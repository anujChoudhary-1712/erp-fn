/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import InputField from '@/components/ReusableComponents/InputField';
import Button from '@/components/ReusableComponents/Button';
import { Upload, X, FileText, Trash2 } from 'lucide-react';
import { getCookie } from '@/actions/CookieUtils';

interface Evidence {
  document: string;
  name: string;
}

// Minimal Document Upload Modal Component
interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (documentId: string, documentName: string) => void;
  documentType: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUploadSuccess,
  documentType 
}) => {
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const handleFileUpload = async () => {
    if (!docName.trim() || !file) {
      setError('Please provide a document name and select a file.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", docName);
    formData.append("docName", docName);
    formData.append("docType", documentType);

    try {
      const token = getCookie("token");
      const response = await fetch("http://localhost:8001/api/documents/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      onUploadSuccess(data.document._id, docName);
      setDocName('');
      setFile(null);
      onClose();
      
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setError(err.message || "Error uploading file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Upload {documentType}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
        
        <div className="space-y-4">
          <InputField
            label="Document Name"
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder={`e.g., ${documentType}`}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button type="button" variant="primary" onClick={handleFileUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// TypeScript interfaces for form data
interface MachineryFormData {
  // General Information
  machine_equipment_name: string;
  machine_equipment_type: string;
  make: string;
  model: string;
  serial_number: string;
  location: string;
  
  // Technical Details
  has_technical_details: boolean;
  range: string;
  resolution: string;
  accuracy: string;
  capacity: string;
  accessories: string;
  
  // Date & Documentation
  date_of_purchase: string;
  name_of_vendor: string;
  date_of_installation: string;
  warranty_period: string;
  date_of_operation: string;
  has_user_manual: boolean;
  
  // Calibration Details
  has_calibration_details: boolean;
  calibration_lab_name: string;
  calibration_date: string;
  next_due: string;
  calibration_frequency: string;
  
  // Machine Maintenance Details
  has_maintenance_details: boolean;
  maintenance_type: string;
  maintenance_frequency: string;
  last_maintenance_performed: string;
  maintenance_service_provider: string;
  next_scheduled_maintenance_date: string;
  maintenance_remarks: string;
  
  documents: Evidence[];
}

interface MachineryFormProps {
  onSubmit: (data: MachineryFormData) => Promise<void>;
  loading?: boolean;
}

const MAINTENANCE_TYPE_OPTIONS = ["Internal", "External"];
const CALIBRATION_FREQUENCY_OPTIONS = ["1", "3", "6", "12", "24"];
const MAINTENANCE_FREQUENCY_OPTIONS = ["1", "3", "6", "12", "24"];

const MachineryForm: React.FC<MachineryFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<MachineryFormData>({
    // General Information
    machine_equipment_name: "",
    machine_equipment_type: "",
    make: "",
    model: "",
    serial_number: "",
    location: "",
    
    // Technical Details
    has_technical_details: false,
    range: "",
    resolution: "",
    accuracy: "",
    capacity: "",
    accessories: "",
    
    // Date & Documentation
    date_of_purchase: "",
    name_of_vendor: "",
    date_of_installation: "",
    warranty_period: "",
    date_of_operation: "",
    has_user_manual: false,
    
    // Calibration Details
    has_calibration_details: false,
    calibration_lab_name: "",
    calibration_date: "",
    next_due: "",
    calibration_frequency: "",
    
    // Machine Maintenance Details
    has_maintenance_details: true, // Always true, not shown to user
    maintenance_type: "",
    maintenance_frequency: "",
    last_maintenance_performed: "",
    maintenance_service_provider: "",
    next_scheduled_maintenance_date: "",
    maintenance_remarks: "",
    
    documents: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');

  const handleChange = (field: keyof MachineryFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUploadSuccess = (documentId: string, documentName: string) => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, { document: documentId, name: documentName }]
    }));
    setUploadSuccessMessage(`Document "${documentName}" uploaded successfully!`);
    setUploadModalOpen(false);
    setTimeout(() => {
      setUploadSuccessMessage('');
    }, 5000);
  };
  
  const handleRemoveDocument = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.document !== documentId)
    }));
  };

  const openUploadModal = (documentType: string) => {
    setUploadDocumentType(documentType);
    setUploadModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Only machine_equipment_name is required as per your request
    if (!formData.machine_equipment_name) {
      newErrors.machine_equipment_name = 'Machine/Equipment Name is required';
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {uploadSuccessMessage && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {uploadSuccessMessage}
        </div>
      )}

      {/* General Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputField
              label="Machine/Equipment Name"
              value={formData.machine_equipment_name}
              onChange={(e) => handleChange("machine_equipment_name", e.target.value)}
              required
              error={errors.machine_equipment_name}
            />
          </div>
          
          <div>
            <InputField
              label="Machine/Equipment Type"
              value={formData.machine_equipment_type}
              onChange={(e) => handleChange("machine_equipment_type", e.target.value)}
            />
          </div>
          
          <div>
            <InputField
              label="Make"
              value={formData.make}
              onChange={(e) => handleChange("make", e.target.value)}
            />
          </div>
          
          <div>
            <InputField
              label="Model"
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value)}
            />
          </div>
          
          <div>
            <InputField
              label="Serial Number"
              value={formData.serial_number}
              onChange={(e) => handleChange("serial_number", e.target.value)}
            />
          </div>
          
          <div>
            <InputField
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Technical Details</h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Has Technical Details:</label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="technical_yes"
                  name="has_technical_details"
                  checked={formData.has_technical_details === true}
                  onChange={() => handleChange("has_technical_details", true)}
                  className="mr-2"
                />
                <label htmlFor="technical_yes">Yes</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="technical_no"
                  name="has_technical_details"
                  checked={formData.has_technical_details === false}
                  onChange={() => handleChange("has_technical_details", false)}
                  className="mr-2"
                />
                <label htmlFor="technical_no">No</label>
              </div>
            </div>
          </div>
        </div>
        
        {formData.has_technical_details && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputField
                label="Range"
                value={formData.range}
                onChange={(e) => handleChange("range", e.target.value)}
              />
            </div>
            
            <div>
              <InputField
                label="Resolution"
                value={formData.resolution}
                onChange={(e) => handleChange("resolution", e.target.value)}
              />
            </div>
            
            <div>
              <InputField
                label="Accuracy"
                value={formData.accuracy}
                onChange={(e) => handleChange("accuracy", e.target.value)}
              />
            </div>
            
            <div>
              <InputField
                label="Capacity"
                value={formData.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <InputField
                label="Accessories"
                value={formData.accessories}
                onChange={(e) => handleChange("accessories", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>



      {/* Calibration Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Calibration Details</h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Has Calibration Details:</label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="calibration_yes"
                  name="has_calibration_details"
                  checked={formData.has_calibration_details === true}
                  onChange={() => handleChange("has_calibration_details", true)}
                  className="mr-2"
                />
                <label htmlFor="calibration_yes">Yes</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="calibration_no"
                  name="has_calibration_details"
                  checked={formData.has_calibration_details === false}
                  onChange={() => handleChange("has_calibration_details", false)}
                  className="mr-2"
                />
                <label htmlFor="calibration_no">No</label>
              </div>
            </div>
          </div>
        </div>
        
        {formData.has_calibration_details && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <InputField
                  label="Calibration Lab Name"
                  value={formData.calibration_lab_name}
                  onChange={(e) => handleChange("calibration_lab_name", e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Calibration Date
                </label>
                <input
                  type="date"
                  value={formData.calibration_date}
                  onChange={(e) => handleChange("calibration_date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Next Due
                </label>
                <input
                  type="date"
                  value={formData.next_due}
                  onChange={(e) => handleChange("next_due", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Calibration Frequency (months)
                </label>
                <select
                  value={formData.calibration_frequency}
                  onChange={(e) => handleChange("calibration_frequency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Please Select</option>
                  {CALIBRATION_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => openUploadModal("Calibration Certificate")}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Calibration Certificate
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Machine Maintenance Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Machine Maintenance Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Maintenance Type
            </label>
            <select
              value={formData.maintenance_type}
              onChange={(e) => handleChange("maintenance_type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Please Select</option>
              {MAINTENANCE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Maintenance Frequency (months)
            </label>
            <select
              value={formData.maintenance_frequency}
              onChange={(e) => handleChange("maintenance_frequency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Please Select</option>
              {MAINTENANCE_FREQUENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <InputField
              label="Maintenance Service Provider"
              value={formData.maintenance_service_provider}
              onChange={(e) => handleChange("maintenance_service_provider", e.target.value)}
            />
          </div>
          
          <div>
            <InputField
              label="Remarks"
              value={formData.maintenance_remarks}
              onChange={(e) => handleChange("maintenance_remarks", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Documents Section */}
      {formData.documents.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
          <div className="space-y-3">
            {formData.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => handleRemoveDocument(doc.document)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          className="min-w-32"
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
      
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        documentType={uploadDocumentType}
      />
    </div>
  );
};

export default MachineryForm;