"use client";
import PurchaseReqApis from '@/actions/Apis/PurchaseReqApis';
import Button from '@/components/ReusableComponents/Button';
import { formatDate } from '@/utils/date';
import { getStatusColor } from '@/utils/order';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import DocumentCard from '@/components/DocumentCard';

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
  total_area?: number;
  usage_area?: number;
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
  vendorId?: Vendor;
  notes?: string;
  criticality?: string;
  expected_days?: number;
}

interface Machinery {
  _id: string;
  standard_type: string;
  discipline: string;
  group: string;
  device_type: string;
  name: string;
  lab_id: string;
  sr_no: string;
  make: string;
  model: string;
  procurement?: string;
  commissioning?: string;
  instruction_manual?: string;
  location?: string;
}

interface Misc {
  _id: string;
  misc_id: string;
  itemName: string;
  specifications: {
    param: string;
    specificationValue: string;
    _id: string;
  }[];
  org_id: string;
  created_date: string;
  last_modified_date: string;
}

interface TimelineEntry {
  status: string;
  date: string;
  by: string;
  user_name?: string;
  user_email?: string;
  notes: string;
}

interface Document {
  _id: string;
  docName: string;
  fileName: string;
  fileSize: number;
  link: string;
  uploadDate: string;
  status: string;
  docType: string;
  description: string;
  outerId: string;
  org_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface PurchaseDocument {
  name: string;
  documentId: {
    _id: string;
    documents: Document[];
    latest_doc_id: string;
  };
}

interface Purchase {
  _id: string;
  purchaseRequestType: "Material" | "Machinery" | "Misc";
  materials: PurchaseMaterial[];
  machineryId?: Machinery;
  misc_id?: Misc;
  requiredBy: string;
  estimatedDate?: string;
  status: string;
  instructions?: string;
  documents: PurchaseDocument[];
  timeline: TimelineEntry[];
  org_id: string;
  vendorsEvaluated: Array<{
    vendorId: string | Vendor;
    name: string;
    availability: boolean;
    price: number;
    isRecommended: boolean;
    isSelected?: boolean;
    estimatedDeliveryDate?: string;
  }>;
  fulfillment?: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const SinglePurchasePage = ({ params }: { params: { id: string } }) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const router = useRouter();

