import React, { useState } from 'react';
import InputField from '@/components/ReusableComponents/InputField';
import Button from '@/components/ReusableComponents/Button';

// TypeScript interfaces for form data
interface MachineryFormData {
  // Basic Information
  standard_type: string;
  discipline: string;
  group: string;
  device_type: string;
  name: string;
  lab_id: string;
  sr_no: string;
  make: string;
  model: string;

  // Procurement & Setup
  procurement: string;
  commissioning: string;
  instruction_manual: string;
  location: string;

  // Technical Specifications
  tolerance_sign: string;
  acceptance_criteria: string;
  acceptance_criteria_unit_type: string;
  verification_conformity: string;

  // Calibration Information
  certificate_no: string;
  calibration_agency: string;
  calibration_date: string;
  calibration_frequency: string;
  valid_upto: string;
  ulr_no: string;
  coverage_factor: string;

  // Error & Measurement Details
  master_error: string;
  error_unit: string;
  drift_in_standard: string;

  // Maintenance Information
  plan_type: string;
  maintenance_frequency: string;
}

interface MachineryFormProps {
  onSubmit: (data: MachineryFormData) => Promise<void>;
  loading?: boolean;
}

// Sample options for dropdowns
const DISCIPLINE_OPTIONS = ["Discipline One", "Discipline Two", "Discipline Three"];
const GROUP_OPTIONS = ["Group A", "Group B", "Group C"];
const DEVICE_TYPE_OPTIONS = ["Type 1", "Type 2", "Type 3"];
const FREQUENCY_OPTIONS = ["1", "3", "6", "12", "24"];
const ERROR_UNIT_OPTIONS = ["mm", "cm", "m", "kg", "g", "°C"];
const ACCEPTANCE_CRITERIA_UNIT_OPTIONS = ["mm", "cm", "m", "kg", "g", "°C"];

