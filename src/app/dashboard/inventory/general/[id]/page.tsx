"use client"
import React, { useEffect, useState } from 'react';
import PurchaseReqApis from '@/actions/Apis/PurchaseReqApis';
import { formatDate } from '@/utils/date';
import { useRouter } from 'next/navigation';

// Interfaces based on the provided JSON structure
interface Specification {
  param: string;
  specificationValue: string;
}

interface TimelineEvent {
  status: string;
  date: string;
  user_name: string;
  notes?: string;
}

interface Document {
  docName: string;
  link: string;
  fileName: string;
}

interface Vendor {
  company_name: string;
  isRecommended: boolean;
  isSelected: boolean;
}

interface PurchaseReceived {
  model: string;
  make: string;
  serialNo: string;
  deviceId: string;
  receivedDate: string;
}

interface SinglePurchaseItem {
  _id: string;
  PurchaseRequest_id: string;
  purchaseRequestType: string;
  misc_id: {
    itemName: string;
    specifications: Specification[];
  };
  requiredBy: string;
  status: string;
  timeline: TimelineEvent[];
  documents: Array<{ documentId: { documents: Document[] } }>;
  vendorsEvaluated: Array<{
    vendorId: Vendor;
    name: string;
    price: number;
    isSelected: boolean;
  }>;
  createdAt: string;
  purchaseReceived?: PurchaseReceived;
}

const SingleGeneralPage = ({ params }: { params: { id: string } }) => {
  const [item, setItem] = useState<SinglePurchaseItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchSingleItem = async (id: string) => {
    try {
      setLoading(true);
      const res = await PurchaseReqApis.getSinglePurchase(id);
      if (res.status === 200) {
        setItem(res.data.requirement);
      } else {
        setError("Failed to fetch item details.");
      }
    } catch (error) {
      console.error("Error fetching single item:", error);
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchSingleItem(params.id);
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  if (!item) {
    return <div className="text-center py-12 text-gray-500">Item not found.</div>;
  }

  const selectedVendor = item.vendorsEvaluated.find(v => v.isSelected);
  const documents = item.documents?.[0]?.documentId?.documents || [];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {item.misc_id?.itemName || "General Item"}
        </h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          &larr; Back to Inventory
        </button>
      </div>

      <div className="space-y-8">
        {/* Basic Details Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Item Name</p>
              <p className="mt-1 text-base text-gray-900">{item.misc_id?.itemName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Request ID</p>
              <p className="mt-1 text-base text-gray-900">{item.PurchaseRequest_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1 text-base text-gray-900">{item.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Purchase Type</p>
              <p className="mt-1 text-base text-gray-900">{item.purchaseRequestType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="mt-1 text-base text-gray-900">{formatDate(item.createdAt)}</p>
            </div>
            {item.purchaseReceived?.receivedDate && (
              <div>
                <p className="text-sm font-medium text-gray-500">Received Date</p>
                <p className="mt-1 text-base text-gray-900">{formatDate(item.purchaseReceived.receivedDate)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Specifications Section */}
        {item.misc_id?.specifications?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              {item.misc_id.specifications.map((spec, index) => (
                <div key={index}>
                  <p className="text-sm font-medium text-gray-500 capitalize">{spec.param}</p>
                  <p className="mt-1 text-base text-gray-900">{spec.specificationValue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchase Details Section */}
        {selectedVendor && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Selected Vendor</p>
                <p className="mt-1 text-base text-gray-900">{selectedVendor.name}</p>
              </div>
              {selectedVendor.price && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Final Price</p>
                  <p className="mt-1 text-base text-gray-900">₹{selectedVendor.price.toLocaleString()}</p>
                </div>
              )}
              {item.purchaseReceived?.deviceId && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Device ID</p>
                  <p className="mt-1 text-base text-gray-900">{item.purchaseReceived.deviceId}</p>
                </div>
              )}
              {item.purchaseReceived?.serialNo && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Serial No</p>
                  <p className="mt-1 text-base text-gray-900">{item.purchaseReceived.serialNo}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Section */}
        {documents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
            <ul className="divide-y divide-gray-200">
              {documents.map((doc, index) => (
                <li key={index} className="py-2 flex justify-between items-center">
                  <span className="text-gray-900">{doc.docName} ({doc.fileName})</span>
                  <a
                    href={doc.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    View Document
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timeline Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-4">
            {item.timeline.map((event, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 pt-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {event.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(event.date)} by {event.user_name}
                  </p>
                  {event.notes && (
                    <p className="mt-1 text-xs text-gray-700 italic">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleGeneralPage;