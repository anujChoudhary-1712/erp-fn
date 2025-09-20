"use client";
import React, { useState, useEffect } from "react";
import PurchaseReqApis from "@/actions/Apis/PurchaseReqApis";
import { formatDate } from "@/utils/date";

// Define the necessary interfaces for the data
interface Misc {
  _id: string;
  itemName: string;
}

interface Purchase {
  _id: string;
  PurchaseRequest_id: string;
  purchaseRequestType: "Material" | "Machinery" | "Misc";
  misc_id?: Misc;
  status: string;
  createdAt: string;
}

const GeneralInventoryPage: React.FC = () => {
  const [generalItems, setGeneralItems] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeneralItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await PurchaseReqApis.getAllPurchases();
        if (res.status === 200) {
          const allPurchases = res.data?.requirements || [];

          // Filter for 'Misc' type and 'Purchase Received' status
          const filteredItems = allPurchases.filter(
            (purchase: Purchase) =>
              purchase.purchaseRequestType === "Misc" &&
              purchase.status === "Purchase Received"
          );

          setGeneralItems(filteredItems);
        } else {
          setError("Failed to fetch purchase requirements.");
        }
      } catch (err) {
        console.error("Error fetching general items:", err);
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralItems();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
        General Inventory
      </h1>
      {generalItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No miscellaneous items found with a &apos;Purchase Received&apos; status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generalItems.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.misc_id?.itemName || "Untitled Item"}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Request ID:</span> {item.PurchaseRequest_id}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Received Date:</span> {formatDate(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneralInventoryPage;