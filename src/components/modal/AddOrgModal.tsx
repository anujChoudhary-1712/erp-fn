"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Building } from "lucide-react";

interface AddOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orgData: {
    name: string;
    company_address: string;
    logo: File | null;
    adminName: string;
    adminEmail: string;
    password: string;
  }) => void;
  isLoading: boolean;
}

const AddOrgModal: React.FC<AddOrgModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    company_address: "",
    adminName: "",
    adminEmail: "",
    password: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<{
    name?: string;
    company_address?: string;
    logo?: string;
    adminName?: string;
    adminEmail?: string;
    password?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: 'Please select an image file' }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'File size must be less than 5MB' }));
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous error
      if (errors.logo) {
        setErrors(prev => ({ ...prev, logo: undefined }));
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      company_address?: string;
      logo?: string;
      adminName?: string;
      adminEmail?: string;
      password?: string;
    } = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
      isValid = false;
    }

    if (!formData.company_address.trim()) {
      newErrors.company_address = "Company address is required";
      isValid = false;
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = "Admin name is required";
      isValid = false;
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = "Admin email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        ...formData,
        logo: logoFile,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      company_address: "",
      adminName: "",
      adminEmail: "",
      password: "",
    });
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Add New Organization</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto">
          <div className="p-6" onKeyPress={handleKeyPress}>
            <div className="space-y-4">
              {/* Organization Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Logo
                </label>
                
                <div className="flex items-center space-x-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Logo
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Max 5MB, PNG/JPG/JPEG
                    </p>
                  </div>
                </div>
                
                {errors.logo && (
                  <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                )}
              </div>

              {/* Organization Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
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
                  placeholder="Enter organization name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Company Address */}
              <div>
                <label htmlFor="company_address" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Address *
                </label>
                <textarea
                  id="company_address"
                  name="company_address"
                  value={formData.company_address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border ${
                    errors.company_address ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none`}
                  placeholder="Enter complete company address"
                />
                {errors.company_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_address}</p>
                )}
              </div>

              {/* Admin Name */}
              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Name *
                </label>
                <input
                  type="text"
                  id="adminName"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.adminName ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter admin name"
                />
                {errors.adminName && (
                  <p className="mt-1 text-sm text-red-600">{errors.adminName}</p>
                )}
              </div>

              {/* Admin Email */}
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email *
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.adminEmail ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter admin email"
                />
                {errors.adminEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.adminEmail}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  "Create Organization"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOrgModal;