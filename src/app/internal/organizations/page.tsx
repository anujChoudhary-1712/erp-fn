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
import { formatDistanceToNow } from "date-fns";
import EditOrgModal from "@/components/modal/EditOrgModal";
import AddOrgModal from "@/components/modal/AddOrgModal";

// Define the Organization interface based on the API response
interface Owner {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  createdAt: string;
  organizationId: string;
}

interface Organization {
  _id: string;
  name: string;
  email?: string;
  type?: string;
  isActive: boolean;
  createdAt: string;
  settings: Record<string, any>;
  __v: number;
  userIds?: string[];
  updatedAt?: string;
  owner?: Owner;
}

// Interface for the create organization payload
interface CreateOrgPayload {
  name: string;
  adminName: string;
  adminEmail: string;
  password: string;
}

// Interface for the edit organization payload
interface EditOrgPayload {
  id: string;
  name: string;
  isActive: boolean;
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

  const handleEditSubmit = async (data: EditOrgPayload) => {
    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      
      const payload = {
        name: data.name,
        isActive: data.isActive,
        settings:{}
      };

      const res = await OrgApis.editOrg(payload,data.id);
      
      if (res.status === 200) {
        setIsEditModalOpen(false);
        setStatusMessage({
          type: "success",
          message: "Organization updated successfully",
        });
        await fetchOrg(); // Refresh the list
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

  const handleCreateOrg = async (orgData: CreateOrgPayload) => {
    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      
      const payload = {
        name: orgData.name,
        adminUser:{
          name: orgData.adminName,
          email: orgData.adminEmail,
          password: orgData.password,
        }
      };

      const res = await OrgApis.createOrg(payload);
      
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

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} (${formatDistanceToNow(date, {
        addSuffix: true,
      })})`;
    } catch (e) {
      return dateString;
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
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 truncate mr-2">
                    {org.name}
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(org._id)}
                      className="text-gray-500 hover:text-blue-500 transition-colors"
                      aria-label="Edit organization"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(org._id)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                      aria-label="Delete organization"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {org.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail
                        size={16}
                        className="mr-2 flex-shrink-0 text-gray-400"
                      />
                      <span className="truncate">{org.email}</span>
                    </div>
                  )}

                  {org.owner && (
                    <>
                      <div className="flex items-center text-sm text-gray-600">
                        <User
                          size={16}
                          className="mr-2 flex-shrink-0 text-gray-400"
                        />
                        <span className="truncate">{org.owner.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail
                          size={16}
                          className="mr-2 flex-shrink-0 text-gray-400"
                        />
                        <span className="truncate">{org.owner.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Shield
                          size={16}
                          className="mr-2 flex-shrink-0 text-gray-400"
                        />
                        <span className="truncate capitalize">{org.owner.roles.join(", ")}</span>
                      </div>
                    </>
                  )}

                  {org.userIds && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users
                        size={16}
                        className="mr-2 flex-shrink-0 text-gray-400"
                      />
                      <span className="truncate">
                        {org.userIds.length} {org.userIds.length === 1 ? 'User' : 'Users'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar
                      size={16}
                      className="mr-2 flex-shrink-0 text-gray-400"
                    />
                    <span>Created {formatDate(org.createdAt)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      org.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {org.isActive ? "Active" : "Inactive"}
                  </span>

                  {org.type && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
                    </span>
                  )}
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
                      