import React, { useState, useEffect } from 'react';
import Button from '@/components/ReusableComponents/Button';

interface TrainingPlanFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

const TrainingPlanForm = ({ onSubmit, loading = false }: TrainingPlanFormProps) => {
    // State to hold form data
    const [formData, setFormData] = useState({
        discipline: '',
        group: '',
        start_date: '',
        end_date: ''
    });

    // State for form validation errors
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.discipline || !formData.group || !formData.start_date || !formData.end_date) {
            setError('All fields are required.');
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
        if (validateForm()) {
            try {
                await onSubmit(formData);
                setFormData({ // Reset form after successful submission
                    discipline: '',
                    group: '',
                    start_date: '',
                    end_date: ''
                });
            } catch (err) {
                console.error('Submission error:', err);
                setError('Failed to submit the training plan. Please try again.');
            }
        }
    };

    return (
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
                        placeholder="e.g., Electro-Technical"
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
                        placeholder="e.g., Temperature Simulation"
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
            </div>
            
            {/* Submit button */}
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="min-w-32"
                >
                    {loading ? 'Submitting...' : 'Save Training Plan'}
                </Button>
            </div>
        </div>
    );
};

export default TrainingPlanForm;
