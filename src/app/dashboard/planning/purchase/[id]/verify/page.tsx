"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PurchaseReqApis from '@/actions/Apis/PurchaseReqApis';
import VendorApis from '@/actions/Apis/VendorApis';
import Button from '@/components/ReusableComponents/Button';
import InputField from '@/components/ReusableComponents/InputField';
import { formatDate } from '@/utils/date';
import { getStatusColor } from '@/utils/order';

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

interface FulfillmentItem {
  purchaseDate: string;
  actualVendorId: Vendor;
  purchaseNotes: string;
  purchaseProof: string;
  quantity: number;
  materialId: Material;
  actual_days: number;
}

interface TimelineEntry {
  status: string;
  date: string;
  by: string;
  user_name: string;
  user_email: string;
  notes: string;
}

interface Purchase {
  _id: string;
  materials: PurchaseMaterial[];
  estimatedDate: string;
  status: string;
  instructions: string;
  fulfillment: FulfillmentItem[];
  timeline: TimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

interface VendorRating {
  quality: number;
  delivery: number;
  price: number;
  communication: number;
  overall: number;
  comments: string;
}

interface ObservedParameter {
  parameter: string;
  expected: string;
  observed: string;
  passed: boolean;
}

interface ObservedValue {
  materialId: string;
  parameters: ObservedParameter[];
}

const VerifyPurchasePage = ({ params }: { params: { id: string } }) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [verificationNotes, setVerificationNotes] = useState<string>("");
  const [showQualityCheck, setShowQualityCheck] = useState<boolean>(false);
  const [showVendorRating, setShowVendorRating] = useState<boolean>(false);
  
  // Quality check state
  const [observedValues, setObservedValues] = useState<ObservedValue[]>([]);
  
  // Vendor rating state
  const [vendorRatings, setVendorRatings] = useState<{ [key: string]: VendorRating }>({});
  
  const router = useRouter();

  // Initialize states when purchase data loads
  useEffect(() => {
    if (purchase) {
      // Initialize observed values for quality check
      const initialObservedValues: ObservedValue[] = purchase.materials
        .filter(material => material.materialId.verificationParameters?.length > 0)
        .map(material => ({
          materialId: material.materialId._id,
          parameters: material.materialId.verificationParameters.map(param => ({
            parameter: param.parameter,
            expected: param.specificationValue,
            observed: '',
            passed: false
          }))
        }));
      setObservedValues(initialObservedValues);

      // Initialize vendor ratings
      const initialRatings: { [key: string]: VendorRating } = {};
      purchase.fulfillment?.forEach(fulfillment => {
        const vendorId = typeof fulfillment.actualVendorId === 'string' 
          ? fulfillment.actualVendorId 
          : fulfillment.actualVendorId._id;
        if (!initialRatings[vendorId]) {
          initialRatings[vendorId] = {
            quality: 0,
            delivery: 0,
            price: 0,
            communication: 0,
            overall: 0,
            comments: ''
          };
        }
      });
      setVendorRatings(initialRatings);
    }
  }, [purchase]);

