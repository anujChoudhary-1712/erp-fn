"use client";
import { getCookie } from "@/actions/CookieUtils";
import DocumentApis from "@/actions/Apis/DocumentApis";
import React, { useState, useEffect, useRef } from "react";
import { Upload, X, Plus, ChevronDown, File } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import CategoryApis from "@/actions/Apis/CategoryApis";

export interface Document {
  _id: string;
  outerId: string;
  docName: string;
  fileName: string;
  fileSize: number;
  link: string;
  status: string;
  description: string;
  org_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  docType?: string;
  uploadDate: string;
  uploaded_by?: {
    name: string;
    email: string;
  };
  approved_by?: {
    name: string;
    email: string;
  };
  rejected_by?: {
    name: string;
    email: string;
  };
}

interface FetchedDocumentObject {
  _id: string;
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
}

type ModalMode = "upload" | "amend" | null;
type ActiveTab = "active" | "obsolete";

const DocumentsPage: React.FC = () => {
  const [activeDocuments, setActiveDocuments] = useState<Document[]>([]);
  const [obsoleteDocuments, setObsoleteDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("active");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [otherCategoryName, setOtherCategoryName] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // State for dynamic categories
  const [documentCategories, setDocumentCategories] = useState<string[]>([
    "Others",
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Function to fetch and set document categories
  const fetchCategories = async (): Promise<void> => {
  try {
    const res = await CategoryApis.getAllCategories();
    if (res.status === 200) {
      // Look for category with type "Document" (not "Document Category")
      const docCategory = res.data.categories.find(
        (cat: Category) => cat.type === "Document"
      );
      
      if (docCategory && docCategory.items.length > 0) {
        // Set categories with fetched items plus "Others" at the end
        setDocumentCategories([...docCategory.items, "Others"]);
      } else {
        // If no document category exists or it's empty, just show "Others"
        setDocumentCategories(["Others"]);
      }
    } else {
      // Fallback to just "Others" if API call fails
      setDocumentCategories(["Others"]);
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    // Fallback to just "Others" on error
    setDocumentCategories(["Others"]);
  }
};

  useEffect(() => {
    fetchCategories();
  }, []);

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

    // If category is "Others", use the custom category name
    if (category) {
      if (category === "Others") {
        if (otherCategoryName.trim()) {
          formData.append("docType", otherCategoryName.trim());
        }
      } else {
        formData.append("docType", category);
      }
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
    file: File | null,
    name: string,
    desc: string,
    category: string | null,
    outerId: string
  ) => {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("docName", name);
    formData.append("description", desc);

    // If category is "Others", use the custom category name
    if (category) {
      if (category === "Others") {
        if (otherCategoryName.trim()) {
          formData.append("docType", otherCategoryName.trim());
        }
      } else {
        formData.append("docType", category);
      }
    }

    try {
      const token = getCookie("token");
      const response = await fetch(
        `http://localhost:8001/api/documents/${outerId}`,
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
    outerId: string,
    docId: string,
    status: string
  ) => {
    try {
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
          // Filter out documents with "invoice" in their docName
          const filteredDocuments = obj.documents.filter(
            (doc) =>
              !doc.docName.toLowerCase().includes("invoice") &&
              !doc.docName.toLowerCase().includes("attendance")
          );

          const latestDoc = filteredDocuments.find(
            (doc) => doc._id === obj.latest_doc_id
          );

          if (latestDoc) {
            fetchedActiveDocuments.push({
              ...latestDoc,
              outerId: obj._id,
              description: latestDoc.description || "No description provided.",
              docType: latestDoc.docType || "Uncategorized",
              status: latestDoc.status || "uploaded",
            });
          }

          filteredDocuments.forEach((doc) => {
            // Check if the document is not the latest one and its status is not 'obsolete'
            if (doc._id !== obj.latest_doc_id) {
              fetchedObsoleteDocuments.push({
                ...doc,
                outerId: obj._id,
                description:
                  doc.description || "No description provided (Obsolete).",
                docType: doc.docType || "Uncategorized",
                status: doc.status || "obsolete",
              });
            }
          });
        });
        // Re-filter documents to handle 'obsolete' status correctly
        const updatedActiveDocs = fetchedActiveDocuments.filter(
          (doc) => doc.status !== "obsolete"
        );
        const updatedObsoleteDocs = [
          ...fetchedObsoleteDocuments,
          ...fetchedActiveDocuments.filter((doc) => doc.status === "obsolete"),
        ];

        setActiveDocuments(updatedActiveDocs);
        setObsoleteDocuments(updatedObsoleteDocs);
        console.log("Active Documents:", updatedActiveDocs);
        console.log("Obsolete Documents:", updatedObsoleteDocs);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      alert("Failed to fetch documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const openDocumentModal = (mode: ModalMode, doc?: Document) => {
    setModalMode(mode);
    setIsModalOpen(true);
    if (mode === "amend" && doc) {
      setEditingDocument(doc);
      setDocumentName(doc.docName || "");
      setDescription(doc.description || "");

      // Check if doc.docType is one of the static categories
      if (doc.docType) {
        if (documentCategories.includes(doc.docType)) {
          setSelectedCategory(doc.docType);
          setOtherCategoryName("");
        } else {
          setSelectedCategory("Others");
          setOtherCategoryName(doc.docType);
        }
      } else {
        setSelectedCategory(null);
        setOtherCategoryName("");
      }
    } else {
      setEditingDocument(null);
      setDocumentName("");
      setDescription("");
      setSelectedCategory(null);
      setOtherCategoryName("");
    }
    setUploadFile(null);
  };

  const closeDocumentModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setEditingDocument(null);
    setDocumentName("");
    setDescription("");
    setSelectedCategory(null);
    setOtherCategoryName("");
    setUploadFile(null);
  };

  const handleSubmitDocument = (): void => {
    if (!documentName.trim()) {
      alert("Please enter a document name.");
      return;
    }

    if (!selectedCategory) {
      alert("Please choose a category.");
      return;
    }

    if (selectedCategory === "Others" && !otherCategoryName.trim()) {
      alert("Please specify a category name.");
      return;
    }

    if (modalMode === "upload" && !uploadFile) {
      alert("Please select a file to upload.");
      return;
    }

    if (modalMode === "amend" && !uploadFile && !editingDocument) {
      alert("No document selected for amendment, and no new file provided.");
      return;
    }

    setIsUploading(true);
    if (modalMode === "upload") {
      uploadDocument(uploadFile!, documentName, description, selectedCategory)
        .then(() => closeDocumentModal())
        .finally(() => setIsUploading(false));
    } else if (modalMode === "amend" && editingDocument) {
      amendDocument(
        uploadFile,
        documentName,
        description,
        selectedCategory,
        editingDocument.outerId
      )
        .then(() => closeDocumentModal())
        .finally(() => setIsUploading(false));
    }
  };

  const handleView = (doc: Document): void => {
    let baseUrl = "http://localhost:8001";
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      baseUrl = "http://localhost:8001";
    } else {
      // This assumes the backend is on the same IP as the frontend, just on a different port.
      baseUrl = `http://${window.location.hostname}:8001`;
    }
    window.open(`${baseUrl}${doc.link}`, "_blank");
  };

  // The change is here:
  const handleDelete = async (doc: Document) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to move "${doc.docName}" to obsolete documents?`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      // Use the updateDocumentStatus function to set the status to "obsolete"
      await updateDocumentStatus(doc.outerId, doc._id, "obsolete");
    } catch (error) {
      console.error("Error marking document as obsolete:", error);
      alert("Failed to move document to obsolete. Please try again.");
    }
  };

  const handleAmend = (doc: Document) => {
    setOpenDropdownId(null);
    openDocumentModal("amend", doc);
  };

  const handleApprove = (doc: Document) => {
    setOpenDropdownId(null);
    updateDocumentStatus(doc.outerId, doc._id, "approved");
  };

  const handleReject = (doc: Document) => {
    setOpenDropdownId(null);
    updateDocumentStatus(doc.outerId, doc._id, "rejected");
  };

  const handleToggleDropdown = (docId: string) => {
    setOpenDropdownId(openDropdownId === docId ? null : docId);
  };

  const documentsToDisplay =
    activeTab === "active" ? activeDocuments : obsoleteDocuments;

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
              <DocumentCard
                key={doc._id}
                document={doc}
                showActions={true}
                onView={handleView}
                onDelete={handleDelete}
                onAmend={activeTab === "active" ? handleAmend : undefined}
                onApprove={activeTab === "active" ? handleApprove : undefined}
                onReject={activeTab === "active" ? handleReject : undefined}
                dropdownOpen={openDropdownId === doc._id}
                onToggleDropdown={() => handleToggleDropdown(doc._id)}
                dropdownRef={dropdownRef}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab === "active" ? "active" : "obsolete"} documents
                found
              </h3>
              {activeTab === "active" && (
                <>
                  <p className="text-gray-500 mb-4">
                    Get started by uploading your first document
                  </p>
                  <button
                    onClick={() => openDocumentModal("upload")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </button>
                </>
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
                      {uploadFile ? uploadFile.name : "Click to upload file"}
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
                      setSelectedCategory(e.target.value);
                      // Clear the other category input if not selecting "Others"
                      if (e.target.value !== "Others") {
                        setOtherCategoryName("");
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
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Other Category Input (Only shown when "Others" is selected) */}
              {selectedCategory === "Others" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specify Category
                  </label>
                  <input
                    type="text"
                    value={otherCategoryName}
                    onChange={(e) => setOtherCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter custom category..."
                  />
                </div>
              )}

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
                    (selectedCategory === "Others" &&
                      !otherCategoryName.trim()) ||
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
    </div>
  );
};

export default DocumentsPage;
