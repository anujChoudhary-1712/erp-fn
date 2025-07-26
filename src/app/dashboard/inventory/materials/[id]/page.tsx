"use client";
import RawMaterialApis from "@/actions/Apis/RawMaterialApis";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/order";
import { formatDate } from "@/utils/date";

// TypeScript interfaces
interface Dimension {
  type: string;
  value: number;
  unit: string;
}

interface VerificationParameter {
  parameter: string;
  specificationValue: string;
  _id: string;
}

interface Product {
  _id: string;
  product_name: string;
}

interface RawMaterial {
  _id: string;
  material_name: string;
  description: string;
  category: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  stock_used: number;
  trigger_value: number;
  verificationParameters: VerificationParameter[];
  hasDimensions: boolean;
  dimensions: Dimension[];
  total_area?: number;
  usage_area?: number;
  product_id: Product;
  created_at: string;
  updated_at: string;
}

// Edit Material Modal Props
interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<RawMaterial>) => void;
  material: RawMaterial;
  isLoading: boolean;
}

const SingleMaterialPage = ({ params }: { params: { id: string } }) => {
  const [material, setMaterial] = useState<RawMaterial | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] =
    useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const router = useRouter();

  // Fetch material details
  const fetchMaterial = async () => {
    setLoading(true);
    try {
      const res = await RawMaterialApis.getSingleRawMaterial(params.id);
      if (res.status === 200) {
        setMaterial(res.data);
      } else {
        throw new Error("Failed to fetch material details");
      }
    } catch (error) {
      console.error("Error fetching material:", error);
      setError("Failed to load material details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterial();
  }, [params.id]);

  // Handle material update
  const handleUpdate = async (data: Partial<RawMaterial>) => {
    setIsUpdating(true);
    try {
      const res = await RawMaterialApis.updateRawMaterial(params.id, data);
      if (res.status === 200) {
        await fetchMaterial();
        setIsEditModalOpen(false);
      } else {
        throw new Error("Failed to update material");
      }
    } catch (error) {
      console.error("Error updating material:", error);
      setError("Failed to update material. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle material deletion
  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const res = await RawMaterialApis.deleteRawMaterial(params.id);
      if (res.status === 200) {
        router.push("/dashboard/inventory/materials");
      } else {
        throw new Error("Failed to delete material");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      setError("Failed to delete material. Please try again.");
    } finally {
      setIsUpdating(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  // Get dimension display label
  const getDimensionLabel = (type: string) => {
    switch (type) {
      case "stock_length":
        return "Length";
      case "stock_width":
        return "Width";
      case "usage_length":
        return "Usage Length";
      case "usage_width":
        return "Usage Width";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error || "Material not found"}
          </h3>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Navigation */}
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
                {material.material_name}
              </h1>
              <p className="text-gray-600 mt-1 capitalize">
                {material.category} material
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Material Details
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    material.current_stock > material.trigger_value
                      ? "bg-green-100 text-green-800"
                      : material.current_stock > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {material.current_stock > material.trigger_value
                    ? "In Stock"
                    : material.current_stock > 0
                    ? "Low Stock"
                    : "Out of Stock"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Material Name
                  </h3>
                  <p className="text-lg font-medium text-gray-900">
                    {material.material_name}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Category
                  </h3>
                  <p className="text-lg font-medium text-gray-900 capitalize">
                    {material.category}
                  </p>
                </div>

                {material.description && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Description
                    </h3>
                    <p className="text-gray-700">{material.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Unit Cost
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(material.unit_cost)}
                  </p>
                  <p className="text-sm text-gray-500">per {material.unit}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Current Stock
                  </h3>
                  <p className="text-lg font-medium text-gray-900">
                    {material.current_stock} {material.unit}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Alert Threshold
                  </h3>
                  <p className="text-lg font-medium text-gray-900">
                    {material.trigger_value} {material.unit}
                  </p>
                </div>

                {material.product_id && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Used In Product
                    </h3>
                    <p className="text-lg font-medium text-gray-900">
                      {material.product_id.product_name}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Stock Used per Product
                  </h3>
                  <p className="text-lg font-medium text-gray-900">
                    {material.stock_used} {material.unit}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Created Date
                  </h3>
                  <p className="text-gray-700">
                    {formatDate(material.created_at)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Last Updated
                  </h3>
                  <p className="text-gray-700">
                    {formatDate(material.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Dimensional Information */}
            {material.hasDimensions && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Dimensional Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stock Dimensions */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h3 className="text-md font-medium text-green-900 mb-3">
                      Stock Dimensions
                    </h3>
                    <div className="space-y-3">
                      {material.dimensions
                        .filter((d) => d.type.startsWith("stock_"))
                        .map((dim, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-green-800 font-medium">
                              {getDimensionLabel(dim.type)}:
                            </span>
                            <span className="text-green-900">
                              {dim.value} {dim.unit}
                            </span>
                          </div>
                        ))}

                      {material.total_area && (
                        <div className="flex justify-between pt-2 border-t border-green-200">
                          <span className="text-green-800 font-medium">
                            Total Area:
                          </span>
                          <span className="text-green-900 font-bold">
                            {material.total_area} {material.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Usage Dimensions */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-md font-medium text-blue-900 mb-3">
                      Usage per Product
                    </h3>
                    <div className="space-y-3">
                      {material.dimensions
                        .filter((d) => d.type.startsWith("usage_"))
                        .map((dim, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-blue-800 font-medium">
                              {getDimensionLabel(dim.type)}:
                            </span>
                            <span className="text-blue-900">
                              {dim.value} {dim.unit}
                            </span>
                          </div>
                        ))}

                      {material.usage_area && (
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="text-blue-800 font-medium">
                            Usage Area:
                          </span>
                          <span className="text-blue-900 font-bold">
                            {material.usage_area} {material.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Parameters */}
            {material.verificationParameters &&
              material.verificationParameters.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Quality Verification Parameters
                  </h2>

                  <div className="overflow-hidden bg-gray-50 border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Parameter
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Specification Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {material.verificationParameters.map((param, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {param.parameter}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {param.specificationValue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Material
                </button>

                <button
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="w-full px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-md border border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Material
                </button>
              </div>
            </div>

            {/* Stock Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Stock Status
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Current Stock Level
                  </h3>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {material.current_stock}
                    </span>
                    <span className="ml-1 text-gray-600">{material.unit}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Alert Threshold
                  </h3>
                  <div className="flex items-center">
                    <span className="text-xl font-medium text-gray-800">
                      {material.trigger_value}
                    </span>
                    <span className="ml-1 text-gray-600">{material.unit}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Stock Level
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        material.current_stock > material.trigger_value * 2
                          ? "bg-green-600"
                          : material.current_stock > material.trigger_value
                          ? "bg-green-500"
                          : material.current_stock > 0
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (material.current_stock /
                            (material.trigger_value * 2)) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 text-right">
                    {material.current_stock > material.trigger_value
                      ? "Healthy stock level"
                      : material.current_stock > 0
                      ? "Low stock, consider ordering more"
                      : "Out of stock!"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-medium">{material.material_name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
                disabled={isUpdating}
              >
                {isUpdating ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {isEditModalOpen && material && (
        <EditMaterialModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdate}
          material={material}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

// Edit Material Modal Component
const EditMaterialModal: React.FC<EditMaterialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  material,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    material_name: "",
    description: "",
    category: "",
    unit: "",
    current_stock: 0,
    unit_cost: 0,
    trigger_value: 0,
  });

  // Unit options based on dimensional status
  const unitOptions = material.hasDimensions
    ? [
        { value: "square_meter", label: "Square Meter" },
        { value: "square_feet", label: "Square Feet" },
      ]
    : [
        { value: "meter", label: "Meter" },
        { value: "kg", label: "Kilogram" },
        { value: "liter", label: "Liter" },
        { value: "piece", label: "Piece" },
        { value: "box", label: "Box" },
        { value: "roll", label: "Roll" },
        { value: "yard", label: "Yard" },
        { value: "gram", label: "Gram" },
      ];

  // Category options
  const categoryOptions = [
    { value: "fabric", label: "Fabric" },
    { value: "thread", label: "Thread" },
    { value: "button", label: "Button" },
    { value: "zipper", label: "Zipper" },
    { value: "accessory", label: "Accessory" },
    { value: "hardware", label: "Hardware" },
    { value: "packaging", label: "Packaging" },
    { value: "other", label: "Other" },
  ];

  // Initialize form data when material changes
  useEffect(() => {
    if (material) {
      setFormData({
        material_name: material.material_name,
        description: material.description || "",
        category: material.category,
        unit: material.unit,
        current_stock: material.current_stock,
        unit_cost: material.unit_cost,
        trigger_value: material.trigger_value,
      });
    }
  }, [material]);

  // Handle input changes
  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Edit Material</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isLoading}
          >
            <svg
              className="h-6 w-6"
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

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Material Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.material_name}
                  onChange={(e) =>
                    handleChange("material_name", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit selection - only if not dimensional */}
              {!material.hasDimensions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {unitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) =>
                      handleChange(
                        "current_stock",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-300 rounded-r-md">
                    {formData.unit}
                  </span>
                </div>
              </div>

              {/* Unit Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="px-3 py-2 bg-gray-100 text-gray-700 border border-r-0 border-gray-300 rounded-l-md">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.unit_cost}
                    onChange={(e) =>
                      handleChange("unit_cost", parseFloat(e.target.value) || 0)
                    }
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Per {formData.unit}
                </p>
              </div>

              {/* Alert Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Threshold <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={formData.trigger_value}
                    onChange={(e) =>
                      handleChange(
                        "trigger_value",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-300 rounded-r-md">
                    {formData.unit}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  You will be notified when stock falls below this level
                </p>
              </div>

              {/* Dimensional note - if material is dimensional */}
              {material.hasDimensions && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Dimensional Material
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        This is a dimensional material. Stock calculations are
                        based on dimensions and area. To modify dimensions,
                        please use the Create Material form.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SingleMaterialPage;
