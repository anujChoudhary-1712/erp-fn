import React, { useState, useEffect } from 'react';
import Button from '@/components/ReusableComponents/Button';
import RawMaterialApis from '@/actions/Apis/RawMaterialApis';

interface MaterialItem {
  materialId: string;
  materialName?: string; // For display purposes only
  quantity: number;
}

interface MaterialsFormProps {
  onSubmit: (data: { materials: MaterialItem[] }) => Promise<void>;
  loading?: boolean;
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

const MaterialsForm: React.FC<MaterialsFormProps> = ({ onSubmit, loading = false }) => {
  // Current material being added
  const [currentMaterial, setCurrentMaterial] = useState<MaterialItem>({
    materialId: '',
    materialName: '',
    quantity: 1
  });
  
  // List of materials added to the purchase request
  const [materialsList, setMaterialsList] = useState<MaterialItem[]>([]);
  
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch materials on component mount
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoadingMaterials(true);
      try {
        const response = await RawMaterialApis.getAllMaterials();
        if (response.status === 200) {
          setMaterials(response.data);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        setError('Failed to load materials. Please try again.');
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleMaterialChange = (materialId: string) => {
    const selectedMaterial = materials.find(m => m._id === materialId);
    setCurrentMaterial({
      materialId,
      materialName: selectedMaterial ? selectedMaterial.material_name : '',
      quantity: 1
    });
  };

  const handleQuantityChange = (quantity: number) => {
    setCurrentMaterial(prev => ({
      ...prev,
      quantity: quantity
    }));
  };

  const addMaterial = () => {
    if (!currentMaterial.materialId) {
      setError('Please select a material');
      return;
    }
    
    if (currentMaterial.quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }
    
    // Check if material already exists in the list
    const existingIndex = materialsList.findIndex(item => item.materialId === currentMaterial.materialId);
    
    if (existingIndex >= 0) {
      // Update quantity if material already exists
      const updatedList = [...materialsList];
      updatedList[existingIndex].quantity += currentMaterial.quantity;
      setMaterialsList(updatedList);
    } else {
      // Add new material to the list
      setMaterialsList(prev => [...prev, { ...currentMaterial }]);
    }
    
    // Reset current material
    setCurrentMaterial({
      materialId: '',
      materialName: '',
      quantity: 1
    });
    
    setError('');
  };

  const removeMaterial = (index: number) => {
    setMaterialsList(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (materialsList.length === 0) {
      setError('Please add at least one material');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await onSubmit({ 
          materials: materialsList.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity
          }))
        });
      } catch (error) {
        console.error('Error submitting material purchase:', error);
        setError('Failed to submit purchase request. Please try again.');
      }
    }
  };

  // Get material name by ID for display
  const getMaterialName = (materialId: string): string => {
    const material = materials.find(m => m._id === materialId);
    return material ? `${material.material_name} ${material.product_id?.product_name ? `(${material.product_id.product_name})` : ''}` : materialId;
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium mb-4 text-gray-700">Add Materials</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      {/* Materials list */}
      {materialsList.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2 text-gray-700">Added Materials</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            {materialsList.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 mb-2 border-b border-gray-200">
                <div>
                  <span className="font-medium">{getMaterialName(item.materialId)}</span>
                  <span className="ml-2 text-gray-600">Qty: {item.quantity}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add new material */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h4 className="text-md font-medium mb-3 text-gray-700">Add New Material</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Material selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Material <span className="text-red-500">*</span>
            </label>
            {loadingMaterials ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                <span>Loading materials...</span>
              </div>
            ) : (
              <select
                value={currentMaterial.materialId}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a material</option>
                {materials.map((material) => (
                  <option key={material._id} value={material._id}>
                    {material.material_name} {material.product_id?.product_name ? `(${material.product_id.product_name})` : ''} 
                    - Stock: {material.current_stock} {material.unit}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={currentMaterial.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quantity"
            />
          </div>
        </div>
        
        {/* Add button */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={addMaterial}
            disabled={loadingMaterials || !currentMaterial.materialId}
            className="px-4"
          >
            Add Material
          </Button>
        </div>
      </div>
      
      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || loadingMaterials || materialsList.length === 0}
          className="min-w-32"
        >
          {loading ? 'Submitting...' : 'Submit Purchase Request'}
        </Button>
      </div>
    </div>
  );
};

export default MaterialsForm;