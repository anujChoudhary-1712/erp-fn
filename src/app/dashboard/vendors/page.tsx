/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import VendorApis from '@/actions/Apis/VendorApis';
import Button from '@/components/ReusableComponents/Button';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// TypeScript interfaces - updated to match your API response
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
  status: 'pending' | 'approved' | 'rejected'; // Added status field
}

interface Tab {
  id: string;
  label: string;
  count: number;
}

const VendorsPage = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  // Fetch all vendors once to get the full list and set initial display
  useEffect(() => {
    const fetchAllVendors = async () => {
      setLoading(true);
      try {
        const res = await VendorApis.getAllVendors();
        if (res.status === 200) {
          const fetchedVendors = res.data || [];
          setAllVendors(fetchedVendors);
          // Set initial vendors based on the active tab, which is 'all' by default
          setVendors(fetchedVendors);
        } else {
          setError("Failed to load vendors");
        }
      } catch (error: any) {
        console.error("Error fetching vendors:", error);
        setError(error.message || "Failed to load vendors");
      } finally {
        setLoading(false);
      }
    };
    fetchAllVendors();
  }, []);

  // Filter vendors whenever the active tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      setVendors(allVendors);
    } else {
      setVendors(allVendors.filter(v => v.status === activeTab));
    }
  }, [activeTab, allVendors]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTabCounts = (vendorList: Vendor[]) => {
    const counts = {
      all: vendorList.length,
      pending: vendorList.filter(v => v.status === "pending").length,
      approved: vendorList.filter(v => v.status === "approved").length,
      rejected: vendorList.filter(v => v.status === "rejected").length,
    };
    return counts;
  };
  
  const tabCounts = getTabCounts(allVendors);

  const tabs: Tab[] = [
    { id: "all", label: "All Vendors", count: tabCounts.all },
    { id: "pending", label: "Pending", count: tabCounts.pending },
    { id: "approved", label: "Approved", count: tabCounts.approved },
    { id: "rejected", label: "Rejected", count: tabCounts.rejected },
  ];

  const navigateToVendorDetails = (vendorId: string) => {
    router.push(`/dashboard/vendors/${vendorId}`);
  };

  // Vendor Card Component - Shows basic details and navigates to detail page on click
  const VendorCard: React.FC<{ vendor: Vendor }> = ({ vendor }) => (
    <div 
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 cursor-pointer hover:border-blue-300"
      onClick={() => navigateToVendorDetails(vendor._id)}
    >
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900 truncate flex-1">
            {vendor.company_name}
          </h3>
          <div className="ml-2">
            <svg 
              className="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-600">{vendor.company_type}</p>
          <span 
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}
          >
            {vendor.status?.charAt(0).toUpperCase() + vendor.status?.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-gray-500 mr-3">
            <svg 
              className="w-4 h-4 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 break-words line-clamp-2">
              {vendor.company_address}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {vendor.city}, {vendor.state} - {vendor.pincode}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex-shrink-0 text-gray-500 mr-3">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
              />
            </svg>
          </div>
          <p className="text-sm text-gray-700">{vendor.mobile_no}</p>
        </div>

        <div className="flex items-center">
          <div className="flex-shrink-0 text-gray-500 mr-3">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <p className="text-sm text-gray-700 break-words truncate">{vendor.mail}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-gray-500 mr-2">
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">{vendor.contact_person}</p>
              <p className="text-xs text-gray-500">{vendor.contact_designation}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {vendor.is_msme && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                MSME
              </span>
            )}
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {vendor.bank_name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Vendors
          </h1>
          <p className="text-gray-600">Manage your vendor information and relationships</p>
        </div>
        <Button
          variant="primary"
          className="w-full md:w-auto mt-4 md:mt-0"
          onClick={() => {
            router.push("/dashboard/vendors/create");
          }}
        >
          + Add Vendor
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Vendors
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => {}}
            >
              Try Again
            </Button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No vendors found
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === "all"
                ? "You haven't added any vendors yet. Start by adding your first vendor."
                : `No ${activeTab} vendors found.`}
            </p>
            {activeTab === "all" && (
              <Button
                variant="primary"
                onClick={() => {
                  router.push("/dashboard/vendors/create");
                }}
              >
                Add Your First Vendor
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600 mb-4 sm:mb-0">
                Showing {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorCard key={vendor._id} vendor={vendor} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;
