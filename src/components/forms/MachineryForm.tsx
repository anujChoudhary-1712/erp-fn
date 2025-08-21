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
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
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
    formData.append("docType", "Machinery Document");

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
          <h3 className="text-xl font-semibold">Upload Document</h3>
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
            placeholder="e.g., Manual, Certificate"
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
  standard_type: string;
  discipline: string;
  group: string;
  device_type: string;
  name: string;
  lab_id: string;
  sr_no: string;
  make: string;
  model: string;
  procurement: string;
  commissioning: string;
  instruction_manual: string;
  location: string;
  tolerance_sign: string;
  acceptance_criteria: string;
  acceptance_criteria_unit_type: string;
  verification_conformity: string;
  certificate_no: string;
  calibration_agency: string;
  calibration_date: string;
  calibration_frequency: string;
  valid_upto: string;
  ulr_no: string;
  coverage_factor: string;
  master_error: string;
  error_unit: string;
  drift_in_standard: string;
  plan_type: string;
  maintenance_frequency: string;
  documents: Evidence[];
}

interface MachineryFormProps {
  onSubmit: (data: MachineryFormData) => Promise<void>;
  loading?: boolean;
}

const FREQUENCY_OPTIONS = ["1", "3", "6", "12", "24"];
const ERROR_UNIT_OPTIONS = ["mm", "cm", "m", "kg", "g", "°C"];
const ACCEPTANCE_CRITERIA_UNIT_OPTIONS = ["mm", "cm", "m", "kg", "g", "°C"];

