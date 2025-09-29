/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import MachineryForm from './forms/MachineryForm';

// TypeScript interface for form data
interface MachineryFormData {
  // All machinery form fields as defined in MachineryForm component
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
}

const MachineryPurchase: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const router = useRouter();
  const { user } = useUser();

  const handleMachinerySubmit = async (data: MachineryFormData): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Convert form data to match your API requirements
      const machineryData = {
        // Basic Information
        standard_type: data.standard_type,
        discipline: data.discipline,
        group: data.group,
        device_type: data.device_type,
        name: data.name,
        lab_id: data.lab_id,
        sr_no: data.sr_no,
        make: data.make,
        model: data.model,
        
        // Procurement & Setup
        procurement: data.procurement ? new Date(data.procurement).toISOString() : null,
        commissioning: data.commissioning ? new Date(data.commissioning).toISOString() : null,
        instruction_manual: data.instruction_manual,
        location: data.location,
        
        // Technical Specifications
        tolerance_sign: data.tolerance_sign,
        acceptance_criteria: data.acceptance_criteria,
        acceptance_criteria_unit_type: data.acceptance_criteria_unit_type,
        verification_conformity: data.verification_conformity,
        
        // Calibration Information
        certificate_no: data.certificate_no,
        calibration_agency: data.calibration_agency,
        calibration_date: data.calibration_date ? new Date(data.calibration_date).toISOString() : null,
        calibration_frequency: data.calibration_frequency,
        valid_upto: data.valid_upto ? new Date(data.valid_upto).toISOString() : null,
        ulr_no: data.ulr_no,
        coverage_factor: data.coverage_factor ? parseFloat(data.coverage_factor) : null,
        
        // Error & Measurement Details
        master_error: data.master_error ? parseFloat(data.master_error) : null,
        error_unit: data.error_unit,
        drift_in_standard: data.drift_in_standard ? parseFloat(data.drift_in_standard) : 0,
        
        // Maintenance Information
        plan_type: data.plan_type,
        maintenance_frequency: data.maintenance_frequency,
        
        // Organization Reference
        org_id: user?.organizationId || "",
      };

      console.log("Submitting machinery data:", machineryData);

      // Make API call to save machinery data
      // Replace with your actual API call
      /*
      const response = await fetch("http://your-api/machinery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getCookie("token")}`,
        },
        body: JSON.stringify(machineryData),
      });

      if (!response.ok) {
        throw new Error("Failed to create machinery record");
      }
      */
      
      // For now, simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess("Machinery record created successfully!");
      // Wait for 2 seconds before redirecting
      setTimeout(() => {
        router.push("/dashboard/machinery");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating machinery record:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating the machinery record. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Add New Machinery
              </h1>
              <p className="text-gray-600 mt-1">
                Fill in the details to add a new machinery to your inventory
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <MachineryForm onSubmit={handleMachinerySubmit} loading={loading} />

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                Creating machinery record...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MachineryPurchase;