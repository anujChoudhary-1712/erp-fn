"use client";
import GoodsApis from '@/actions/Apis/GoodsApis';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/order';
import { formatDate } from '@/utils/date';

// TypeScript interface for Finished Good
interface FinishedGood {
  _id: string;
  product_name: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_price: number;
  org_id: string;
  createdAt: string;
  updatedAt: string;
}

const FinishedGoodsPage = () => {
  const [goods, setGoods] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchAllGoods = async() => {
    setLoading(true);
    try {
      const res = await GoodsApis.getAllGoods();
      if(res.status === 200) {
        setGoods(res.data);
      }
    } catch (error) {
      console.log("Error fetching goods", error);
      setError('Failed to load finished goods. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllGoods();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finished Goods Inventory</h1>
            <p className="text-gray-600 mt-1">Manage your product inventory</p>
          </div>
          <Link 
            href="/dashboard/inventory/finished-goods/create" 
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Product
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
            {/* No Products State */}
            {goods.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-6">You haven&apos;t added any finished goods to your inventory yet.</p>
                <Link 
                  href="/dashboard/inventory/finished-goods/create" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Your First Product
                </Link>
              </div>
            ) : (
              /* Products Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goods.map((product) => (
                  <div 
                    key={product._id} 
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{product.product_name}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.current_stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.current_stock > 0 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {product.current_stock > 10 
                            ? 'In Stock' 
                            : product.current_stock > 0 
                              ? 'Low Stock' 
                              : 'Out of Stock'}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                        {product.description || "No description provided."}
                      </p>
                      
                      {/* Price and Unit */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold text-gray-900">{formatCurrency(product.unit_price)}</span>
                          <span className="ml-1 text-sm text-gray-500">/{product.unit}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.current_stock} {product.unit}{product.current_stock !== 1 ? 's' : ''} available
                        </div>
                      </div>
                      
                      {/* Created Date */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          Added on {formatDate(product.createdAt)}
                        </div>
                        <button 
                          onClick={() => {
                            if(window.confirm(`Are you sure you want to delete "${product.product_name}"?`)) {
                              GoodsApis.deleteFinishedGood(product._id)
                                .then(res => {
                                  if(res.status === 200) {
                                    // Remove deleted product from state
                                    setGoods(prevGoods => prevGoods.filter(item => item._id !== product._id));
                                  }
                                })
                                .catch(err => {
                                  console.error("Error deleting product:", err);
                                  alert("Failed to delete product. Please try again.");
                                });
                            }
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          aria-label="Delete product"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

export default FinishedGoodsPage;