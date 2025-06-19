/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Package, Archive, TrendingUp, PieChart, ArrowRight } from 'lucide-react';

const InventoryPage = () => {
  const router = useRouter();

  // Stats for the dashboard (can be replaced with actual data)
  const stats = [
    { label: 'Total Products', value: '87', icon: <Package className="h-5 w-5 text-blue-500" /> },
    { label: 'Raw Materials', value: '124', icon: <Archive className="h-5 w-5 text-green-500" /> },
    { label: 'Low Stock Items', value: '12', icon: <TrendingUp className="h-5 w-5 text-amber-500" /> },
    { label: 'Total Value', value: '$45,250', icon: <PieChart className="h-5 w-5 text-purple-500" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your finished goods and raw materials</p>
        </div>

        {/* Stats Overview */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center"
            >
              <div className="bg-gray-50 p-3 rounded-lg mr-4">
                {stat.icon}
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-gray-900 text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div> */}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Finished Goods Card */}
          <div 
            onClick={() => router.push('/dashboard/inventory/finished-goods')}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">Finished Goods</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Manage your ready-to-sell products, update inventory levels, prices, and monitor stock status.
              </p>
              
              <div className="mt-auto flex items-center text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                View Finished Goods
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Raw Materials Card */}
          {/* <div 
            onClick={() => router.push('/dashboard/inventory/raw-materials')}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Archive className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">Raw Materials</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Track raw materials, manage suppliers, monitor consumption, and set reorder points for production.
              </p>
              
              <div className="mt-auto flex items-center text-green-600 font-medium group-hover:text-green-800 transition-colors">
                View Raw Materials
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div> */}
        </div>

        {/* Quick Actions */}
        {/* <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/dashboard/inventory/finished-goods/create')}
              className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
            >
              <Package className="h-5 w-5 mr-2" />
              Add New Product
            </button>
            <button 
              onClick={() => router.push('/dashboard/inventory/raw-materials/create')}
              className="flex items-center justify-center p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
            >
              <Archive className="h-5 w-5 mr-2" />
              Add Raw Material
            </button>
            <button 
              onClick={() => router.push('/dashboard/inventory/stock-adjustment')}
              className="flex items-center justify-center p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Stock Adjustment
            </button>
            <button 
              onClick={() => router.push('/dashboard/inventory/reports')}
              className="flex items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
            >
              <PieChart className="h-5 w-5 mr-2" />
              Inventory Reports
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default InventoryPage;