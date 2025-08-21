/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Button from "@/components/ReusableComponents/Button";
import PurchaseReqApis from "@/actions/Apis/PurchaseReqApis";
import MachineryApis from "@/actions/Apis/MachineryApis";
import MachineryForm from "./MachineryForm";
import MaterialsForm from "./MaterialsForm";

const PURCHASE_TYPES = {
  MATERIALS: "Material",
  MACHINERY: "Machinery",
  MISC: "Misc",
};

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
  documents: { document: string; name: string }[];
}

interface MiscItem {
  itemName: string;
  specifications: {
    parameter: string;
    specification: string;
  }[];
}

interface CreatePurchaseFormProps {
  loading?: boolean;
}

const CreatePurchaseForm: React.FC<CreatePurchaseFormProps> = ({
  loading: initialLoading = false,
}) => {
  const [purchaseType, setPurchaseType] = useState<string>("");
  const [showTypeSelection, setShowTypeSelection] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [initialMaterialIds, setInitialMaterialIds] = useState<string[]>([]);

  const [currentMiscItem, setCurrentMiscItem] = useState<MiscItem>({
    itemName: "",
    specifications: [{ parameter: "", specification: "" }],
  });

  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams(); // Hook to read URL params

  // Effect to handle URL parameters on page load
  useEffect(() => {
    const type = searchParams.get('type');
    const materialIds = searchParams.getAll('material');

    if (type === 'material' && materialIds.length > 0) {
      handleTypeSelection(PURCHASE_TYPES.MATERIALS);
      setInitialMaterialIds(materialIds);
    }
  }, [searchParams]);

  const handleTypeSelection = (type: string) => {
    setPurchaseType(type);
    setShowTypeSelection(false);
  };

  const addSpecification = () => {
    setCurrentMiscItem((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        { parameter: "", specification: "" },
      ],
    }));
  };

  const removeSpecification = (index: number) => {
    setCurrentMiscItem((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const updateSpecification = (
    index: number,
    field: keyof { parameter: string; specification: string },
    value: string
  ) => {
    setCurrentMiscItem((prev) => {
      const newSpecs = [...prev.specifications];
      newSpecs[index] = { ...newSpecs[index], [field]: value };
      return { ...prev, specifications: newSpecs };
    });
  };

  const updateMiscItem = (field: keyof MiscItem, value: string | any) => {
    setCurrentMiscItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMiscSubmit = async () => {
    if (!currentMiscItem.itemName) {
      setError("Item name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formattedSpecs = currentMiscItem.specifications.map((spec) => ({
        param: spec.parameter,
        specificationValue: spec.specification,
      }));

      const purchaseData = {
        purchaseRequestType: PURCHASE_TYPES.MISC,
        itemName: currentMiscItem.itemName,
        specifications: formattedSpecs,
        org_id: user?.organizationId || "",
      };

      const response = await PurchaseReqApis.createPurchaseRequirement(
        purchaseData
      );

      if (response.status === 200 || response.status === 201) {
        setSuccess("Misc purchase requirement created successfully!");
        setTimeout(() => {
          router.push("/dashboard/purchases");
        }, 2000);
      } else {
        throw new Error(
          response.data?.message || "Failed to create misc purchase requirement"
        );
      }
    } catch (error: any) {
      console.error("Error creating misc purchase:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating the misc purchase. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialsSubmit = async (data: {
    materials: Array<{ materialId: string; quantity: number }>;
  }) => {
    if (data.materials.length === 0) {
      setError("Please add at least one material");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const purchaseData = {
        purchaseRequestType: PURCHASE_TYPES.MATERIALS,
        materials: data.materials.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
        })),
        org_id: user?.organizationId || "",
      };

      const response = await PurchaseReqApis.createPurchaseRequirement(
        purchaseData
      );

      if (response.status === 200 || response.status === 201) {
        setSuccess("Material purchase requirement created successfully!");
        setTimeout(() => {
          router.push("/dashboard/purchases");
        }, 2000);
      } else {
        throw new Error(
          response.data?.message ||
            "Failed to create material purchase requirement"
        );
      }
    } catch (error: any) {
      console.error("Error creating material purchase:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating the material purchase. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMachinerySubmit = async (machineryData: MachineryFormData) => {
    setLoading(true);
    setError("");

    try {
      const machineryResponse = await MachineryApis.createMachinery({
        ...machineryData,
        org_id: user?.organizationId || "",
      });

      if (
        machineryResponse.status !== 200 &&
        machineryResponse.status !== 201
      ) {
        throw new Error(
          machineryResponse.data?.message || "Failed to create machinery record"
        );
      }

      const machineryId = machineryResponse.data.machinery._id;

      if (!machineryId) {
        throw new Error("No machinery ID returned from server");
      }

      const purchaseData = {
        purchaseRequestType: PURCHASE_TYPES.MACHINERY,
        machineryId,
        org_id: user?.organizationId || "",
      };

      const purchaseResponse = await PurchaseReqApis.createPurchaseRequirement(
        purchaseData
      );

      if (purchaseResponse.status === 200 || purchaseResponse.status === 201) {
        setSuccess("Machinery purchase requirement created successfully!");
        setTimeout(() => {
          router.push("/dashboard/purchases");
        }, 2000);
      } else {
        throw new Error(
          purchaseResponse.data?.message ||
            "Failed to create machinery purchase requirement"
        );
      }
    } catch (error: any) {
      console.error("Error creating machinery purchase:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating the machinery purchase. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (showTypeSelection) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          What would you like to purchase?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(PURCHASE_TYPES).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeSelection(type)}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all"
            >
              <div className="w-16 h-16 flex items-center justify-center bg-blue-100 rounded-full mb-3">
                {type === PURCHASE_TYPES.MATERIALS && (
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                    />
                  </svg>
                )}
                {type === PURCHASE_TYPES.MACHINERY && (
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
                {type === PURCHASE_TYPES.MISC && (
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                )}
              </div>
              <span className="text-lg font-medium text-gray-800">{type}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {purchaseType} Purchase Request
          </h2>
          <button
            type="button"
            onClick={() => setShowTypeSelection(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
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
                d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
              />
            </svg>
            Change Type
          </button>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
      </div>

      {purchaseType === PURCHASE_TYPES.MACHINERY && (
        <MachineryForm onSubmit={handleMachinerySubmit} loading={loading} />
      )}

      {purchaseType === PURCHASE_TYPES.MATERIALS && (
        <MaterialsForm
          onSubmit={handleMaterialsSubmit}
          loading={loading}
          initialMaterialIds={initialMaterialIds}
        />
      )}

      {purchaseType === PURCHASE_TYPES.MISC && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium mb-3 text-gray-700">
            Item Details
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Item Name*
            </label>
            <input
              type="text"
              value={currentMiscItem.itemName}
              onChange={(e) => updateMiscItem("itemName", e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Specifications
            </label>

            {currentMiscItem.specifications.map((spec, idx) => (
              <div key={idx} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Parameter"
                  value={spec.parameter}
                  onChange={(e) =>
                    updateSpecification(idx, "parameter", e.target.value)
                  }
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Specification"
                  value={spec.specification}
                  onChange={(e) =>
                    updateSpecification(idx, "specification", e.target.value)
                  }
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => removeSpecification(idx)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <svg
                      className="w-5 h-5"
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
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addSpecification}
              className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
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
              Add Specification
            </button>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="button"
              variant="primary"
              onClick={handleMiscSubmit}
              disabled={loading || !currentMiscItem.itemName}
              className="min-w-32"
            >
              {loading ? "Submitting..." : "Submit Purchase Request"}
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-700 font-medium">
              Processing request...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePurchaseForm;