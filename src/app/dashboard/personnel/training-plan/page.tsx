/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import TrainingPlanApis from "@/actions/Apis/TrainingPlanApis";
import Button from "@/components/ReusableComponents/Button";
import { useRouter } from "next/navigation";

// Utility function to format date strings
const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const TrainingPlanPage = () => {
  const router = useRouter();
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch training plans from the API
  const fetchTrainingPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await TrainingPlanApis.getAllTrainingPlans();
      if (res.status === 200) {
        setTrainingPlans(res.data.trainingPlans);
      } else {
        console.error("Failed to fetch training plans:", res.data);
        setError("Failed to fetch training plans.");
      }
    } catch (err) {
      console.error("Error fetching training plans:", err);
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for updating the training plan status
  const handleStatusUpdate = async (
    id: string,
    status: "approved" | "executed"
  ) => {
    try {
      const res = await TrainingPlanApis.updateTrainingPlanStatus(id, {
        status,
      });
      if (res.status === 200) {
        // Refresh the list after a successful update
        fetchTrainingPlans();
      } else {
        console.error(`Failed to update status to ${status}:`, res.data);
        setError(`Failed to update status to ${status}.`);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("An error occurred while updating the status.");
    }
  };

  const handleUpdate = (id: string) => {
    router.push(`/dashboard/personnel/training-plan/${id}?action=update`);
  };

  const handleExecute = (id: string) => {
    router.push(`/dashboard/personnel/training-plan/${id}?action=execute`);
  };

  useEffect(() => {
    fetchTrainingPlans();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading training plans...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          Training Plan
        </h1>
        <Button variant="primary" onClick={() => router.push("/dashboard/personnel/training-plan/create")}>
          + Add New Plan
        </Button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name of Training
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Department
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Start Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                End Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created By
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Approved By
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trainingPlans.length > 0 ? (
              trainingPlans.map((plan: any) => (
                <tr key={plan._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {plan.nameOfTraining}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plan.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(plan.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(plan.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plan.createdBy?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plan.approvedBy?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${
                                              plan.status === "approved"
                                                ? "bg-green-100 text-green-800"
                                                : plan.status === "executed"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                    >
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleUpdate(plan._id)}
                      >
                        Update
                      </Button>
                      {plan.status === "Pending" && (
                        <Button
                          variant="primary"
                          onClick={() =>
                            handleStatusUpdate(plan._id, "approved")
                          }
                        >
                          Approve
                        </Button>
                      )}
                      {plan.status === "approved" && (
                        <Button
                          variant="primary"
                          onClick={() => handleExecute(plan._id)}
                        >
                          Execute
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No training plans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainingPlanPage;
