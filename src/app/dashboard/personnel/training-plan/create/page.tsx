"use client"
import React, { useState } from 'react';
import TrainingPlanApis from '@/actions/Apis/TrainingPlanApis';
import TrainingPlanForm from '@/components/forms/TrainingPlanForm';
import { useRouter } from 'next/navigation';

const CreateTrainingPlanPage = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter()

    const handleSubmit = async (formData: any) => {
        setLoading(true);
        try {
            const res = await TrainingPlanApis.addTrainingPlan(formData);
            if (res.status === 201) {
                console.log("Training plan created successfully:", res.data);
                router.push('/dashboard/personnel/training-plan');
            } else {
                console.error("Failed to create training plan:", res.data);
                // Handle non-201 status codes
            }
        } catch (error) {
            console.error("Error creating training plan:", error);
            // You can also update a state variable to display an error message on the page
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Create Training Plan</h1>
            <TrainingPlanForm onSubmit={handleSubmit} loading={loading} />
        </div>
    );
};

export default CreateTrainingPlanPage;
