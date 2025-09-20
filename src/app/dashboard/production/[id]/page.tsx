"use client";
import React, { useState, useEffect, useRef, forwardRef } from "react";
import { useRouter } from "next/navigation";
import ManufacturingBatchApis from "@/actions/Apis/BatchApis";
import Button from "@/components/ReusableComponents/Button";
import { formatDate } from "@/utils/date";
import {
  AlertTriangle,
  ChevronsRight,
  ShieldCheck,
  Download,
} from "lucide-react";
import InputField from "@/components/ReusableComponents/InputField";
import { useReactToPrint } from "react-to-print";
import Image from "next/image";
import proscaLogo from "../../../../../public/images/logo.png";
import { useUser } from "@/context/UserContext";

interface FinishedGood {
  product_name: string;
  unit: string;
}

interface WorkflowStage {
  stage_id: string;
  stage_name: string;
  sequence_order: number;
  quality_check_required: boolean;
}

interface ReworkItem {
  _id: string;
  stage_id: string;
  stage_name: string;
  quantity: number;
  reason: string;
  status: "Pending" | "Resolved";
}

interface Disposition {
  quantity_passed: number;
  quantity_for_rework: number;
  quantity_rejected: number;
}

interface SampleData {
  parameter: string;
  specification: string;
  observed_value: string;
  passed: boolean;
}

interface QualityCheckRecord {
  _id: string;
  overall_result: "pass" | "fail" | "rework" | "partial";
  disposition: Disposition;
  notes: string;
  check_date: string;
  samples_data?: SampleData[];
}

interface StageHistory {
  stage_id: string;
  stage_name: string;
  status: string;
  end_date?: string;
  quality_checks?: QualityCheckRecord[];
}

interface ProductionPlan {
  _id: string;
  plan_type: string;
  plan_name: string;
  start_date: string;
  end_date: string;
}

interface RawMaterialUsed {
  material_id: {
    _id: string;
    material_name: string;
    unit: string;
  };
  quantity_issued: number;
  lot_numbers: string[];
  issue_date: string;
}

interface ManufacturingBatch {
  _id: string;
  batch_number: string;
  production_plan_id: ProductionPlan;
  finished_good_id: FinishedGood;
  quantity_planned: number;
  quantity_produced: number;
  quantity_rejected: number;
  quantity_in_rework: number;
  lot_number: string;
  current_stage?: {
    stage_id: string;
    stage_name: string;
    status: string;
    quantity: number;
  };
  rework_items: ReworkItem[];
  stages_history: StageHistory[];
  raw_materials_used: RawMaterialUsed[];
  status: "Draft" | "In Progress" | "Completed" | "Rejected" | "On Hold";
  workflow_id: {
    _id: string;
    workflow_name: string;
    stages: WorkflowStage[];
  };
}

interface SampleDataForForm {
  sample_number: number;
  parameters: {
    parameter_name: string;
    specification: string;
    observed_value: string;
    passed: boolean;
  }[];
}

const QualityCheckModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  batch: ManufacturingBatch;
  submitting: boolean;
}> = ({ isOpen, onClose, onSubmit, batch, submitting }) => {
  const [qualityCheckParams, setQualityCheckParams] = useState<any[]>([]);
  const [numberOfSamples, setNumberOfSamples] = useState<number>(1);
  const [samplesData, setSamplesData] = useState<SampleDataForForm[]>([]);

  const [passed, setPassed] = useState(0);
  const [rework, setRework] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [reworkReason, setReworkReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const quantityAtStage = batch.current_stage?.quantity || 0;

  useEffect(() => {
    if (isOpen && batch.current_stage) {
      const fetchAndInit = async () => {
        try {
          const response = await ManufacturingBatchApis.getQualityParameters(
            batch._id,
            batch.current_stage!.stage_id
          );
          const fetchedParams = response.data.parameters || [];
          setQualityCheckParams(fetchedParams);
          initializeSamplesData(numberOfSamples, fetchedParams);
        } catch (err) {
          console.error("Failed to fetch QC params:", err);
          setError("Could not load quality parameters for this stage.");
        }
      };
      fetchAndInit();
      setPassed(quantityAtStage);
      setRework(0);
      setRejected(0);
    }
  }, [isOpen, batch, numberOfSamples]);

  const initializeSamplesData = (count: number, params: any[]) => {
    const newSamplesData: SampleDataForForm[] = Array.from(
      { length: count },
      (_, i) => ({
        sample_number: i + 1,
        parameters: params.map((p) => ({
          parameter_name: p.parameter_name,
          specification: p.specification,
          observed_value: "",
          passed: false,
        })),
      })
    );
    setSamplesData(newSamplesData);
  };

  const handleSampleDataChange = (
    sampleIndex: number,
    paramIndex: number,
    field: string,
    value: any
  ) => {
    const updatedSamples = [...samplesData];
    (updatedSamples[sampleIndex].parameters[paramIndex] as any)[field] = value;
    setSamplesData(updatedSamples);
  };

  useEffect(() => {
    const total = passed + rework + rejected;
    if (total !== quantityAtStage) {
      setError(
        `Disposition quantities must sum to ${quantityAtStage}. Current sum: ${total}`
      );
    } else {
      setError("");
    }
  }, [passed, rework, rejected, quantityAtStage]);

  const handleSubmit = () => {
    if (error) return;

    const flattenedSamplesData = samplesData.flatMap((sample) =>
      sample.parameters.map((param) => ({
        parameter: param.parameter_name,
        specification: param.specification,
        observed_value: param.observed_value,
        passed: param.passed,
      }))
    );

    const payload = {
      disposition: {
        quantity_passed: passed,
        quantity_for_rework: rework,
        quantity_rejected: rejected,
      },
      rework_reason: rework > 0 ? reworkReason : undefined,
      notes: notes,
      samples_data: flattenedSamplesData,
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
        <h3 className="text-xl font-semibold mb-4">Perform Quality Check</h3>
        <div className="max-h-[75vh] overflow-y-auto pr-4 space-y-6">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-4">
              Detailed Sample Analysis
            </h4>
            <InputField
              label="Number of Samples to Test"
              type="number"
              value={numberOfSamples}
              onChange={(e) => setNumberOfSamples(Number(e.target.value))}
              min="1"
              max={batch.quantity_planned}
            />
            <div className="space-y-4 mt-4">
              {samplesData.map((sample, sampleIndex) => (
                <div
                  key={sample.sample_number}
                  className="p-3 bg-gray-50 border rounded-md"
                >
                  <h5 className="font-medium text-gray-700 mb-2">
                    Sample #{sample.sample_number}
                  </h5>
                  {sample.parameters.map((param, paramIndex) => (
                    <div
                      key={paramIndex}
                      className="grid grid-cols-3 gap-4 items-center mb-2"
                    >
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">
                          {param.parameter_name} (Spec: {param.specification})
                        </label>
                        <InputField
                          type="text"
                          value={param.observed_value}
                          onChange={(e) =>
                            handleSampleDataChange(
                              sampleIndex,
                              paramIndex,
                              "observed_value",
                              e.target.value
                            )
                          }
                          placeholder="Observed value"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <input
                          id={`pass-${sampleIndex}-${paramIndex}`}
                          type="checkbox"
                          checked={param.passed}
                          onChange={(e) =>
                            handleSampleDataChange(
                              sampleIndex,
                              paramIndex,
                              "passed",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label
                          htmlFor={`pass-${sampleIndex}-${paramIndex}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          Passed
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">
              Final Disposition
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Distribute the total{" "}
              <span className="font-bold">{quantityAtStage} units</span> from
              this stage.
            </p>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <div className="space-y-3">
              <InputField
                label="Quantity Passed (to next stage)"
                type="number"
                value={passed}
                onChange={(e) => setPassed(Number(e.target.value))}
                max={quantityAtStage}
                min={0}
              />
              <InputField
                label="Quantity for Rework"
                type="number"
                value={rework}
                onChange={(e) => setRework(Number(e.target.value))}
                max={quantityAtStage}
                min={0}
              />
              <InputField
                label="Quantity Rejected (scrapped)"
                type="number"
                value={rejected}
                onChange={(e) => setRejected(Number(e.target.value))}
                max={quantityAtStage}
                min={0}
              />
              {rework > 0 && (
                <InputField
                  label="Rework Reason"
                  type="text"
                  value={reworkReason}
                  onChange={(e) => setReworkReason(e.target.value)}
                  placeholder="e.g., Stitching defects"
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Overall Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !!error}
          >
            {submitting ? "Submitting..." : "Submit Results"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ResolveReworkModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reworkId: string, payload: any) => Promise<void>;
  reworkItem: ReworkItem | null;
  submitting: boolean;
}> = ({ isOpen, onClose, onSubmit, reworkItem, submitting }) => {
  const [passed, setPassed] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (reworkItem) {
      setPassed(reworkItem.quantity);
      setRejected(0);
    }
  }, [reworkItem]);

  useEffect(() => {
    if (reworkItem) {
      const total = passed + rejected;
      if (total !== reworkItem.quantity) {
        setError(
          `Quantities must sum to ${reworkItem.quantity}. Current sum: ${total}`
        );
      } else {
        setError("");
      }
    }
  }, [passed, rejected, reworkItem]);

  if (!isOpen || !reworkItem) return null;

  const handleSubmit = () => {
    if (error) return;
    const payload = {
      disposition: { quantity_passed: passed, quantity_rejected: rejected },
      notes: notes,
    };
    onSubmit(reworkItem._id, payload);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-2">Resolve Rework Item</h3>
        <p className="text-sm text-gray-600 mb-4">
          Result for{" "}
          <span className="font-bold">
            {reworkItem.quantity} reworked units
          </span>{" "}
          from stage: <span className="font-bold">{reworkItem.stage_name}</span>
        </p>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="space-y-4">
          <InputField
            label="Quantity Passed (Good)"
            type="number"
            value={passed}
            onChange={(e) => setPassed(Number(e.target.value))}
            max={reworkItem.quantity}
            min={0}
          />
          <InputField
            label="Quantity Rejected (Scrapped)"
            type="number"
            value={rejected}
            onChange={(e) => setRejected(Number(e.target.value))}
            max={reworkItem.quantity}
            min={0}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Resolution Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !!error}
          >
            {submitting ? "Submitting..." : "Submit Resolution"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "in progress":
      return "border-blue-300 text-blue-700 bg-blue-50";
    case "completed":
      return "border-green-300 text-green-700 bg-green-50";
    case "rejected":
      return "border-red-300 text-red-700 bg-red-50";
    case "on hold":
      return "border-yellow-300 text-yellow-700 bg-yellow-50";
    default:
      return "border-gray-300 text-gray-700 bg-gray-50";
  }
};

interface PrintableBatchReportProps {
  batch: ManufacturingBatch;
  companyName: string;
  companyAddress: string;
  logoSrc?: string;
}

const PrintableBatchReport = forwardRef<HTMLDivElement, PrintableBatchReportProps>(
  ({ batch, companyName, companyAddress, logoSrc }, ref) => (
    <div ref={ref} className="p-8 bg-white text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header with Logo and Company Info */}
      <div className="flex items-start justify-between mb-8">
        <div className="border border-black p-2 flex items-center justify-center" style={{ width: '120px', height: '80px' }}>
          <img
            src={logoSrc || proscaLogo.src}
            alt="Company Logo"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
        <div className="flex-1 ml-6 border border-black p-4 flex items-center justify-center" style={{ height: '80px' }}>
          <div className="text-center">
            <h1 className="text-base font-bold mb-1">{companyName}</h1>
            <p className="text-sm">{companyAddress}</p>
          </div>
        </div>
      </div>

      {/* Horizontal line */}
      <div className="border-t border-black mb-6"></div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold">Quality Test Report</h2>
      </div>

      {/* Report Details */}
      <div className="grid grid-cols-2 gap-x-16 gap-y-2 mb-8 text-sm">
        <div>
          <span className="font-medium">Date of Inspection:</span> {formatDate(new Date().toISOString())}
        </div>
        <div>
          <span className="font-medium">Report No:</span> {batch.batch_number}
        </div>
        <div>
          <span className="font-medium">Product Name:</span> {batch.finished_good_id.product_name}
        </div>
        <div>
          <span className="font-medium">Lot/Batch No:</span> {batch.lot_number}
        </div>
        <div>
          <span className="font-medium">Samples Drawn:</span> {batch.stages_history?.reduce((total, stage) => 
            total + (stage.quality_checks?.reduce((qcTotal, qc) => qcTotal + (qc.samples_data?.length || 0), 0) || 0), 0) || 0}
        </div>
        <div>
          <span className="font-medium">Applicable Test Method:</span> Quality Control Standards
        </div>
      </div>

      {/* Test Summary Table - NOW AT THE TOP */}
      <div className="mb-8">
        <h3 className="text-sm font-medium mb-3 text-center">Test Summary</h3>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-3 text-center font-medium bg-gray-100">Tested Quantity</th>
              <th className="border border-black p-3 text-center font-medium bg-gray-100">Accepted Quantity</th>
              <th className="border border-black p-3 text-center font-medium bg-gray-100">Rejected Quantity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-3 text-center">{batch.quantity_planned}</td>
              <td className="border border-black p-3 text-center">{batch.quantity_produced}</td>
              <td className="border border-black p-3 text-center">{batch.quantity_rejected}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detailed Test Results - Now comes AFTER Test Summary */}
      {batch.stages_history && batch.stages_history.length > 0 && (
        <div className="mb-8">
          {batch.stages_history.map((history, stageIndex) => (
            history.quality_checks && history.quality_checks.length > 0 && (
              <div key={stageIndex} className="mb-6">
                <h4 className="text-sm font-medium mb-2">Stage: {history.stage_name}</h4>
                {history.quality_checks.map((qc, qcIndex) => (
                  <div key={qcIndex} className="mb-4">
                    <p className="text-sm mb-2">
                      <span className="font-medium">QC Date:</span> {formatDate(qc.check_date)}
                    </p>
                    {/* Only show table if there's sample data */}
                    {qc.samples_data && qc.samples_data.length > 0 ? (
                      <table className="w-full border-collapse border border-black text-sm">
                        <thead>
                          <tr>
                            <th className="border border-black p-2 text-center font-medium bg-gray-100">S.No.</th>
                            <th className="border border-black p-2 text-center font-medium bg-gray-100">Parameter</th>
                            <th className="border border-black p-2 text-center font-medium bg-gray-100">Specified Value</th>
                            <th className="border border-black p-2 text-center font-medium bg-gray-100">Observed Value</th>
                            <th className="border border-black p-2 text-center font-medium bg-gray-100">Result (Pass/Fail)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qc.samples_data.map((sample, sampleIndex) => (
                            <tr key={sampleIndex}>
                              <td className="border border-black p-2 text-center">{sampleIndex + 1}</td>
                              <td className="border border-black p-2 text-center">{sample.parameter}</td>
                              <td className="border border-black p-2 text-center">{sample.specification}</td>
                              <td className="border border-black p-2 text-center">{sample.observed_value}</td>
                              <td className="border border-black p-2 text-center font-medium">
                                {sample.passed ? 'Pass' : 'Fail'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      // Show message when no sample data exists
                      <p className="text-sm text-gray-600 italic">No sample data available for this quality check.</p>
                    )}
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
);

PrintableBatchReport.displayName = 'PrintableBatchReport';

const SingleManufacturingBatchPage = ({
  params,
}: {
  params: { id: string };
}) => {
  const router = useRouter();
  const { organization } = useUser();
  const [batch, setBatch] = useState<ManufacturingBatch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [showQualityCheckModal, setShowQualityCheckModal] =
    useState<boolean>(false);
  const [showResolveReworkModal, setShowResolveReworkModal] =
    useState<boolean>(false);
  const [selectedReworkItem, setSelectedReworkItem] =
    useState<ReworkItem | null>(null);

  // Use useRef for the print component reference
  const printRef = useRef<HTMLDivElement>(null);

  // Updated useReactToPrint configuration
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Batch_${batch?.batch_number}_Report`,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        // Add any pre-print logic here
        setTimeout(() => {
          resolve();
        }, 100);
      });
    },
    onAfterPrint: () => {
      console.log("Print completed!");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      setError("Failed to print. Please try again.");
    }
  });

  const fetchBatchDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ManufacturingBatchApis.getSingleManufacturingBatch(
        params.id
      );
      if (response.status === 200) setBatch(response.data.batch);
      else throw new Error(response.data?.message || "Failed to fetch details");
    } catch (err: any) {
      setError(err.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchBatchDetails();
  }, [params.id]);

  const handleDispositionSubmit = async (payload: any) => {
    if (!batch) return;
    setSubmitting(true);
    setError("");
    try {
      await ManufacturingBatchApis.performQualityCheck(batch._id, payload);
      setShowQualityCheckModal(false);
      await fetchBatchDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit disposition.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResolveReworkModal = (reworkItem: ReworkItem) => {
    setSelectedReworkItem(reworkItem);
    setShowResolveReworkModal(true);
  };

  const handleResolveReworkSubmit = async (reworkId: string, payload: any) => {
    if (!batch) return;
    setSubmitting(true);
    setError("");
    try {
      await ManufacturingBatchApis.resolveReworkItem(
        batch._id,
        reworkId,
        payload
      );
      setShowResolveReworkModal(false);
      setSelectedReworkItem(null);
      await fetchBatchDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resolve rework item.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error && !batch)
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  if (!batch) return <div className="text-center p-8">Batch not found.</div>;

  const pendingReworkItems = (batch.rework_items || []).filter(
    (item) => item.status === "Pending"
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Batch #{batch.batch_number}
          </h1>
          <p className="text-gray-600 mt-1">
            Product: {batch.finished_good_id.product_name}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handlePrint}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
              batch.status
            )}`}
          >
            {batch.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Hidden print component */}
      <div className="hidden">
        <PrintableBatchReport
          ref={printRef}
          batch={batch}
          companyName={organization?.name || "Prosca"}
          companyAddress={organization?.company_address || ""}
          logoSrc={organization?.logo || proscaLogo.src}
        />
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Batch Progress
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">PLANNED</p>
              <p className="text-2xl font-bold text-gray-800">
                {batch.quantity_planned}
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-semibold">
                PRODUCED (GOOD)
              </p>
              <p className="text-2xl font-bold text-green-700">
                {batch.quantity_produced}
              </p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-semibold">IN REWORK</p>
              <p className="text-2xl font-bold text-orange-700">
                {batch.quantity_in_rework}
              </p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-semibold">REJECTED</p>
              <p className="text-2xl font-bold text-red-800">
                {batch.quantity_rejected}
              </p>
            </div>
          </div>
        </div>

        {batch.production_plan_id && (
          <div className="bg-white p-6 rounded-lg border shadow-sm mt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Production Plan Details
            </h3>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Plan Name:</span>{" "}
                {batch.production_plan_id.plan_name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Plan Type:</span>{" "}
                {batch.production_plan_id.plan_type}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Dates:</span>{" "}
                {formatDate(batch.production_plan_id.start_date)} -{" "}
                {formatDate(batch.production_plan_id.end_date)}
              </p>
            </div>
          </div>
        )}

        {batch.raw_materials_used && batch.raw_materials_used.length > 0 && (
          <div className="bg-white p-6 rounded-lg border shadow-sm mt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Raw Materials Used
            </h3>
            <div className="space-y-4">
              {batch.raw_materials_used.map((material, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border"
                >
                  <p className="text-gray-800 font-medium">
                    Material: {material.material_id.material_name}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Quantity Issued:</span>{" "}
                    {material.quantity_issued} {material.material_id.unit}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Lot Number(s):</span>{" "}
                    {material.lot_numbers.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingReworkItems.length > 0 && (
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 mt-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-orange-900">
                Items Pending Rework
              </h3>
            </div>
            <div className="space-y-3">
              {pendingReworkItems.map((item) => (
                <div
                  key={item._id}
                  className="p-3 bg-white rounded-md border flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.quantity} units from &quot;{item.stage_name}&quot;
                    </p>
                    <p className="text-sm text-gray-600">
                      Reason: {item.reason}
                    </p>
                  </div>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleOpenResolveReworkModal(item)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {batch.status === "In Progress" && batch.current_stage && (
          <div className="bg-white p-6 rounded-lg border shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <ChevronsRight className="inline-block h-5 w-5 text-blue-600 mr-2" />
              Current Stage: {batch.current_stage.stage_name}
            </h3>
            <p className="text-sm text-gray-600 mb-4 ml-7">
              Processing Quantity:{" "}
              <span className="font-medium">
                {batch.current_stage.quantity}
              </span>{" "}
              units
            </p>
            <div className="flex flex-wrap gap-4 ml-7">
              <Button
                variant="primary"
                onClick={() => setShowQualityCheckModal(true)}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Perform Quality Check
              </Button>
            </div>
          </div>
        )}

        {batch.status === "On Hold" && (
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mt-6">
            <h3 className="text-lg font-semibold text-yellow-900">
              Batch On Hold
            </h3>
            <p className="text-yellow-800">
              Please resolve all pending rework items to finalize the batch.
            </p>
          </div>
        )}
        {batch.status === "Completed" && (
          <div className="bg-green-50 p-6 rounded-lg border border-green-200 mt-6">
            <h3 className="text-lg font-semibold text-green-900">
              Batch Completed
            </h3>
            <p className="text-green-800">
              Final produced count is {batch.quantity_produced}.
            </p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg border shadow-sm mt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Stage History & Quality Checks
          </h3>
          {(batch.stages_history || []).length > 0 ? (
            (batch.stages_history || []).map((history) => (
              <div
                key={history.stage_id}
                className="mb-4 border-b pb-4 last:border-b-0 last:pb-0"
              >
                <h4 className="font-semibold text-lg text-gray-800">
                  {history.stage_name}
                </h4>
                {history.quality_checks && history.quality_checks.length > 0 ? (
                  <div className="mt-2 space-y-3 pl-4 border-l-2">
                    {history.quality_checks.map((qc) => (
                      <div
                        key={qc._id}
                        className="p-3 bg-gray-50 rounded-md border"
                      >
                        <p className="text-sm font-medium">
                          QC on {formatDate(qc.check_date)}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                          <div className="bg-green-100 p-1 rounded">
                            <p className="text-xs text-green-700">Passed</p>
                            <p className="font-bold text-green-800">
                              {qc.disposition.quantity_passed}
                            </p>
                          </div>
                          <div className="bg-orange-100 p-1 rounded">
                            <p className="text-xs text-orange-700">Rework</p>
                            <p className="font-bold text-orange-800">
                              {qc.disposition.quantity_for_rework}
                            </p>
                          </div>
                          <div className="bg-red-100 p-1 rounded">
                            <p className="text-xs text-red-700">Rejected</p>
                            <p className="font-bold text-red-800">
                              {qc.disposition.quantity_rejected}
                            </p>
                          </div>
                        </div>

                        {qc.samples_data && qc.samples_data.length > 0 && (
                          <div className="mt-4 overflow-x-auto">
                            <p className="text-sm font-semibold mb-2">Sample Test Results</p>
                            <table className="min-w-full text-sm text-left border border-gray-200">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="p-2 border-b border-r">Parameter</th>
                                  <th className="p-2 border-b border-r">Specified Value</th>
                                  <th className="p-2 border-b border-r">Observed Value</th>
                                  <th className="p-2 border-b">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {qc.samples_data.map((sample, sampleIndex) => (
                                  <tr key={sampleIndex} className="odd:bg-white even:bg-gray-50">
                                    <td className="p-2 border-r">{sample.parameter}</td>
                                    <td className="p-2 border-r">{sample.specification}</td>
                                    <td className="p-2 border-r">{sample.observed_value}</td>
                                    <td className={`p-2 font-medium ${sample.passed ? 'text-green-600' : 'text-red-600'}`}>
                                      {sample.passed ? 'Pass' : 'Fail'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {qc.notes && (
                          <p className="text-xs text-gray-600 mt-2">
                            <b>Notes:</b> {qc.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 pl-4">
                    No quality checks performed.
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No stage history recorded yet.</p>
          )}
        </div>
      </div>

      {batch.current_stage && (
        <QualityCheckModal
          isOpen={showQualityCheckModal}
          onClose={() => setShowQualityCheckModal(false)}
          onSubmit={handleDispositionSubmit}
          batch={batch}
          submitting={submitting}
        />
      )}
      <ResolveReworkModal
        isOpen={showResolveReworkModal}
        onClose={() => {
          setShowResolveReworkModal(false);
          setSelectedReworkItem(null);
        }}
        onSubmit={handleResolveReworkSubmit}
        reworkItem={selectedReworkItem}
        submitting={submitting}
      />
    </div>
  );
};

export default SingleManufacturingBatchPage;