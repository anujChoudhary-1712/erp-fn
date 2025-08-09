"use client";

import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, RefreshCw } from "lucide-react";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    name: string;
    email: string;
    roles: string[];
    department: string;
    position: string;
    joiningDate: string;
    password: string;
  }) => void;
  isLoading: boolean;
  editMode?: boolean;
  initialData?: {
    name: string;
    email: string;
    roles: string[];
    department?: string;
    position?: string;
    joiningDate?: string;
  };
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editMode = false,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
              roles: ["store_mgt"],
    department: "",
    position: "",
    joiningDate: new Date().toISOString().split('T')[0], // Today's date as default
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    roles?: string;
    department?: string;
    position?: string;
    joiningDate?: string;
    password?: string;
  }>({});

  const availableRoles = [
    { value: "store_mgt", label: "Store Management" },
    { value: "vendors_mgt", label: "Vendors Management" },
    { value: "document_mgt", label: "Document Management" },
    { value: "order_mgt", label: "Order Management" },
    { value: "machinery_mgt", label: "Machinery Management" },
    { value: "report", label: "Report & Complaint" },
    { value: "production", label: "Production" },
    { value: "quality_check", label: "Quality Check" },
    { value: "dashboard", label: "Dashboard" },
    { value: "admin", label: "Admin" },
  ];

  const departments = [
    "Production",
    "Purchase",
    "Quality Control",
    "Dispatch",
    "Accounts",
    "Administration",
    "Sales",
    "Marketing",
    "Human Resources",
    "IT",
  ];

  // Reset form when modal opens/closes or when switching between add/edit modes
  useEffect(() => {
    if (isOpen) {
      if (editMode && initialData) {
        setFormData({
          name: initialData.name || "",
          email: initialData.email || "",
          roles: initialData.roles.length > 0 ? initialData.roles : ["store_mgt"],
          department: initialData.department || "",
          position: initialData.position || "",
          joiningDate: initialData.joiningDate ? initialData.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
          password: "",
        });
      } else {
        setFormData({
          name: "",
          email: "",
          roles: ["store_mgt"],
          department: "",
          position: "",
          joiningDate: new Date().toISOString().split('T')[0],
          password: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editMode, initialData]);

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
    let password = "";
    
    // Ensure at least one character from each category
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "@#$%&*"[Math.floor(Math.random() * 6)]; // special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({ ...prev, password: shuffled }));
    setShowPassword(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleRoleChange = (roleValue: string) => {
    setFormData(prev => {
      const currentRoles = prev.roles;
      const isSelected = currentRoles.includes(roleValue);
      
      let newRoles;
      if (isSelected) {
        // Remove role if already selected
        newRoles = currentRoles.filter(role => role !== roleValue);
      } else {
        // Add role if not selected
        newRoles = [...currentRoles, roleValue];
      }
      
      return { ...prev, roles: newRoles };
    });

    // Clear roles error when user selects/deselects
    if (errors.roles) {
      setErrors(prev => ({ ...prev, roles: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      roles?: string;
      department?: string;
      position?: string;
      joiningDate?: string;
      password?: string;
    } = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (formData.roles.length === 0) {
      newErrors.roles = "At least one role is required";
      isValid = false;
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
      isValid = false;
    }

    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
      isValid = false;
    }

    if (!formData.joiningDate) {
      newErrors.joiningDate = "Joining date is required";
      isValid = false;
    }

    if (!formData.password.trim() && !editMode) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.trim() && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = editMode && !formData.password.trim() 
        ? { ...formData, password: "" }
        : formData;
      onSubmit(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-semibold text-gray-800">
            {editMode ? "Edit Team Member" : "Add Team Member"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={editMode}
                    className={`w-full px-3 py-2 border ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      editMode ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Work Information Section */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Work Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.department ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                  )}
                </div>

                {/* Position */}
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    Position/Title *
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.position ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., Senior Production Manager"
                  />
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                  )}
                </div>

                {/* Joining Date */}
                <div className="md:col-span-2">
                  <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    id="joiningDate"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]} // Can't select future dates
                    className={`w-full px-3 py-2 border ${
                      errors.joiningDate ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.joiningDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.joiningDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Roles Section */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Roles & Permissions
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Roles * <span className="text-xs text-gray-500">(You can select multiple roles)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map((role) => (
                    <label
                      key={role.value}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role.value)}
                        onChange={() => handleRoleChange(role.value)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {role.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.roles && (
                  <p className="mt-2 text-sm text-red-600">{errors.roles}</p>
                )}
              </div>
            </div>

            {/* Password Section */}
            {!editMode && <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Account Security
              </h4>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editMode ? "(Leave blank to keep current)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pr-20 border ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder={editMode ? "Enter new password (optional)" : "Enter password"}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-2 text-gray-400 hover:text-blue-600 transition-colors border-l border-gray-300"
                      title="Generate random password"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Click the refresh icon to generate a secure password automatically
                </p>
              </div>
            </div>}
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  {editMode ? "Updating..." : "Creating..."}
                </div>
              ) : (
                editMode ? "Update Member" : "Add Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamMemberModal;