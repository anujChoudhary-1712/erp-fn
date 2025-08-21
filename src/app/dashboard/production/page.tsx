"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ReusableComponents/Button";
import ManufacturingBatchApis from "@/actions/Apis/BatchApis";

// TypeScript Interfaces
interface FinishedGood {
  product_name: string;
  unit: string;
}

interface Workflow {
  workflow_name: string;
}

interface ManufacturingBatch {
  _id: string;
  batch_number: string;
  finished_good_id: FinishedGood;
  workflow_id: Workflow;
  quantity_planned: number;
  quantity_produced: number;
  current_stage: {
    stage_name: string;
    status: string;
  };
  status: "Draft" | "In Progress" | "Completed" | "Rejected" | "On Hold";
  createdAt: string;
}

const ManufacturingBatchesPage: React.FC = () => {
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<ManufacturingBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const router = useRouter();

  // Debounce search to avoid too many API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      // Option 1: If API supports search
      const params = debouncedSearchTerm ? { batch_number: debouncedSearchTerm } : {};
      const response = await ManufacturingBatchApis.getAllManufacturingBatches(params);
      
      console.log("API Response:", response); // Debug log
      
      if (response.status === 200) {
        setBatches(response.data.batches || []);
        setFilteredBatches(response.data.batches || []);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      setBatches([]);
      setFilteredBatches([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  // Alternative: Client-side filtering if API doesn't support search
  const fetchAllBatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ManufacturingBatchApis.getAllManufacturingBatches({});
      
      console.log("API Response:", response); // Debug log
      
      if (response.status === 200) {
        const allBatches = response.data.batches || [];
        setBatches(allBatches);
        
        // Client-side filtering
        if (debouncedSearchTerm.trim()) {
          const filtered = allBatches.filter((batch: ManufacturingBatch) =>
            batch.batch_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            batch.finished_good_id?.product_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            batch.status.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
          setFilteredBatches(filtered);
        } else {
          setFilteredBatches(allBatches);
        }
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      setBatches([]);
      setFilteredBatches([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // Try server-side filtering first, fallback to client-side if needed
    fetchBatches();
    
    // If you want to use client-side filtering instead, uncomment the line below and comment out fetchBatches()
    // fetchAllBatches();
  }, [fetchBatches]);

  const handleViewDetails = (batchId: string) => {
    router.push(`/dashboard/production/${batchId}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const BatchCard: React.FC<{ batch: ManufacturingBatch }> = ({ batch }) => {
    const isCompleted = batch.status === "Completed" || batch.status === "Rejected";

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Batch #{batch.batch_number}
          </h3>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Product:</span>
            <span className="text-sm font-medium text-gray-900">
              {batch?.finished_good_id?.product_name || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              batch.status === 'Completed' ? 'bg-green-100 text-green-800' :
              batch.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
              batch.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
              batch.status === 'Rejected' ? 'bg-red-100 text-red-800' :
              batch.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {batch?.status}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Quantity:</span>
            <span className="text-sm font-medium text-gray-900">
              {batch?.quantity_planned} {batch?.finished_good_id?.unit || ''}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Stage:</span>
            <span className={`text-sm font-medium ${isCompleted ? 'text-gray-500' : 'text-blue-600'}`}>
              {isCompleted ? "N/A" : batch?.current_stage?.stage_name || 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2">
          <Button
            variant="outline"
            className="w-full text-sm"
            onClick={() => handleViewDetails(batch._id)}
          >
            View Batch Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Manufacturing Batches
        </h1>
      </div>

      {/* Search Input with Clear Button */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by batch number, product name, or status..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-600">
          {loading ? 'Searching...' : `Found ${filteredBatches.length} result(s) for "${searchTerm}"`}
        </div>
      )}

      <div className="min-h-96">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching batches found' : 'No manufacturing batches found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `Try adjusting your search term "${searchTerm}"`
                : 'Create a production plan and activate it to start a new batch.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <BatchCard key={batch._id} batch={batch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManufacturingBatchesPage;