/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import OrgApis from "@/actions/Apis/OrgApis";
import React, { useEffect, useState } from "react";
import {
  Edit,
  Trash2,
  Building2,
  Mail,
  Calendar,
  AlertCircle,
  User,
  Shield,
  Users,
} from "lucide-react";
import EditOrgModal from "@/components/modal/EditOrgModal";
import AddOrgModal from "@/components/modal/AddOrgModal";
import { formatDate } from "@/utils/date";

interface Owner {
  _id: string;
  name: string;
  email: string;
  organizationId: string;
  roles: string[];
  status: string;
  joiningDate?: string;
  department?: string;
  position?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Prefix {
  _id?: string;
  title: string;
  format: string;
}

interface Organization {
  _id: string;
  name: string;
  company_address?: string;
  logo?: string;
  prefixes: Prefix[];
  type?: string;
  userIds: string[];
  settings: Record<string, any>;
  isActive: boolean;
  owner: Owner | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const OrgPage = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchOrg();
  }, []);

  useEffect(() => {
    // Auto-hide status message after 5 seconds
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      const res = await OrgApis.getAllOrgs();
      if (res.status === 200) {
        const data = await res.data;
        setOrganizations(data.organizations || []);
        console.log("Organizations:", data);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      setError("Failed to load organizations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const org = organizations.find(org => org._id === id);
    if (org) {
      setSelectedOrg(org);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (data: {
    id: string;
    name: string;
    company_address: string;
    logo: File | null;
    prefixes: Array<{ title: string; format: string }>;
    isActive: boolean;
  }) => {
    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      
      // If there's a logo file, use FormData approach
      if (data.logo) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('company_address', data.company_address);
        formData.append('prefixes', JSON.stringify(data.prefixes));
        formData.append('logo', data.logo);
        formData.append('isActive', data.isActive.toString());
        
        // Add settings as empty object
        formData.append('settings', JSON.stringify({}));
  
        const res = await OrgApis.editOrgWithFormData(formData, data.id);
        
        if (res.status === 200) {
          setIsEditModalOpen(false);
          setStatusMessage({
            type: "success",
            message: "Organization updated successfully",
          });
          await fetchOrg(); // Refresh the list
        }
      } else {
        // No file upload, use regular JSON
        const payload = {
          name: data.name,
          company_address: data.company_address,
          prefixes: data.prefixes,
          isActive: data.isActive,
          settings: {}
        };
  
        const res = await OrgApis.editOrg(payload, data.id);
        
        if (res.status === 200) {
          setIsEditModalOpen(false);
          setStatusMessage({
            type: "success",
            message: "Organization updated successfully",
          });
          await fetchOrg(); // Refresh the list
        }
      }
    } catch (error: any) {
      console.error("Error updating organization:", error);
      setStatusMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to update organization",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      try {
        setStatusMessage(null);
        const res = await OrgApis.deleteOrg(id);
        if (res.status === 200) {
          setStatusMessage({
            type: "success",
            message: "Organization deleted successfully",
          });
          await fetchOrg(); // Refresh the list
        }
      } catch (error: any) {
        console.error("Error deleting organization:", error);
        setStatusMessage({
          type: "error",
          message: error.response?.data?.message || "Failed to delete organization",
        });
      }
    }
  };

  const handleCreateOrg = async (orgData: {
    name: string;
    company_address: string;
    logo: File | null;
    adminName: string;
    adminEmail: string;
    password: string;
  }) => {
    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', orgData.name);
      formData.append('company_address', orgData.company_address);
      
      // Add admin user as JSON string
      formData.append('adminUser', JSON.stringify({
        name: orgData.adminName,
        email: orgData.adminEmail,
        password: orgData.password,
      }));
      
      // Add logo file if provided
      if (orgData.logo) {
        formData.append('logo', orgData.logo);
      }
  
      const res = await OrgApis.createOrgWithFormData(formData);
      
      if (res.status === 200 || res.status === 201) {
        setIsAddModalOpen(false);
        setStatusMessage({
          type: "success",
          message: "Organization created successfully",
        });
        await fetchOrg(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error creating organization:", error);
      setStatusMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to create organization",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Error Loading Organizations
        </h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchOrg}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Status Message */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-md ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            {statusMessage.type === "success" ? (
              <span className="mr-2">✅</span>
            ) : (
              <span className="mr-2">❌</span>
            )}
            <p>{statusMessage.message}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Organizations
        </h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
        >
          + Add New Organization
        </button>
      </div>

      {organizations.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Organizations Found
          </h3>
          <p className="text-gray-500">
            Create your first organization to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
           <div
           key={org._id}
           className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
         >
           <div className="p-5">
             {/* Header with Logo and Name */}
             <div className="flex justify-between items-start mb-4">
               <div className="flex items-start space-x-3 flex-1">
                 {/* Organization Logo */}
                 <div className="flex-shrink-0">
                   {org.logo ? (
                     <img
                       src={org.logo}
                       alt={`${org.name} logo`}
                       className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                       onError={(e) => {
                         // Fallback if image fails to load
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                         target.nextElementSibling?.classList.remove('hidden');
                       }}
                     />
                   ) : null}
                   
                   {/* Fallback logo or default when no logo */}
                   <div className={`w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center ${org.logo ? 'hidden' : ''}`}>
                     <Building2 className="w-7 h-7 text-white" />
                   </div>
                 </div>
                 
                 <div className="flex-1 min-w-0">
                   <h2 className="text-xl font-semibold text-gray-800 truncate">
                     {org.name}
                   </h2>
                   {org.company_address && (
                     <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                       {org.company_address}
                     </p>
                   )}
                 </div>
               </div>
               
               <div className="flex space-x-2 flex-shrink-0 ml-2">
                 <button
                   onClick={() => handleEdit(org._id)}
                   className="text-gray-500 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50"
                   aria-label="Edit organization"
                 >
                   <Edit size={18} />
                 </button>
                 <button
                   onClick={() => handleDelete(org._id)}
                   className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                   aria-label="Delete organization"
                 >
                   <Trash2 size={18} />
                 </button>
               </div>
             </div>
       
             {/* Organization Details */}
             <div className="space-y-3 mb-4">
               {/* Owner Information */}
               {org.owner ? (
                 <div className="bg-gray-50 rounded-lg p-3">
                   <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                     Administrator
                   </h4>
                   <div className="space-y-2">
                     <div className="flex items-center text-sm text-gray-700">
                       <User size={14} className="mr-2 flex-shrink-0 text-gray-500" />
                       <span className="font-medium">{org.owner.name}</span>
                     </div>
                     <div className="flex items-center text-sm text-gray-600">
                       <Mail size={14} className="mr-2 flex-shrink-0 text-gray-500" />
                       <span className="truncate">{org.owner.email}</span>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                   <div className="flex items-center text-sm text-yellow-800">
                     <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                     <span>No administrator assigned</span>
                   </div>
                 </div>
               )}
       
               {/* Organization Statistics */}
               <div className="grid grid-cols-2 gap-3">
                 <div className="text-center bg-blue-50 rounded-lg p-3">
                   <div className="flex items-center justify-center mb-1">
                     <Users size={16} className="text-blue-600" />
                   </div>
                   <div className="text-2xl font-bold text-blue-700">
                     {org.userIds?.length || 0}
                   </div>
                   <div className="text-xs text-blue-600">
                     {org.userIds?.length === 1 ? 'User' : 'Users'}
                   </div>
                 </div>
                 
                 <div className="text-center bg-green-50 rounded-lg p-3">
                   <div className="flex items-center justify-center mb-1">
                     <Calendar size={16} className="text-green-600" />
                   </div>
                   <div className="text-xs font-medium text-green-700">
                     Created
                   </div>
                   <div className="text-xs text-green-600">
                     {formatDate(org.createdAt)}
                   </div>
                 </div>
               </div>
             </div>
       
             {/* Status and Type Footer */}
             <div className="flex justify-between items-center pt-3 border-t border-gray-100">
               <div className="flex items-center space-x-2">
                 <span
                   className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                     org.isActive
                       ? "bg-green-100 text-green-800 border border-green-200"
                       : "bg-red-100 text-red-800 border border-red-200"
                   }`}
                 >
                   <div className={`w-2 h-2 rounded-full mr-1.5 ${
                     org.isActive ? "bg-green-500" : "bg-red-500"
                   }`}></div>
                   {org.isActive ? "Active" : "Inactive"}
                 </span>
               </div>
       
               <div className="flex items-center space-x-2">
                 {org.type && (
                   <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                     {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
                   </span>
                 )}
                 
                 {org.prefixes && org.prefixes.length > 0 && (
                   <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                     {org.prefixes.length} Prefix{org.prefixes.length !== 1 ? 'es' : ''}
                   </span>
                 )}
               </div>
             </div>
           </div>
         </div>
          ))}
        </div>
      )}

      <AddOrgModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateOrg}
        isLoading={isSubmitting}
      />

      <EditOrgModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        isLoading={isSubmitting}
        organization={selectedOrg}
      />
    </div>
  );
};

export default OrgPage;
                      