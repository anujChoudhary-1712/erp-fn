/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PurchaseReqApis from '@/actions/Apis/PurchaseReqApis';
import VendorApis from '@/actions/Apis/VendorApis';
import InputField from '@/components/ReusableComponents/InputField';
import Button from '@/components/ReusableComponents/Button';
import { formatDate } from '@/utils/date';
import { getCookie } from '@/actions/CookieUtils';
import { Upload, X, FileText, Trash2, CheckCircle } from 'lucide-react';

// --- Reusable RatingStars Component ---
// This component provides a visual star rating interface.
interface RatingStarsProps {
  rating: number;
  onRatingChange?: (value: number) => void;
  readOnly?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating, onRatingChange, readOnly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (starIndex: number) => {
    if (!readOnly) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const handleClick = (starIndex: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(starIndex);
    }
  };

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`cursor-pointer text-lg transition-colors ${
            (hoverRating >= star || rating >= star)
              ? 'text-yellow-400'
              : 'text-gray-300'
          }`}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};
// --- End of RatingStars Component ---

// --- TypeScript Interfaces ---
interface MaterialReceivedPayload {
  materialId: string;
  receivedQuantity: number;
}

interface PurchaseReceivedPayload {
  model?: string;
  make?: string;
  serialNo?: string;
  deviceId?: string;
  documents?: {
    documentId: string;
    name: string;
    purchaseRecdDate: string;
  }[];
  materialsReceived?: MaterialReceivedPayload[];
  notes?: string;
}

interface DocumentItem {
  documentId: string;
  name: string;
  purchaseRecdDate: string;
}

interface VendorRatingData {
  quality: number;
  delivery: number;
  price: number;
  communication: number;
  overall: number;
  comments: string;
}

interface Vendor {
  _id: string;
  company_name: string;
  contact_person: string;
  mobile_no: string;
}

interface Purchase {
  _id: string;
  purchaseRequestType: 'Material' | 'Machinery' | 'Misc';
  materials?: any[];
  machineryId?: {
    _id: string;
    name: string;
    model: string;
    make: string;
    sr_no: string;
  };
  misc_id?: {
    itemName: string;
  };
  vendorsEvaluated?: Array<{
    vendorId: Vendor;
    isSelected?: boolean;
  }>;
}

