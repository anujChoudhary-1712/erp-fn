/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import MachineryApis from '@/actions/Apis/MachineryApis'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import Button from '@/components/ReusableComponents/Button';
import { formatDate } from '@/utils/date';
import { FileText } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";

// TypeScript interface for maintenance history
interface History {
    _id: string;
    maintenance_repair: string;
    record_type: string;
    remark: string;
    date: string;
}

// TypeScript interface for the nested document structure
interface NestedDocument {
    _id: string;
    documents: any[];
    latest_doc_id: string;
    org_id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

// TypeScript interface for documents in the machinery schema
interface MachineryDocument {
    name: string;
    document: NestedDocument;
    _id: string;
}

// Updated TypeScript interface for all machinery data to match new schema
interface Machinery {
    _id: string;
    // General Information
    machine_equipment_name: string;
    machine_equipment_type: string;
    make: string;
    model: string;
    serial_number: string;
    location: string;
    
    // Technical Details
    has_technical_details: boolean;
    range: string;
    resolution: string;
    accuracy: string;
    capacity: string;
    accessories: string;
    
    // Date & Documentation
    date_of_purchase?: string;
    name_of_vendor?: string;
    date_of_installation?: string;
    warranty_period?: string;
    date_of_operation?: string;
    has_user_manual: boolean;
    
    // Calibration Details
    has_calibration_details: boolean;
    calibration_lab_name: string;
    calibration_date?: string;
    next_due?: string;
    calibration_frequency: string;
    
    // Machine Maintenance Details
    has_maintenance_details: boolean;
    maintenance_type: string;
    maintenance_frequency: string;
    last_maintenance_performed?: string;
    maintenance_service_provider: string;
    next_scheduled_maintenance_date?: string;
    maintenance_remarks: string;
    
    // Legacy fields for backward compatibility
    lab_id?: string;
    status: string;
    history: History[];
    documents: MachineryDocument[];
    org_id: string;
    created_date: string;
    last_modified_date: string;
}

// Re-defining the Document interface from the vendor page for use here
interface Document {
    _id: string;
    docName: string;
    fileName: string;
    fileSize: number;
    link: string;
    status: string;
    docType: string;
    uploadDate: string;
    description: string;
    outerId: string;
    org_id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

const SingleMachineryPage = ({params}:{params:{id:string}}) => {
    const [machinery, setMachinery] = useState<Machinery | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [maintenanceForm, setMaintenanceForm] = useState({
      record_type: '',
      maintenance_repair: '',
      remark: '',
      date: new Date().toISOString().split('T')[0],
    });
    const [formSaving, setFormSaving] = useState(false);
    const router = useRouter();

    const fetchMachineryData = async () => {
        setLoading(true);
        try {
            const res = await MachineryApis.getSingleMachinery(params.id);
            if(res.status === 200){
                setMachinery(res.data.machinery);
            } else {
                setError("Failed to fetch machinery data.");
            }
        } catch (err: any) {
            console.error("Error fetching single machinery data:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    // Helper function to extract document data from the nested structure
    const extractMachineryDocument = (documentObj: MachineryDocument): Document | null => {
      if (!documentObj || !documentObj.document || !documentObj.document.documents || documentObj.document.documents.length === 0) {
        return null;
      }
  
      // Get the latest document based on the `latest_doc_id`
      const latestDoc = documentObj.document.documents.find(
        (doc: any) => doc._id === documentObj.document.latest_doc_id
      ) || documentObj.document.documents[0];
  
      return {
        _id: latestDoc._id,
        docName: latestDoc.docName,
        fileName: latestDoc.fileName,
        fileSize: latestDoc.fileSize,
        link: latestDoc.link,
        status: latestDoc.status,
        docType: latestDoc.docType,
        uploadDate: latestDoc.uploadDate,
        description: latestDoc.description,
        outerId: latestDoc.outerId,
        org_id: latestDoc.org_id,
        createdAt: latestDoc.createdAt,
        updatedAt: latestDoc.updatedAt,
        __v: latestDoc.__v,
      };
    };

    const getMachineryDocuments = (): Document[] => {
      if (!machinery || !machinery.documents) return [];

      return machinery.documents.map(docItem => {
        const doc = extractMachineryDocument(docItem);
        if (doc) {
          return {
            ...doc,
            docName: docItem.name || doc.docName,
          }
        }
        return null;
      }).filter(Boolean) as Document[];
    };

    useEffect(()=>{
        fetchMachineryData();
    }, [params.id])

    const handleMaintenanceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setMaintenanceForm(prev => ({ ...prev, [name]: value }));
    };

    const handleMaintenanceSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormSaving(true);

      const payload = {
        maintenance_repair: maintenanceForm.maintenance_repair,
        record_type: maintenanceForm.record_type,
        remark: maintenanceForm.remark,
        date: new Date(maintenanceForm.date).toISOString(),
      };

      try {
        const res = await MachineryApis.addMaintainaenaceHistory(params.id, payload);
        if (res.status === 200) {
          alert('Maintenance history added successfully!');
          setIsModalOpen(false);
          fetchMachineryData(); 
        } else {
          alert('Failed to add maintenance history.');
        }
      } catch (err) {
        console.error('Error adding maintenance history:', err);
        alert('An error occurred. Please try again.');
      } finally {
        setFormSaving(false);
      }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading machinery details...</p>
                </div>
            </div>
        );
    }

    if (error || !machinery) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Machinery</h3>
                    <p className="text-gray-600 mb-4">{error || "Machinery not found."}</p>
                    <Button 
                        variant="primary"
                        onClick={() => router.push('/dashboard/inventory/machinery')}
                    >
                        Back to Machinery
                    </Button>
                </div>
            </div>
        );
    }
    
