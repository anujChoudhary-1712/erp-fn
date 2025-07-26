"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PurchaseReqApis from '@/actions/Apis/PurchaseReqApis';
import VendorApis from '@/actions/Apis/VendorApis';
import InputField from '@/components/ReusableComponents/InputField';
import Button from '@/components/ReusableComponents/Button';
import { formatDate } from '@/utils/date';
import { getCookie } from '@/actions/CookieUtils';

// TypeScript interfaces
interface Dimension {
  type: string;
  value: number;
  unit: string;
}

interface VerificationParameter {
  parameter: string;
  specificationValue: string;
  _id: string;
}

interface Material {
  _id: string;
  material_name: string;
  description: string;
  category: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  stock_used: number;
  trigger_value: number;
  verificationParameters: VerificationParameter[];
  hasDimensions: boolean;
  dimensions: Dimension[];
  total_area: number;
  usage_area: number;
  product_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  __v: number;
}

interface Vendor {
  _id: string;
  org_id: string;
  approved_for: string;
  company_name: string;
  company_address: string;
  state: string;
  city: string;
  pincode: string;
  mobile_no: string;
  phone_no: string;
  mail: string;
  website: string;
  company_type: string;
  partner_name: string;
  contact_person: string;
  contact_designation: string;
  bank_name: string;
  branch_name: string;
  bank_ifsc: string;
  bank_account_no: string;
  bank_micr_code: string;
  bank_swift_code: string;
  gst_no: string;
  pan_no: string;
  is_msme: boolean;
  document_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface PurchaseMaterial {
  materialId: Material;
  quantity: number;
  vendorId: Vendor;
  notes: string;
  criticality: string;
  expected_days: number;
}

interface Purchase {
  _id: string;
  materials: PurchaseMaterial[];
  estimatedDate: string;
  status: string;
  instructions: string;
}

interface FulfillmentItem {
  purchaseDate: string;
  actualVendorId: string;
  purchaseNotes: string;
  purchaseProof: string;
  quantity: number;
  materialId: string;
  materialName: string; // For display
  unit: string; // For display
  requiredQuantity: number; // For reference
  criticality: string; // From material
  expected_days: number; // From material
  actual_days: number; // Calculated field
}

const FulfillRequirementPage = ({ params }: { params: { id: string } }) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [fulfillmentItems, setFulfillmentItems] = useState<FulfillmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingProof, setUploadingProof] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  const router = useRouter();

  // Calculate actual delivery days
  const calculateActualDays = (purchaseDate: string, estimatedDate: string): number => {
    if (!purchaseDate || !estimatedDate) return 0;
    
    const purchase = new Date(purchaseDate);
    const estimated = new Date(estimatedDate);
    const timeDiff = purchase.getTime() - estimated.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Fetch purchase details and vendors
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [purchaseRes, vendorsRes] = await Promise.all([
          PurchaseReqApis.getSinglePurchase(params.id),
          VendorApis.getAllVendors()
        ]);

        if (purchaseRes.status === 200) {
          const purchaseData = purchaseRes.data;
          setPurchase(purchaseData);
          
          // Initialize fulfillment items based on required materials
          const initialItems: FulfillmentItem[] = purchaseData.materials.map((material: PurchaseMaterial) => ({
            purchaseDate: new Date().toISOString().split('T')[0], // Prefill today's date
            actualVendorId: '', // Don't prefill vendor
            purchaseNotes: '',
            purchaseProof: '',
            quantity: 0, // Don't prefill quantity
            materialId: material.materialId._id,
            materialName: material.materialId.material_name,
            unit: material.materialId.unit,
            requiredQuantity: material.quantity,
            criticality: material.criticality,
            expected_days: material.expected_days,
            actual_days: 0,
          }));
          setFulfillmentItems(initialItems);
        }

        if (vendorsRes.status === 200) {
          setVendors(vendorsRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load purchase requirement details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Handle file upload
  const handleFileUpload = async (file: File, description: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    try {
      const token = getCookie("token");
      const response = await fetch(
        "http://localhost:8001/api/documents/upload",
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      return data.documentId || data._id;
    } catch (error) {
      console.error("Error uploading document:", error);
      return null;
    }
  };

  // Update fulfillment item
  const updateFulfillmentItem = (index: number, field: keyof FulfillmentItem, value: string | number): void => {
    const updatedItems = [...fulfillmentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-calculate actual_days when purchase date changes
    if (field === 'purchaseDate' && purchase) {
      const actualDays = calculateActualDays(value as string, purchase.estimatedDate);
      updatedItems[index].actual_days = actualDays;
    }

    setFulfillmentItems(updatedItems);
  };

  // Handle proof upload
  const handleProofUpload = async (index: number, file: File): Promise<void> => {
    setUploadingProof(prev => ({ ...prev, [index]: true }));
    try {
      const documentId = await handleFileUpload(file, `Invoice for ${fulfillmentItems[index].materialName}`);
      if (documentId) {
        updateFulfillmentItem(index, 'purchaseProof', documentId);
        setSuccess('Invoice uploaded successfully');
      } else {
        setError('Failed to upload invoice');
      }
    } catch (error) {
      setError('Error uploading invoice');
    } finally {
      setUploadingProof(prev => ({ ...prev, [index]: false }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    for (let i = 0; i < fulfillmentItems.length; i++) {
      const item = fulfillmentItems[i];
      if (!item.purchaseDate) {
        setError(`Purchase date is required for ${item.materialName}`);
        return false;
      }
      if (!item.actualVendorId) {
        setError(`Vendor is required for ${item.materialName}`);
        return false;
      }
      if (item.quantity <= 0) {
        setError(`Quantity must be greater than 0 for ${item.materialName}`);
        return false;
      }
      if (!item.materialId) {
        setError(`Material selection is required for item ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const fulfillmentData = {
        fulfillment: fulfillmentItems.map(item => ({
          purchaseDate: item.purchaseDate,
          actualVendorId: item.actualVendorId,
          purchaseNotes: item.purchaseNotes.trim(),
          purchaseProof: item.purchaseProof || undefined,
          quantity: Number(item.quantity),
          materialId: item.materialId,
          actual_days: item.actual_days, // Include calculated actual days
        }))
      };

      const response = await PurchaseReqApis.fulfillPurchase(params.id, fulfillmentData);

      if (response.status === 200 || response.status === 201) {
        setSuccess("Purchase requirement fulfilled successfully!");
        setTimeout(() => {
          router.push(`/dashboard/planning/purchase/${params.id}`);
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to fulfill purchase requirement");
      }
    } catch (error: any) {
      console.error("Error fulfilling purchase:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while fulfilling the purchase requirement. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'regular':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDeliveryStatus = (actualDays: number, expectedDays: number) => {
    if (actualDays <= expectedDays) {
      return { status: 'On Time', color: 'text-green-600' };
    } else if (actualDays <= expectedDays + 2) {
      return { status: 'Slightly Delayed', color: 'text-yellow-600' };
    } else {
      return { status: 'Delayed', color: 'text-red-600' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 font-medium">Loading purchase requirement...</span>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Purchase requirement not found
          </h3>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Fulfill Purchase Requirement
              </h1>
              <p className="text-gray-600 mt-1">
                Record the actual purchases made for this requirement
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Purchase Overview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Requirement Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Required by Date
                </label>
                <p className="text-gray-900 font-medium">{formatDate(purchase.estimatedDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Total Materials
                </label>
                <p className="text-gray-900 font-medium">{purchase.materials.length} items</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Status
                </label>
                <p className="text-gray-900 font-medium">{purchase.status}</p>
              </div>
            </div>
            {purchase.instructions && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Instructions
                </label>
                <p className="text-gray-800 bg-gray-50 rounded-md p-3">{purchase.instructions}</p>
              </div>
            )}
          </div>

          {/* Fulfillment Items */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Details</h2>
            <div className="space-y-6">
              {fulfillmentItems.map((item, index) => {
                const deliveryStatus = getDeliveryStatus(item.actual_days, item.expected_days);
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.materialName}
                        </h3>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCriticalityColor(item.criticality)}`}>
                            {item.criticality} Priority
                          </span>
                          <span className="text-sm text-gray-600">
                            Expected: {item.expected_days} days
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">
                          Required: {item.requiredQuantity} {item.unit.replace('_', ' ')}
                        </span>
                        {item.actual_days > 0 && (
                          <div className="mt-1">
                            <span className={`text-sm font-medium ${deliveryStatus.color}`}>
                              {deliveryStatus.status} ({item.actual_days} days)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Purchase Date */}
                      <InputField
                        label="Purchase Date"
                        type="date"
                        value={item.purchaseDate}
                        onChange={(e) => updateFulfillmentItem(index, 'purchaseDate', e.target.value)}
                        required
                      />

                      {/* Vendor */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Actual Vendor <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={item.actualVendorId}
                          onChange={(e) => updateFulfillmentItem(index, 'actualVendorId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select vendor</option>
                          {vendors.map((vendor) => (
                            <option key={vendor._id} value={vendor._id}>
                              {vendor.company_name} - {vendor.contact_person}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <InputField
                        label={`Quantity Purchased (${item.unit.replace('_', ' ')})`}
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateFulfillmentItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Enter quantity purchased"
                        min="0.01"
                        step="0.01"
                        required
                      />

                      {/* Purchase Notes */}
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Purchase Notes
                        </label>
                        <textarea
                          value={item.purchaseNotes}
                          onChange={(e) => updateFulfillmentItem(index, 'purchaseNotes', e.target.value)}
                          placeholder="Any notes about this purchase (condition, quality, issues, etc.)..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Invoice Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Invoice/Receipt (Optional)
                        </label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            id={`proof-${index}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleProofUpload(index, file);
                              }
                            }}
                            disabled={uploadingProof[index]}
                          />
                          {item.purchaseProof && (
                            <p className="text-sm text-green-600">✓ Invoice uploaded successfully</p>
                          )}
                          {uploadingProof[index] && (
                            <p className="text-sm text-blue-600">📤 Uploading invoice...</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Performance Indicator */}
                    {item.actual_days > 0 && (
                      <div className="mt-4 p-3 bg-white rounded-md border">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Delivery Performance:</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-500">Expected: {item.expected_days} days</span>
                            <span className="text-xs text-gray-500">Actual: {item.actual_days} days</span>
                            <span className={`text-sm font-medium ${deliveryStatus.color}`}>
                              {deliveryStatus.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Total Items
                </label>
                <p className="text-2xl font-bold text-gray-900">{fulfillmentItems.length}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Critical Items
                </label>
                <p className="text-2xl font-bold text-red-600">
                  {fulfillmentItems.filter(item => item.criticality.toLowerCase() === 'critical').length}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Items with Proofs
                </label>
                <p className="text-2xl font-bold text-green-600">
                  {fulfillmentItems.filter(item => item.purchaseProof).length}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || Object.values(uploadingProof).some(Boolean)}
              className="min-w-40"
            >
              {submitting ? 'Fulfilling...' : 'Fulfill Requirement'}
            </Button>
          </div>
        </form>

        {/* Loading Overlay */}
        {submitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                Fulfilling purchase requirement...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FulfillRequirementPage;