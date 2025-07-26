/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import InputField from '@/components/ReusableComponents/InputField';
import Button from '@/components/ReusableComponents/Button';
import RawMaterialApis from '@/actions/Apis/RawMaterialApis';
import VendorApis from '@/actions/Apis/VendorApis';
import { getCookie } from '@/actions/CookieUtils';

// TypeScript interfaces
interface PurchaseItem {
  materialId: string;
  materialName: string;
  unit: string;
  unitCost: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  notes: string;
  // New fields for vendor evaluation
  criticality: string;
  expected_days: number;
}

interface Document {
  documentId: string;
  file?: File;
  description: string;
}

interface PurchaseFormData {
  materials: PurchaseItem[];
  estimatedDate: string;
  instructions: string;
  documents: Document[];
}

interface RawMaterial {
  _id: string;
  material_name: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  product_id: {
    _id: string;
    product_name: string;
  };
}

interface Vendor {
  _id: string;
  company_name: string;
  company_address: string;
  mobile_no: string;
  mail: string;
}

interface CreatePurchaseFormProps {
  onSubmit: (data: PurchaseFormData) => Promise<void>;
  loading?: boolean;
}

const CreatePurchaseForm: React.FC<CreatePurchaseFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<PurchaseFormData>({
    estimatedDate: '',
    instructions: '',
    materials: [
      {
        materialId: '',
        materialName: '',
        unit: '',
        unitCost: 0,
        quantity: 1,
        vendorId: '',
        vendorName: '',
        notes: '',
        criticality: 'Regular', // Default criticality
        expected_days: 7, // Default expected days
      }
    ],
    documents: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [uploadingDocs, setUploadingDocs] = useState<boolean>(false);

  // Fetch materials and vendors on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [materialsResponse, vendorsResponse] = await Promise.all([
          RawMaterialApis.getAllMaterials(),
          VendorApis.getAllVendors()
        ]);

        if (materialsResponse.status === 200) {
          setMaterials(materialsResponse.data);
        }
        if (vendorsResponse.status === 200) {
          setVendors(vendorsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Update purchase item
  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: string | number): void => {
    const updatedItems = [...formData.materials];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // If materialId is changing, update materialName, unit, and unitCost
    if (field === 'materialId') {
      const selectedMaterial = materials.find(m => m._id === value);
      if (selectedMaterial) {
        updatedItems[index].materialName = selectedMaterial.material_name;
        updatedItems[index].unit = selectedMaterial.unit;
        updatedItems[index].unitCost = selectedMaterial.unit_cost;
      }
    }

    // If vendorId is changing, update vendorName
    if (field === 'vendorId') {
      const selectedVendor = vendors.find(v => v._id === value);
      if (selectedVendor) {
        updatedItems[index].vendorName = selectedVendor.company_name; // Changed from name to company_name
      }
    }

    setFormData(prev => ({
      ...prev,
      materials: updatedItems,
    }));

    // Clear error for this field
    if (errors[`materials.${index}.${field}`]) {
      setErrors(prev => ({ ...prev, [`materials.${index}.${field}`]: '' }));
    }
  };

  // Add new purchase item
  const addPurchaseItem = (): void => {
    setFormData(prev => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          materialId: '',
          materialName: '',
          unit: '',
          unitCost: 0,
          quantity: 1,
          vendorId: '',
          vendorName: '',
          notes: '',
          criticality: 'Regular', // Default criticality
          expected_days: 7, // Default expected days
        }
      ]
    }));
  };

  // Remove purchase item
  const removePurchaseItem = (index: number): void => {
    if (formData.materials.length > 1) {
      const updatedItems = formData.materials.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        materials: updatedItems,
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File, description: string): Promise<string | null> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("description", description);

    try {
      const token = getCookie("token");
      const response = await fetch(
        "http://localhost:8001/api/documents/upload",
        {
          method: "POST",
          body: formDataUpload,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status !== 201) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      return data.documentId || data._id; // Adjust based on your API response
    } catch (error) {
      console.error("Error uploading document:", error);
      return null;
    }
  };

  // Add document
  const addDocument = async (file: File, description: string): Promise<void> => {
    if (!file || !description.trim()) {
      setErrors(prev => ({ ...prev, document: 'Please select a file and provide description' }));
      return;
    }

    setUploadingDocs(true);
    try {
      const documentId = await handleFileUpload(file, description);
      if (documentId) {
        setFormData(prev => ({
          ...prev,
          documents: [
            ...prev.documents,
            {
              documentId,
              file,
              description,
            }
          ]
        }));
        setErrors(prev => ({ ...prev, document: '' }));
      } else {
        setErrors(prev => ({ ...prev, document: 'Failed to upload document' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, document: 'Error uploading document' }));
    } finally {
      setUploadingDocs(false);
    }
  };

  // Remove document
  const removeDocument = (index: number): void => {
    const updatedDocuments = formData.documents.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      documents: updatedDocuments,
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Date validation
    if (!formData.estimatedDate) {
      newErrors['estimatedDate'] = 'Estimated date is required';
    } else if (new Date(formData.estimatedDate) <= new Date()) {
      newErrors['estimatedDate'] = 'Estimated date must be in the future';
    }

    // Materials validation
    formData.materials.forEach((item, index) => {
      if (!item.materialId) {
        newErrors[`materials.${index}.materialId`] = 'Please select a material';
      }
      if (!item.vendorId) {
        newErrors[`materials.${index}.vendorId`] = 'Please select a vendor';
      }
      if (item.quantity <= 0) {
        newErrors[`materials.${index}.quantity`] = 'Quantity must be greater than 0';
      }
      if (item.expected_days <= 0) {
        newErrors[`materials.${index}.expected_days`] = 'Expected days must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (validateForm()) {
      // Format data for API
      const submitData: PurchaseFormData = {
        ...formData,
        materials: formData.materials.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          vendorId: item.vendorId,
          notes: item.notes,
          criticality: item.criticality,
          expected_days: item.expected_days,
          // Remove display fields
          materialName: item.materialName,
          unit: item.unit,
          unitCost: item.unitCost,
          vendorName: item.vendorName,
        }))
      };
      
      await onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Purchase Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Requirement Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <InputField
            label="Estimated Delivery Date"
            type="date"
            value={formData.estimatedDate}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDate: e.target.value }))}
            required
            error={errors['estimatedDate']}
          />
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Special Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Enter any special instructions for the purchase"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Materials Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Materials Required</h3>
          <Button
            type="button"
            variant="outline"
            onClick={addPurchaseItem}
            className="text-sm"
          >
            + Add Material
          </Button>
        </div>

        {loadingData ? (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading materials and vendors...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.materials.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-800">Material {index + 1}</h4>
                  {formData.materials.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removePurchaseItem(index)}
                      className="text-xs px-2 py-1"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Material Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Material <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={item.materialId}
                      onChange={(e) => updatePurchaseItem(index, 'materialId', e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        errors[`materials.${index}.materialId`] ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      required
                    >
                      <option value="">Select a material</option>
                      {materials.map((material) => (
                        <option key={material._id} value={material._id}>
                          {material.material_name} ({material.product_id?.product_name || 'No product'})
                        </option>
                      ))}
                    </select>
                    {errors[`materials.${index}.materialId`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`materials.${index}.materialId`]}</p>
                    )}
                  </div>

                  {/* Vendor Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Vendor <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={item.vendorId}
                      onChange={(e) => updatePurchaseItem(index, 'vendorId', e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        errors[`materials.${index}.vendorId`] ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      required
                    >
                      <option value="">Select a vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.company_name}
                        </option>
                      ))}
                    </select>
                    {errors[`materials.${index}.vendorId`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`materials.${index}.vendorId`]}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <InputField
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="1"
                      min="1"
                      required
                      error={errors[`materials.${index}.quantity`]}
                    />
                  </div>

                  {/* Criticality Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Criticality <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={item.criticality}
                      onChange={(e) => updatePurchaseItem(index, 'criticality', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Critical">Critical</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Regular">Regular</option>
                    </select>
                  </div>

                  {/* Expected Days */}
                  <div>
                    <InputField
                      label="Expected Delivery Days"
                      type="number"
                      value={item.expected_days}
                      onChange={(e) => updatePurchaseItem(index, 'expected_days', parseInt(e.target.value) || 0)}
                      placeholder="7"
                      min="1"
                      required
                      error={errors[`materials.${index}.expected_days`]}
                    />
                  </div>

                  {/* Notes */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Notes
                    </label>
                    <textarea
                      value={item.notes}
                      onChange={(e) => updatePurchaseItem(index, 'notes', e.target.value)}
                      placeholder="Additional notes for this material"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
        
        {/* Upload Document */}
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-md font-medium text-gray-800 mb-3">Upload Document</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Document File
              </label>
              <input
                type="file"
                id="documentFile"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
            <div>
              <InputField
                label="Description"
                placeholder="Document description"
                id="documentDescription"
              />
            </div>
          </div>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              disabled={uploadingDocs}
              onClick={() => {
                const fileInput = document.getElementById('documentFile') as HTMLInputElement;
                const descInput = document.getElementById('documentDescription') as HTMLInputElement;
                
                if (fileInput.files?.[0] && descInput.value.trim()) {
                  addDocument(fileInput.files[0], descInput.value.trim());
                  fileInput.value = '';
                  descInput.value = '';
                }
              }}
              className="text-sm"
            >
              {uploadingDocs ? 'Uploading...' : 'Upload Document'}
            </Button>
            {errors['document'] && (
              <p className="mt-1 text-sm text-red-600">{errors['document']}</p>
            )}
          </div>
        </div>

        {/* Document List */}
        {formData.documents.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Uploaded Documents</h4>
            <div className="space-y-2">
              {formData.documents.map((doc, index) => (
                <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{doc.description}</span>
                    <span className="text-xs text-gray-500 ml-2">({doc.file?.name})</span>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => removeDocument(index)}
                    className="text-xs px-2 py-1"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
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
          disabled={loading || uploadingDocs}
          className="min-w-32"
        >
          {loading ? 'Creating...' : 'Create Purchase Requirement'}
        </Button>
      </div>
    </form>
  );
};

export default CreatePurchaseForm;