    const DataField = ({ label, value }: { label: string; value: string | number | undefined | null }) => (
        <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
            <p className="text-gray-900 break-words">{value || 'N/A'}</p>
        </div>
    );
    
    const sortedHistory = machinery.history?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
    const allDocuments = getMachineryDocuments();

    const HistoryList = ({ history }: { history: History[] }) => (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Maintenance History</h2>
            <div className="space-y-4">
                {history.length > 0 ? (
                    history.map((record) => (
                        <div key={record._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {record.maintenance_repair}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {record.record_type}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600 mt-1 sm:mt-0">
                                    {formatDate(record.date)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700">{record.remark}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-4">No maintenance history found.</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-8">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                            aria-label="Go back"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {machinery.machine_equipment_name}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {machinery.machine_equipment_type && `Type: ${machinery.machine_equipment_type}`}
                                {machinery.lab_id && ` • Lab ID: ${machinery.lab_id}`}
                            </p>
                        </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => setIsModalOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      + Add Maintenance
                    </Button>
                </div>

                {/* Main Content - Form Sections Layout */}
                <div className="space-y-6">
                    {/* General Information */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">General Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            <DataField label="Machine/Equipment Name" value={machinery.machine_equipment_name} />
                            <DataField label="Machine/Equipment Type" value={machinery.machine_equipment_type} />
                            <DataField label="Make" value={machinery.make} />
                            <DataField label="Model" value={machinery.model} />
                            <DataField label="Serial Number" value={machinery.serial_number} />
                            <DataField label="Location" value={machinery.location} />
                        </div>
                    </div>

                    {/* Technical Details */}
                    {machinery.has_technical_details && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Technical Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <DataField label="Range" value={machinery.range} />
                                <DataField label="Resolution" value={machinery.resolution} />
                                <DataField label="Accuracy" value={machinery.accuracy} />
                                <DataField label="Capacity" value={machinery.capacity} />
                                <DataField label="Accessories" value={machinery.accessories} />
                            </div>
                        </div>
                    )}

                    {/* Date & Documentation */}
                    {(machinery.date_of_purchase || machinery.name_of_vendor || machinery.date_of_installation || 
                      machinery.warranty_period || machinery.date_of_operation) && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Date & Documentation</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {machinery.date_of_purchase && (
                                    <DataField label="Date of Purchase" value={formatDate(machinery.date_of_purchase)} />
                                )}
                                {machinery.name_of_vendor && (
                                    <DataField label="Name of Vendor" value={machinery.name_of_vendor} />
                                )}
                                {machinery.date_of_installation && (
                                    <DataField label="Date of Installation" value={formatDate(machinery.date_of_installation)} />
                                )}
                                {machinery.warranty_period && (
                                    <DataField label="Warranty Period" value={machinery.warranty_period} />
                                )}
                                {machinery.date_of_operation && (
                                    <DataField label="Date of Operation" value={formatDate(machinery.date_of_operation)} />
                                )}
                                <DataField label="User Manual" value={machinery.has_user_manual ? 'Yes' : 'No'} />
                            </div>
                        </div>
                    )}

                    {/* Calibration Details */}
                    {machinery.has_calibration_details && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Calibration Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <DataField label="Calibration Lab Name" value={machinery.calibration_lab_name} />
                                {machinery.calibration_date && (
                                    <DataField label="Calibration Date" value={formatDate(machinery.calibration_date)} />
                                )}
                                {machinery.next_due && (
                                    <DataField label="Next Due" value={formatDate(machinery.next_due)} />
                                )}
                                <DataField label="Calibration Frequency" value={machinery.calibration_frequency ? `${machinery.calibration_frequency} months` : ''} />
                            </div>
                        </div>
                    )}

                    {/* Machine Maintenance Details */}
                    {machinery.has_maintenance_details && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Machine Maintenance Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <DataField label="Maintenance Type" value={machinery.maintenance_type} />
                                <DataField label="Maintenance Frequency" value={machinery.maintenance_frequency ? `${machinery.maintenance_frequency} months` : ''} />
                                {machinery.last_maintenance_performed && (
                                    <DataField label="Last Maintenance Performed" value={formatDate(machinery.last_maintenance_performed)} />
                                )}
                                <DataField label="Maintenance Service Provider" value={machinery.maintenance_service_provider} />
                                {machinery.next_scheduled_maintenance_date && (
                                    <DataField label="Next Scheduled Maintenance Date" value={formatDate(machinery.next_scheduled_maintenance_date)} />
                                )}
                                <DataField label="Remarks" value={machinery.maintenance_remarks} />
                            </div>
                        </div>
                    )}

                    {/* Documents Section */}
                    {allDocuments.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Documents</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {allDocuments.map((doc, index) => (
                                    <DocumentCard
                                        key={`${doc._id}-${index}`}
                                        document={doc}
                                        showActions={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Maintenance History */}
                    {machinery.history && machinery.history.length > 0 && <HistoryList history={sortedHistory} />}
                </div>
            </div>
            
            {/* Maintenance Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {machinery.machine_equipment_name} : Maintenance/Repair Record
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <form onSubmit={handleMaintenanceSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Record Type</label>
                        <div className="flex items-center space-x-6">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="record_type"
                              value="Internal"
                              checked={maintenanceForm.record_type === 'Internal'}
                              onChange={handleMaintenanceFormChange}
                              className="form-radio text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Internal</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="record_type"
                              value="External"
                              checked={maintenanceForm.record_type === 'External'}
                              onChange={handleMaintenanceFormChange}
                              className="form-radio text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">External</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance / Repair</label>
                        <div className="flex items-center space-x-6">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="maintenance_repair"
                              value="Maintenance"
                              checked={maintenanceForm.maintenance_repair === 'Maintenance'}
                              onChange={handleMaintenanceFormChange}
                              className="form-radio text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Maintenance</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="maintenance_repair"
                              value="Repair"
                              checked={maintenanceForm.maintenance_repair === 'Repair'}
                              onChange={handleMaintenanceFormChange}
                              className="form-radio text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Repair</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
                        <textarea
                          name="remark"
                          value={maintenanceForm.remark}
                          onChange={handleMaintenanceFormChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Enter remarks about the maintenance or repair"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={maintenanceForm.date}
                          onChange={handleMaintenanceFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={formSaving}
                      >
                        {formSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
        </div>
    );
}

export default SingleMachineryPage;