  // Fetch purchase details
  useEffect(() => {
    const fetchPurchase = async () => {
      setLoading(true);
      try {
        const res = await PurchaseReqApis.getSinglePurchase(params.id);
        if (res.status === 200) {
          setPurchase(res.data);
        } else {
          setError("Failed to fetch purchase requirement details");
        }
      } catch (error) {
        console.error('Error fetching purchase:', error);
        setError('Failed to load purchase requirement details');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [params.id]);

  // Update observed parameter
  const updateObservedParameter = (materialIndex: number, paramIndex: number, field: keyof ObservedParameter, value: string | boolean) => {
    const updatedObservedValues = [...observedValues];
    updatedObservedValues[materialIndex].parameters[paramIndex] = {
      ...updatedObservedValues[materialIndex].parameters[paramIndex],
      [field]: value
    };
    setObservedValues(updatedObservedValues);
  };

  // Update vendor rating
  const updateVendorRating = (vendorId: string, field: keyof VendorRating, value: number | string) => {
    setVendorRatings(prev => ({
      ...prev,
      [vendorId]: {
        ...prev[vendorId],
        [field]: value
      }
    }));
  };

  // Calculate overall rating automatically
  const submitVendorRatings = async (): Promise<void> => {
    setSubmittingRating(true);
    setError("");
    setSuccess("");

    try {
      const ratingPromises = Object.entries(vendorRatings).map(async ([vendorId, rating]) => {
        // Only submit if vendor has at least one rating
        if (rating.quality > 0 || rating.delivery > 0 || rating.price > 0 || rating.communication > 0) {
          const fulfillmentItems = purchase?.fulfillment?.filter(f => {
            const fVendorId = typeof f.actualVendorId === 'string' ? f.actualVendorId : f.actualVendorId._id;
            return fVendorId === vendorId;
          }) || [];

          // Submit rating for each material from this vendor
          const materialRatingPromises = fulfillmentItems.map(async (fulfillmentItem) => {
            const materialId = typeof fulfillmentItem.materialId === 'string' ? fulfillmentItem.materialId : fulfillmentItem.materialId._id;
            const originalMaterial = purchase?.materials.find(m => m.materialId._id === materialId);
            
            const ratingData = {
              purchase_id: purchase?._id,
              material_id: materialId,
              material_name: originalMaterial?.materialId.material_name || 'Unknown Material',
              criticality: originalMaterial?.criticality || 'Regular',
              quality_score: rating.quality,
              delivery_score: rating.delivery,
              price_score: rating.price,
              communication_score: rating.communication,
              overall_score: rating.overall,
              comments: rating.comments.trim() || ''
            };

            return VendorApis.rateVendor(vendorId, ratingData);
          });

          await Promise.all(materialRatingPromises);
        }
      });

      await Promise.all(ratingPromises);
      setSuccess("Vendor ratings submitted successfully!");
      
      // Reset rating form
      const resetRatings: { [key: string]: VendorRating } = {};
      Object.keys(vendorRatings).forEach(vendorId => {
        resetRatings[vendorId] = {
          quality: 0,
          delivery: 0,
          price: 0,
          communication: 0,
          overall: 0,
          comments: ''
        };
      });
      setVendorRatings(resetRatings);
      
    } catch (error: any) {
      console.error("Error submitting vendor ratings:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while submitting vendor ratings. Please try again."
      );
    } finally {
      setSubmittingRating(false);
    }
  };
  const calculateOverallRating = (vendorId: string) => {
    const rating = vendorRatings[vendorId];
    if (rating) {
      const overall = (rating.quality + rating.delivery + rating.price + rating.communication) / 4;
      updateVendorRating(vendorId, 'overall', Math.round(overall * 10) / 10);
    }
  };

  // Handle approval
  const handleApprove = async (): Promise<void> => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const verificationData: any = {
        status: "approved",
        verification: {
          notes: verificationNotes.trim() || "Approved"
        }
      };

      // Add observed values if quality check was performed
      if (showQualityCheck && observedValues.length > 0) {
        verificationData.observedValues = observedValues;
      }

      // Add vendor ratings if provided
      if (showVendorRating && Object.keys(vendorRatings).length > 0) {
        verificationData.vendorRatings = Object.entries(vendorRatings).map(([vendorId, rating]) => ({
          vendorId,
          ...rating
        }));
      }

      const response = await PurchaseReqApis.verifyPurchase(params.id, verificationData);

      if (response.status === 200 || response.status === 201) {
        setSuccess("Purchase requirement approved successfully!");
        setTimeout(() => {
          router.push(`/dashboard/planning/purchase/${params.id}`);
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to approve purchase requirement");
      }
    } catch (error: any) {
      console.error("Error approving purchase:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while approving the purchase requirement. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle rejection
  const handleReject = async (): Promise<void> => {
    if (!verificationNotes.trim()) {
      setError("Rejection reason is required when rejecting a purchase requirement.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const verificationData = {
        status: "rejected",
        verification: {
          notes: verificationNotes.trim()
        },
        rejectionReason: verificationNotes.trim()
      };

      const response = await PurchaseReqApis.verifyPurchase(params.id, verificationData);

      if (response.status === 200 || response.status === 201) {
        setSuccess("Purchase requirement rejected successfully!");
        setTimeout(() => {
          router.push(`/dashboard/planning/purchase/${params.id}`);
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to reject purchase requirement");
      }
    } catch (error: any) {
      console.error("Error rejecting purchase:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while rejecting the purchase requirement. Please try again."
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
      return { status: 'On Time', color: 'text-green-600', icon: '✅' };
    } else if (actualDays <= expectedDays + 2) {
      return { status: 'Slightly Delayed', color: 'text-yellow-600', icon: '⚠️' };
    } else {
      return { status: 'Delayed', color: 'text-red-600', icon: '❌' };
    }
  };

  const renderStarRating = (rating: number, onChange: (value: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
      </div>
    );
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
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Verify Purchase Requirement
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    purchase.status
                  )}`}
                >
                  {purchase.status?.charAt(0).toUpperCase() + purchase.status?.slice(1)}
                </span>
              </div>
              <p className="text-gray-600">
                Review the fulfillment details, perform quality checks, rate vendors, and approve or reject the purchase requirement
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Purchase Overview */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Created Date
                  </label>
                  <p className="text-gray-900 font-medium">{formatDate(purchase.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Last Modified
                  </label>
                  <p className="text-gray-900 font-medium">{formatDate(purchase.updatedAt)}</p>
                </div>
              </div>
              
              {purchase.instructions && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Original Instructions
                  </label>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-gray-800">{purchase.instructions}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Requirements vs Fulfillment */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements vs Fulfillment</h2>
              <div className="space-y-6">
                {purchase.materials.map((originalMaterial, index) => {
                  const fulfillmentItem = purchase.fulfillment?.find(
                    (f) => {
                      // Handle both string and object materialId in fulfillment
                      const fulfillmentMaterialId = typeof f.materialId === 'string' ? f.materialId : f.materialId._id;
                      return fulfillmentMaterialId === originalMaterial.materialId._id;
                    }
                  );
                  
                  const deliveryStatus = fulfillmentItem ? 
                    getDeliveryStatus(fulfillmentItem.actual_days, originalMaterial.expected_days) : null;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {originalMaterial.materialId.material_name}
                          </h3>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCriticalityColor(originalMaterial.criticality)}`}>
                              {originalMaterial.criticality} Priority
                            </span>
                            <span className="text-sm text-gray-600">
                              Expected: {originalMaterial.expected_days} days
                            </span>
                          </div>
                        </div>
                        {deliveryStatus && (
                          <div className="text-right">
                            <span className={`text-sm font-medium ${deliveryStatus.color}`}>
                              {deliveryStatus.icon} {deliveryStatus.status}
                            </span>
                            <p className="text-xs text-gray-500">
                              Actual: {fulfillmentItem?.actual_days} days
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Original Requirements */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-3">📋 Original Requirement</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Quantity:</span>
                              <span className="font-medium text-blue-900">
                                {originalMaterial.quantity} {originalMaterial.materialId.unit.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Vendor:</span>
                              <span className="font-medium text-blue-900">
                                {originalMaterial.vendorId.company_name}
                              </span>
                            </div>
                            {originalMaterial.notes && (
                              <div>
                                <span className="text-blue-700">Notes:</span>
                                <p className="text-blue-900 mt-1">{originalMaterial.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actual Fulfillment */}
                        {fulfillmentItem ? (
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-medium text-green-900 mb-3">✅ Actual Purchase</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-green-700">Quantity:</span>
                                <span className="font-medium text-green-900">
                                  {fulfillmentItem.quantity} {originalMaterial.materialId.unit.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-green-700">Vendor:</span>
                                <span className="font-medium text-green-900">
                                  {fulfillmentItem.actualVendorId.company_name}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-green-700">Purchase Date:</span>
                                <span className="font-medium text-green-900">
                                  {formatDate(fulfillmentItem.purchaseDate)}
                                </span>
                              </div>
                              {fulfillmentItem.purchaseNotes && (
                                <div>
                                  <span className="text-green-700">Notes:</span>
                                  <p className="text-green-900 mt-1">{fulfillmentItem.purchaseNotes}</p>
                                </div>
                              )}
                              {fulfillmentItem.purchaseProof && (
                                <div className="flex justify-between">
                                  <span className="text-green-700">Invoice:</span>
                                  <span className="text-green-900">📄 Attached</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 rounded-lg p-4">
                            <h4 className="font-medium text-red-900 mb-3">❌ Not Fulfilled</h4>
                            <p className="text-red-700 text-sm">This material was not purchased.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quality Check Section */}
            {observedValues.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Quality Check</h2>
                  <button
                    type="button"
                    onClick={() => setShowQualityCheck(!showQualityCheck)}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    {showQualityCheck ? 'Hide Quality Check' : 'Perform Quality Check'}
                  </button>
                </div>
                
                {showQualityCheck && (
                  <div className="space-y-6">
                    {observedValues.map((materialObs, materialIndex) => {
                      const material = purchase.materials.find(m => m.materialId._id === materialObs.materialId);
                      return (
                        <div key={materialIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h3 className="font-medium text-gray-900 mb-4">
                            {material?.materialId.material_name} - Verification Parameters
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {materialObs.parameters.map((param, paramIndex) => (
                              <div key={paramIndex} className="bg-white rounded-md p-3 border">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {param.parameter}
                                </label>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Expected:</span>
                                    <span className="font-medium">{param.expected}</span>
                                  </div>
                                  <InputField
                                    label="Observed Value"
                                    value={param.observed}
                                    onChange={(e) => updateObservedParameter(materialIndex, paramIndex, 'observed', e.target.value)}
                                    placeholder="Enter observed value"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`passed-${materialIndex}-${paramIndex}`}
                                      checked={param.passed}
                                      onChange={(e) => updateObservedParameter(materialIndex, paramIndex, 'passed', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`passed-${materialIndex}-${paramIndex}`} className="text-sm text-gray-700">
                                      Parameter Passed
                                    </label>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Submit Ratings Button */}
                    <div className="flex justify-center pt-4 border-t border-gray-200">
                      <Button
                        variant="primary"
                        onClick={submitVendorRatings}
                        disabled={submittingRating || Object.values(vendorRatings).every(rating => 
                          rating.quality === 0 && rating.delivery === 0 && rating.price === 0 && rating.communication === 0
                        )}
                        className="px-6 py-2"
                      >
                        {submittingRating ? 'Submitting Ratings...' : '⭐ Submit Vendor Ratings'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vendor Rating Section */}
            {purchase.fulfillment && purchase.fulfillment.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Vendor Performance Rating</h2>
                  <button
                    type="button"
                    onClick={() => setShowVendorRating(!showVendorRating)}
                    className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                  >
                    {showVendorRating ? 'Hide Vendor Rating' : 'Rate Vendors'}
                  </button>
                </div>
                
                {showVendorRating && (
                  <div className="space-y-6">
                    {Object.entries(vendorRatings).map(([vendorId, rating]) => {
                      const vendor = purchase.fulfillment?.find(f => {
                        const fVendorId = typeof f.actualVendorId === 'string' ? f.actualVendorId : f.actualVendorId._id;
                        return fVendorId === vendorId;
                      })?.actualVendorId;
                      
                      const fulfillmentItems = purchase.fulfillment?.filter(f => {
                        const fVendorId = typeof f.actualVendorId === 'string' ? f.actualVendorId : f.actualVendorId._id;
                        return fVendorId === vendorId;
                      }) || [];
                      
                      // Get vendor object (handle both string and object cases)
                      const vendorObj = typeof vendor === 'object' ? vendor : null;
                      
                      return (
                        <div key={vendorId} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                          <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              {vendorObj?.company_name || 'Unknown Vendor'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Contact: {vendorObj?.contact_person || 'N/A'} • {vendorObj?.mobile_no || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Materials supplied: {fulfillmentItems.map(f => {
                                // Get material name from the original materials array
                                const originalMaterial = purchase.materials.find(m => {
                                  const fMaterialId = typeof f.materialId === 'string' ? f.materialId : f.materialId._id;
                                  return m.materialId._id === fMaterialId;
                                });
                                return originalMaterial?.materialId.material_name || 'Unknown Material';
                              }).join(', ')}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quality (1-5 stars) <span className="text-red-500">*</span>
                              </label>
                              {renderStarRating(rating.quality, (value) => {
                                updateVendorRating(vendorId, 'quality', value);
                                calculateOverallRating(vendorId);
                              })}
                              <p className="text-xs text-gray-500 mt-1">Rate material quality</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery (1-5 stars) <span className="text-red-500">*</span>
                              </label>
                              {renderStarRating(rating.delivery, (value) => {
                                updateVendorRating(vendorId, 'delivery', value);
                                calculateOverallRating(vendorId);
                              })}
                              <p className="text-xs text-gray-500 mt-1">Rate delivery performance</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price (1-5 stars) <span className="text-red-500">*</span>
                              </label>
                              {renderStarRating(rating.price, (value) => {
                                updateVendorRating(vendorId, 'price', value);
                                calculateOverallRating(vendorId);
                              })}
                              <p className="text-xs text-gray-500 mt-1">Rate price competitiveness</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Communication (1-5 stars) <span className="text-red-500">*</span>
                              </label>
                              {renderStarRating(rating.communication, (value) => {
                                updateVendorRating(vendorId, 'communication', value);
                                calculateOverallRating(vendorId);
                              })}
                              <p className="text-xs text-gray-500 mt-1">Rate responsiveness</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Overall Rating (Auto-calculated)
                              </label>
                              <div className="flex items-center space-x-2">
                                {renderStarRating(rating.overall, (value) => updateVendorRating(vendorId, 'overall', value))}
                                <span className="text-sm text-gray-600">({rating.overall.toFixed(1)}/5)</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Based on above 4 ratings</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comments (Optional)
                              </label>
                              <textarea
                                value={rating.comments}
                                onChange={(e) => updateVendorRating(vendorId, 'comments', e.target.value)}
                                placeholder="Additional comments about vendor performance..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">Optional feedback</p>
                            </div>
                          </div>
                          
                          {/* Rating Validation */}
                          {(rating.quality === 0 || rating.delivery === 0 || rating.price === 0 || rating.communication === 0) && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-sm text-yellow-800">
                                ⚠️ Please provide ratings for all 4 criteria before submitting
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verification Sidebar */}
          <div className="space-y-6">
            {/* Verification Form */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Decision</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Notes {showVendorRating ? '(Optional)' : '(Required for Rejection)'}
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Enter your verification notes, rejection reason, or additional comments..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required when rejecting. Optional when approving.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={handleApprove}
                    disabled={submitting || submittingRating}
                  >
                    {submitting ? 'Processing...' : '✅ Approve Purchase'}
                  </Button>
                  
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={handleReject}
                    disabled={submitting || submittingRating}
                  >
                    {submitting ? 'Processing...' : '❌ Reject Purchase'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={submitting || submittingRating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowQualityCheck(!showQualityCheck)}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                  {showQualityCheck ? '🔍 Hide Quality Check' : '🔍 Perform Quality Check'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowVendorRating(!showVendorRating)}
                  className="w-full px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                >
                  {showVendorRating ? '⭐ Hide Vendor Rating' : '⭐ Rate Vendors'}
                </button>
                
                {showVendorRating && (
                  <Button
                    variant="primary"
                    onClick={submitVendorRatings}
                    disabled={submittingRating || Object.values(vendorRatings).every(rating => 
                      rating.quality === 0 && rating.delivery === 0 && rating.price === 0 && rating.communication === 0
                    )}
                    className="w-full"
                  >
                    {submittingRating ? 'Submitting...' : '📝 Submit Ratings'}
                  </Button>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fulfillment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Required Materials:</span>
                  <span className="font-medium text-gray-900">{purchase.materials.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fulfilled Materials:</span>
                  <span className="font-medium text-gray-900">{purchase.fulfillment?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate:</span>
                  <span className="font-medium text-gray-900">
                    {purchase.materials.length > 0 
                      ? Math.round(((purchase.fulfillment?.length || 0) / purchase.materials.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unique Vendors:</span>
                  <span className="font-medium text-gray-900">
                    {new Set(purchase.fulfillment?.map(f => {
                      return typeof f.actualVendorId === 'string' ? f.actualVendorId : f.actualVendorId._id;
                    })).size || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Critical Items:</span>
                  <span className="font-medium text-red-600">
                    {purchase.materials.filter(m => m.criticality.toLowerCase() === 'critical').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">On-Time Deliveries:</span>
                  <span className="font-medium text-green-600">
                    {purchase.fulfillment?.filter(f => {
                      const materialId = typeof f.materialId === 'string' ? f.materialId : f.materialId._id;
                      const material = purchase.materials.find(m => m.materialId._id === materialId);
                      return material && f.actual_days <= material.expected_days;
                    }).length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Check Progress */}
            {showQualityCheck && observedValues.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Check Progress</h3>
                <div className="space-y-3">
                  {observedValues.map((materialObs, index) => {
                    const material = purchase.materials.find(m => m.materialId._id === materialObs.materialId);
                    const totalParams = materialObs.parameters.length;
                    const passedParams = materialObs.parameters.filter(p => p.passed).length;
                    const checkedParams = materialObs.parameters.filter(p => p.observed.trim() !== '').length;
                    
                    return (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <p className="font-medium text-gray-900">{material?.materialId.material_name}</p>
                        <p className="text-sm text-gray-600">
                          {checkedParams}/{totalParams} parameters checked • {passedParams} passed
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${totalParams > 0 ? (checkedParams / totalParams) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vendor Rating Progress */}
            {showVendorRating && Object.keys(vendorRatings).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Rating Progress</h3>
                <div className="space-y-3">
                  {Object.entries(vendorRatings).map(([vendorId, rating]) => {
                    const vendor = purchase.fulfillment?.find(f => {
                      const fVendorId = typeof f.actualVendorId === 'string' ? f.actualVendorId : f.actualVendorId._id;
                      return fVendorId === vendorId;
                    })?.actualVendorId;
                    
                    const vendorObj = typeof vendor === 'object' ? vendor : null;
                    const hasRating = rating.quality > 0 || rating.delivery > 0 || rating.price > 0 || rating.communication > 0;
                    
                    return (
                      <div key={vendorId} className="border-l-4 border-yellow-500 pl-4">
                        <p className="font-medium text-gray-900">{vendorObj?.company_name || 'Unknown Vendor'}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Overall:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${
                                  star <= rating.overall ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">({rating.overall}/5)</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {hasRating ? 'Rating completed' : 'No rating provided'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {(submitting || submittingRating) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                {submitting ? 'Processing verification...' : 'Submitting vendor ratings...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPurchasePage;