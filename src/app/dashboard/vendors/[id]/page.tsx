/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import VendorApis from "@/actions/Apis/VendorApis";
import Button from "@/components/ReusableComponents/Button";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// TypeScript interface for vendor data
interface Vendor {
  _id: string;
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
  msme_reg_no?: string;
}

const SingleVendorPage = ({ params }: { params: { id: string } }) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const router = useRouter();

  const fetchVendorDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await VendorApis.getSingleVendor(id);
      if (res.status === 200) {
        console.log("Vendor Details:", res.data);
        setVendor(res.data);
      } else {
        setError("Failed to load vendor details");
      }
    } catch (error: any) {
      console.error("Error fetching vendor:", error);
      setError(error.message || "Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      setDeleteLoading(true);
      try {
        const res = await VendorApis.deleteVendor(params.id);
        if (res.status === 200) {
          alert("Vendor deleted successfully!");
          router.push("/dashboard/vendors");
        } else {
          alert("Failed to delete vendor");
        }
      } catch (error: any) {
        console.error("Error deleting vendor:", error);
        alert(error.message || "Failed to delete vendor");
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleEditVendor = () => {
    router.push(`/dashboard/vendors/${params.id}/edit`);
  };

  useEffect(() => {
    if (params.id) {
      fetchVendorDetails(params.id);
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-red-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Vendor</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/vendors')}
          >
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor Not Found</h3>
          <p className="text-gray-600 mb-4">The requested vendor could not be found.</p>
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/vendors')}
          >
            Back to Vendors
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
              onClick={() => router.push('/dashboard/vendors')}
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {vendor.company_name}
              </h1>
              <p className="text-gray-600 mt-1">
                {vendor.company_type} • {vendor.city}, {vendor.state}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleEditVendor}
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteVendor}
                disabled={deleteLoading}
                className="flex items-center space-x-2"
              >
                {deleteLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                <span>{deleteLoading ? 'Deleting...' : 'Delete'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Vendor Details */}
        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vendor.approved_for && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Approved For</label>
                  <p className="text-gray-900">{vendor.approved_for}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
                <p className="text-gray-900 font-medium">{vendor.company_name}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                <p className="text-gray-900">{vendor.company_address}</p>
                <p className="text-gray-600 text-sm mt-1">{vendor.city}, {vendor.state} - {vendor.pincode}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Mobile Number</label>
                <p className="text-gray-900">{vendor.mobile_no}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                <p className="text-gray-900">{vendor.phone_no || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{vendor.mail}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Website</label>
                {vendor.website ? (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {vendor.website}
                  </a>
                ) : (
                  <p className="text-gray-900">N/A</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Company Type</label>
                <p className="text-gray-900">{vendor.company_type}</p>
              </div>

              {vendor.partner_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Partner/Directors</label>
                  <p className="text-gray-900">{vendor.partner_name}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Contact Person</label>
                <p className="text-gray-900 font-medium">{vendor.contact_person}</p>
                <p className="text-gray-600 text-sm">{vendor.contact_designation}</p>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Banking Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Bank Name</label>
                <p className="text-gray-900">{vendor.bank_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Branch Name</label>
                <p className="text-gray-900">{vendor.branch_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account Number</label>
                <p className="text-gray-900 font-mono">{vendor.bank_account_no}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">IFSC Code</label>
                <p className="text-gray-900 font-mono">{vendor.bank_ifsc}</p>
              </div>

              {vendor.bank_micr_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">MICR Code</label>
                  <p className="text-gray-900 font-mono">{vendor.bank_micr_code}</p>
                </div>
              )}

              {vendor.bank_swift_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">SWIFT Code</label>
                  <p className="text-gray-900 font-mono">{vendor.bank_swift_code}</p>
                </div>
              )}
            </div>
          </div>

          {/* GST & Registration Details */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">GST & Registration Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">GST Number</label>
                <p className="text-gray-900 font-mono">{vendor.gst_no}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">PAN Number</label>
                <p className="text-gray-900 font-mono">{vendor.pan_no}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">MSME Unit</label>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vendor.is_msme 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {vendor.is_msme ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {vendor.is_msme && vendor.msme_reg_no && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">MSME Registration No.</label>
                  <p className="text-gray-900 font-mono">{vendor.msme_reg_no}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleVendorPage