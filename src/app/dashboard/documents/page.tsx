"use client";
import { getCookie } from "@/actions/CookieUtils";
import DocumentApis from "@/actions/Apis/DocumentApis";
import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  Trash2,
  Upload,
  X,
  File,
  Plus,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import CategoryApis from "@/actions/Apis/CategoryApis";

interface Document {
  _id: string; // This is the sub-document ID
  outerId: string; // Add this to store the parent document's ID
  docName: string;
  fileName: string;
  fileSize: number;
  link: string;
  status: string; // e.g., "uploaded", "approved", "rejected"
  description: string;
  org_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  docType?: string;
  uploadDate: string;
}

interface FetchedDocumentObject {
  _id: string; // This is the outer main ID
  documents: Document[];
  org_id: string;
  latest_doc_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Category {
  _id: string;
  type: string;
  items: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

type ModalMode = "upload" | "amend" | null;
type ActiveTab = "active" | "obsolete";

const DocumentsPage: React.FC = () => {
  const [activeDocuments, setActiveDocuments] = useState<Document[]>([]);
  const [obsoleteDocuments, setObsoleteDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("active"); // New state for tabs

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null); // For amend mode
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [documentCategories, setDocumentCategories] = useState<string[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] =
    useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [documentCategoryObject, setDocumentCategoryObject] =
    useState<Category | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // To manage dropdown state

  // Ref for dropdown to close when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const uploadDocument = async (
    file: File,
    name: string,
    desc: string,
    category: string | null
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docName", name);
    formData.append("description", desc);
    if (category) {
      formData.append("docType", category);
    }

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
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      console.log("Document uploaded successfully:", data);
      await fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document. Please try again.");
    }
  };

  const amendDocument = async (
    file: File | null, // File can be null if not changed
    name: string,
    desc: string,
    category: string | null,
    outerId: string // Use the outer main ID
  ) => {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("docName", name);
    formData.append("description", desc);
    if (category) {
      formData.append("docType", category);
    }

    try {
      const token = getCookie("token");
      const response = await fetch(
        `http://localhost:8001/api/documents/${outerId}`, // Use outerId here
        {
          method: "PUT",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to amend document");
      }
      const data = await response.json();
      console.log("Document amended successfully:", data);
      await fetchDocuments();
    } catch (error) {
      console.error("Error amending document:", error);
      alert("Failed to amend document. Please try again.");
    }
  };

  const updateDocumentStatus = async (
    outerId: string, // Main document ID
    docId: string, // Sub-document ID
    status: string
  ) => {
    try {
      // Assuming DocumentApis.updateStatus exists and accepts outerId, docId, status
      // You might need to adjust your DocumentApis if it doesn't support both IDs
      const res = await DocumentApis.updateStatus(outerId, docId, status);
      if (res.status === 200) {
        console.log("Document status updated successfully:", res.data);
        alert("Document status updated successfully.");
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Error updating document status:", error);
      alert("Failed to update document status. Please try again.");
    }
  };

  const fetchDocuments = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const res = await DocumentApis.getAllDocuments();
      if (res.status === 200) {
        const fetchedActiveDocuments: Document[] = [];
        const fetchedObsoleteDocuments: Document[] = [];

        res.data.forEach((obj: FetchedDocumentObject) => {
          const latestDoc = obj.documents.find(
            (doc) => doc._id === obj.latest_doc_id
          );

          if (latestDoc) {
            fetchedActiveDocuments.push({
              ...latestDoc,
              outerId: obj._id, // Attach the outer main ID here
              description: latestDoc.description || "No description provided.",
              docType: latestDoc.docType || "Uncategorized",
              status: latestDoc.status || "uploaded", // Ensure status exists
            });
          }

          // Collect all other documents as obsolete
          obj.documents.forEach((doc) => {
            if (doc._id !== obj.latest_doc_id) {
              fetchedObsoleteDocuments.push({
                ...doc,
                outerId: obj._id, // Still needs the outerId for potential actions
                description: doc.description || "No description provided (Obsolete).",
                docType: doc.docType || "Uncategorized",
                status: doc.status || "obsolete", // Can explicitly set status for obsolete versions if needed
              });
            }
          });
        });

        setActiveDocuments(fetchedActiveDocuments);
        setObsoleteDocuments(fetchedObsoleteDocuments);
        console.log("Active Documents:", fetchedActiveDocuments);
        console.log("Obsolete Documents:", fetchedObsoleteDocuments);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      alert("Failed to fetch documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocumentCategories = async (): Promise<void> => {
    try {
      const res = await CategoryApis.getAllCategories();
      if (res.status === 200) {
        const docCategory = res.data.find(
          (cat: Category) => cat.type === "Document-Category"
        );
        if (docCategory) {
          setDocumentCategories(docCategory.items);
          setDocumentCategoryObject(docCategory);
        } else {
          setDocumentCategories([]);
          setDocumentCategoryObject(null);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setDocumentCategories([]);
      setDocumentCategoryObject(null);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }

    try {
      if (documentCategoryObject) {
        const updatedItems = [
          ...documentCategoryObject.items,
          newCategoryName.trim(),
        ];
        const res = await CategoryApis.updateCategories(
          documentCategoryObject._id,
          { items: updatedItems }
        );
        if (res.status === 200) {
          alert(`Category "${newCategoryName}" added successfully!`);
          await fetchDocumentCategories();
          setNewCategoryName("");
          setIsAddCategoryModalOpen(false);
        }
      } else {
        const res = await CategoryApis.createCategory({
          type: "Document-Category",
          items: [newCategoryName.trim()],
        });
        if (res.status === 201) {
          alert(`Category "${newCategoryName}" added successfully!`);
          await fetchDocumentCategories();
          setNewCategoryName("");
          setIsAddCategoryModalOpen(false);
        }
      }
    } catch (error) {
      console.error("Error adding/updating category:", error);
      alert("Failed to add category. Please try again.");
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchDocumentCategories();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileName: string): JSX.Element => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const iconClass = "w-8 h-8 text-blue-500";

    switch (extension) {
      case "pdf":
        return <File className={`${iconClass} text-red-500`} />;
      case "doc":
      case "docx":
        return <File className={`${iconClass} text-blue-600`} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <File className={`${iconClass} text-green-500`} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const getDisplayStatus = (status: string): string => {
    switch (status.toLowerCase()) {
      case "uploaded":
        return "Review Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "obsolete": // Added for explicit obsolete status display
          return "Obsolete";
      default:
        return status;
    }
  };

  const openDocumentModal = (mode: ModalMode, doc?: Document) => {
    setModalMode(mode);
    setIsModalOpen(true);
    // When amending, we only set the editingDocument for the outerId,
    // but we don't pre-fill any form fields.
    if (mode === "amend" && doc) {
      setEditingDocument(doc); // Keep the outerId for the API call
    } else {
      setEditingDocument(null);
    }
    // Always clear fields for a fresh start for both upload and amend
    setDocumentName("");
    setDescription("");
    setSelectedCategory(null);
    setUploadFile(null);
  };

  const closeDocumentModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setEditingDocument(null);
    setDocumentName("");
    setDescription("");
    setSelectedCategory(null);
    setUploadFile(null);
  };

  const handleSubmitDocument = (): void => {
    if (!documentName.trim() || !selectedCategory) {
      alert("Please enter a document name and choose a category.");
      return;
    }

    if (modalMode === "upload" && !uploadFile) {
      alert("Please select a file to upload.");
      return;
    }

    // For amend mode, a file is optional. If no file is selected, `uploadFile` will be null.
    // However, if no file is selected AND no document to amend is set (which shouldn't happen
    // if `editingDocument` is correctly set on `handleAmend`), this means an invalid state.
    if (modalMode === "amend" && !uploadFile && !editingDocument) {
        alert("No document selected for amendment, and no new file provided.");
        return;
    }


    setIsUploading(true);
    if (modalMode === "upload") {
      uploadDocument(
        uploadFile!, // Assert non-null as we checked it
        documentName,
        description,
        selectedCategory
      )
        .then(() => closeDocumentModal())
        .finally(() => setIsUploading(false));
    } else if (modalMode === "amend" && editingDocument) {
      amendDocument(
        uploadFile, // Can be null if file is not updated
        documentName,
        description,
        selectedCategory,
        editingDocument.outerId // Use outerId for amending
      )
        .then(() => closeDocumentModal())
        .finally(() => setIsUploading(false));
    }
  };

  const handleView = (doc: Document): void => {
    window.open(`http://localhost:8001${doc.link}`, "_blank");
  };

  const handleDelete = async (doc: Document) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${doc.docName}"? This action cannot be undone.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const res = await DocumentApis.deleteDocument(doc.outerId); // Assuming delete uses the outer ID
      if (res.status === 200) {
        window.alert("Document deleted successfully.");
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  const handleAmend = (doc: Document) => {
    setOpenDropdownId(null); // Close dropdown
    openDocumentModal("amend", doc); // Pass the document to retain outerId
  };

  const handleApprove = (doc: Document) => {
    setOpenDropdownId(null); // Close dropdown
    updateDocumentStatus(doc.outerId, doc._id, "approved");
  };

  const handleReject = (doc: Document) => {
    setOpenDropdownId(null); // Close dropdown
    updateDocumentStatus(doc.outerId, doc._id, "rejected");
  };

  const documentsToDisplay = activeTab === "active" ? activeDocuments : obsoleteDocuments;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Document Management
        </h1>
        <button
          onClick={() => openDocumentModal("upload")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Tabs for Active/Obsolete Documents */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "active"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active Documents ({activeDocuments.length})
        </button>
        <button
          onClick={() => setActiveTab("obsolete")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "obsolete"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Obsolete Documents ({obsoleteDocuments.length})
        </button>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documentsToDisplay.length > 0 ? (
            documentsToDisplay.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow relative"
              >
                {/* Three dots dropdown */}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() =>
                      setOpenDropdownId(openDropdownId === doc._id ? null : doc._id)
                    }
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {openDropdownId === doc._id && (
                    <div
                      ref={dropdownRef} // Attach ref here
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    >
                      <button
                        onClick={() => handleView(doc)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Delete
                      </button>
                      {activeTab === "active" && ( // Only show these for active documents
                        <>
                          <button
                            onClick={() => handleAmend(doc)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Amend
                          </button>
                          <button
                            onClick={() => handleApprove(doc)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(doc)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* File Icon and Name */}
                <div className="flex items-start gap-3 mb-3 pr-8">
                  {" "}
                  {/* Add padding right to avoid overlap with dropdown */}
                  {getFileIcon(doc.fileName)}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium text-gray-900 truncate"
                      title={doc.docName}
                    >
                      {doc.docName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                </div>

                {/* Category (if exists) */}
                {doc.docType && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Category:</span> {doc.docType}
                  </p>
                )}

                {/* Description */}
                <p
                  className="text-sm text-gray-600 mb-3 line-clamp-2"
                  title={doc.description}
                >
                  {doc.description}
                </p>

                {/* Status Display */}
                <p className="text-sm mb-2 font-medium">
                  Status:{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      getDisplayStatus(doc.status) === "Approved"
                        ? "bg-green-100 text-green-800"
                        : getDisplayStatus(doc.status) === "Rejected"
                        ? "bg-red-100 text-red-800"
                        : getDisplayStatus(doc.status) === "Obsolete"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {getDisplayStatus(doc.status)}
                  </span>
                </p>

                {/* Upload Date */}
                <p className="text-xs text-gray-400">
                  Uploaded: {formatDate(doc.uploadDate)}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab === "active" ? "active" : "obsolete"} documents found
              </h3>
              {activeTab === "active" && (
                <p className="text-gray-500 mb-4">
                  Get started by uploading your first document
                </p>
              )}
               {activeTab === "active" && (
                <button
                  onClick={() => openDocumentModal("upload")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload/Amend Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalMode === "upload" ? "Upload Document" : "Amend Document"}
              </h2>
              <button
                onClick={closeDocumentModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File {modalMode === "amend" && "(Optional for Amend)"}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUploadFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadFile
                        ? uploadFile.name
                        : "Click to upload file"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter document name..."
                />
              </div>

              {/* Document Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) => {
                      if (e.target.value === "add-new-category") {
                        setIsAddCategoryModalOpen(true);
                        setSelectedCategory(null);
                      } else {
                        setSelectedCategory(e.target.value);
                      }
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <button
                  onClick={closeDocumentModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDocument}
                  disabled={
                    !documentName.trim() ||
                    !selectedCategory ||
                    (modalMode === "upload" && !uploadFile) ||
                    isUploading
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading
                    ? "Processing..."
                    : modalMode === "upload"
                    ? "Upload"
                    : "Amend"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Document Category
              </h2>
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
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
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new category name..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;