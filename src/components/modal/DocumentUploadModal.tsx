/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ReusableComponents/DocumentUploadModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Upload, X, ChevronDown, File, AlertCircle } from "lucide-react";
import { getCookie } from "@/actions/CookieUtils"; // Assuming CookieUtils is accessible
import InputField from "../ReusableComponents/InputField";
import Button from "../ReusableComponents/Button";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (documentId: string, documentName?: string, fileName?: string) => void; // Enhanced callback
  documentCategories: string[];
  isAddingCategory: boolean;
  onAddCategory: () => void; // To open add category modal
  onNewCategoryNameChange: (name: string) => void;
  onAddCategorySubmit: () => void;
  newCategoryName: string;
  uploadType: "msme" | "general"; // To differentiate between MSME and general uploads
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: { [key: string]: string };
    };
    status?: number;
  };
  message?: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  documentCategories,
  isAddingCategory,
  onAddCategory,
  onNewCategoryNameChange,
  onAddCategorySubmit,
  newCategoryName,
  uploadType = "general",
}) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setUploadFile(null);
      setDocumentName("");
      setDescription("");
      setSelectedCategory(null);
      setErrors({});
      setIsUploading(false);
      setApiError("");
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    if (field === "documentName") {
      setDocumentName(value);
    } else if (field === "description") {
      setDescription(value);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError("");
    }
  };

  const handleFileChange = (file: File | null) => {
    setUploadFile(file);
    
    // Auto-generate document name from file name if empty
    if (file && !documentName.trim()) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setDocumentName(nameWithoutExtension);
    }

    // Clear file error
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: "" }));
    }

    // Clear API error
    if (apiError) {
      setApiError("");
    }
  };

  const validateDocumentUploadForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!uploadFile) {
      newErrors.file = "Document file is required.";
    } else {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (uploadFile.size > maxSize) {
        newErrors.file = "File size must be less than 10MB.";
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(uploadFile.type)) {
        newErrors.file = "Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.";
      }
    }
    
    if (!documentName.trim()) {
      newErrors.documentName = "Document name is required.";
    }
    
    if (!selectedCategory) {
      newErrors.category = "Document category is required.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApiError = (error: ApiError) => {
    console.error("Document upload failed:", error);

    // Handle different types of API errors
    if (error.response?.data) {
      const { data } = error.response;
      
      // Handle field-specific errors
      if (data.errors) {
        setErrors(data.errors);
        return;
      }

      // Handle general API error messages
      if (data.message) {
        setApiError(data.message);
        return;
      }
    }

    // Handle HTTP status codes
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          setApiError("Invalid file or form data. Please check your inputs.");
          break;
        case 401:
          setApiError("Authentication failed. Please login again.");
          break;
        case 413:
          setApiError("File too large. Please upload a smaller file.");
          break;
        case 415:
          setApiError("Unsupported file type. Please upload a valid document.");
          break;
        case 500:
          setApiError("Server error. Please try again later.");
          break;
        case 503:
          setApiError("Service temporarily unavailable. Please try again later.");
          break;
        default:
          setApiError("Upload failed. Please try again.");
      }
      return;
    }

    // Handle network errors
    if (error.message?.includes("Network")) {
      setApiError("Network error. Please check your internet connection.");
      return;
    }

    // Handle timeout errors
    if (error.message?.includes("timeout")) {
      setApiError("Upload timeout. Please try again with a smaller file.");
      return;
    }

    // Generic error fallback
    setApiError("Upload failed. Please try again.");
  };

  const handleDocumentUpload = async () => {
    // Clear previous errors
    setApiError("");

    if (!validateDocumentUploadForm()) {
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile!);
    formData.append("docName", documentName.trim());
    formData.append("description", description.trim());
    if (selectedCategory) {
      formData.append("docType", selectedCategory);
    }

    setIsUploading(true);
    
    try {
      const token = getCookie("token");
      if (!token) {
        setApiError("Authentication token not found. Please login again.");
        setIsUploading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:8001/api/documents/upload",
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload document");
      }

      const data = await response.json();
      console.log("Document uploaded successfully:", data);
      
      // Call success callback with appropriate parameters based on upload type
      if (uploadType === "msme") {
        onUploadSuccess(data?.document?._id);
      } else {
        onUploadSuccess(
          data?.document?._id, 
          documentName.trim(), 
          uploadFile?.name
        );
      }
      
      onClose();
    } catch (error: any) {
      handleApiError(error as ApiError);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {uploadType === "msme" ? "Upload MSME Document" : "Upload Document"}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* API Error Message */}
          {apiError && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 text-sm">{apiError}</p>
              </div>
              <button
                onClick={() => setApiError("")}
                className="text-red-400 hover:text-red-600 ml-2"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              errors.file ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
            }`}>
              <input
                type="file"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleFileChange(e.target.files?.[0] || null);
                }}
                className="hidden"
                id={`file-upload-${uploadType}`}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={isUploading}
              />
              <label
                htmlFor={`file-upload-${uploadType}`}
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploadFile ? uploadFile.name : "Click to upload file"}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPG, JPEG, PNG (max 10MB)
                </span>
              </label>
            </div>
            {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
          </div>

          {/* Document Name */}
          <InputField
            label="Document Name"
            value={documentName}
            onChange={(e) => handleInputChange("documentName", e.target.value)}
            placeholder="Enter document name..."
            required
            error={errors.documentName}
            disabled={isUploading}
          />

          {/* Document Category Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedCategory || ""}
                onChange={(e) => {
                  if (e.target.value === "add-new-category") {
                    onAddCategory();
                    setSelectedCategory(null);
                  } else {
                    setSelectedCategory(e.target.value);
                  }
                  if (errors.category) {
                    setErrors(prev => ({ ...prev, category: "" }));
                  }
                  if (apiError) {
                    setApiError("");
                  }
                }}
                className={`block w-full px-3 py-2 border rounded-lg appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.category ? "border-red-500" : "border-gray-300"
                }`}
                required
                disabled={isUploading}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {documentCategories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
                <option value="add-new-category" className="font-bold">
                  + Add New Category
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange("description", e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
              placeholder="Enter document description..."
              disabled={isUploading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDocumentUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  Uploading...
                </div>
              ) : (
                "Upload Document"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Add New Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Document Category
              </h2>
              <button
                onClick={onAddCategory}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <InputField
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => onNewCategoryNameChange(e.target.value)}
                  placeholder="Enter new category name..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onAddCategory}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={onAddCategorySubmit}
                  disabled={!newCategoryName.trim()}
                  className="flex-1"
                >
                  Add Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadModal;