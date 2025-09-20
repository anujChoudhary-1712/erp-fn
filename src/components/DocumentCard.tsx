import React from "react";
import {
  File,
  MoreVertical,
  Eye,
  User,
  CheckCircle,
  XCircle,
  Printer,
} from "lucide-react";
import { Document } from "@/app/dashboard/documents/page";

interface DocumentCardProps {
  document: Document;
  showActions?: boolean;
  onView?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  onAmend?: (doc: Document) => void;
  onApprove?: (doc: Document) => void;
  onReject?: (doc: Document) => void;
  dropdownOpen?: boolean;
  onToggleDropdown?: () => void;
  dropdownRef?: React.RefObject<HTMLDivElement>;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  showActions = true,
  onView,
  onDelete,
  onAmend,
  onApprove,
  onReject,
  dropdownOpen = false,
  onToggleDropdown,
  dropdownRef,
}) => {
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
      case "obsolete":
        return "Obsolete";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (getDisplayStatus(status)) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Obsolete":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const handleView = () => {
    if (onView) {
      onView(document);
    } else {
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
      window.open(`${baseUrl}${document.link}`, "_blank");
    }
  };

  const handlePrint = () => {
    // Open the document in a new window and print it
    const printWindow = window.open(
      `http://localhost:8001${document.link}`,
      "_blank"
    );
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
  };

  // Get initials from a name
  const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow relative">
      {/* Three dots dropdown */}
      {showActions && (
        <div className="absolute top-2 right-2">
          <button
            onClick={onToggleDropdown}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {dropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
            >
              <button
                onClick={handleView}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </button>
              <button
                onClick={handlePrint}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(document)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  Delete
                </button>
              )}
              {onAmend && (
                <button
                  onClick={() => onAmend(document)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  Amend
                </button>
              )}
              {onApprove && document.status !== "approved" && (
                <button
                  onClick={() => onApprove(document)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </button>
              )}
              {onReject && document.status !== "rejected" && (
                <button
                  onClick={() => onReject(document)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* View button for non-action mode */}
      {!showActions && (
        <div className="absolute top-2 right-2">
          <button
            onClick={handleView}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            title="View Document"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* File Icon and Name */}
      <div className="flex items-start gap-3 mb-3 pr-8">
        {getFileIcon(document.fileName)}
        <div className="flex-1 min-w-0">
          <h3
            className="font-medium text-gray-900 truncate"
            title={document.docName}
          >
            {document.docName}
          </h3>
          <p className="text-sm text-gray-500">
            {formatFileSize(document.fileSize)}
          </p>
        </div>
      </div>

      {/* Category (if exists) */}
      {document.docType && (
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Category:</span> {document.docType}
        </p>
      )}

      {/* Description */}
      {document.description && (
        <p
          className="text-sm text-gray-600 mb-3 line-clamp-2"
          title={document.description}
        >
          {document.description}
        </p>
      )}

      {/* User Information */}
      <div className="space-y-1.5 mb-3">
        {/* Uploaded by */}
        {document.uploaded_by?.name && (
          <div className="flex items-center text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full">
                <span className="text-xs">
                  {getInitials(document.uploaded_by.name)}
                </span>
              </div>
              <User className="w-3 h-3" />
              <span>Uploaded by:</span>
              <span className="font-medium" title={document.uploaded_by.email}>
                {document.uploaded_by.name}
              </span>
            </div>
          </div>
        )}

        {/* Approved by */}
        {document.approved_by?.name && document.status === "approved" && (
          <div className="flex items-center text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 flex items-center justify-center bg-green-100 text-green-700 rounded-full">
                <span className="text-xs">
                  {getInitials(document.approved_by.name)}
                </span>
              </div>
              <CheckCircle className="w-3 h-3" />
              <span>Approved by:</span>
              <span className="font-medium" title={document.approved_by.email}>
                {document.approved_by.name}
              </span>
            </div>
          </div>
        )}

        {/* Rejected by */}
        {document.rejected_by?.name && document.status === "rejected" && (
          <div className="flex items-center text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-700 rounded-full">
                <span className="text-xs">
                  {getInitials(document.rejected_by.name)}
                </span>
              </div>
              <XCircle className="w-3 h-3" />
              <span>Rejected by:</span>
              <span className="font-medium" title={document.rejected_by.email}>
                {document.rejected_by.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status Display */}
      <p className="text-sm mb-2 font-medium">
        Status:{" "}
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
            document.status
          )}`}
        >
          {getDisplayStatus(document.status)}
        </span>
      </p>

      {/* Upload Date */}
      <p className="text-xs text-gray-400">
        Uploaded: {formatDate(document.uploadDate)}
      </p>
    </div>
  );
};

export default DocumentCard;