const MachineryForm: React.FC<MachineryFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<MachineryFormData>({
    standard_type: "Primary",
    discipline: "",
    group: "",
    device_type: "",
    name: "",
    lab_id: "",
    sr_no: "",
    make: "",
    model: "",
    procurement: "",
    commissioning: "",
    instruction_manual: "Yes",
    location: "",
    tolerance_sign: "+",
    acceptance_criteria: "",
    acceptance_criteria_unit_type: "",
    verification_conformity: "Yes",
    certificate_no: "",
    calibration_agency: "",
    calibration_date: "",
    calibration_frequency: "",
    valid_upto: "",
    ulr_no: "",
    coverage_factor: "",
    master_error: "",
    error_unit: "",
    drift_in_standard: "0",
    plan_type: "Internal",
    maintenance_frequency: "",
    documents: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');

  const handleChange = (field: keyof MachineryFormData, value: string) => {
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

  const handleRadioChange = (field: keyof MachineryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleManualUploadSuccess = (documentId: string, documentName: string) => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, { document: documentId, name: documentName }]
    }));
    setUploadSuccessMessage(`Instruction Manual "${documentName}" uploaded successfully!`);
    setIsManualModalOpen(false);
    setTimeout(() => {
      setUploadSuccessMessage('');
    }, 5000);
  };

  const handleVerificationUploadSuccess = (documentId: string, documentName: string) => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, { document: documentId, name: documentName }]
    }));
    setUploadSuccessMessage(`Verification Conformity "${documentName}" uploaded successfully!`);
    setIsVerificationModalOpen(false);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const requiredFields: (keyof MachineryFormData)[] = [
      'name', 'lab_id', 'device_type', 'discipline', 'group'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });
    
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
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Standard Type
          </label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="primary"
                name="standard_type"
                checked={formData.standard_type === "Primary"}
                onChange={() => handleRadioChange("standard_type", "Primary")}
                className="mr-2"
              />
              <label htmlFor="primary">Primary</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="secondary"
                name="standard_type"
                checked={formData.standard_type === "Secondary"}
                onChange={() => handleRadioChange("standard_type", "Secondary")}
                className="mr-2"
              />
              <label htmlFor="secondary">Secondary</label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Discipline <span className="text-red-500">*</span>
            </label>
            <InputField
              type="text"
              name="discipline"
              value={formData.discipline}
              onChange={(e) => handleChange("discipline", e.target.value)}
              required
              error={errors.discipline}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Group <span className="text-red-500">*</span>
            </label>
            <InputField
              type="text"
              name="group"
              value={formData.group}
              onChange={(e) => handleChange("group", e.target.value)}
              required
              error={errors.group}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Device Type <span className="text-red-500">*</span>
          </label>
            <InputField
              type="text"
              name="device_type"
              value={formData.device_type}
              onChange={(e) => handleChange("device_type", e.target.value)}
              required
              error={errors.device_type}
            />
        </div>
        
        <div className="mb-4">
          <InputField
            label="Name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value as any)}
            required
            error={errors.name}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <InputField
              label="Lab ID"
              value={formData.lab_id}
              onChange={(e) => handleChange("lab_id", e.target.value as any)}
              required
              error={errors.lab_id}
            />
          </div>
          
          <div>
            <InputField
              label="Sr No."
              value={formData.sr_no}
              onChange={(e) => handleChange("sr_no", e.target.value as any)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <InputField
              label="Make"
              value={formData.make}
              onChange={(e) => handleChange("make", e.target.value as any)}
            />
          </div>
          
          <div>
            <InputField
              label="Model"
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value as any)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Procurement
            </label>
            <input
              type="date"
              value={formData.procurement}
              onChange={(e) => handleChange("procurement", e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Commissioning
            </label>
            <input
              type="date"
              value={formData.commissioning}
              onChange={(e) => handleChange("commissioning", e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Instruction Manual
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="manual_yes"
                  name="instruction_manual"
                  checked={formData.instruction_manual === "Yes"}
                  onChange={() => handleRadioChange("instruction_manual", "Yes")}
                  className="mr-2"
                />
                <label htmlFor="manual_yes">Yes</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="manual_no"
                  name="instruction_manual"
                  checked={formData.instruction_manual === "No"}
                  onChange={() => handleRadioChange("instruction_manual", "No")}
                  className="mr-2"
                />
                <label htmlFor="manual_no">No</label>
              </div>
            </div>
          </div>
          
          <div>
            <InputField
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value as any)}
            />
          </div>
        </div>
        
        {formData.instruction_manual === 'Yes' && (
          <div className="md:col-span-2 mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Instruction Manual Document</h2>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
              
              <div className="space-y-3">
                {uploadSuccessMessage && (
                  <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
                    {uploadSuccessMessage}
                  </div>
                )}
                {formData.documents && formData.documents.length > 0 ? (
                  formData.documents.filter(doc => doc.name.includes("Manual")).map((doc, index) => (
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
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No documents uploaded yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Tolerance Sign
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="tolerance_plus"
                  name="tolerance_sign"
                  checked={formData.tolerance_sign === "+"}
                  onChange={() => handleRadioChange("tolerance_sign", "+")}
                  className="mr-2"
                />
                <label htmlFor="tolerance_plus">+</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="tolerance_minus"
                  name="tolerance_sign"
                  checked={formData.tolerance_sign === "-"}
                  onChange={() => handleRadioChange("tolerance_sign", "-")}
                  className="mr-2"
                />
                <label htmlFor="tolerance_minus">-</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="tolerance_plusminus"
                  name="tolerance_sign"
                  checked={formData.tolerance_sign === "±"}
                  onChange={() => handleRadioChange("tolerance_sign", "±")}
                  className="mr-2"
                />
                <label htmlFor="tolerance_plusminus">±</label>
              </div>
            </div>
          </div>
          
          <div>
            <InputField
              label="Acceptance Criteria"
              value={formData.acceptance_criteria}
              onChange={(e) => handleChange("acceptance_criteria", e.target.value as any)}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Acceptance Criteria Unit Type
          </label>
          <select
            value={formData.acceptance_criteria_unit_type}
            onChange={(e) => handleChange("acceptance_criteria_unit_type", e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Please select</option>
            {ACCEPTANCE_CRITERIA_UNIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Verification Conformity
          </label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="verification_yes"
                name="verification_conformity"
                checked={formData.verification_conformity === "Yes"}
                onChange={() => handleRadioChange("verification_conformity", "Yes")}
                className="mr-2"
              />
              <label htmlFor="verification_yes">Yes</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="verification_no"
                name="verification_conformity"
                checked={formData.verification_conformity === "No"}
                onChange={() => handleRadioChange("verification_conformity", "No")}
                className="mr-2"
                />
              <label htmlFor="verification_no">No</label>
            </div>
          </div>
        </div>
        
        {formData.verification_conformity === 'Yes' && (
          <div className="md:col-span-2 mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Verification Conformity Document</h2>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
              
              <div className="space-y-3">
                {uploadSuccessMessage && (
                  <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
                    {uploadSuccessMessage}
                  </div>
                )}
                {formData.documents && formData.documents.length > 0 ? (
                  formData.documents.filter(doc => doc.name.includes("Conformity")).map((doc, index) => (
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
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No documents uploaded yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Calibration Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <InputField
              label="Certificate No."
              value={formData.certificate_no}
              onChange={(e) => handleChange("certificate_no", e.target.value as any)}
            />
          </div>
          
          <div>
            <InputField
              label="Calibration Agency"
              value={formData.calibration_agency}
              onChange={(e) => handleChange("calibration_agency", e.target.value as any)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Calibration Date
            </label>
            <input
              type="date"
              value={formData.calibration_date}
              onChange={(e) => handleChange("calibration_date", e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Calibration Frequency in month
            </label>
            <select
              value={formData.calibration_frequency}
              onChange={(e) => handleChange("calibration_frequency", e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Please Select</option>
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Valid Up To
            </label>
            <input
              type="date"
              value={formData.valid_upto}
              onChange={(e) => handleChange("valid_upto", e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <InputField
              label="ULR No."
              value={formData.ulr_no}
              onChange={(e) => handleChange("ulr_no", e.target.value as any)}
            />
          </div>
          
          <div>
            <InputField
              label="Coverage Factor"
              value={formData.coverage_factor}
              onChange={(e) => handleChange("coverage_factor", e.target.value as any)}
              type="number"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputField
              label="Master Error"
              value={formData.master_error}
              onChange={(e) => handleChange("master_error", e.target.value as any)}
              type="number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Error Unit
            </label>
            <select
              value={formData.error_unit}
              onChange={(e) => handleChange("error_unit", e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Please select</option>
              {ERROR_UNIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <InputField
            label="Drift in Standard (in %)"
            value={formData.drift_in_standard}
            onChange={(e) => handleChange("drift_in_standard", e.target.value as any)}
            type="number"
          />
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Plan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Plan Type
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="plan_internal"
                  name="plan_type"
                  checked={formData.plan_type === "Internal"}
                  onChange={() => handleRadioChange("plan_type", "Internal")}
                  className="mr-2"
                />
                <label htmlFor="plan_internal">Internal</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="plan_external"
                  name="plan_type"
                  checked={formData.plan_type === "External"}
                  onChange={() => handleRadioChange("plan_type", "External")}
                  className="mr-2"
                />
                <label htmlFor="plan_external">External</label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Maintenance Frequency in month
            </label>
            <select
              value={formData.maintenance_frequency}
              onChange={(e) => handleChange("maintenance_frequency", e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Please Select</option>
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
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
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onUploadSuccess={handleManualUploadSuccess}
      />
      <DocumentUploadModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onUploadSuccess={handleVerificationUploadSuccess}
      />
    </div>
  );
};

export default MachineryForm;
