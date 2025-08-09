"use client";
import RawMaterialApis from '@/actions/Apis/RawMaterialApis';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/order';
import { useRouter } from 'next/navigation';

// TypeScript interface for Raw Material
interface RawMaterial {
  _id: string;
  material_name: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  trigger_value: number;
  category: string;
  hasDimensions: boolean;
  total_area?: number;
  usage_area?: number;
  created_at: string;
}

const MaterialsPage = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const fetchAllMaterials = async() => {
    setLoading(true);
    try {
      const res = await RawMaterialApis.getAllMaterials();
      if(res.status === 200) {
        setMaterials(res.data);
      }
    } catch (error) {
      console.error("Error fetching materials", error);
      setError('Failed to load raw materials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMaterials();
  }, []);

  // Navigate to single material page
  const handleCardClick = (id: string) => {
    router.push(`/dashboard/inventory/materials/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Raw Materials Inventory</h1>
            <p className="text-gray-600 mt-1">Manage your raw material inventory</p>
          </div>
          <Link 
            href="/dashboard/inventory/materials/create" 
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Material
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* No Materials State */}
            {materials.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Materials Found</h3>
                <p className="text-gray-600 mb-6">You haven&apos;t added any raw materials to your inventory yet.</p>
                {/* <Link 
                  href="/dashboard/inventory/materials/create" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Your First Material
                </Link> */}
              </div>
            ) : (
              /* Materials Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((material) => (
                  <div 
                    key={material._id} 
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCardClick(material._id)}
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{material.material_name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{material.category}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          material.current_stock > material.trigger_value 
                            ? 'bg-green-100 text-green-800' 
                            : material.current_stock > 0 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {material.current_stock > material.trigger_value
                            ? 'In Stock' 
                            : material.current_stock > 0 
                              ? 'Low Stock' 
                              : 'Out of Stock'}
                        </span>
                      </div>
                      
                      {/* Price and Stock Display - Updated to match screenshot */}
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-gray-900">{formatCurrency(material.unit_cost)}</span>
                        <div className="text-sm text-gray-500 mt-1">per {material.unit}</div>
                        
                        <div className="mt-2 text-sm text-gray-600">
                          {material.current_stock} {material.unit}{material.unit !== 'square_meter' ? 's' : ''} available
                        </div>
                      </div>
                      
                      {/* Dimensional indicator */}
                      {/* {material.hasDimensions && (
                        <div className="mt-4 py-2 px-3 bg-purple-50 rounded-md text-sm">
                          <div className="flex items-center text-purple-700">
                            <span>Dimensional material</span>
                            {material.total_area && (
                              <span className="ml-2">
                                {material.total_area} {material.unit} total
                              </span>
                            )}
                          </div>
                        </div>
                      )} */}
                      
                      {/* View details button */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                        <button className="text-sm text-blue-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MaterialsPage;