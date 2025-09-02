"use client"
import React, { useState, useEffect } from "react";
import OrgApis from "@/actions/Apis/OrgApis";
import { format } from "date-fns";

interface OrganizationUser {
  _id: string;
  name: string;
  email: string;
  organizationId: {
    _id: string;
    name: string;
  };
  roles: string[];
  status: string;
  createdAt: string;
}

// The provided mapping of role values to display labels
const ROLE_LABELS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "orders", label: "Orders" },
  { value: "store_finished_goods", label: "Store: Finished Goods" },
  { value: "store_raw_materials", label: "Store: Raw Materials" },
  { value: "vendors", label: "Vendors" },
  { value: "production_plans", label: "Production: Plans" },
  { value: "production_batch_mgt", label: "Production: Batch Management" },
  { value: "documents", label: "Documents" },
  { value: "machinery", label: "Machinery" },
  { value: "reports", label: "Reports & Complaints" },
  { value: "personnel_team", label: "Personnel: Team" },
  { value: "personnel_training", label: "Personnel: Training" },
  { value: "admin", label: "Admin" },
];

// Helper function to get the display label for a role value
const getRoleLabel = (roleValue: string) => {
  const role = ROLE_LABELS.find((r) => r.value === roleValue);
  return role ? role.label : roleValue; // Fallback to the value if label not found
};

const UsersPage = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch organization users from the API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await OrgApis.getAllUsers();
      if (res.status === 200) {
        setUsers(res.data.organizationUsers);
      } else {
        setError("Failed to fetch users. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("An unexpected error occurred while fetching users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to determine the color of the status badge
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 text-gray-600">
          <p>No organization users found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Organization Users</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-semibold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 leading-snug">
                    {user.name}
                  </h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium w-24 flex-shrink-0">Org:</span>
                  <span className="truncate">{user.organizationId.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-24 flex-shrink-0">Roles:</span>
                  <span className="flex flex-wrap gap-1">
                    {user.roles.map((role, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                      >
                        {getRoleLabel(role)}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-24 flex-shrink-0">Created:</span>
                  <span>{format(new Date(user.createdAt), "PPP")}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-24 flex-shrink-0">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;