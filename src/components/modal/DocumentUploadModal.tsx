/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ReusableComponents/DocumentUploadModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Upload, X, ChevronDown, File } from "lucide-react";
import { getCookie } from "@/actions/CookieUtils"; // Assuming CookieUtils is accessible
import InputField from "../ReusableComponents/InputField";
import Button from "../ReusableComponents/Button";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (documentId: string) => void; // Callback to return the main Mongo _id
  documentCategories: string[];
  isAddingCategory: boolean;
  onAddCategory: () => void; // To open add category modal
  onNewCategoryNameChange: (name: string) => void;
  onAddCategorySubmit: () => void;
  newCategoryName: string;
  // Optional for amend mode if you want to pass initial values, but for MSME it's fresh upload
  // initialDocName?: string;
  // initialDescription?: string;
  // initialSelectedCategory?: string;
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
}) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setUploadFile(null);
      setDocumentName("");
      setDescription("");
      setSelectedCategory(null);
      setErrors({});
      setIsUploading(false);
    }
  }, [isOpen]);

  const validateDocumentUploadForm = () => {
    const newErrors: Record<string, string> = {};
    if (!uploadFile) {
      newErrors.file = "Document file is required.";
    }
    if (!documentName.trim()) {
      newErrors.docName = "Document name is required.";
    }
    if (!selectedCategory) {
      newErrors.category = "Document category is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDocumentUpload = async () => {
    if (!validateDocumentUploadForm()) {
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile!);
    formData.append("docName", documentName);
    formData.append("description", description);
    if (selectedCategory) {
      formData.append("docType", selectedCategory);
    }

    setIsUploading(true);
    try {
      const token = getCookie("token");
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
      onUploadSuccess(data?.document?._id);
      onClose();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      setErrors((prev) => ({ ...prev, general: error.message || "Upload failed." }));
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {errors.general && (
            <p className="text-red-600 text-sm">{errors.general}</p>
          )}
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setUploadFile(e.target.files?.[0] || null);
                  setErrors((prev) => ({ ...prev, file: "" })); // Clear error on file change
                }}
                className="hidden"
                id="file-upload-msme"
              />
              <label
                htmlFor="file-upload-msme"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploadFile ? uploadFile.name : "Click to upload file"}
                </span>
              </label>
            </div>
            {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
          </div>

          {/* Document Name */}
          <InputField
            label="Document Name"
            value={documentName}
            onChange={(e) => {
              setDocumentName(e.target.value);
              setErrors((prev) => ({ ...prev, docName: "" }));
            }}
            placeholder="Enter document name..."
            required
            error={errors.docName}
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
                  setErrors((prev) => ({ ...prev, category: "" }));
                }}
                className={`block w-full px-3 py-2 border rounded-lg appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? "border-red-500" : "border-gray-300"
                }`}
                required
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
                setDescription(e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Enter document description..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
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
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      </div>

      {/* Add New Category Modal (Integrated or separate) */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Document Category
              </h2>
              <button
                onClick={() => onAddCategory()} // Close the category modal
                className="text-gray-400 hover:text-gray-600"
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
                  onClick={() => onAddCategory()} // Close the category modal
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