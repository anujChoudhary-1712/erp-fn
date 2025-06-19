"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EditGoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goodData: {
    id: string;
    current_stock: number;
    unit_price: number;
  }) => void;
  isLoading: boolean;
  good?: {
    _id: string;
    product_name: string;
    current_stock: number;
    unit_price: number;
    unit: string;
  } | null;
}

const EditGoodModal: React.FC<EditGoodModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  good,
}) => {
  const [formData, setFormData] = useState({
    current_stock: 0,
    unit_price: 0,
  });

  const [errors, setErrors] = useState<{
    current_stock?: string;
    unit_price?: string;
  }>({});

  // Update form data when good changes
  useEffect(() => {
    if (good) {
      setFormData({
        current_stock: good.current_stock,
        unit_price: good.unit_price,
      });
    }
  }, [good]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert to number for numeric fields
    const numericValue = parseFloat(value) || 0;
    
    setFormData((prev) => ({
      ...prev,
      [name]: numericValue,
    }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {
      current_stock?: string;
      unit_price?: string;
    } = {};
    let isValid = true;

    if (formData.current_stock < 0) {
      newErrors.current_stock = "Stock cannot be negative";
      isValid = false;
    }

    if (formData.unit_price <= 0) {
      newErrors.unit_price = "Price must be greater than 0";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && good) {
      onSubmit({
        id: good._id,
        current_stock: formData.current_stock,
        unit_price: formData.unit_price,
      });
    }
  };

  if (!isOpen || !good) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Edit Product</h3>
            <p className="text-sm text-gray-600 mt-1">{good.product_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Current Stock */}
            <div>
              <label htmlFor="current_stock" className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock ({good.unit}s) *
              </label>
              <input
                type="number"
                id="current_stock"
                name="current_stock"
                value={formData.current_stock}
                onChange={handleChange}
                min="0"
                step="1"
                className={`w-full px-3 py-2 border ${
                  errors.current_stock ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter current stock quantity"
              />
              {errors.current_stock && (
                <p className="mt-1 text-sm text-red-600">{errors.current_stock}</p>
              )}
            </div>

            {/* Unit Price */}
            <div>
              <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (per {good.unit}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="unit_price"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  className={`w-full pl-8 pr-3 py-2 border ${
                    errors.unit_price ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="0.00"
                />
              </div>
              {errors.unit_price && (
                <p className="mt-1 text-sm text-red-600">{errors.unit_price}</p>
              )}
            </div>

            {/* Current Values Display */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Values:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Stock:</span>
                  <span>{good.current_stock} {good.unit}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span>₹{good.unit_price.toFixed(2)} per {good.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  Updating...
                </div>
              ) : (
                "Update Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoodModal;