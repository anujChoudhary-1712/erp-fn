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
  status: "active" | "inactive";
  createdAt: string;
  __v: number;
}

interface AddUserPayload {
  name: string;
  email: string;
  roles: string[];
  password: string;
}

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
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 truncate">
                      {user.name}
                    </h2>
                  </div>
                  <div>
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

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail
                      size={16}
                      className="mr-2 flex-shrink-0 text-gray-400"
                    />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Shield
                      size={16}
                      className="mr-2 flex-shrink-0 text-gray-400"
                    />
                    <span className="truncate capitalize">
                      {user.roles.join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar
                      size={16}
                      className="mr-2 flex-shrink-0 text-gray-400"
                    />
                    <span>Joined {formatDate(user.createdAt)}</span>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default TeamPage;
