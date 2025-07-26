/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import VendorApis from "@/actions/Apis/VendorApis";
import Button from "@/components/ReusableComponents/Button";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VendorForm from "@/components/forms/VendorForm";

// TypeScript interface for vendor data
interface VendorFormData {
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
  company_type: 'Proprietorship' | 'Partnership' | 'Private Limited' | 'Limited' | '';
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

const EditVendorPage = ({ params }: { params: { id: string } }) => {
  const [vendorData, setVendorData] = useState<VendorFormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const router = useRouter();

  const fetchVendorDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await VendorApis.getSingleVendor(id);
      if (res.status === 200) {
        console.log("Vendor Details:", res.data);
        setVendorData(res.data);
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

  const handleUpdateVendor = async (updatedVendorData: VendorFormData) => {
    setUpdateLoading(true);
    setError("");
    setSuccess("");

    try {
      // Clean up the data before sending
      const cleanedData = {
        ...updatedVendorData,
        // Remove msme_reg_no if not MSME unit
        ...(updatedVendorData.is_msme ? {} : { msme_reg_no: undefined }),
        // Ensure empty strings are converted to appropriate values
        approved_for: updatedVendorData.approved_for.trim(),
        company_name: updatedVendorData.company_name.trim(),
        company_address: updatedVendorData.company_address.trim(),
        state: updatedVendorData.state.trim(),
        city: updatedVendorData.city.trim(),
        pincode: updatedVendorData.pincode.trim(),
        mobile_no: updatedVendorData.mobile_no.trim(),
        phone_no: updatedVendorData.phone_no.trim(),
        mail: updatedVendorData.mail.trim(),
        website: updatedVendorData.website.trim(),
        partner_name: updatedVendorData.partner_name.trim(),
        contact_person: updatedVendorData.contact_person.trim(),
        contact_designation: updatedVendorData.contact_designation.trim(),
        bank_name: updatedVendorData.bank_name.trim(),
        branch_name: updatedVendorData.branch_name.trim(),
        bank_ifsc: updatedVendorData.bank_ifsc.trim(),
        bank_account_no: updatedVendorData.bank_account_no.trim(),
        bank_micr_code: updatedVendorData.bank_micr_code.trim(),
        bank_swift_code: updatedVendorData.bank_swift_code.trim(),
        gst_no: updatedVendorData.gst_no.trim(),
        pan_no: updatedVendorData.pan_no.trim(),
        msme_reg_no: updatedVendorData.msme_reg_no?.trim()
      };

      console.log('Updating vendor with data:', cleanedData); // Debug log

      const response = await VendorApis.updateVendor(params.id, cleanedData);
      
      console.log('Update response:', response); // Debug log
      
      if (response.status === 200) {
        setSuccess("Vendor updated successfully!");
        setTimeout(() => {
          router.push(`/dashboard/vendors/${params.id}`);
        }, 1500);
      } else {
        throw new Error(response.data?.message || "Failed to update vendor");
      }
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      setError(
        error.response?.data?.message ||
        error.message ||
        'Failed to update vendor'
      );
    } finally {
      setUpdateLoading(false);
    }
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
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  if (error && !vendorData) {
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
          <div className="space-x-3">
            <Button 
              variant="outline"
              onClick={() => fetchVendorDetails(params.id)}
            >
              Try Again
            </Button>
            <Button 
              variant="primary"
              onClick={() => router.push('/dashboard/vendors')}
            >
              Back to Vendors
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!vendorData) {
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
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push(`/dashboard/vendors/${params.id}`)}
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
                Edit Vendor
              </h1>
              <p className="text-gray-600 mt-1">
                Update vendor information for {vendorData.company_name}
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg max-w-6xl mx-auto">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-6xl mx-auto">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Vendor Form Component */}
        <VendorForm
          initialData={vendorData}
          onSubmit={handleUpdateVendor}
          isLoading={updateLoading}
          submitButtonText="Update Vendor"
          title="Edit Vendor Information"
        />

        {/* Loading Overlay */}
        {updateLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                Updating vendor...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditVendorPage;