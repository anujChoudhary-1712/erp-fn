"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import CategoryApis from "@/actions/Apis/CategoryApis";

// Interfaces for the raw material data structure
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

interface Category {
  _id: string;
  type: string;
  items: string[];
}

// Props interface for the component
interface CreateRawMaterialFormProps {
  productId: string;
  materials: RawMaterialData[];
  setMaterials: React.Dispatch<React.SetStateAction<RawMaterialData[]>>;
  loading: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  success: string;
  setSuccess: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  onBack: () => void;
}

const CreateRawMaterialForm: React.FC<CreateRawMaterialFormProps> = ({
  productId,
  materials,
  setMaterials,
  loading,
  setError,
  setSuccess,
  onSubmit,
  onBack,
}) => {
  // Local state for the current material being added
  const [currentMaterial, setCurrentMaterial] = useState<RawMaterialData>({
    material_name: "",
    category: "",
    description: "",
    unit: "meter",
    current_stock: 0,
    unit_cost: 0,
    product_id: productId,
    stock_used: 0,
    trigger_value: 0,
    verificationParameters: [],
    hasDimensions: false,
    dimensions: [],
  });
  
  // New state to hold the value of the "Other" category input
  const [otherCategoryValue, setOtherCategoryValue] = useState("");
  const [rawMaterialCategories, setRawMaterialCategories] = useState<string[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(true);


  // Temporary states for adding single items
  const [tempParameter, setTempParameter] = useState<VerificationParameter>({
    parameter: "",
    specificationValue: "",
  });
  const [tempDimension, setTempDimension] = useState<Dimension>({
    type: "stock_length",
    value: 0,
    unit: "meter",
  });

  // Effect to update product_id when it changes from the parent
  useEffect(() => {
    setCurrentMaterial((prev) => ({ ...prev, product_id: productId }));
  }, [productId]);

  // Effect to fetch categories
 useEffect(() => {
  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await CategoryApis.getAllCategories();
      if (res.status === 200) {
        // Look for category with type "Raw Material" (not "Raw Material Category")
        const rawMaterialCategory = res.data.categories.find(
          (cat: Category) => cat.type === "Raw Material"
        );
        
        if (rawMaterialCategory && rawMaterialCategory.items.length > 0) {
          // Set categories with fetched items plus "other" at the end
          setRawMaterialCategories([...rawMaterialCategory.items, "other"]);
        } else {
          // If no raw material category exists or it's empty, just show "other"
          setRawMaterialCategories(["other"]);
        }
      } else {
        // Fallback to just "other" if API call fails
        setRawMaterialCategories(["other"]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      // Fallback to just "other" on error
      setRawMaterialCategories(["other"]);
    } finally {
      setIsCategoriesLoading(false);
    }
  };
  fetchCategories();
}, []);

  // Function to calculate area when length and width dimensions are present
  const calculateArea = (
    dimensions: Dimension[]
  ): { stockArea: number; usageArea: number } => {
    let stockLength = 0;
    let stockWidth = 0;
    let usageLength = 0;
    let usageWidth = 0;

    dimensions.forEach((dim) => {
      if (dim.type === "stock_length") stockLength = dim.value;
      if (dim.type === "stock_width") stockWidth = dim.value;
      if (dim.type === "usage_length") usageLength = dim.value;
      if (dim.type === "usage_width") usageWidth = dim.value;
    });

    const stockArea =
      stockLength > 0 && stockWidth > 0 ? stockLength * stockWidth : 0;
    const usageArea =
      usageLength > 0 && usageWidth > 0 ? usageLength * usageWidth : 0;

    return { stockArea, usageArea };
  };

  // Handle material input changes
  const handleMaterialChange = (
    field: keyof RawMaterialData,
    value: any
  ): void => {
    if (field === "category" && value !== "other") {
      setOtherCategoryValue(""); // Clear other category value if a regular category is selected
    }

    if (typeof value === "string" && !isNaN(Number(value))) {
      const numericFields = [
        "current_stock",
        "unit_cost",
        "stock_used",
        "trigger_value",
      ];
      if (numericFields.includes(field as string)) {
        value = Number(value);
      }
    }

    setCurrentMaterial((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle adding verification parameter
  const handleAddVerificationParameter = (): void => {
    if (
      !tempParameter.parameter.trim() ||
      !tempParameter.specificationValue.trim()
    ) {
      setError("Both parameter and specification value are required");
      return;
    }
    setCurrentMaterial((prev) => ({
      ...prev,
      verificationParameters: [...prev.verificationParameters, { ...tempParameter }],
    }));
    setTempParameter({ parameter: "", specificationValue: "" });
    setError("");
  };

  // Handle removing verification parameter
  const handleRemoveVerificationParameter = (index: number): void => {
    setCurrentMaterial((prev) => ({
      ...prev,
      verificationParameters: prev.verificationParameters.filter((_, i) => i !== index),
    }));
  };

  // Handle adding a new dimension
  const handleAddDimension = (): void => {
    if (!tempDimension.type.trim() || tempDimension.value <= 0) {
      setError("Dimension type and value are required");
      return;
    }

    setCurrentMaterial((prev) => {
      const newDimensions = [...prev.dimensions, { ...tempDimension }];
      const { stockArea, usageArea } = calculateArea(newDimensions);

      const updatedMaterial = { ...prev, dimensions: newDimensions };
      if (stockArea > 0) {
        updatedMaterial.total_area = stockArea;
        updatedMaterial.current_stock = stockArea;
      }
      if (usageArea > 0) {
        updatedMaterial.usage_area = usageArea;
        updatedMaterial.stock_used = usageArea;
      }
      return updatedMaterial;
    });

    setTempDimension({ type: "stock_length", value: 0, unit: "meter" });
    setError("");
  };

  // Handle removing a dimension
  const handleRemoveDimension = (index: number): void => {
    setCurrentMaterial((prev) => {
      const newDimensions = prev.dimensions.filter((_, i) => i !== index);
      const { stockArea, usageArea } = calculateArea(newDimensions);

      const updatedMaterial = { ...prev, dimensions: newDimensions };
      if (stockArea > 0) {
        updatedMaterial.total_area = stockArea;
        updatedMaterial.current_stock = stockArea;
      } else if (prev.hasDimensions) {
        updatedMaterial.total_area = 0;
        if (prev.total_area === prev.current_stock) {
          updatedMaterial.current_stock = 0;
        }
      }
      if (usageArea > 0) {
        updatedMaterial.usage_area = usageArea;
        updatedMaterial.stock_used = usageArea;
      } else if (prev.hasDimensions) {
        updatedMaterial.usage_area = 0;
        if (prev.usage_area === prev.stock_used) {
          updatedMaterial.stock_used = 0;
        }
      }
      return updatedMaterial;
    });
  };

  // Add the current material to the list
  const handleAddMaterial = (): void => {
    // Basic validation
    if (
      !currentMaterial.material_name.trim() ||
      currentMaterial.unit_cost <= 0 ||
      currentMaterial.stock_used <= 0
    ) {
      setError("Please fill out all required fields and ensure costs/stock are positive.");
      return;
    }
    
    let finalCategory = currentMaterial.category;
    if (currentMaterial.category === "other") {
      if (!otherCategoryValue.trim()) {
        setError("Please specify the custom category name.");
        return;
      }
      finalCategory = otherCategoryValue.trim();
    }
    
    if (!finalCategory) {
      setError("A category is required.");
      return;
    }

    setMaterials((prev) => [...prev, { ...currentMaterial, category: finalCategory }]);
    
    // Reset form for the next material
    setCurrentMaterial({
      material_name: "",
      category: "",
      description: "",
      unit: "meter",
      current_stock: 0,
      unit_cost: 0,
      product_id: productId,
      stock_used: 0,
      trigger_value: 0,
      verificationParameters: [],
      hasDimensions: false,
      dimensions: [],
    });
    setTempParameter({ parameter: "", specificationValue: "" });
    setTempDimension({ type: "stock_length", value: 0, unit: "meter" });
    setOtherCategoryValue(""); // Reset the custom category value
    setError("");
    setSuccess("Material added to the list");
  };

  // Remove a material from the list
  const handleRemoveMaterial = (index: number): void => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Add Raw Material
        </h3>
        {/* Section 1: Basic Information */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
            1. Basic Information
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Material Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Material Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={currentMaterial.material_name}
                  onChange={(e) => handleMaterialChange("material_name", e.target.value)}
                  placeholder="Enter material name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Category <span className="text-red-500 ml-1">*</span>
                </label>
                {isCategoriesLoading ? (
                  <p className="text-gray-500">Loading categories...</p>
                ) : (
                  <select
                    value={currentMaterial.category}
                    onChange={(e) => handleMaterialChange("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    {rawMaterialCategories.map((category, index) => (
                      <option key={index} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                )}
                {currentMaterial.category === "other" && (
                  <input
                    type="text"
                    value={otherCategoryValue}
                    onChange={(e) => setOtherCategoryValue(e.target.value)}
                    placeholder="Enter custom category name"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                )}
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Description
              </label>
              <textarea
                value={currentMaterial.description}
                onChange={(e) => handleMaterialChange("description", e.target.value)}
                placeholder="Enter material description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Verification Report */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
            2. Verification Report
          </h4>
          <div className="space-y-4">
            {/* Add Verification Parameter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Parameter
                </label>
                <input
                  type="text"
                  value={tempParameter.parameter}
                  onChange={(e) =>
                    setTempParameter((prev) => ({ ...prev, parameter: e.target.value }))
                  }
                  placeholder="e.g., Tensile Strength"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Specification Value
                </label>
                <input
                  type="text"
                  value={tempParameter.specificationValue}
                  onChange={(e) =>
                    setTempParameter((prev) => ({
                      ...prev,
                      specificationValue: e.target.value,
                    }))
                  }
                  placeholder="e.g., 500 N/mm²"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddVerificationParameter}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Parameter
                </button>
              </div>
            </div>
            {/* Display Verification Parameters */}
            {currentMaterial.verificationParameters.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  Added Parameters ({currentMaterial.verificationParameters.length})
                </h5>
                <div className="space-y-2">
                  {currentMaterial.verificationParameters.map((param, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white p-3 rounded border"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{param.parameter}:</span>{" "}
                        <span className="text-gray-700">{param.specificationValue}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVerificationParameter(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Stock Information & Dimensions */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
            3. Stock Information & Dimensions
          </h4>
          <div className="space-y-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">
                Stock Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Unit <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={currentMaterial.unit}
                    onChange={(e) => handleMaterialChange("unit", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {!currentMaterial.hasDimensions ? (
                      <>
                        <option value="meter">Meter</option>
                        <option value="kg">Kilogram</option>
                        <option value="liter">Liter</option>
                        <option value="piece">Piece</option>
                        <option value="box">Box</option>
                        <option value="roll">Roll</option>
                        <option value="yard">Yard</option>
                        <option value="gram">Gram</option>
                      </>
                    ) : (
                      <>
                        <option value="square_meter">Square Meter</option>
                        <option value="square_feet">Square Feet</option>
                      </>
                    )}
                  </select>
                </div>
                {/* Current Stock */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {currentMaterial.hasDimensions ? "Current Total Area" : "Current Stock"}{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    value={currentMaterial.current_stock}
                    onChange={(e) => handleMaterialChange("current_stock", e.target.value)}
                    placeholder="0"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      currentMaterial.hasDimensions &&
                      currentMaterial.total_area !== undefined
                        ? "bg-gray-100"
                        : ""
                    }`}
                    min="0"
                    step="0.01"
                    readOnly={currentMaterial.hasDimensions && currentMaterial.total_area !== undefined}
                  />
                </div>
                {/* Unit Cost */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Unit Cost <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    value={currentMaterial.unit_cost}
                    onChange={(e) => handleMaterialChange("unit_cost", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                {/* Stock Used */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {currentMaterial.hasDimensions ? "Area Used per Product" : "Stock Used per Unit"}{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    value={currentMaterial.stock_used}
                    onChange={(e) => handleMaterialChange("stock_used", e.target.value)}
                    placeholder="0"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      currentMaterial.hasDimensions &&
                      currentMaterial.usage_area !== undefined
                        ? "bg-gray-100"
                        : ""
                    }`}
                    min="0"
                    step="0.01"
                    readOnly={currentMaterial.hasDimensions && currentMaterial.usage_area !== undefined}
                  />
                </div>
                {/* Trigger Value */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {currentMaterial.hasDimensions ? "Minimum Area Alert" : "Alert Stock Value"}{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    value={currentMaterial.trigger_value}
                    onChange={(e) => handleMaterialChange("trigger_value", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions Section */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="hasDimensions"
                  checked={currentMaterial.hasDimensions}
                  onChange={(e) => {
                    handleMaterialChange("hasDimensions", e.target.checked);
                    if (e.target.checked && currentMaterial.unit !== "square_meter" && currentMaterial.unit !== "square_feet") {
                      handleMaterialChange("unit", "square_meter");
                    } else if (!e.target.checked && (currentMaterial.unit === "square_meter" || currentMaterial.unit === "square_feet")) {
                      handleMaterialChange("unit", "meter");
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="hasDimensions"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  This material needs to be tracked by area (fabric, sheets, etc.)
                </label>
              </div>

              {currentMaterial.hasDimensions && (
                <div className="space-y-4">
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                    <p>
                      Adding stock dimensions (length and width) will automatically calculate the total area. Similarly, adding usage dimensions will calculate the area used per product.
                    </p>
                  </div>

                  {/* Add Dimension */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Dimension Type
                      </label>
                      <select
                        value={tempDimension.type}
                        onChange={(e) =>
                          setTempDimension((prev) => ({ ...prev, type: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <optgroup label="Stock Dimensions">
                          <option value="stock_length">Stock Length</option>
                          <option value="stock_width">Stock Width</option>
                        </optgroup>
                        <optgroup label="Usage Dimensions">
                          <option value="usage_length">Usage Length per Product</option>
                          <option value="usage_width">Usage Width per Product</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Value
                      </label>
                      <input
                        type="number"
                        value={tempDimension.value}
                        onChange={(e) =>
                          setTempDimension((prev) => ({
                            ...prev,
                            value: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Unit
                      </label>
                      <select
                        value={tempDimension.unit}
                        onChange={(e) =>
                          setTempDimension((prev) => ({ ...prev, unit: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="meter">Meter</option>
                        <option value="centimeter">Centimeter</option>
                        <option value="millimeter">Millimeter</option>
                        <option value="inch">Inch</option>
                        <option value="feet">Feet</option>
                        <option value="yard">Yard</option>
                        <option value="square_meter">Square Meter</option>
                        <option value="square_feet">Square Feet</option>
                      </select>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddDimension}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        Add Dimension
                      </button>
                    </div>
                  </div>

                  {/* Display Dimensions */}
                  {currentMaterial.dimensions.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h6 className="text-sm font-medium text-gray-700 mb-3">
                        Material Dimensions ({currentMaterial.dimensions.length})
                      </h6>
                      <div className="grid grid-cols-1 gap-4">
                        {currentMaterial.dimensions.some((d) => d.type.startsWith("stock_")) && (
                          <div className="border-l-4 border-green-500 pl-3">
                            <h6 className="text-sm font-medium text-gray-700 mb-2">
                              Stock Dimensions
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {currentMaterial.dimensions
                                .filter((d) => d.type.startsWith("stock_"))
                                .map((dimension, dimIndex) => (
                                  <div
                                    key={dimIndex}
                                    className="flex justify-between items-center bg-white p-3 rounded border"
                                  >
                                    <div>
                                      <span className="font-medium text-gray-900 capitalize">
                                        {dimension.type === "stock_length" ? "Length" : "Width"}:
                                      </span>{" "}
                                      <span className="text-gray-700">
                                        {dimension.value} {dimension.unit}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDimension(dimIndex)}
                                      className="text-red-600 hover:text-red-800 text-sm ml-2"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                            </div>
                            {currentMaterial.total_area !== undefined &&
                              currentMaterial.total_area > 0 && (
                                <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                  <span className="font-medium">Calculated Total Area:</span>{" "}
                                  {currentMaterial.total_area.toFixed(2)}{" "}
                                  {currentMaterial.unit}
                                </div>
                              )}
                          </div>
                        )}

                        {currentMaterial.dimensions.some((d) => d.type.startsWith("usage_")) && (
                          <div className="border-l-4 border-blue-500 pl-3">
                            <h6 className="text-sm font-medium text-gray-700 mb-2">
                              Usage Dimensions (per product)
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {currentMaterial.dimensions
                                .filter((d) => d.type.startsWith("usage_"))
                                .map((dimension, dimIndex) => (
                                  <div
                                    key={dimIndex}
                                    className="flex justify-between items-center bg-white p-3 rounded border"
                                  >
                                    <div>
                                      <span className="font-medium text-gray-900 capitalize">
                                        {dimension.type === "usage_length" ? "Length" : "Width"}:
                                      </span>{" "}
                                      <span className="text-gray-700">
                                        {dimension.value} {dimension.unit}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDimension(dimIndex)}
                                      className="text-red-600 hover:text-red-800 text-sm ml-2"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                            </div>
                            {currentMaterial.usage_area !== undefined &&
                              currentMaterial.usage_area > 0 && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                  <span className="font-medium">Area per Product:</span>{" "}
                                  {currentMaterial.usage_area.toFixed(2)}{" "}
                                  {currentMaterial.unit}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Material Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddMaterial}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Add Material to List
          </button>
        </div>
      </div>

      {/* Materials List - Enhanced Display */}
      {materials.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Added Materials ({materials.length})
          </h3>
          <div className="space-y-4">
            {materials.map((material, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {material.material_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Category: <span className="capitalize">{material.category}</span>
                    </p>
                    {material.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {material.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(index)}
                    className="text-red-600 hover:text-red-900 px-3 py-1 border border-red-300 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {material.verificationParameters.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Verification Parameters:
                      </h5>
                      <div className="space-y-1">
                        {material.verificationParameters.map((param, paramIndex) => (
                          <div key={paramIndex} className="text-xs bg-blue-50 p-2 rounded">
                            <span className="font-medium">{param.parameter}:</span>{" "}
                            {param.specificationValue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Stock Details:
                    </h5>
                    <div className="text-xs bg-green-50 p-2 rounded space-y-1">
                      <div>
                        <span className="font-medium">Current Stock:</span>{" "}
                        {material.current_stock} {material.unit}
                      </div>
                      <div>
                        <span className="font-medium">Unit Cost:</span> ₹{material.unit_cost}
                      </div>
                      <div>
                        <span className="font-medium">Usage per Unit:</span>{" "}
                        {material.stock_used} {material.unit}
                      </div>
                      <div>
                        <span className="font-medium">Alert Level:</span>{" "}
                        {material.trigger_value} {material.unit}
                      </div>
                    </div>
                  </div>

                  {material.hasDimensions && material.dimensions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Dimensions:
                      </h5>
                      <div className="space-y-2">
                        {material.dimensions.some((d) => d.type.startsWith("stock_")) && (
                          <div className="text-xs bg-green-50 p-2 rounded mb-2">
                            <div className="font-medium mb-1">Stock Dimensions:</div>
                            {material.dimensions
                              .filter((d) => d.type.startsWith("stock_"))
                              .map((dim, dimIndex) => (
                                <div key={dimIndex}>
                                  <span className="capitalize">
                                    {dim.type === "stock_length" ? "Length" : "Width"}:
                                  </span>{" "}
                                  {dim.value} {dim.unit}
                                </div>
                              ))}
                            {material.total_area && (
                              <div className="mt-1 font-medium">
                                Total Area: {material.total_area.toFixed(2)}{" "}
                                {material.unit}
                              </div>
                            )}
                          </div>
                        )}
                        {material.dimensions.some((d) => d.type.startsWith("usage_")) && (
                          <div className="text-xs bg-blue-50 p-2 rounded">
                            <div className="font-medium mb-1">Usage per Product:</div>
                            {material.dimensions
                              .filter((d) => d.type.startsWith("usage_"))
                              .map((dim, dimIndex) => (
                                <div key={dimIndex}>
                                  <span className="capitalize">
                                    {dim.type === "usage_length" ? "Length" : "Width"}:
                                  </span>{" "}
                                  {dim.value} {dim.unit}
                                </div>
                              ))}
                            {material.usage_area && (
                              <div className="mt-1 font-medium">
                                Area per Product: {material.usage_area.toFixed(2)}{" "}
                                {material.unit}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
          onClick={onSubmit}
          disabled={materials.length === 0 || loading}
          className={`px-4 py-2 ${
            materials.length === 0
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          {loading ? "Submitting..." : "Submit Materials & Continue"}
        </button>
      </div>
    </div>
  );
};

export default CreateRawMaterialForm;