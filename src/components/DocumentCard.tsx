import React from "react";
import { File, MoreVertical, Eye } from "lucide-react";
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
      // Default view behavior
      window.open(`http://localhost:8001${document.link}`, "_blank");
    }
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
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                View
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(document)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Delete
                </button>
              )}
              {onAmend && (
                <button
                  onClick={() => onAmend(document)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Amend
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => onApprove(document)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Approve
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(document)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
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

      {/* Status Display */}
      <p className="text-sm mb-2 font-medium">
        Status:{" "}
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(document.status)}`}
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