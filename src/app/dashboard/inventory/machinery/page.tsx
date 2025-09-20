/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import MachineryApis from '@/actions/Apis/MachineryApis'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import Button from '@/components/ReusableComponents/Button';

// TypeScript interface for machinery data
interface Machinery {
    _id: string;
    name: string;
    lab_id: string;
    device_type: string;
    make: string;
    model: string;
    standard_type: string;
    discipline: string;
}

const MachineryPage = () => {
    const [machineryList, setMachineryList] = useState<Machinery[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const router = useRouter();

    const fetchMachineryData = async () => {
        setLoading(true);
        try {
            const res = await MachineryApis.getAllMachinery();
            if(res.status === 200){
                setMachineryList(res.data.machinery || []);
            } else {
                setError("Failed to fetch machinery data.");
            }
        } catch (err: any) {
            console.error("Error fetching machinery data:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        fetchMachineryData();
    },[])

    const navigateToSingleMachinery = (id: string) => {
        router.push(`/dashboard/inventory/machinery/${id}`);
    }

    const MachineryCard = ({ machinery }: { machinery: Machinery }) => (
        <div 
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300"
            onClick={() => navigateToSingleMachinery(machinery._id)}
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                    {machinery.name}
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {machinery.lab_id}
                </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2h1.03l1-1.71-3.23-3.23zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                    <span>{machinery.device_type}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    <span>{machinery.make} - {machinery.model}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                    <span>{machinery.discipline} - {machinery.standard_type}</span>
                </div>
            </div>
        </div>
    )

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">
                    Machinery
                </h1>
                <Button
                    variant="primary"
                    className="w-full md:w-auto"
                    onClick={() => router.push("/dashboard/purchases/create")}
                >
                    + Add Machinery
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button variant="outline" onClick={fetchMachineryData}>
                        Try Again
                    </Button>
                </div>
            ) : machineryList.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No machinery found
                    </h3>
                    <p className="text-gray-600 mb-4">
                        You haven&apos;t added any machinery yet. Start by adding your first one.
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => router.push("/dashboard/purchases/create")}
                    >
                        Add Your First Machinery
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {machineryList.map((machinery) => (
                        <MachineryCard key={machinery._id} machinery={machinery} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MachineryPage;
