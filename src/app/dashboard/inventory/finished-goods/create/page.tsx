/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CreateGoodsForm, { FinishedGoodData } from "@/components/forms/CreateGoodsForm";
import CreateRawMaterialForm from "@/components/forms/CreateRawMaterialForm";
import CreateWorkflowForm from "@/components/forms/CreateWorkflowForm";
import { useUser } from "@/context/UserContext";
import GoodsApis from "@/actions/Apis/GoodsApis";
import RawMaterialApis from "@/actions/Apis/RawMaterialApis";
import WorkflowApis from "@/actions/Apis/WorkflowApis";
import OrgUserApis from "@/actions/Apis/OrgUserApis";

// Define the data interfaces here or in a separate shared types file
export interface VerificationParameter {
  parameter: string;
  specificationValue: string;
}

export interface Dimension {
  type: string;
  value: number;
  unit: string;
}

export interface RawMaterialData {
  material_name: string;
  category: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  product_id: string;
  stock_used: number;
  trigger_value: number;
  verificationParameters: VerificationParameter[];
  hasDimensions: boolean;
  dimensions: Dimension[];
  total_area?: number;
  usage_area?: number;
}

// Updated WorkflowStage and related interfaces
export interface QualityParameter {
  parameter_name: string;
  specification: string;
  measurement_unit?: string;
  min_value?: number;
  max_value?: number;
  is_critical: boolean;
}

export interface AssignedTo {
  name: string;
  email: string;
}

export interface WorkflowStage {
  stage_id?: string;
  stage_name: string;
  sequence_order: number;
  quality_check_required: boolean;
  quality_parameters?: QualityParameter[];
  assignedTo?: AssignedTo; // New field
}

export interface WorkflowData {
  workflow_name: string;
  finished_product_id: string;
  stages: WorkflowStage[];
}

const CreateProductPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Get product ID from URL params if it exists
  const productId = searchParams.get("pId") || "";

  // State for the overall multi-step process
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Data state that is passed to the child components and persists across steps
  const [materials, setMaterials] = useState<RawMaterialData[]>([]);

  // State for team members
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Handle Step 1: Create a new finished good
  const handleCreateFinishedGood = async (
    data: FinishedGoodData
  ): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const goodsData = {
        ...data,
        org_id: user?.organizationId || "",
      };

      const response = await GoodsApis.createFinishedGood(goodsData);

      if (response.status === 200 || response.status === 201) {
        const id = response?.data?.finishedGood?._id;
        setSuccess("Finished good created successfully!");
        // Update URL and move to the next step
        router.push(`?pId=${id}`);
        setCurrentStep(2);
      } else {
        throw new Error(
          response.data?.message || "Failed to create finished good"
        );
      }
    } catch (error: any) {
      console.error("Error creating finished good:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating the finished good. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Submit all added materials
  const handleSubmitMaterials = async (): Promise<void> => {
    if (materials.length === 0) {
      setError("Please add at least one material");
      return;
    }
  
    setLoading(true);
    setError("");
    setSuccess("");
  
    try {
      // The child component handles validation for individual materials before they are added.
      // This call handles the API submission for the list of materials.
      const promises = materials.map((material) => RawMaterialApis.addMaterial(material));
  
      const results = await Promise.all(promises);
      const allSuccessful = results.every(
        (res) => res.status === 200 || res.status === 201
      );
  
      if (allSuccessful) {
        setSuccess("All materials added successfully!");
        setCurrentStep(3);
      } else {
        throw new Error("Some materials failed to be added");
      }
    } catch (error: any) {
      console.error("Error adding materials:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while adding materials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3: Submit the final workflow with quality parameters
  const handleSubmitWorkflow = async (workflowData: WorkflowData): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const workflowWithProductId = { ...workflowData, finished_product_id: productId };
      
      // Validate that quality parameters are properly set for stages with quality checks
      const hasInvalidStages = workflowWithProductId.stages.some(
        stage => stage.quality_check_required && 
                (!stage.quality_parameters || stage.quality_parameters.length === 0)
      );
      
      if (hasInvalidStages) {
        throw new Error("Some stages with quality checks have no quality parameters defined");
      }

      const response = await WorkflowApis.addWorkflow(workflowWithProductId);

      if (response.status === 200 || response.status === 201) {
        setSuccess("Workflow added successfully! Product setup is complete.");
        setTimeout(() => {
          // Navigate to the finished goods dashboard after a short delay
          router.push("/dashboard/inventory/finished-goods");
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to add workflow");
      }
    } catch (error: any) {
      console.error("Error adding workflow:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while adding workflow. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await OrgUserApis.getAllUsers()
      if (res.status === 200) {
        // Filter users to only include those with the 'production' role
        const productionMembers = res.data.users.filter((user: any) => 
          user.roles.includes('production_plans') || user.roles.includes('production_batch_mgt')
        );
        setTeamMembers(productionMembers);
      } else {
        throw new Error(res.data?.message || "Failed to fetch team members");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Handle error, maybe set an error state
    }
  }

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Render the step indicator (reused from the original code)
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep === step
                    ? "border-blue-600 bg-blue-600 text-white"
                    : currentStep > step
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 text-gray-500"
                }`}
              >
                {currentStep > step ? (
                  <svg
                    className="w-6 h-6"
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
                ) : (
                  <span>{step}</span>
                )}
              </div>
              {step < 3 && (
                <div
                  className={`w-20 h-1 ${
                    currentStep > step ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex justify-between w-64 text-sm text-gray-600">
            <span
              className={
                currentStep === 1 ? "font-medium text-blue-600" : "font-medium"
              }
            >
              Product
            </span>
            <span
              className={
                currentStep === 2 ? "font-medium text-blue-600" : "font-medium"
              }
            >
              Materials
            </span>
            <span
              className={
                currentStep === 3 ? "font-medium text-blue-600" : "font-medium"
              }
            >
              Workflow
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render the appropriate child component based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <CreateGoodsForm onSubmit={handleCreateFinishedGood} loading={loading} />;
      case 2:
        return (
          <CreateRawMaterialForm
            productId={productId}
            materials={materials}
            setMaterials={setMaterials}
            loading={loading}
            error={error}
            setError={setError}
            success={success}
            setSuccess={setSuccess}
            onSubmit={handleSubmitMaterials}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <CreateWorkflowForm
            productId={productId}
            loading={loading}
            error={error}
            setError={setError}
            onSubmit={handleSubmitWorkflow}
            onBack={() => setCurrentStep(2)}
            teamMembers={teamMembers}
          />
        );
      default:
        return null;
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
                {currentStep === 1 && "Add New Product"}
                {currentStep === 2 && "Add Raw Materials"}
                {currentStep === 3 && "Setup Production Workflow"}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentStep === 1 &&
                  "Fill in the details to add a new product to your inventory"}
                {currentStep === 2 &&
                  "Specify the materials, verification parameters, equipment and dimensions"}
                {currentStep === 3 &&
                  "Define the production stages and quality parameters for manufacturing this product"}
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

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

        {/* Step Content */}
        {renderStepContent()}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                {currentStep === 1 && "Adding product..."}
                {currentStep === 2 && "Submitting materials..."}
                {currentStep === 3 && "Setting up workflow..."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProductPage;