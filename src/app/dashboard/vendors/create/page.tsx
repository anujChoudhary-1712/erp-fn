/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import VendorApis from '@/actions/Apis/VendorApis'
import VendorForm from '@/components/forms/VendorForm';

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

const CreateVendorPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const router = useRouter();

  const handleCreateVendor = async (vendorData: VendorFormData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const cleanedData = {
        ...vendorData,
        ...(vendorData.is_msme ? {} : { msme_reg_no: undefined }),
        approved_for: vendorData.approved_for.trim(),
        company_name: vendorData.company_name.trim(),
        company_address: vendorData.company_address.trim(),
        state: vendorData.state.trim(),
        city: vendorData.city.trim(),
        pincode: vendorData.pincode.trim(),
        mobile_no: vendorData.mobile_no.trim(),
        phone_no: vendorData.phone_no.trim(),
        mail: vendorData.mail.trim(),
        website: vendorData.website.trim(),
        partner_name: vendorData.partner_name.trim(),
        contact_person: vendorData.contact_person.trim(),
        contact_designation: vendorData.contact_designation.trim(),
        bank_name: vendorData.bank_name.trim(),
        branch_name: vendorData.branch_name.trim(),
        bank_ifsc: vendorData.bank_ifsc.trim(),
        bank_account_no: vendorData.bank_account_no.trim(),
        bank_micr_code: vendorData.bank_micr_code.trim(),
        bank_swift_code: vendorData.bank_swift_code.trim(),
        gst_no: vendorData.gst_no.trim(),
        pan_no: vendorData.pan_no.trim(),
        msme_reg_no: vendorData.msme_reg_no?.trim()
      };

      const res = await VendorApis.addVendors(cleanedData);
      
      if(res.status === 201 || res.status === 200) {
        setSuccess("Vendor created successfully!");
        setTimeout(() => {
          router.push("/dashboard/vendors");
        }, 1500);
      } else {
        throw new Error(res.data?.message || "Failed to create vendor");
      }
    } catch (error: any) {
      console.error("Error creating vendor:", error);
      setError(
        error.response?.data?.message ||
        error.message ||
        "An error occurred while creating the vendor. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-4 mb-2 sm:mb-4">
            <button
              onClick={() => router.back()}
              className="p-1 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
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
            <div className="w-full">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                Create New Vendor
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Fill in the complete vendor registration details below
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg max-w-full mx-auto text-sm sm:text-base">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0"
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-full mx-auto text-sm sm:text-base">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 flex-shrink-0"
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
          onSubmit={handleCreateVendor}
          isLoading={loading}
          submitButtonText="Create Vendor"
          title="Vendor Registration"
        />
      </div>
    </div>
  );
}

export default CreateVendorPage;