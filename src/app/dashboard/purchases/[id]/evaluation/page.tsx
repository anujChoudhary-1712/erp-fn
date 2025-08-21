/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import PurchaseReqApis from "@/actions/Apis/PurchaseReqApis";
import VendorApis from "@/actions/Apis/VendorApis";
import Button from "@/components/ReusableComponents/Button";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// TypeScript interfaces
interface Vendor {
  _id: string;
  company_name: string;
  status: string;
  state: string;
  city: string;
  contact_person: string;
  approved_for: string;
}

interface VerificationParameter {
  parameter: string;
  specificationValue: string;
  _id: string;
}

interface Material {
  materialId: {
    _id: string;
    material_name: string;
    verificationParameters: VerificationParameter[];
    [key: string]: any;
  };
  quantity: number;
}

interface SpecificationAvailability {
  param: string;
  specification: string;
  available: boolean;
}

interface MaterialObservability {
  materialId: string;
  param: string;
  specification: string;
  observedValue: string;
}

interface VendorEvaluation {
  vendorId:
    | string
    | {
        _id: string;
        company_name: string;
        [key: string]: any;
      };
  name: string;
  price: number;
  isRecommended: boolean;
  isSelected?: boolean;
  // For Misc type
  availabilities?: SpecificationAvailability[];
  // For Material type
  observabilities?: MaterialObservability[];
  // Old availability field for backward compatibility
  availability?: boolean;
}

interface MiscSpecification {
  param: string;
  specificationValue: string;
}

const VendorEvaluationPage = ({ params }: { params: { id: string } }) => {
  const searchParams = useSearchParams();
  const isSelectionMode = searchParams.get("selection") === "required";

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<VendorEvaluation[]>(
    []
  );
  const [currentVendor, setCurrentVendor] = useState<VendorEvaluation>({
    vendorId: "",
    name: "",
    price: 0,
    isRecommended: false,
    availabilities: [], // For Misc type
    observabilities: [], // For Material type
  });

  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [miscSpecs, setMiscSpecs] = useState<MiscSpecification[]>([]); // State for misc specifications
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // For vendor selection mode
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] =
    useState<string>("");

  const router = useRouter();

  // Get min date for estimated delivery (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Handle specification availability change for Misc type
  const handleSpecificationAvailabilityChange = (
    param: string,
    specification: string,
    available: boolean
  ) => {
    const updatedAvailabilities = [...(currentVendor.availabilities || [])];
    const existingSpecIndex = updatedAvailabilities.findIndex(
      (av) => av.param === param && av.specification === specification
    );

    if (existingSpecIndex > -1) {
      updatedAvailabilities[existingSpecIndex].available = available;
    } else {
      updatedAvailabilities.push({ param, specification, available });
    }

    setCurrentVendor({
      ...currentVendor,
      availabilities: updatedAvailabilities,
    });
  };

  // Handle material observability change for Material type
  const handleMaterialObservabilityChange = (
    materialId: string,
    param: string,
    specification: string,
    observedValue: string
  ) => {
    const updatedObservabilities = [...(currentVendor.observabilities || [])];
    const existingObsIndex = updatedObservabilities.findIndex(
      (obs) => 
        obs.materialId === materialId && 
        obs.param === param && 
        obs.specification === specification
    );

    if (existingObsIndex > -1) {
      updatedObservabilities[existingObsIndex].observedValue = observedValue;
    } else {
      updatedObservabilities.push({ 
        materialId, 
        param, 
        specification, 
        observedValue 
      });
    }

    setCurrentVendor({
      ...currentVendor,
      observabilities: updatedObservabilities,
    });
  };

  // Fetch vendors and purchase details
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch purchase details
        const purchaseRes = await PurchaseReqApis.getSinglePurchase(params.id);
        let requiredCategory = "";
        if (purchaseRes.status === 200) {
          const requirement = purchaseRes.data.requirement;
          setPurchaseDetails(requirement);

          requiredCategory =
            requirement.purchaseRequestType === "Misc"
              ? "miscellaneous"
              : requirement.purchaseRequestType.toLowerCase();

          // If it's a Misc type, get specifications
          if (
            requirement.purchaseRequestType === "Misc" &&
            requirement.misc_id?.specifications
          ) {
            setMiscSpecs(requirement.misc_id.specifications);
          }

          // If vendors were already evaluated, load them
          if (
            requirement.vendorsEvaluated &&
            requirement.vendorsEvaluated.length > 0
          ) {
            // Format the vendorsEvaluated data for our state
            const formattedVendors = requirement.vendorsEvaluated.map(
              (vendor: any) => {
                const vendorIdValue =
                  typeof vendor.vendorId === "object"
                    ? vendor.vendorId._id
                    : vendor.vendorId;

                return {
                  vendorId: vendorIdValue,
                  name: vendor.name,
                  // Handle all field types
                  availability: vendor.availability,
                  availabilities: vendor.availabilities,
                  observabilities: vendor.observabilities,
                  price: vendor.price,
                  isRecommended: vendor.isRecommended,
                  isSelected: vendor.isSelected || false,
                  vendorObj:
                    typeof vendor.vendorId === "object"
                      ? vendor.vendorId
                      : null,
                };
              }
            );

            setSelectedVendors(formattedVendors);

            // Set recommended vendor as selected by default in selection mode
            if (isSelectionMode) {
              const recommendedVendor = formattedVendors.find(
                (v: { isRecommended: any }) => v.isRecommended
              );
              if (recommendedVendor) {
                setSelectedVendorId(recommendedVendor.vendorId as string);
              }
            }
          }
        } else {
          setError("Failed to fetch purchase details");
        }

        // Only fetch vendors if not in selection mode
        if (!isSelectionMode) {
          const vendorsRes = await VendorApis.getAllVendors();
          if (vendorsRes.status === 200) {
            // Filter vendors with "approved" status
            const approvedVendors = vendorsRes.data.filter(
              (vendor: Vendor) =>
                vendor.status.toLowerCase() === "approved" &&
                vendor.approved_for.toLowerCase() === requiredCategory
            );
            setVendors(approvedVendors);
          } else {
            setError("Failed to fetch vendors");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, isSelectionMode]);

  // Handle vendor selection
  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    if (!vendorId) return;

    const selectedVendor = vendors.find((v) => v._id === vendorId);
    if (selectedVendor) {
      let initialAvailabilities: SpecificationAvailability[] = [];
      let initialObservabilities: MaterialObservability[] = [];

      // For Misc type, initialize availabilities
      if (purchaseDetails?.purchaseRequestType === "Misc" && miscSpecs.length > 0) {
        initialAvailabilities = miscSpecs.map((s) => ({
          param: s.param,
          specification: s.specificationValue,
          available: true, // Default to available
        }));
      }
      
      // For Material type, initialize empty observabilities for each material parameter
      if (purchaseDetails?.purchaseRequestType === "Material" && 
          purchaseDetails.materials && 
          purchaseDetails.materials.length > 0) {
        // Each material may have multiple verification parameters
        initialObservabilities = purchaseDetails.materials.flatMap((material: Material) => {
          if (material.materialId.verificationParameters && 
              material.materialId.verificationParameters.length > 0) {
            return material.materialId.verificationParameters.map((param: VerificationParameter) => ({
              materialId: material.materialId._id,
              param: param.parameter,
              specification: param.specificationValue,
              observedValue: "", // Initialize with empty string
            }));
          }
          return [];
        });
      }

      setCurrentVendor({
        vendorId: selectedVendor._id,
        name: selectedVendor.company_name,
        price: 0,
        isRecommended: false,
        availabilities: initialAvailabilities,
        observabilities: initialObservabilities,
      });
    }
  };

  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0;
    setCurrentVendor({
      ...currentVendor,
      price: price,
    });
  };

  // Handle recommendation change
  const handleRecommendationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isRecommended = e.target.checked;

    setCurrentVendor({
      ...currentVendor,
      isRecommended,
    });
  };

  // Add vendor to the list
  const addVendor = () => {
    // Validate form
    if (!currentVendor.vendorId) {
      setError("Please select a vendor");
      return;
    }

    if (currentVendor.price <= 0) {
      setError("Please enter a valid price");
      return;
    }

    // Check if vendor already exists in the list
    if (selectedVendors.some((v) => v.vendorId === currentVendor.vendorId)) {
      setError("This vendor is already added to the evaluation list");
      return;
    }

    let updatedVendors = [...selectedVendors];

    // If current vendor is recommended, unset recommendation for all others
    if (currentVendor.isRecommended) {
      updatedVendors = updatedVendors.map((vendor) => ({
        ...vendor,
        isRecommended: false,
      }));
    }

    // Add the new vendor
    updatedVendors.push(currentVendor);
    setSelectedVendors(updatedVendors);

    // Reset current vendor form
    setCurrentVendor({
      vendorId: "",
      name: "",
      price: 0,
      isRecommended: false,
      availabilities: [], // Reset availabilities
      observabilities: [], // Reset observabilities
    });

    // Clear any error
    setError("");
  };

  // Remove vendor from the list
  const removeVendor = (index: number) => {
    const updatedVendors = [...selectedVendors];
    updatedVendors.splice(index, 1);
    setSelectedVendors(updatedVendors);
  };

  // Toggle recommendation for a vendor in the list
  const toggleRecommendation = (index: number) => {
    const updatedVendors = [...selectedVendors];

    // If toggling to recommended, unset recommendation for all others
    if (!updatedVendors[index].isRecommended) {
      updatedVendors.forEach((vendor, i) => {
        if (i !== index) {
          vendor.isRecommended = false;
        }
      });
      updatedVendors[index].isRecommended = true;
    } else {
      // If toggling off recommendation, just update that vendor
      updatedVendors[index].isRecommended = false;
    }

    setSelectedVendors(updatedVendors);
  };

  // Select a vendor (in selection mode)
  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
  };

  // Find material name by ID
  const getMaterialNameById = (materialId: string): string => {
    if (!purchaseDetails?.materials) return "Unknown Material";
    
    const material = purchaseDetails.materials.find(
      (m: any) => m.materialId._id === materialId
    );
    
    return material ? material.materialId.material_name : "Unknown Material";
  };

  // Submit vendor evaluations
  const handleVendorEvaluation = async () => {
    if (selectedVendors.length === 0) {
      setError("Please add at least one vendor to evaluate");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        vendors: selectedVendors.map((vendor) => {
          const baseVendor = {
            vendorId: vendor.vendorId,
            name: vendor.name,
            price: vendor.price,
            isRecommended: vendor.isRecommended,
          };

          // Add type-specific fields
          if (purchaseDetails?.purchaseRequestType === "Misc") {
            return {
              ...baseVendor,
              availabilities: vendor.availabilities,
            };
          } else if (purchaseDetails?.purchaseRequestType === "Material") {
            return {
              ...baseVendor,
              observabilities: vendor.observabilities,
            };
          }

          return baseVendor;
        }),
      };

      const res = await PurchaseReqApis.evaluateVendors(params.id, payload);

      if (res.status === 200) {
        setSuccess("Vendor evaluation submitted successfully");
        // Redirect after a delay
        setTimeout(() => {
          router.push(`/dashboard/purchases/${params.id}`);
        }, 2000);
      } else {
        setError("Failed to submit vendor evaluation");
      }
    } catch (error) {
      console.error("Error submitting vendor evaluation:", error);
      setError("An error occurred while submitting the evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit vendor selection
  const handleVendorSelection = async () => {
    if (!selectedVendorId) {
      setError("Please select a vendor");
      return;
    }

    if (!estimatedDeliveryDate) {
      setError("Please select an estimated delivery date");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        vendorId: selectedVendorId,
        estimatedDeliveryDate: new Date(estimatedDeliveryDate).toISOString(),
      };

      const res = await PurchaseReqApis.selectVendor(params.id, payload);

      if (res.status === 200) {
        setSuccess("Vendor selected successfully");
        // Redirect after a delay
        setTimeout(() => {
          router.push(`/dashboard/purchases/${params.id}`);
        }, 2000);
      } else {
        setError("Failed to select vendor");
      }
    } catch (error) {
      console.error("Error selecting vendor:", error);
      setError("An error occurred while selecting the vendor");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
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
                {isSelectionMode ? "Select Vendor" : "Vendor Evaluation"}
              </h1>
              <p className="text-gray-600 mt-1">
                {purchaseDetails?.purchaseRequestType} Purchase Requirement
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
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

        {/* Selection Mode UI */}
        {isSelectionMode ? (
          <div className="space-y-6">
            {/* Estimated Delivery Date */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Delivery Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Delivery Date{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={getMinDate()}
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Vendor Selection Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select a Vendor
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Select
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Vendor
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price (₹)
                      </th>
                      {purchaseDetails?.purchaseRequestType !== "Machinery" && (
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {purchaseDetails?.purchaseRequestType === "Misc"
                            ? "Specifications"
                            : purchaseDetails?.purchaseRequestType === "Material"
                            ? "Observations"
                            : "Availability"}
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Recommended
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedVendors.map((vendor, index) => (
                      <tr
                        key={index}
                        className={
                          selectedVendorId === vendor.vendorId
                            ? "bg-blue-50"
                            : ""
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="vendorSelection"
                              checked={selectedVendorId === vendor.vendorId}
                              onChange={() =>
                                handleVendorSelect(vendor.vendorId as string)
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vendor.price.toLocaleString()}
                          </div>
                        </td>
                        {purchaseDetails?.purchaseRequestType !== "Machinery" && (
                          <td className="px-6 py-4">
                            {purchaseDetails?.purchaseRequestType === "Misc" ? (
                              <div className="space-y-1">
                                {vendor.availabilities?.map((av, avIndex) => (
                                  <div key={avIndex} className="text-sm">
                                    <span className="font-medium">
                                      {av.param}:
                                    </span>{" "}
                                    {av.specification}
                                    <span
                                      className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        av.available
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {av.available ? "Yes" : "No"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : purchaseDetails?.purchaseRequestType === "Material" ? (
                              <div className="space-y-1">
                                {vendor.observabilities?.map((obs, obsIndex) => (
                                  <div key={obsIndex} className="text-sm">
                                    <span className="font-medium">
                                      {getMaterialNameById(obs.materialId)} - {obs.param}:
                                    </span>{" "}
                                    {obs.specification}
                                    <span className="ml-2 text-gray-700">
                                      Observed: {obs.observedValue || "N/A"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  vendor.availability
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {vendor.availability ? "Yes" : "No"}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {vendor.isRecommended ? (
                              <span className="text-green-600">
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={handleVendorSelection}
                disabled={
                  submitting || !selectedVendorId || !estimatedDeliveryDate
                }
                className="min-w-32"
              >
                {submitting ? "Processing..." : "Confirm Selection"}
              </Button>
            </div>
          </div>
        ) : (
          /* Evaluation Mode UI */
          <>
            {/* Add Vendor Form */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Add Vendor Evaluation
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Vendor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentVendor.vendorId as string}
                    onChange={handleVendorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option
                        key={vendor._id}
                        value={vendor._id}
                        disabled={selectedVendors.some(
                          (v) => v.vendorId === vendor._id
                        )}
                      >
                        {vendor.company_name} ({vendor.city}, {vendor.state})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={currentVendor.price || ""}
                    onChange={handlePriceChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter price"
                  />
                </div>
              </div>

              {/* Conditional rendering for type-specific inputs */}
              {purchaseDetails?.purchaseRequestType === "Misc" &&
                miscSpecs.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specification Availability
                    </label>
                    <div className="space-y-3">
                      {miscSpecs.map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="text-sm text-gray-800">
                            <span className="font-medium">{spec.param}:</span>{" "}
                            {spec.specificationValue}
                          </div>
                          <select
                            value={
                              currentVendor.availabilities?.find(
                                (av) =>
                                  av.param === spec.param &&
                                  av.specification === spec.specificationValue
                              )?.available
                                ? "yes"
                                : "no"
                            }
                            onChange={(e) =>
                              handleSpecificationAvailabilityChange(
                                spec.param,
                                spec.specificationValue,
                                e.target.value === "yes"
                              )
                            }
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="yes">Available</option>
                            <option value="no">Not Available</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Material Observability Form */}
              {purchaseDetails?.purchaseRequestType === "Material" &&
                purchaseDetails.materials &&
                purchaseDetails.materials.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Observations
                    </label>
                    <div className="space-y-6">
                      {purchaseDetails.materials.map((material: Material, materialIndex: number) => (
                        <div key={materialIndex} className="p-4 border border-gray-200 rounded-lg">
                          <h3 className="text-md font-medium text-gray-800 mb-2">
                            {material.materialId.material_name}
                          </h3>
                          
                          {material.materialId.verificationParameters && 
                           material.materialId.verificationParameters.length > 0 ? (
                            <div className="space-y-3">
                              {material.materialId.verificationParameters.map((param: VerificationParameter, paramIndex: number) => (
                                <div key={paramIndex} className="grid grid-cols-3 gap-4 items-center">
                                  <div className="col-span-1 text-sm text-gray-800">
                                    <span className="font-medium">{param.parameter}:</span>{" "}
                                    {param.specificationValue}
                                  </div>
                                  <div className="col-span-2">
                                    <input
                                      type="text"
                                      value={
                                        currentVendor.observabilities?.find(
                                          (obs) => 
                                            obs.materialId === material.materialId._id && 
                                            obs.param === param.parameter && 
                                            obs.specification === param.specificationValue
                                        )?.observedValue || ""
                                      }
                                      onChange={(e) => 
                                        handleMaterialObservabilityChange(
                                          material.materialId._id,
                                          param.parameter,
                                          param.specificationValue,
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="Enter observed value"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No verification parameters found</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Recommended */}
                <div className="flex items-center h-full">
                  <input
                    type="checkbox"
                    id="recommended"
                    checked={currentVendor.isRecommended}
                    onChange={handleRecommendationChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="recommended"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Recommended Vendor
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addVendor}
                  disabled={!currentVendor.vendorId || currentVendor.price <= 0}
                  className="px-4"
                >
                  Add Vendor
                </Button>
              </div>
            </div>

            {/* Vendor List */}
            {selectedVendors.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Vendor Evaluation List
                </h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Vendor
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Price (₹)
                        </th>
                        {purchaseDetails?.purchaseRequestType !== "Machinery" && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {purchaseDetails?.purchaseRequestType === "Misc"
                              ? "Specifications"
                              : purchaseDetails?.purchaseRequestType === "Material"
                              ? "Observations"  
                              : "Availability"}
                          </th>
                        )}
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Recommended
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedVendors.map((vendor, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {vendor.price.toLocaleString()}
                            </div>
                          </td>
                          {purchaseDetails?.purchaseRequestType !== "Machinery" && (
                            <td className="px-6 py-4">
                              {purchaseDetails?.purchaseRequestType === "Misc" ? (
                                <div className="space-y-1">
                                  {vendor.availabilities?.map((av, avIndex) => (
                                    <div key={avIndex} className="text-sm">
                                      <span className="font-medium">
                                        {av.param}:
                                      </span>{" "}
                                      {av.specification}
                                      <span
                                        className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          av.available
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {av.available ? "Yes" : "No"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : purchaseDetails?.purchaseRequestType === "Material" ? (
                                <div className="space-y-1">
                                  {vendor.observabilities?.map((obs, obsIndex) => (
                                    <div key={obsIndex} className="text-sm">
                                      <span className="font-medium">
                                        {getMaterialNameById(obs.materialId)} - {obs.param}:
                                      </span>{" "}
                                      {obs.specification}
                                      <span className="ml-2 text-gray-700">
                                        Observed: {obs.observedValue || "N/A"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    vendor.availability
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {vendor.availability ? "Yes" : "No"}
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={vendor.isRecommended}
                                onChange={() => toggleRecommendation(index)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => removeVendor(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={handleVendorEvaluation}
                disabled={submitting || selectedVendors.length === 0}
                className="min-w-32"
              >
                {submitting ? "Submitting..." : "Submit Evaluation"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorEvaluationPage;