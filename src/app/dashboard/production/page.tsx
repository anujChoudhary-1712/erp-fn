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
  const [allBatches, setAllBatches] = useState<ManufacturingBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<ManufacturingBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const router = useRouter();

  // Debounce search to avoid too many operations
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch all batches - no search params, pure frontend filtering
  const fetchAllBatches = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch all batches without any search parameters
      const response = await ManufacturingBatchApis.getAllManufacturingBatches({});
      
      console.log("API Response:", response); // Debug log
      
      if (response.status === 200) {
        const batches = response.data.batches || [];
        setAllBatches(batches);
        // Don't set filteredBatches here - let the filter effect handle it
      } else {
        console.error("API Error:", response);
        setAllBatches([]);
        setFilteredBatches([]);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      setAllBatches([]);
      setFilteredBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter batches based on search term - pure frontend filtering
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      // No search term - show all batches
      setFilteredBatches(allBatches);
      return;
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    const filtered = allBatches.filter((batch: ManufacturingBatch) => {
      // Safe access to nested properties with fallbacks
      const batchNumber = batch.batch_number?.toLowerCase() || '';
      const productName = batch.finished_good_id?.product_name?.toLowerCase() || '';
      const status = batch.status?.toLowerCase() || '';
      const currentStage = batch.current_stage?.stage_name?.toLowerCase() || '';
      const workflowName = batch.workflow_id?.workflow_name?.toLowerCase() || '';

      return (
        batchNumber.includes(searchLower) ||
        productName.includes(searchLower) ||
        status.includes(searchLower) ||
        currentStage.includes(searchLower) ||
        workflowName.includes(searchLower)
      );
    });

    setFilteredBatches(filtered);
  }, [allBatches, debouncedSearchTerm]);

  // Initial fetch - only runs once
  useEffect(() => {
    fetchAllBatches();
  }, []);

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
            <span className="text-sm text-gray-600">Workflow:</span>
            <span className="text-sm font-medium text-gray-900">
              {batch?.workflow_id?.workflow_name || 'N/A'}
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
        <div className="relative">
          <input
            type="text"
            placeholder="Search by batch number, product name, status, stage, or workflow..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {debouncedSearchTerm && (
        <div className="mb-4 text-sm text-gray-600">
          Found {filteredBatches.length} result(s) for &quot;{debouncedSearchTerm}&quot;
        </div>
      )}

      <div className="min-h-96">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading batches...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {debouncedSearchTerm ? 'No matching batches found' : 'No manufacturing batches found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {debouncedSearchTerm 
                  ? `No batches match your search for "${debouncedSearchTerm}". Try using different keywords or check your spelling.`
                  : 'Create a production plan and activate it to start a new batch.'
                }
              </p>
              {debouncedSearchTerm && (
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search and show all batches
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <BatchCard key={batch._id} batch={batch} />
            ))}
          </div>
        )}
      </div>

      {/* Summary info */}
      {!loading && allBatches.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          {debouncedSearchTerm 
            ? `Showing ${filteredBatches.length} of ${allBatches.length} total batches`
            : `Total: ${allBatches.length} batches`
          }
        </div>
      )}
    </div>
  );
};

export default ManufacturingBatchesPage;