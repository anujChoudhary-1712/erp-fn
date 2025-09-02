"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Building, Plus, Trash2 } from "lucide-react";

interface Prefix {
  title: string;
  format: string;
}

interface EditOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orgData: {
    id: string;
    name: string;
    company_address: string;
    logo: File | null;
    prefixes: Prefix[];
    isActive: boolean;
  }) => void;
  isLoading: boolean;
  organization?: {
    _id: string;
    name: string;
    company_address?: string;
    logo?: string;
    prefixes: Prefix[];
    isActive: boolean;
  } | null;
}

const EditOrgModal: React.FC<EditOrgModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  organization,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    company_address: "",
    isActive: true,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [newPrefix, setNewPrefix] = useState({ title: "Batch", format: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<{
    name?: string;
    company_address?: string;
    logo?: string;
    prefixes?: string;
  }>({});

  // Update form data when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        company_address: organization.company_address || "",
        isActive: organization.isActive,
      });
      
      setCurrentLogo(organization.logo || null);
      setLogoPreview(null);
      setLogoFile(null);
      setPrefixes(organization.prefixes || []);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [organization]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

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
    setCurrentLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNewPrefixChange = (field: keyof typeof newPrefix, value: string) => {
    setNewPrefix(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPrefix = () => {
    if (!newPrefix.format.trim()) {
      setErrors(prev => ({ ...prev, prefixes: 'Please enter a format for the prefix' }));
      return;
    }

    // Check if prefix with same title already exists
    if (prefixes.some(p => p.title.toLowerCase() === newPrefix.title.toLowerCase())) {
      setErrors(prev => ({ ...prev, prefixes: `${newPrefix.title} prefix already exists` }));
      return;
    }

    setPrefixes(prev => [...prev, { ...newPrefix }]);
    setNewPrefix({ title: "Batch", format: "" });
    
    // Clear error
    if (errors.prefixes) {
      setErrors(prev => ({ ...prev, prefixes: undefined }));
    }
  };

  const removePrefix = (index: number) => {
    setPrefixes(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      company_address?: string;
      logo?: string;
      prefixes?: string;
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

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm() && organization) {
      onSubmit({
        id: organization._id,
        name: formData.name,
        company_address: formData.company_address,
        logo: logoFile,
        prefixes: prefixes,
        isActive: formData.isActive,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      company_address: "",
      isActive: true,
    });
    setLogoFile(null);
    setLogoPreview(null);
    setCurrentLogo(null);
    setPrefixes([]);
    setNewPrefix({ title: "Batch", format: "" });
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

  if (!isOpen || !organization) return null;

  // Get the display logo (preview, current, or none)
  const displayLogo = logoPreview || currentLogo;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Edit Organization</h3>
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
            <div className="space-y-6">
              {/* Organization Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Logo
                </label>
                
                <div className="flex items-center space-x-4">
                  {displayLogo ? (
                    <div className="relative">
                      <img
                        src={displayLogo}
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
                      {displayLogo ? 'Change Logo' : 'Upload Logo'}
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

              {/* Prefixes Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefixes Configuration
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Configure custom prefixes for batch numbers, order IDs, etc. Example: &quot;BATCH-2024-001&quot;
                </p>

                {/* Existing Prefixes */}
                {prefixes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Current Prefixes:</h4>
                    <div className="space-y-2">
                      {prefixes.map((prefix, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div>
                            <span className="font-medium text-sm text-gray-700">{prefix.title}:</span>
                            <span className="ml-2 text-sm text-gray-600 font-mono bg-gray-200 px-2 py-1 rounded">
                              {prefix.format}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePrefix(index)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Prefix */}
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Prefix:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Prefix Type
                      </label>
                      <select
                        value={newPrefix.title}
                        onChange={(e) => handleNewPrefixChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Batch">Batch</option>
                        <option value="Order">Order</option>
                        <option value="Invoice">Invoice</option>
                        <option value="Product">Product</option>
                        <option value="Customer">Customer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Format Pattern *
                      </label>
                      <input
                        type="text"
                        value={newPrefix.format}
                        onChange={(e) => handleNewPrefixChange('format', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., BATCH-2024-###"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Use ### for numbers
                      </p>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addPrefix}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                      >
                        <Plus size={16} className="mr-1" />
                        Add
                      </button>
                    </div>
                  </div>
                  {errors.prefixes && (
                    <p className="mt-2 text-sm text-red-600">{errors.prefixes}</p>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Organization
                </label>
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
                    Updating...
                  </div>
                ) : (
                  "Update Organization"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrgModal;