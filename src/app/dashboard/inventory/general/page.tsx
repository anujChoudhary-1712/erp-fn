"use client";
import React, { useState, useEffect } from "react";
import PurchaseReqApis from "@/actions/Apis/PurchaseReqApis";
import { formatDate } from "@/utils/date";
import { useRouter } from "next/navigation";
import Button from "@/components/ReusableComponents/Button";

// Define the necessary interfaces for the data
interface Misc {
  _id: string;
  itemName: string;
}

interface TimelineEntry {
  status: string;
  date: string;
  by: string;
  user_name: string;
  user_email: string;
}

interface Purchase {
  _id: string;
  PurchaseRequest_id: string;
  purchaseRequestType: "Material" | "Machinery" | "Misc";
  misc_id?: Misc;
  status: string;
  createdAt: string;
  timeline: TimelineEntry[];
  purchaseReceived?: {
    receivedDate: string;
    receivedBy: string;
  };
}

const GeneralInventoryPage: React.FC = () => {
  const [generalItems, setGeneralItems] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGeneralItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await PurchaseReqApis.getAllPurchases();
        if (res.status === 200) {
          const allPurchases = res.data?.requirements || [];
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

  const getTimelineDetails = (timeline: TimelineEntry[], status: string) => {
    const entry = timeline.find(t => t.status === status);
    return entry ? { name: entry.user_name, date: entry.date } : null;
  };

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
          {generalItems.map((item) => {
            const requestedBy = getTimelineDetails(item.timeline, "Requested");
            const approvedBy = getTimelineDetails(item.timeline, "Request Approved");
            const receivedDate = item.purchaseReceived?.receivedDate;

            return (
              <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {item.misc_id?.itemName || "Untitled Item"}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {requestedBy && (
                    <div>
                      <span className="font-medium text-gray-900">Requested By:</span>{" "}
                      {requestedBy.name}
                    </div>
                  )}

                  {requestedBy && (
                    <div>
                      <span className="font-medium text-gray-900">Requested On:</span>{" "}
                      {formatDate(requestedBy.date)}
                    </div>
                  )}

                  {approvedBy && (
                    <div>
                      <span className="font-medium text-gray-900">Approved By:</span>{" "}
                      {approvedBy.name}
                    </div>
                  )}

                  {receivedDate && (
                    <div>
                      <span className="font-medium text-gray-900">Received Date:</span>{" "}
                      {formatDate(receivedDate)}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/dashboard/inventory/general/${item._id}`)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GeneralInventoryPage;