// --- Simplified Document Upload Modal Component ---
// This is a minimal modal to handle the document upload flow.
interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (documentId: string, documentName: string) => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async () => {
    if (!docName.trim() || !file) {
      setError('Please provide a document name and select a file.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", docName);
    formData.append("docName", docName);

    try {
      const token = getCookie("token");
      const response = await fetch("http://localhost:8001/api/documents/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      onUploadSuccess(data.document._id, docName);
      // Reset state and close modal
      setDocName('');
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setError(err.message || "Error uploading file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Upload Document</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
        <div className="space-y-4">
          <InputField
            label="Document Name"
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g., Invoice, Warranty Card"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" onClick={handleFileUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
};
// --- End of Document Upload Modal Component ---

const PurchaseReceivedPage = ({ params }: { params: { id: string } }) => {
  // --- State Management ---
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [formData, setFormData] = useState<PurchaseReceivedPayload>({
    documents: [],
    materialsReceived: [],
  });
  const [vendorRatings, setVendorRatings] = useState<{ [key: string]: VendorRatingData }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const purchaseRes = await PurchaseReqApis.getSinglePurchase(params.id);
        if (purchaseRes.status === 200) {
          const purchaseData = purchaseRes.data.requirement;
          setPurchase(purchaseData);

          // Initialize form data for Material
          if (purchaseData?.purchaseRequestType === 'Material') {
            const materialsReceived = purchaseData.materials?.map((mat: any) => ({
              materialId: mat.materialId._id,
              receivedQuantity: mat.receivedQuantity || 0,
            }));
            setFormData(prev => ({ ...prev, materialsReceived }));
          }
          // Initialize form data for Machinery/Misc
          else if (purchaseData?.purchaseRequestType === 'Machinery') {
            setFormData(prev => ({
              ...prev,
              model: purchaseData.machineryId?.model || '',
              make: purchaseData.machineryId?.make || '',
              serialNo: purchaseData.machineryId?.sr_no || '',
            }));
          }

          // Initialize vendor ratings if a vendor is selected
          const selectedVendor = purchaseData.vendorsEvaluated?.find((v: any) => v.isSelected);
          if (selectedVendor && selectedVendor.vendorId) {
            const vendorId = selectedVendor.vendorId._id;
            setVendorRatings({
              [vendorId]: {
                quality: 0,
                delivery: 0,
                price: 0,
                communication: 0,
                overall: 0,
                comments: "",
              },
            });
          }
        } else {
          setError("Failed to fetch purchase details.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load purchase requirement details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // --- Form & Rating Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialQuantityChange = (materialId: string, quantity: string) => {
    const newQuantity = parseInt(quantity, 10);
    setFormData((prev) => ({
      ...prev,
      materialsReceived: prev.materialsReceived?.map(item =>
        item.materialId === materialId ? { ...item, receivedQuantity: newQuantity } : item
      ),
    }));
  };

  const handleRatingChange = (vendorId: string, ratingType: keyof VendorRatingData, value: number) => {
    setVendorRatings((prev) => {
      const newRatings = {
        ...prev,
        [vendorId]: {
          ...prev[vendorId],
          [ratingType]: value,
        },
      };
      const currentVendorRating = newRatings[vendorId];
      const sum = currentVendorRating.quality + currentVendorRating.delivery + currentVendorRating.price + currentVendorRating.communication;
      const avg = sum > 0 ? sum / 4 : 0;
      newRatings[vendorId].overall = parseFloat(avg.toFixed(1));
      return newRatings;
    });
  };

  const handleRatingCommentsChange = (vendorId: string, comments: string) => {
    setVendorRatings((prev) => ({
      ...prev,
      [vendorId]: {
        ...prev[vendorId],
        comments: comments,
      },
    }));
  };
  
  // --- Document Upload Handlers ---
  const handleDocumentUploadSuccess = (documentId: string, documentName: string) => {
    const newDoc = { documentId, name: documentName, purchaseRecdDate: new Date().toISOString() };
    setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), newDoc] }));
  };

  const handleRemoveDocument = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter(doc => doc.documentId !== documentId)
    }));
  };

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Validate that an invoice document is present
      if (!formData.documents || formData.documents.length === 0 || !formData.documents.some(d => d.name.toLowerCase().includes('invoice'))) {
        setError("An invoice document is required to mark the purchase as received. Please upload a document with 'invoice' in its name.");
        setSubmitting(false);
        return;
      }

      const payload: PurchaseReceivedPayload = {
        documents: formData.documents,
        notes: formData.notes,
      };

      if (purchase?.purchaseRequestType === 'Material') {
        // For Material, prepare the specific payload
        if (!formData.materialsReceived || formData.materialsReceived.some(item => !item.materialId || !item.receivedQuantity || item.receivedQuantity <= 0)) {
          setError("Please enter a positive quantity received for all materials.");
          setSubmitting(false);
          return;
        }
        payload.materialsReceived = formData.materialsReceived;
      } else {
        // For Machinery/Misc, prepare the generic payload
        payload.model = formData.model;
        payload.make = formData.make;
        payload.serialNo = formData.serialNo;
        payload.deviceId = formData.deviceId;
      }

      const res = await PurchaseReqApis.purchaseReceived(params.id, payload);
      if (res.status !== 200) {
        throw new Error(res.data?.message || "Failed to mark purchase as received");
      }

      // Submit vendor ratings if available and non-empty
      const ratingPromises = Object.entries(vendorRatings).map(async ([vendorId, ratingData]) => {
        if (Object.values(ratingData).some(val => typeof val === 'number' && val > 0)) {
          const material = purchase?.materials?.[0];
          const payload = {
            purchase_id: params.id,
            material_id: material?.materialId._id || '',
            material_name: material?.materialId.material_name || '',
            criticality: material?.criticality || 'Regular',
            quality_score: ratingData.quality,
            delivery_score: ratingData.delivery,
            price_score: ratingData.price,
            communication_score: ratingData.communication,
            overall_score: ratingData.overall,
            comments: ratingData.comments,
          };
          return VendorApis.rateVendor(vendorId, payload);
        }
        return Promise.resolve();
      });

      await Promise.all(ratingPromises);
      
      setSuccess("Purchase has been marked as received and vendor(s) have been rated successfully!");
      setTimeout(() => {
        router.push(`/dashboard/purchases/${params.id}`);
      }, 2000);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 font-medium">Loading purchase details...</span>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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

  const selectedVendor = purchase.vendorsEvaluated?.find((v: any) => v.isSelected);
  const vendorObj = selectedVendor?.vendorId;
  const itemDisplayName = purchase.purchaseRequestType === 'Machinery'
    ? purchase.machineryId?.name
    : purchase.purchaseRequestType === 'Material'
      ? purchase.materials?.[0]?.materialId.material_name
      : purchase.misc_id?.itemName;

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
                Purchase Received - {purchase.purchaseRequestType}
              </h1>
              <p className="text-gray-600 mt-1">
                Record details of the received item and rate the vendor&apos;s performance.
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
          {/* Item Details (for Machinery and Misc) */}
          {(purchase.purchaseRequestType === 'Machinery' || purchase.purchaseRequestType === 'Misc') && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <p className="font-medium text-gray-900">{itemDisplayName}</p>
                </div>
                
                <InputField
                  label="Model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g., Model-XYZ-2025"
                  required
                />
                <InputField
                  label="Make"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Manufacturing"
                  required
                />
                <InputField
                  label="Serial Number"
                  name="serialNo"
                  value={formData.serialNo}
                  onChange={handleInputChange}
                  placeholder="e.g., SN123456789"
                  required
                />
                <InputField
                  label="Device ID"
                  name="deviceId"
                  value={formData.deviceId}
                  onChange={handleInputChange}
                  placeholder="e.g., DEV-001-2025"
                  required
                />
              </div>
            </div>
          )}

          {/* Material Details (for Material) */}
          {purchase.purchaseRequestType === 'Material' && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Materials Received</h2>
              {purchase.materials?.map((material, index) => (
                <div key={material.materialId._id} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                    <p className="font-medium text-gray-900">{material.materialId.material_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Requested</label>
                    <p className="font-medium text-gray-900">{material.quantity} {material.materialId.unit}</p>
                  </div>
                  <div className="md:col-span-2">
                    <InputField
                      label="Quantity Received"
                      type="number"
                      name={`receivedQuantity-${index}`}
                      value={formData.materialsReceived?.[index]?.receivedQuantity?.toString() || ''}
                      onChange={(e) => handleMaterialQuantityChange(material.materialId._id, e.target.value)}
                      placeholder="Enter quantity received"
                      min="1"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Document Uploads */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
            
            {/* List of Uploaded Documents */}
            <div className="space-y-3">
              {formData.documents && formData.documents.length > 0 ? (
                formData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.documentId)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No documents uploaded yet.</div>
              )}
            </div>
            
            {/* Invoice validation message for all types */}
            {!formData.documents?.some(d => d.name.toLowerCase().includes('invoice')) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  ⚠️ An invoice document is required to mark the purchase as received.
                </p>
              </div>
            )}
          </div>

          {/* Vendor Rating */}
          {vendorObj && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Vendor Performance</h2>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{vendorObj.company_name}</h3>
                <p className="text-sm text-gray-600 mb-4">Your feedback helps in future purchasing decisions.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality (1-5 Stars) <span className="text-red-500">*</span>
                    </label>
                    <RatingStars
                      rating={vendorRatings[vendorObj._id]?.quality || 0}
                      onRatingChange={(value) => handleRatingChange(vendorObj._id, 'quality', value)}
                    />
                  </div>

                  {/* Delivery */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery (1-5 Stars) <span className="text-red-500">*</span>
                    </label>
                    <RatingStars
                      rating={vendorRatings[vendorObj._id]?.delivery || 0}
                      onRatingChange={(value) => handleRatingChange(vendorObj._id, 'delivery', value)}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (1-5 Stars) <span className="text-red-500">*</span>
                    </label>
                    <RatingStars
                      rating={vendorRatings[vendorObj._id]?.price || 0}
                      onRatingChange={(value) => handleRatingChange(vendorObj._id, 'price', value)}
                    />
                  </div>

                  {/* Communication */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Communication (1-5 Stars) <span className="text-red-500">*</span>
                    </label>
                    <RatingStars
                      rating={vendorRatings[vendorObj._id]?.communication || 0}
                      onRatingChange={(value) => handleRatingChange(vendorObj._id, 'communication', value)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={vendorRatings[vendorObj._id]?.comments || ''}
                    onChange={(e) => handleRatingCommentsChange(vendorObj._id, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter additional comments here..."
                  ></textarea>
                </div>

                <div className="mt-4 p-3 bg-white rounded-md border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Overall Rating:</span>
                    <RatingStars
                      rating={vendorRatings[vendorObj._id]?.overall || 0}
                      readOnly
                    />
                    <span className="text-sm font-medium text-gray-900">
                      ({(vendorRatings[vendorObj._id]?.overall || 0).toFixed(1)}/5)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={submitting}
              className="min-w-40"
            >
              {submitting ? 'Submitting...' : 'Mark as Received'}
            </Button>
          </div>
        </form>

        {/* Loading Overlay */}
        {submitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                Submitting purchase details...
              </span>
            </div>
          </div>
        )}
      </div>
      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleDocumentUploadSuccess}
      />
    </div>
  );
};

export default PurchaseReceivedPage;