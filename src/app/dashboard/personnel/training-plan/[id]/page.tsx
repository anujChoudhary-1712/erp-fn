"use client"
import React, { useState, useEffect } from 'react';
import TrainingPlanApis from '@/actions/Apis/TrainingPlanApis';
import Button from '@/components/ReusableComponents/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import OrgUserApis from '@/actions/Apis/OrgUserApis';

const SinglePlanPage = ({ params }: { params: { id: string } }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    const [formData, setFormData] = useState({
        discipline: '',
        group: '',
        nameOfFaculty: '',
        facultyOrganization: '',
        location: '',
        start_date: '',
        end_date: '',
        remark: '',
    });
    const [allUsers, setAllUsers] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState<Array<{ userId: string, name: string }>>([]);
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
                    discipline: planData.discipline || '',
                    group: planData.group || '',
                    nameOfFaculty: planData.nameOfFaculty || '',
                    facultyOrganization: planData.facultyOrganization || '',
                    location: planData.location || '',
                    start_date: planData.start_date ? planData.start_date.substring(0, 10) : '',
                    end_date: planData.end_date ? planData.end_date.substring(0, 10) : '',
                    remark: planData.remark || '',
                });
                setSelectedParticipants(planData.participants || []);
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

    const handleParticipantChange = (user: any) => {
        const isSelected = selectedParticipants.some(p => p.userId === user._id);
        if (isSelected) {
            setSelectedParticipants(selectedParticipants.filter(p => p.userId !== user._id));
        } else {
            setSelectedParticipants([...selectedParticipants, { userId: user._id, name: user.name }]);
        }
    };

    const validateForm = () => {
        // Basic validation
        if (!formData.discipline || !formData.group || !formData.start_date || !formData.end_date) {
            setError('Discipline, Group, Start Date, and End Date are required.');
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
            const updateData = { ...formData, participants: selectedParticipants };
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
                await fetchUsers(); // Fetch users first to have the list for the UI
                await fetchTrainingPlan(params.id); // Then fetch the specific plan to pre-select participants
            }
        };
        fetchData();
    }, [params.id]);

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
                    {/* Discipline */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Discipline <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="discipline"
                            value={formData.discipline}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
                            Faculty's Organization
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
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Participants
                        </label>
                        {loadingUsers ? (
                            <div className="text-gray-500">Loading participants...</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                                {allUsers.map((user: any) => (
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
        </div>
    );
};

export default SinglePlanPage;
