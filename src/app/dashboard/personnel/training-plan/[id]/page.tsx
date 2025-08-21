/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState, useEffect } from 'react';
import TrainingPlanApis from '@/actions/Apis/TrainingPlanApis';
import Button from '@/components/ReusableComponents/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import OrgUserApis from '@/actions/Apis/OrgUserApis';
import { getCookie } from '@/actions/CookieUtils';
import InputField from '@/components/ReusableComponents/InputField';
import { Upload, X, FileText, Trash2 } from 'lucide-react';

const departments = [
    "Production",
    "Purchase",
    "Quality Control",
    "Dispatch",
    "Accounts",
    "Administration",
    "Sales",
    "Marketing",
    "Human Resources",
    "IT",
];

interface Evidence {
  documentId: string;
  name: string;
  uploadDate: string;
}

interface User {
    _id: string;
    name: string;
    department: string;
}

// Minimal Document Upload Modal Component
interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (documentId: string, documentName: string) => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async () => {
    if (!docName.trim() || !file) {
      setError('Please provide a document name and select a file.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", docName);
    formData.append("docName", docName);
    formData.append("docType", "Training Evidence"); // Explicitly setting a document type

    try {
      const token = getCookie("token");
      const response = await fetch("http://localhost:8001/api/documents/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      onUploadSuccess(data.document._id, docName);
      setDocName('');
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setError(err.message || "Error uploading file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Upload Evidence Document</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
        <div className="space-y-4">
          <InputField
            label="Document Name"
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g., Completion Certificate, Attendance Sheet"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" onClick={handleFileUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
};


const SinglePlanPage = ({ params }: { params: { id: string } }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    const [formData, setFormData] = useState({
        nameOfTraining: '',
        department: '',
        group: '',
        nameOfFaculty: '',
        facultyOrganization: '',
        location: '',
        start_date: '',
        end_date: '',
        remark: '',
    });
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<Array<{ userId: string, name: string }>>([]);
    const [evidences, setEvidences] = useState<Evidence[]>([]);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await OrgUserApis.getAllUsers();
            if (res.status === 200) {
                setAllUsers(res.data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setError('Failed to fetch users for participants.');
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchTrainingPlan = async (id: string) => {
        setLoading(true);
        try {
            const res = await TrainingPlanApis.getSingleTrainingPlan(id);
            if (res.status === 200) {
                const planData = res.data.trainingPlan;
                setFormData({
                    nameOfTraining: planData.nameOfTraining || '',
                    department: planData.department || '',
                    group: planData.group || '',
                    nameOfFaculty: planData.nameOfFaculty || '',
                    facultyOrganization: planData.facultyOrganization || '',
                    location: planData.location || '',
                    start_date: planData.start_date ? planData.start_date.substring(0, 10) : '',
                    end_date: planData.end_date ? planData.end_date.substring(0, 10) : '',
                    remark: planData.remark || '',
                });
                setSelectedParticipants(planData.participants || []);
                setEvidences(planData.evidences || []); // Assume API returns evidence docs with name and ID
            } else {
                console.error("Failed to fetch training plan:", res.data);
                setError('Failed to fetch training plan data.');
            }
        } catch (err) {
            console.error("Error fetching training plan:", err);
            setError('An error occurred while fetching data.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleParticipantChange = (user: User) => {
        const isSelected = selectedParticipants.some(p => p.userId === user._id);
        if (isSelected) {
            setSelectedParticipants(selectedParticipants.filter(p => p.userId !== user._id));
        } else {
            setSelectedParticipants([...selectedParticipants, { userId: user._id, name: user.name }]);
        }
    };

    const handleSelectAllParticipants = () => {
        const allUserIds = allUsers.map(user => ({ userId: user._id, name: user.name }));
        if (selectedParticipants.length === allUserIds.length) {
            setSelectedParticipants([]);
        } else {
            setSelectedParticipants(allUserIds);
        }
    };

    const handleSelectAllDepartment = (department: string) => {
        const departmentUsers = allUsers.filter(user => user.department === department);
        const departmentUserIds = departmentUsers.map(user => ({ userId: user._id, name: user.name }));
        const departmentUsersSelected = departmentUsers.every(user => selectedParticipants.some(p => p.userId === user._id));

        if (departmentUsersSelected) {
            setSelectedParticipants(selectedParticipants.filter(p => !departmentUserIds.some(d => d.userId === p.userId)));
        } else {
            const newSelections = departmentUserIds.filter(dUser => !selectedParticipants.some(p => p.userId === dUser.userId));
            setSelectedParticipants([...selectedParticipants, ...newSelections]);
        }
    };

    const handleDocumentUploadSuccess = (documentId: string, documentName: string) => {
      const newEvidence = { documentId, name: documentName, uploadDate: new Date().toISOString() };
      setEvidences(prev => [...prev, newEvidence]);
      setIsDocumentModalOpen(false);
    };

    const handleRemoveDocument = (documentId: string) => {
      setEvidences(prev => prev.filter(doc => doc.documentId !== documentId));
    };

    const validateForm = () => {
        if (!formData.nameOfTraining || !formData.department || !formData.group || !formData.start_date || !formData.end_date) {
            setError('Name of Training, Department, Group, Start Date, and End Date are required.');
            return false;
        }

        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        if (endDate < startDate) {
            setError('End date cannot be before the start date.');
            return false;
        }

        setError('');
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        
        setSubmitting(true);
        try {
            const evidencesIds = evidences.map(e => e.documentId);
            const updateData = { ...formData, participants: selectedParticipants, evidences: evidencesIds };
            let res;

            if (action === 'execute') {
                res = await TrainingPlanApis.updateTrainingPlanStatus(params.id, { status: 'executed' });
            } else {
                res = await TrainingPlanApis.updateTrainingPlan(params.id, updateData);
            }

            if (res.status === 200) {
                console.log("Training plan updated successfully:", res.data);
                router.push('/dashboard/personnel/training-plan');
            } else {
                console.error("Failed to update training plan:", res.data);
                setError('Failed to update training plan.');
            }
        } catch (err) {
            console.error("Error updating training plan:", err);
            setError('An error occurred while updating the training plan.');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (params.id) {
                await fetchUsers();
                await fetchTrainingPlan(params.id);
            }
        };
        fetchData();
    }, [params.id]);

    const usersGroupedByDepartment = allUsers.reduce((acc: { [key: string]: User[] }, user) => {
      const department = user.department || 'Uncategorized';
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(user);
      return acc;
    }, {});


    if (loading || loadingUsers) {
        return <div className="p-6 text-center text-gray-500">Loading training plan details...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                {action === 'execute' ? 'Execute Training Plan' : 'Update Training Plan'}
            </h1>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                        {error}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Name of Training */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Name of Training <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nameOfTraining"
                            value={formData.nameOfTraining}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Department <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="" disabled>Select a department</option>
                            {departments.map((dept, index) => (
                                <option key={index} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Group */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Group <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="group"
                            value={formData.group}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Name of Faculty */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Name of Faculty
                        </label>
                        <input
                            type="text"
                            name="nameOfFaculty"
                            value={formData.nameOfFaculty}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Faculty's Organization */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Faculty&apos;s Organization
                        </label>
                        <input
                            type="text"
                            name="facultyOrganization"
                            value={formData.facultyOrganization}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Participants Section */}
                    <div className="md:col-span-2">
                        <div className="flex items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 mr-2">
                                Participants
                            </label>
                            <input
                                type="checkbox"
                                id="selectAll"
                                checked={selectedParticipants.length === allUsers.length}
                                onChange={handleSelectAllParticipants}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                                Select All
                            </label>
                        </div>
                        {loadingUsers ? (
                            <div className="text-gray-500">Loading participants...</div>
                        ) : (
                            <div className="space-y-4 p-4 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                                {Object.entries(usersGroupedByDepartment).map(([department, users]) => (
                                    <div key={department} className="border-b border-gray-200 pb-2 last:border-b-0">
                                        <div className="flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                id={`selectAll-${department}`}
                                                checked={users.every(user => selectedParticipants.some(p => p.userId === user._id))}
                                                onChange={() => handleSelectAllDepartment(department)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor={`selectAll-${department}`} className="ml-2 text-sm font-semibold text-gray-900">
                                                {department}
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {users.map((user: User) => (
                                                <div key={user._id} className="flex items-center">
                                                    <input
                                                        id={`user-${user._id}`}
                                                        type="checkbox"
                                                        checked={selectedParticipants.some(p => p.userId === user._id)}
                                                        onChange={() => handleParticipantChange(user)}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`user-${user._id}`} className="ml-2 text-sm text-gray-700">
                                                        {user.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Remark */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Remark
                        </label>
                        <textarea
                            name="remark"
                            value={formData.remark}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>

                    {/* Evidences Section */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Evidences</h2>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => setIsDocumentModalOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload Evidence
                                </Button>
                            </div>
                            
                            {/* List of Uploaded Documents */}
                            <div className="space-y-3">
                                {evidences && evidences.length > 0 ? (
                                    evidences.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => handleRemoveDocument(doc.documentId)}
                                                className="p-1 text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">No evidence documents uploaded yet.</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="min-w-32"
                    >
                        {submitting ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
            <DocumentUploadModal
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                onUploadSuccess={handleDocumentUploadSuccess}
            />
        </div>
    );
};

export default SinglePlanPage;
