/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Package, Archive, Wrench, Warehouse, ArrowRight } from 'lucide-react';

const InventoryPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your finished goods, raw materials, machinery, and general supplies.</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                Manage ready-to-sell products, update inventory levels, prices, and monitor stock status.
              </p>
              <div className="mt-auto flex items-center text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                View Finished Goods
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Raw Materials Card */}
          <div
            onClick={() => router.push('/dashboard/inventory/materials')}
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
                Track raw materials, manage suppliers, monitor consumption, and set reorder points.
              </p>
              <div className="mt-auto flex items-center text-green-600 font-medium group-hover:text-green-800 transition-colors">
                View Raw Materials
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Machinery Card */}
          <div
            onClick={() => router.push('/dashboard/inventory/machinery')}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Wrench className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">Machinery</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Keep an inventory of all your production machinery, tools, and equipment for maintenance.
              </p>
              <div className="mt-auto flex items-center text-purple-600 font-medium group-hover:text-purple-800 transition-colors">
                View Machinery
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* General Supplies Card */}
          <div
            onClick={() => router.push('/dashboard/inventory/general')}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Warehouse className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">General Supplies</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Manage general supplies, office consumables, and miscellaneous items not used in production.
              </p>
              <div className="mt-auto flex items-center text-amber-600 font-medium group-hover:text-amber-800 transition-colors">
                View General Supplies
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;