"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MaterialRequestApis from '@/actions/Apis/MaterialRequestApis';
import Button from '@/components/ReusableComponents/Button';
import { formatDate } from '@/utils/date';
import ProductionPlanApis from '@/actions/Apis/ProductionPlanApis';

// TypeScript interfaces for the new page
interface MaterialRequestMaterial {
    material_id: { _id: string; material_name: string; unit: string; current_stock: number; };
    quantity_required: number;
}

interface MaterialIssuanceRequest {
    [x: string]: any;
    _id: string;
    request_number: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    finished_good_id: { product_name: string; unit: string };
    quantity_planned: number;
    requested_materials: MaterialRequestMaterial[];
    createdAt?: string; // Made optional
    created_at?: string; // Added to match the API response
    production_plan_id: string; // Added to interface for navigation
}

const MaterialRequestApprovalPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestId = searchParams.get("requestId") || "";

    const [request, setRequest] = useState<MaterialIssuanceRequest | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [rejectionReason, setRejectionReason] = useState<string>("");
    // Re-added lot number state
    const [lotNumbers, setLotNumbers] = useState<{ [key: string]: string }>({});

    // Fetch the single material request details
    useEffect(() => {
        const fetchRequest = async () => {
            if (!requestId) {
                setError("No request ID provided.");
                setLoading(false);
                return;
            }
            try {
                const response = await MaterialRequestApis.getSingleMaterialRequest(requestId);
                if (response.status === 200) {
                    const fetchedRequest = response.data.request;
                    setRequest(fetchedRequest);
                    // Initialize lot numbers state
                    const initialLots: { [key: string]: string } = {};
                    fetchedRequest.requested_materials.forEach((mat: { material_id: { _id: string; }; }) => {
                        initialLots[mat.material_id._id] = "";
                    });
                    setLotNumbers(initialLots);
                } else {
                    throw new Error(response.data?.message || "Failed to fetch request details.");
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || "An error occurred while fetching the request.");
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [requestId]);

    const handleLotNumberChange = (materialId: string, value: string) => {
        setLotNumbers(prev => ({ ...prev, [materialId]: value }));
    };

    const handleApprove = async () => {
        if (!request) return;
        setSubmitting(true);
        setError("");

        // Added validation for lot numbers
        const lotNumbersArray = Object.values(lotNumbers).filter(lot => lot.trim() !== "");
        if (lotNumbersArray.length !== request.requested_materials.length) {
            setError("Please enter lot numbers for all requested materials.");
            setSubmitting(false);
            return;
        }

        try {
            // Updated API call to send the lot numbers
            const response = await ProductionPlanApis.approveMaterialIssuance(request._id, { lot_numbers: lotNumbersArray });
            if (response.status === 201) {
                setSuccess(response.data.message);
                setTimeout(() => router.push(`/dashboard/planning/${request.production_plan_id}`), 2000);
            } else {
                throw new Error(response.data?.message || "Approval failed.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "An error occurred during approval.");
        } finally {
            setSubmitting(false);
        }
    };
    
    // Placeholder for rejection logic
    const handleReject = async () => {
        if (!request) return;
        // Logic to send a rejection request to the backend with rejectionReason
        // You would need to create a new API endpoint for this
        alert("Reject functionality is not yet implemented.");
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!request) return <div>Request not found.</div>;

    const isPending = request.status === 'Pending';

    // Safe date formatting function
    const safeFormatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return formatDate(dateString);
        } catch (e) {
            console.error('Date format error:', e);
            return 'Invalid Date';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Material Issuance Request #{request.request_number}</h1>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Product</p>
                        <p className="mt-1 text-gray-900">{request.finished_good_id?.product_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Requested Quantity</p>
                        <p className="mt-1 text-gray-900">{request.quantity_planned} {request.finished_good_id?.unit || 'units'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {request.status}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Date Requested</p>
                        <p className="mt-1 text-gray-900">{safeFormatDate(request.created_at || request.createdAt)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Materials to Issue</h2>
                {request.requested_materials.length > 0 ? (
                    <div className="space-y-4">
                        {request.requested_materials.map((material, index) => (
                            <div key={index} className="border-b pb-4 last:border-b-0">
                                <p className="text-base font-medium">{material.material_id.material_name}</p>
                                <p className="text-sm text-gray-600 mt-1">Required: {material.quantity_required} {material.material_id.unit}</p>
                                {isPending && (
                                    <div className="mt-2">
                                        <label htmlFor={`lot-${material.material_id._id}`} className="text-sm font-medium text-gray-700">Lot Number</label>
                                        <input
                                            type="text"
                                            id={`lot-${material.material_id._id}`}
                                            value={lotNumbers[material.material_id._id] || ''}
                                            onChange={(e) => handleLotNumberChange(material.material_id._id, e.target.value)}
                                            className="mt-1 block w-full rounded-md border-black border p-2 shadow-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No materials listed for this request.</p>
                )}
            </div>

            {isPending && (
                <div className="flex justify-end space-x-4">
                    <Button onClick={handleReject} disabled={submitting}>
                        Reject
                    </Button>
                    <Button onClick={handleApprove} variant="primary" disabled={submitting}>
                        {submitting ? "Approving..." : "Approve & Create Batch"}
                    </Button>
                </div>
            )}
        </div>
    );
};

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'approved':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'rejected':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'cancelled':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export default MaterialRequestApprovalPage;
