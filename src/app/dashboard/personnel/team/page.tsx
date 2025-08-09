/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import OrgUserApis from "@/actions/Apis/OrgUserApis";
import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Shield,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Building2,
} from "lucide-react";
import { formatDate } from "@/utils/date";
import AddTeamMemberModal from "@/components/modal/AddTeamMemberModal";
import Button from "@/components/ReusableComponents/Button";

interface UserData {
  _id: string;
  name: string;
  email: string;
  organizationId: string;
  roles: string[];
  department?: string;
  position?: string;
  joiningDate?: string;
  status: "active" | "inactive";
  createdAt: string;
  __v: number;
}

interface AddUserPayload {
  name: string;
  email: string;
  roles: string[];
  department: string;
  position: string;
  joiningDate: string;
  password: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(
    new Set()
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    user: UserData | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    user: null,
    isLoading: false,
  });

  useEffect(() => {
    fetchTeamData();
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

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await OrgUserApis.getAllUsers();
      if (res.status === 200) {
        const data = await res.data;
        setUsers(data.users || []);
        console.log("Team members:", data);
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
      setError("Failed to load team members. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      setProcessingUsers((prev) => new Set(prev).add(userId));
      setStatusMessage(null);

      const newStatus = currentStatus === "active" ? "inactive" : "active";
      let res;
      if (currentStatus === "active") {
        res = await OrgUserApis.deactivateUser(userId);
      } else {
        res = await OrgUserApis.activateUser(userId);
      }

      if (res.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId
              ? { ...user, status: newStatus as "active" | "inactive" }
              : user
          )
        );

        setStatusMessage({
          type: "success",
          message: `User ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully`,
        });
      }
    } catch (error: any) {
      console.error("Error updating user status:", error);
      setStatusMessage({
        type: "error",
        message:
          error.response?.data?.message || "Failed to update user status",
      });
    } finally {
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDeleteClick = (user: UserData) => {
    setDeleteConfirmModal({
      isOpen: true,
      user,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmModal.user) return;

    try {
      setDeleteConfirmModal(prev => ({
        ...prev,
        isLoading: true,
      }));
      setStatusMessage(null);

      const res = await OrgUserApis.deleteUser(deleteConfirmModal.user._id);

      if (res.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== deleteConfirmModal.user!._id)
        );
        
        setStatusMessage({
          type: "success",
          message: "Team member deleted successfully",
        });
        
        setDeleteConfirmModal({
          isOpen: false,
          user: null,
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error("Error deleting team member:", error);
      setStatusMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to delete team member",
      });
      
      setDeleteConfirmModal(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmModal({
      isOpen: false,
      user: null,
      isLoading: false,
    });
  };

  const handleAddUser = async (userData: AddUserPayload) => {
    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const res = await OrgUserApis.addUser(userData);

      if (res.status === 200 || res.status === 201) {
        setIsAddModalOpen(false);
        setStatusMessage({
          type: "success",
          message: "Team member added successfully",
        });
        await fetchTeamData(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error adding team member:", error);
      setStatusMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to add team member",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (userData: AddUserPayload) => {
    if (!editingUser) return;
    
    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      // Prepare the update data - only include password if it's provided
      const updateData: any = {
        name: userData.name,
        roles: userData.roles,
        department: userData.department,
        position: userData.position,
        joiningDate: userData.joiningDate,
      };

      if (userData.password.trim()) {
        updateData.password = userData.password;
      }

      const res = await OrgUserApis.editUser(editingUser._id, updateData);

      if (res.status === 200) {
        setEditingUser(null);
        setStatusMessage({
          type: "success",
          message: "Team member updated successfully",
        });
        await fetchTeamData(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error updating team member:", error);
      setStatusMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to update team member",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalSubmit = (userData: AddUserPayload) => {
    if (editingUser) {
      handleEditUser(userData);
    } else {
      handleAddUser(userData);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingUser(null);
  };

  const handleEditClick = (user: UserData) => {
    setEditingUser(user);
  };

  const formatRoles = (roles: string[]) => {
    const roleLabels: { [key: string]: string } = {
      store_mgt: "Store Management",
      vendors_mgt: "Vendors Management", 
      document_mgt: "Document Management",
      order_mgt: "Order Management",
      machinery_mgt: "Machinery Management",
      report: "Report & Complaint",
      production: "Production",
      quality_check: "Quality Check",
      dashboard: "Dashboard",
      admin: "Admin",
      // Legacy role mappings for backward compatibility
      purchase_order_member: "Purchase Order Member",
      production_member: "Production Member",
      dispatch_member: "Dispatch Member",
      accounts_member: "Accounts Member",
      quality_control_member: "Quality Control Member",
      inventory_member: "Inventory Member",
    };

    return roles
      .map(role => roleLabels[role] || role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()))
      .join(", ");
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
          Error Loading Team Members
        </h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchTeamData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          Team Members
        </h1>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          + Add New Member
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Team Members Found
          </h3>
          <p className="text-gray-500">
            Add your first team member to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user._id}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border ${
                user.status === "active"
                  ? "border-gray-100"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-lg font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 truncate">
                        {user.name}
                      </h2>
                      {user.position && (
                        <p className="text-sm text-gray-600 truncate">
                          {user.position}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-gray-500 hover:text-blue-500 transition-colors"
                      aria-label="Edit user"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                      aria-label="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user._id, user.status)}
                      disabled={processingUsers.has(user._id)}
                      className={`text-gray-500 transition-colors ${
                        user.status === "active"
                          ? "hover:text-red-500"
                          : "hover:text-green-500"
                      }`}
                      aria-label={`${
                        user.status === "active" ? "Deactivate" : "Activate"
                      } user`}
                    >
                      {processingUsers.has(user._id) ? (
                        <div className="w-6 h-6 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                      ) : user.status === "active" ? (
                        <ToggleRight
                          size={24}
                          className="text-green-500 hover:text-red-500"
                        />
                      ) : (
                        <ToggleLeft
                          size={24}
                          className="text-gray-400 hover:text-green-500"
                        />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail
                      size={16}
                      className="mr-2 flex-shrink-0 text-gray-400"
                    />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {user.department && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2
                        size={16}
                        className="mr-2 flex-shrink-0 text-gray-400"
                      />
                      <span className="truncate">{user.department}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Shield
                      size={16}
                      className="mr-2 flex-shrink-0 text-gray-400"
                    />
                    <span className="truncate">
                      {formatRoles(user.roles)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar
                      size={16}
                      className="mr-2 flex-shrink-0 text-gray-400"
                    />
                    <span>
                      Joined {user.joiningDate ? formatDate(user.joiningDate) : formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                  
                  {user.roles.length > 1 && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {user.roles.length} roles
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddModalOpen || editingUser !== null}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        isLoading={isSubmitting}
        editMode={editingUser !== null}
        initialData={editingUser ? {
          name: editingUser.name,
          email: editingUser.email,
          roles: editingUser.roles,
          department: editingUser.department || "",
          position: editingUser.position || "",
          joiningDate: editingUser.joiningDate || "",
        } : undefined}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteConfirmModal.isLoading}
        title="Delete Team Member"
        message={`Are you sure you want to delete ${deleteConfirmModal.user?.name || 'this team member'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default TeamPage;