  const fetchSinglePurchase = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await PurchaseReqApis.getSinglePurchase(params.id);
      if (res.status === 200) {
        setPurchase(res.data.requirement);
      } else {
        setError("Failed to fetch purchase requirement");
      }
    } catch (error) {
      console.error("Error fetching purchase:", error);
      setError("An error occurred while fetching the purchase requirement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSinglePurchase();
  }, [params.id]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'requested':
        return '🔔';
      case 'request approved':
        return '✓';
      case 'pending':
        return '⏳';
      case 'verification needed':
        return '🔍';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'purchase received':
        return '📦';
      default:
        return '📋';
    }
  };

  const getTimelineIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'requested':
        return '🔔';
      case 'request approved':
        return '✓';
      case 'pending':
        return '⏳';
      case 'verification needed':
        return '🔍';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'purchase received':
        return '📦';
      default:
        return '📝';
    }
  };

  const getCriticalityColor = (criticality?: string) => {
    switch (criticality?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDimensions = (dimensions: Dimension[]) => {
    const stockLength = dimensions.find(d => d.type === 'stock_length');
    const stockWidth = dimensions.find(d => d.type === 'stock_width');
    const usageLength = dimensions.find(d => d.type === 'usage_length');
    const usageWidth = dimensions.find(d => d.type === 'usage_width');

    return {
      stock: stockLength && stockWidth ? `${stockLength.value} × ${stockWidth.value} ${stockLength.unit}` : null,
      usage: usageLength && usageWidth ? `${usageLength.value} × ${usageWidth.value} ${usageLength.unit}` : null
    };
  };

  const handleApproveRequest = async () => {
    if (!purchase) return;
    
    setActionLoading(true);
    try {
      const response = await PurchaseReqApis.updateStatus(purchase._id, "Request Approved");
      if (response.status === 200) {
        fetchSinglePurchase();
      } else {
        setError("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      setError("An error occurred while approving the request");
    } finally {
      setActionLoading(false);
    }
  };
  
  const handlePurchaseReceived = async () => {
    router.push(`/dashboard/purchases/${purchase?._id}/purchase-received`);
  };

  const extractDocumentData = (documentObj: any): Document | null => {
    if (!documentObj || !documentObj.documents || documentObj.documents.length === 0) {
      return null;
    }

    const latestDoc = documentObj.documents.find(
      (doc: any) => doc._id === documentObj.latest_doc_id
    ) || documentObj.documents[0];

    return {
      _id: latestDoc._id,
      docName: latestDoc.docName,
      fileName: latestDoc.fileName,
      fileSize: latestDoc.fileSize,
      link: latestDoc.link,
      status: latestDoc.status,
      docType: latestDoc.docType,
      uploadDate: latestDoc.uploadDate,
      description: latestDoc.description,
      outerId: latestDoc.outerId,
      org_id: latestDoc.org_id,
      createdAt: latestDoc.createdAt,
      updatedAt: latestDoc.updatedAt,
      __v: latestDoc.__v,
    };
  };

  const getAllDocuments = (): Document[] => {
    if (!purchase) return [];

    const allDocs: Document[] = [];

    if (purchase.documents && purchase.documents.length > 0) {
      purchase.documents.forEach((docItem) => {
        const doc = extractDocumentData(docItem.documentId);
        if (doc) {
          allDocs.push({
            ...doc,
            docName: docItem.name || doc.docName,
            description: docItem.name || doc.description,
          });
        }
      });
    }

    return allDocs;
  };
  
  const isPurchaseReceived = purchase?.status.toLowerCase() === 'purchase received';
  const allDocuments = getAllDocuments();


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

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || "Purchase requirement not found"}
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
                  {purchase.purchaseRequestType} Purchase Details
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    purchase.status
                  )}`}
                >
                  {getStatusIcon(purchase.status)} {purchase.status?.charAt(0).toUpperCase() + purchase.status?.slice(1)}
                </span>
              </div>
              <p className="text-gray-600">
                Created on {formatDate(purchase.createdAt)}
                {purchase.estimatedDate && ` • Required by ${formatDate(purchase.estimatedDate)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Purchase Overview */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchase.estimatedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Estimated Delivery Date
                    </label>
                    <p className="text-gray-900 font-medium">{formatDate(purchase.estimatedDate)}</p>
                  </div>
                )}
                
                {(() => {
                  const selectedVendor = purchase.vendorsEvaluated?.find(v => v.isSelected);
                  if (selectedVendor && selectedVendor.estimatedDeliveryDate) {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Vendor Delivery Date
                        </label>
                        <p className="text-gray-900 font-medium">{formatDate(selectedVendor.estimatedDeliveryDate)}</p>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {purchase.purchaseRequestType === "Material" && purchase.materials && purchase.materials.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Total Materials
                    </label>
                    <p className="text-gray-900 font-medium">{purchase.materials.length} items</p>
                  </div>
                )}
                
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
                    Special Instructions
                  </label>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-gray-800">{purchase.instructions}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Selected Vendor Details */}
            {purchase.status.toLowerCase() === 'vendor selected' && (() => {
              const selectedVendorData = purchase.vendorsEvaluated?.find(v => v.isSelected);
              
              if (!selectedVendorData) return null;
              
              const vendorDetails = typeof selectedVendorData.vendorId === 'object' 
                ? selectedVendorData.vendorId 
                : null;
                
              if (!vendorDetails) return null;
              
              return (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Selected Vendor</h2>
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{vendorDetails.company_name}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {vendorDetails.company_type}
                          </span>
                          {vendorDetails.is_msme && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              MSME Certified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Contact Person
                        </label>
                        <p className="text-gray-900 font-medium">{vendorDetails.contact_person}</p>
                        <p className="text-sm text-gray-600">{vendorDetails.contact_designation}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Contact Details
                        </label>
                        <p className="text-gray-900">
                          <span className="font-medium">Phone:</span> {vendorDetails.mobile_no}
                        </p>
                        <p className="text-gray-900">
                          <span className="font-medium">Email:</span> {vendorDetails.mail}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Location
                        </label>
                        <p className="text-gray-900 font-medium">
                          {vendorDetails.city}, {vendorDetails.state} - {vendorDetails.pincode}
                        </p>
                      </div>
                      
                      {selectedVendorData.estimatedDeliveryDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Expected Delivery
                          </label>
                          <p className="text-gray-900 font-medium">
                            {formatDate(selectedVendorData.estimatedDeliveryDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Material Purchase Type */}
            {purchase.purchaseRequestType === "Material" && purchase.materials && purchase.materials.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Materials Required</h2>
                <div className="space-y-6">
                  {purchase.materials.map((material, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      {/* Material Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{material.materialId?.material_name}</h3>
                          {material.materialId?.description && (
                            <p className="text-sm text-gray-600 mt-1">{material.materialId.description}</p>
                          )}
                          {material.materialId?.category && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {material.materialId.category}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {material.criticality && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCriticalityColor(material.criticality)}`}>
                              {material.criticality} Priority
                            </span>
                          )}
                          {material.expected_days && (
                            <span className="text-sm text-gray-600">
                              Expected: {material.expected_days} days
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Material Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Quantity Required
                          </label>
                          <p className="text-gray-900 font-medium">
                            {material.quantity} {material.materialId?.unit?.replace('_', ' ')}
                          </p>
                        </div>
                        
                        {material.materialId?.current_stock !== undefined && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Current Stock
                            </label>
                            <p className="text-gray-900 font-medium">
                              {material.materialId.current_stock} {material.materialId.unit?.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              Used: {material.materialId.stock_used} | Trigger: {material.materialId.trigger_value}
                            </p>
                          </div>
                        )}
                        
                        {material.materialId?.unit_cost !== undefined && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Unit Cost
                            </label>
                            <p className="text-gray-900 font-medium">₹{material.materialId.unit_cost}</p>
                            <p className="text-xs text-gray-500">
                              Total: ₹{(material.quantity * material.materialId.unit_cost).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Dimensions */}
                      {material.materialId?.hasDimensions && material.materialId.dimensions && material.materialId.dimensions.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Dimensions & Area
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-md p-3 border">
                            {(() => {
                              const dims = formatDimensions(material.materialId.dimensions);
                              return (
                                <>
                                  {dims.stock && (
                                    <div>
                                      <span className="text-xs text-gray-500">Stock Size:</span>
                                      <p className="font-medium">{dims.stock}</p>
                                    </div>
                                  )}
                                  {dims.usage && (
                                    <div>
                                      <span className="text-xs text-gray-500">Usage Size:</span>
                                      <p className="font-medium">{dims.usage}</p>
                                    </div>
                                  )}
                                  {material.materialId.total_area !== undefined && material.materialId.usage_area !== undefined && (
                                    <div>
                                      <span className="text-xs text-gray-500">Areas:</span>
                                      <p className="font-medium">
                                        Total: {material.materialId.total_area} | Usage: {material.materialId.usage_area}
                                      </p>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Verification Parameters */}
                      {material.materialId?.verificationParameters && material.materialId.verificationParameters.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Verification Parameters
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {material.materialId.verificationParameters.map((param, paramIndex) => (
                              <div key={paramIndex} className="bg-white rounded-md p-3 border">
                                <span className="text-sm font-medium text-gray-900">{param.parameter}</span>
                                <p className="text-sm text-gray-600">Value: {param.specificationValue}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vendor Information */}
                      {material.vendorId && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Vendor Details
                          </label>
                          <div className="bg-white rounded-md p-4 border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold text-gray-900">{material.vendorId.company_name}</h4>
                                <p className="text-sm text-gray-600">{material.vendorId.company_type}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Contact: {material.vendorId.contact_person} ({material.vendorId.contact_designation})
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  📞 {material.vendorId.mobile_no}
                                </p>
                                <p className="text-sm text-gray-600">
                                  ✉️ {material.vendorId.mail}
                                </p>
                                <p className="text-sm text-gray-600">
                                  📍 {material.vendorId.city}, {material.vendorId.state} - {material.vendorId.pincode}
                                </p>
                                {material.vendorId.is_msme && (
                                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    MSME Certified
                                  </span>
                                )}
                              </div>
                            </div>
                            {material.vendorId.gst_no && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                  GST: {material.vendorId.gst_no} | PAN: {material.vendorId.pan_no}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {material.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Material Notes
                          </label>
                          <p className="text-gray-800 bg-white rounded-md p-3 border">{material.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Machinery Purchase Type */}
            {purchase.purchaseRequestType === "Machinery" && purchase.machineryId && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Machinery Details</h2>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{purchase.machineryId.name}</h3>
                      {purchase.machineryId.device_type && (
                        <p className="text-sm text-gray-600 mt-1">Type: {purchase.machineryId.device_type}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {purchase.machineryId.make && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Make
                        </label>
                        <p className="text-gray-900 font-medium">{purchase.machineryId.make}</p>
                      </div>
                    )}
                    
                    {purchase.machineryId.model && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Model
                        </label>
                        <p className="text-gray-900 font-medium">{purchase.machineryId.model}</p>
                      </div>
                    )}
                    
                    {purchase.machineryId.sr_no && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Serial Number
                        </label>
                        <p className="text-gray-900 font-medium">{purchase.machineryId.sr_no}</p>
                      </div>
                    )}
                    
                    {purchase.machineryId.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Location
                        </label>
                        <p className="text-gray-900 font-medium">{purchase.machineryId.location}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="primary" 
                      onClick={() => purchase.machineryId && router.push(`/dashboard/inventory/machinery/${purchase.machineryId._id}`)}
                      className="text-sm"
                    >
                      View All Details
                    </Button>
                  </div>
                </div>
              </div>
            )}


            {/* Misc Purchase Type */}
            {purchase.purchaseRequestType === "Misc" && purchase.misc_id && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Miscellaneous Item Details</h2>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{purchase.misc_id.itemName}</h3>
                      <p className="text-sm text-gray-600 mt-1">ID: {purchase.misc_id.misc_id}</p>
                    </div>
                  </div>

                  {/* Specifications */}
                  {purchase.misc_id.specifications && purchase.misc_id.specifications.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Specifications
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {purchase.misc_id.specifications.map((spec, specIndex) => (
                          <div key={specIndex} className="bg-white rounded-md p-3 border">
                            <span className="text-sm font-medium text-gray-900">{spec.param}</span>
                            <p className="text-sm text-gray-600">{spec.specificationValue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            {allDocuments.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allDocuments.map((doc, index) => (
                    <DocumentCard
                      key={`${doc._id}-${index}`}
                      document={doc}
                      showActions={false}
                    />
                  ))}
                </div>
              </div>
            )}
            
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {!isPurchaseReceived && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  
                  {purchase.status.toLowerCase() === 'requested' && (
                    <Button 
                      variant="success" 
                      className="w-full"
                      onClick={handleApproveRequest}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Approve Request'}
                    </Button>
                  )}
                  
                  {purchase.status.toLowerCase() === 'request approved' && (
                    <>
                      {purchase.vendorsEvaluated && purchase.vendorsEvaluated.length > 0 ? (
                        <Button 
                          variant="primary" 
                          className="w-full"
                          onClick={() => router.push(`/dashboard/purchases/${purchase._id}/evaluation?selection=required`)}
                        >
                          Select Vendor
                        </Button>
                      ) : (
                        <Button 
                          variant="primary" 
                          className="w-full"
                          onClick={() => router.push(`/dashboard/purchases/${purchase._id}/evaluation`)}
                        >
                          Vendor Evaluation
                        </Button>
                      )}
                    </>
                  )}
                  
                  {purchase.status.toLowerCase() === 'pending' && (
                    <Button 
                      variant="success" 
                      className="w-full"
                      onClick={() => router.push(`/dashboard/purchases/${purchase._id}/fulfill`)}
                    >
                      Fulfill Requirement
                    </Button>
                  )}
                  
                  {purchase.status.toLowerCase() === 'verification needed' && (
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={() => router.push(`/dashboard/purchases/${purchase._id}/verify`)}
                    >
                      Verify Purchase
                    </Button>
                  )}
                  
                  {purchase.status.toLowerCase() === 'vendor selected' && (
                    <Button 
                      variant="success" 
                      className="w-full"
                      onClick={handlePurchaseReceived}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Purchase Received'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                {purchase.timeline.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg">{getTimelineIcon(entry.status)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        <p>{formatDate(entry.date)}</p>
                        {entry.user_name && (
                          <p>By: {entry.user_name} {entry.user_email && `(${entry.user_email})`}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePurchasePage;
