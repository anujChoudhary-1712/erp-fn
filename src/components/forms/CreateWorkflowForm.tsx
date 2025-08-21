/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";

// Enhanced interfaces for the workflow data structure
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

// Props interface for the component
interface CreateWorkflowFormProps {
  productId: string;
  loading: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (data: WorkflowData) => void;
  onBack: () => void;
  teamMembers: any[]; // Receive team members as a prop
}

const CreateWorkflowForm: React.FC<CreateWorkflowFormProps> = ({
  productId,
  loading,
  setError,
  onSubmit,
  onBack,
  teamMembers,
}) => {
  // Local state for the workflow form
  const [workflow, setWorkflow] = useState<WorkflowData>({
    workflow_name: "",
    finished_product_id: productId,
    stages: [
      {
        stage_name: "Cutting",
        sequence_order: 1,
        quality_check_required: true,
      },
    ],
  });

  // State for the current stage being edited for quality parameters
  const [currentEditStage, setCurrentEditStage] = useState<number | null>(null);
  const [newParameter, setNewParameter] = useState<QualityParameter>({
    parameter_name: "",
    specification: "",
    measurement_unit: "",
    min_value: undefined,
    max_value: undefined,
    is_critical: false,
  });

  // Effect to update product_id when it changes from the parent
  useEffect(() => {
    setWorkflow((prev) => ({ ...prev, finished_product_id: productId }));
  }, [productId]);

  // Handle workflow input changes
  const handleWorkflowChange = (
    field: keyof WorkflowData,
    value: string
  ): void => {
    setWorkflow((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle individual stage changes
  const handleStageChange = (
    index: number,
    field: keyof WorkflowStage,
    value: any
  ): void => {
    setWorkflow((prev) => {
      const newStages = [...prev.stages];
      newStages[index] = {
        ...newStages[index],
        [field]: value,
      };

      // If quality check is disabled, clear any quality parameters
      if (field === "quality_check_required" && value === false) {
        newStages[index].quality_parameters = [];
      }

      return {
        ...prev,
        stages: newStages,
      };
    });
  };

  // Handle assignedTo change for a specific stage
  const handleAssignedToChange = (
    index: number,
    value: string
  ): void => {
    const selectedUser = teamMembers.find(member => member.email === value);
    setWorkflow((prev) => {
      const newStages = [...prev.stages];
      newStages[index] = {
        ...newStages[index],
        assignedTo: selectedUser ? { name: selectedUser.name, email: selectedUser.email } : undefined,
      };
      return {
        ...prev,
        stages: newStages,
      };
    });
  };

  // Add a new stage
  const handleAddStage = (): void => {
    setWorkflow((prev) => {
      const newStages = [...prev.stages];
      const nextOrder = newStages.length + 1;
      newStages.push({
        stage_name: "",
        sequence_order: nextOrder,
        quality_check_required: true,
        quality_parameters: [],
      });
      return {
        ...prev,
        stages: newStages,
      };
    });
  };

  // Remove a stage
  const handleRemoveStage = (index: number): void => {
    if (workflow.stages.length <= 1) {
      setError("At least one stage is required");
      return;
    }
    setWorkflow((prev) => {
      const newStages = prev.stages.filter((_, i) => i !== index);
      // Re-sequence the stages
      newStages.forEach((stage, i) => {
        stage.sequence_order = i + 1;
      });
      return {
        ...prev,
        stages: newStages,
      };
    });
    setError("");
  };

  // Handle quality parameter input changes
  const handleParameterChange = (field: keyof QualityParameter, value: any): void => {
    setNewParameter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

// Add a new quality parameter to a stage
const handleAddParameter = (): void => {
    if (currentEditStage === null) return;
  
    if (!newParameter.parameter_name.trim() || !newParameter.specification.trim()) {
      setError("Parameter name and specification are required");
      return;
    }
  
    // Use a single state update for all related state changes.
    // This is the key to preventing the double-add issue.
    setWorkflow((prevWorkflow) => {
      // Create a new array of stages.
      const newStages = prevWorkflow.stages.map((stage, index) => {
        // Find the correct stage to update.
        if (index === currentEditStage) {
          // Create a new quality_parameters array to avoid mutation.
          const newParameters = stage.quality_parameters
            ? [...stage.quality_parameters, { ...newParameter }]
            : [{ ...newParameter }];
  
          // Return a new stage object with the updated parameters.
          return {
            ...stage,
            quality_parameters: newParameters,
          };
        }
        // Return other stages as they are.
        return stage;
      });
  
      return {
        ...prevWorkflow,
        stages: newStages,
      };
    });
  
    // Since we're using a single update for the data,
    // we can now safely reset the form and close the modal
    // in separate calls, which React will handle correctly.
    setNewParameter({
      parameter_name: "",
      specification: "",
      measurement_unit: "",
      min_value: undefined,
      max_value: undefined,
      is_critical: false,
    });
  
    setCurrentEditStage(null);
  
    setError("");
  };

  // Remove a quality parameter from a stage
  const handleRemoveParameter = (stageIndex: number, paramIndex: number): void => {
    setWorkflow((prev) => {
      const newStages = [...prev.stages];
      newStages[stageIndex].quality_parameters!.splice(paramIndex, 1);
      return {
        ...prev,
        stages: newStages,
      };
    });
  };

  // Submit the form to the parent component
  const handleSubmit = (): void => {
    if (!workflow.workflow_name.trim()) {
      setError("Workflow name is required");
      return;
    }
    if (workflow.stages.some((stage) => !stage.stage_name.trim())) {
      setError("All stages must have a name");
      return;
    }
    onSubmit(workflow);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Production Workflow
        </h3>
        <div className="space-y-4">
          {/* Workflow Name */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Workflow Name <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={workflow.workflow_name}
              onChange={(e) =>
                handleWorkflowChange("workflow_name", e.target.value)
              }
              placeholder="Enter workflow name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Stages Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-medium text-gray-800">
                Production Stages
              </h4>
              <button
                type="button"
                onClick={handleAddStage}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Stage
              </button>
            </div>

            <div className="space-y-4">
              {workflow.stages.map((stage, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs mr-2">
                        {stage.sequence_order}
                      </span>
                      <h5 className="text-sm font-medium text-gray-700">
                        Stage
                      </h5>
                    </div>
                    {workflow.stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Stage Name */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">
                        Stage Name <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={stage.stage_name}
                        onChange={(e) =>
                          handleStageChange(index, "stage_name", e.target.value)
                        }
                        placeholder="Enter stage name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    {/* Assigned To */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">
                        Assigned To
                      </label>
                      <select
                        value={stage.assignedTo?.email || ""}
                        onChange={(e) => handleAssignedToChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Team Member --</option>
                        {teamMembers.map((member) => (
                          <option key={member.email} value={member.email}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quality Check */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`quality-check-${index}`}
                        checked={stage.quality_check_required}
                        onChange={(e) =>
                          handleStageChange(
                            index,
                            "quality_check_required",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`quality-check-${index}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Quality check required
                      </label>
                    </div>
                  </div>

                  {/* Quality Parameters Section */}
                  {stage.quality_check_required && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h6 className="text-sm font-medium text-gray-700">
                          Quality Parameters
                        </h6>
                        <button
                          type="button"
                          onClick={() => setCurrentEditStage(index)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Add Parameter
                        </button>
                      </div>

                      {/* Display existing parameters */}
                      {stage.quality_parameters && stage.quality_parameters.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {stage.quality_parameters.map((param, paramIndex) => (
                            <div 
                              key={paramIndex} 
                              className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
                            >
                              <div>
                                <div className="font-medium text-xs text-gray-800">
                                  {param.parameter_name}
                                  {param.is_critical && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                                      Critical
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {param.specification}
                                  {param.measurement_unit && ` (${param.measurement_unit})`}
                                  {(param.min_value !== undefined || param.max_value !== undefined) && (
                                    <span className="ml-1">
                                      {param.min_value !== undefined && `Min: ${param.min_value}`}
                                      {param.min_value !== undefined && param.max_value !== undefined && ", "}
                                      {param.max_value !== undefined && `Max: ${param.max_value}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveParameter(index, paramIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          No quality parameters defined. Add parameters to enable quality testing at this stage.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quality Parameter Form Modal */}
      {currentEditStage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Quality Parameter
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Parameter Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={newParameter.parameter_name}
                  onChange={(e) => handleParameterChange("parameter_name", e.target.value)}
                  placeholder="e.g., Dimension Check, Weight, Texture"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Specification <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={newParameter.specification}
                  onChange={(e) => handleParameterChange("specification", e.target.value)}
                  placeholder="e.g., Must be within tolerance, Smooth finish"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Measurement Unit (optional)
                </label>
                <input
                  type="text"
                  value={newParameter.measurement_unit || ""}
                  onChange={(e) => handleParameterChange("measurement_unit", e.target.value)}
                  placeholder="e.g., mm, kg, %"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Minimum Value (optional)
                  </label>
                  <input
                    type="number"
                    value={newParameter.min_value || ""}
                    onChange={(e) => handleParameterChange("min_value", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Min value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Maximum Value (optional)
                  </label>
                  <input
                    type="number"
                    value={newParameter.max_value || ""}
                    onChange={(e) => handleParameterChange("max_value", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is-critical"
                  checked={newParameter.is_critical}
                  onChange={(e) => handleParameterChange("is_critical", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is-critical"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Critical parameter (failure requires rejection)
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setCurrentEditStage(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddParameter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Parameter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? "Submitting..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
};

export default CreateWorkflowForm;