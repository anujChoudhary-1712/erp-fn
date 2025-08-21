import React, { useState } from "react";
import InputField from "@/components/ReusableComponents/InputField";
import Button from "@/components/ReusableComponents/Button";

// TypeScript interface
export interface FinishedGoodData {
  product_name: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_price: number;
  trigger_value: number;
}

interface CreateGoodsFormProps {
  onSubmit: (data: FinishedGoodData) => Promise<void>;
  loading?: boolean;
}

const CreateGoodsForm: React.FC<CreateGoodsFormProps> = ({
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<FinishedGoodData>({
    product_name: "",
    description: "",
    unit: "piece",
    current_stock: 0,
    unit_price: 0,
    trigger_value: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Unit options for products
  const unitOptions = [
    { value: "piece", label: "Piece" },
    { value: "kg", label: "Kilogram" },
    { value: "liter", label: "Liter" },
    { value: "meter", label: "Meter" },
    { value: "box", label: "Box" },
    { value: "pack", label: "Pack" },
  ];

  // Update form field
const updateField = (
  field: keyof FinishedGoodData,
  value: string | number
): void => {
  let newValue = value;

  // Check if the field is a numeric type
  const numericFields = ["current_stock", "unit_price", "trigger_value"];
  if (numericFields.includes(field as string)) {
    if (value === "") {
      newValue = "";
    } else {
      newValue = Number(value);
    }
  }

  setFormData((prev) => ({
    ...prev,
    [field]: newValue,
  }));

  // Clear error for this field
  if (errors[field]) {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }
};

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate product name
    if (!formData.product_name.trim()) {
      newErrors.product_name = "Product name is required";
    }

    // Validate description (optional but if provided, should be meaningful)
    if (formData.description.trim() && formData.description.trim().length < 5) {
      newErrors.description =
        "Description should be at least 5 characters long";
    }

    // Validate current_stock
    if (formData.current_stock < 0) {
      newErrors.current_stock = "Current stock cannot be negative";
    }

    // Validate unit_price
    if (formData.unit_price <= 0) {
      newErrors.unit_price = "Unit price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
      {/* Product Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Product Information
        </h3>

        <div className="space-y-4">
          <InputField
            label="Product Name"
            value={formData.product_name}
            onChange={(e) => updateField("product_name", e.target.value)}
            placeholder="Enter product name"
            required
            error={errors.product_name}
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
              className={`w-full px-3 py-2 border ${
                errors.description ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Inventory Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Unit <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={formData.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <InputField
            label="Current Stock"
            type="number"
            value={formData.current_stock}
            onChange={(e) => updateField("current_stock", e.target.value)}
            placeholder="0"
            min="0"
            step="1"
            required
            error={errors.current_stock}
          />

          <InputField
            label="Unit Price"
            type="number"
            value={formData.unit_price}
            onChange={(e) => updateField("unit_price", e.target.value)}
            placeholder="0"
            min="0"
            step="1"
            required
            error={errors.unit_price}
          />

          <InputField
            label="Alert Value"
            type="number"
            value={formData.trigger_value}
            onChange={(e) => updateField("trigger_value", e.target.value)}
            placeholder="0"
            min="0"
            step="1"
            required
            error={errors.trigger_value}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="min-w-32"
        >
          {loading ? "Adding..." : "Add Product"}
        </Button>
      </div>
    </form>
  );
};

export default CreateGoodsForm;