const MachineryForm: React.FC<MachineryFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<MachineryFormData>({
    // Basic Information
    standard_type: "Primary",
    discipline: "",
    group: "",
    device_type: "",
    name: "",
    lab_id: "",
    sr_no: "",
    make: "",
    model: "",

    // Procurement & Setup
    procurement: "",
    commissioning: "",
    instruction_manual: "Yes",
    location: "",

    // Technical Specifications
    tolerance_sign: "+",
    acceptance_criteria: "",
    acceptance_criteria_unit_type: "",
    verification_conformity: "Yes",

    // Calibration Information
    certificate_no: "",
    calibration_agency: "",
    calibration_date: "",
    calibration_frequency: "",
    valid_upto: "",
    ulr_no: "",
    coverage_factor: "",

    // Error & Measurement Details
    master_error: "",
    error_unit: "",
    drift_in_standard: "0",

    // Maintenance Information
    plan_type: "Internal",
    maintenance_frequency: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input change
  const handleChange = (field: keyof MachineryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle radio buttons
  const handleRadioChange = (field: keyof MachineryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    const requiredFields: (keyof MachineryFormData)[] = [
      'name', 'lab_id', 'device_type', 'discipline', 'group'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });
    
    // Set errors
    setErrors(newErrors);
    
    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        {/* Standard Type */}
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
          {/* Discipline */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Discipline <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.discipline}
              onChange={(e) => handleChange("discipline", e.target.value)}
              className={`w-full px-3 py-2 border ${
                errors.discipline ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Please Select</option>
              {DISCIPLINE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.discipline && (
              <p className="mt-1 text-sm text-red-600">{errors.discipline}</p>
            )}
          </div>
          
          {/* Group */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Group <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.group}
              onChange={(e) => handleChange("group", e.target.value)}
              className={`w-full px-3 py-2 border ${
                errors.group ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Please Select</option>
              {GROUP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.group && (
              <p className="mt-1 text-sm text-red-600">{errors.group}</p>
            )}
          </div>
        </div>
        
        {/* Device Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Device Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.device_type}
            onChange={(e) => handleChange("device_type", e.target.value)}
            className={`w-full px-3 py-2 border ${
              errors.device_type ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Please Select</option>
            {DEVICE_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.device_type && (
            <p className="mt-1 text-sm text-red-600">{errors.device_type}</p>
          )}
        </div>
        
        {/* Name */}
        <div className="mb-4">
          <InputField
            label="Name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            error={errors.name}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Lab ID */}
          <div>
            <InputField
              label="Lab ID"
              value={formData.lab_id}
              onChange={(e) => handleChange("lab_id", e.target.value)}
              required
              error={errors.lab_id}
            />
          </div>
          
          {/* Sr No */}
          <div>
            <InputField
              label="Sr No."
              value={formData.sr_no}
              onChange={(e) => handleChange("sr_no", e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Make */}
          <div>
            <InputField
              label="Make"
              value={formData.make}
              onChange={(e) => handleChange("make", e.target.value)}
            />
          </div>
          
          {/* Model */}
          <div>
            <InputField
              label="Model"
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Procurement */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Procurement
            </label>
            <input
              type="date"
              value={formData.procurement}
              onChange={(e) => handleChange("procurement", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Commissioning */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Commissioning
            </label>
            <input
              type="date"
              value={formData.commissioning}
              onChange={(e) => handleChange("commissioning", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Instruction Manual */}
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
          
          {/* Location */}
          <div>
            <InputField
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Technical Specifications */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Tolerance Sign */}
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
          
          {/* Acceptance Criteria */}
          <div>
            <InputField
              label="Acceptance Criteria"
              value={formData.acceptance_criteria}
              onChange={(e) => handleChange("acceptance_criteria", e.target.value)}
            />
          </div>
        </div>
        
        {/* Acceptance Criteria Unit Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Acceptance Criteria Unit Type
          </label>
          <select
            value={formData.acceptance_criteria_unit_type}
            onChange={(e) => handleChange("acceptance_criteria_unit_type", e.target.value)}
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
        
        {/* Verification Conformity */}
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
      </div>
      
      {/* Calibration Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Calibration Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Certificate No */}
          <div>
            <InputField
              label="Certificate No."
              value={formData.certificate_no}
              onChange={(e) => handleChange("certificate_no", e.target.value)}
            />
          </div>
          
          {/* Calibration Agency */}
          <div>
            <InputField
              label="Calibration Agency"
              value={formData.calibration_agency}
              onChange={(e) => handleChange("calibration_agency", e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Calibration Date */}
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
          
          {/* Calibration Frequency */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Calibration Frequency in month
            </label>
            <select
              value={formData.calibration_frequency}
              onChange={(e) => handleChange("calibration_frequency", e.target.value)}
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
          
          {/* Valid Up To */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Valid Up To
            </label>
            <input
              type="date"
              value={formData.valid_upto}
              onChange={(e) => handleChange("valid_upto", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* ULR No */}
          <div>
            <InputField
              label="ULR No."
              value={formData.ulr_no}
              onChange={(e) => handleChange("ulr_no", e.target.value)}
            />
          </div>
          
          {/* Coverage Factor */}
          <div>
            <InputField
              label="Coverage Factor"
              value={formData.coverage_factor}
              onChange={(e) => handleChange("coverage_factor", e.target.value)}
              type="number"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Master Error */}
          <div>
            <InputField
              label="Master Error"
              value={formData.master_error}
              onChange={(e) => handleChange("master_error", e.target.value)}
              type="number"
            />
          </div>
          
          {/* Error Unit */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Error Unit
            </label>
            <select
              value={formData.error_unit}
              onChange={(e) => handleChange("error_unit", e.target.value)}
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
        
        {/* Drift in Standard */}
        <div className="mt-4">
          <InputField
            label="Drift in Standard (in %)"
            value={formData.drift_in_standard}
            onChange={(e) => handleChange("drift_in_standard", e.target.value)}
            type="number"
          />
        </div>
      </div>
      
      {/* Maintenance Plan */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Plan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Plan Type */}
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
          
          {/* Maintenance Frequency */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Maintenance Frequency in month
            </label>
            <select
              value={formData.maintenance_frequency}
              onChange={(e) => handleChange("maintenance_frequency", e.target.value)}
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
      
      {/* Submit Button */}
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
    </div>
  );
};

export default MachineryForm;