"use client"
import CustomerApis from '@/actions/Apis/CustomerApis'
import OrgUserApis from '@/actions/Apis/OrgUserApis'
import ReportApis from '@/actions/Apis/ReportApis' // Assuming a ReportApis file exists
import Button from '@/components/ReusableComponents/Button'
import InputField from '@/components/ReusableComponents/InputField'
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

// TypeScript interfaces for fetched data
interface Customer {
    _id: string;
    name: string;
    phone: string;
    email: string;
}

interface OrgUser {
    _id: string;
    name: string;
    email: string;
}

// TypeScript interface for form data
interface ReportFormData {
    customer_id: string;
    subject: string;
    request_by: string;
    description: string;
    email: string;
    request_date: string;
    mobile: string;
    priority: string;
    category: string;
    assign_to: string;
    sub_category: string;
    status: string;
    resolution_date: string;
    resolution_note: string;
    org_id: string;
}

const CreateReportPage = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [formLoading, setFormLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [formData, setFormData] = useState<ReportFormData>({
        customer_id: '',
        subject: '',
        request_by: '',
        description: '',
        email: '',
        request_date: new Date().toISOString().split('T')[0],
        mobile: '',
        priority: '',
        category: '',
        assign_to: '',
        sub_category: '',
        status: 'open',
        resolution_date: '',
        resolution_note: '',
        org_id: '',
    });
    const router = useRouter();
    const { user } = useUser();

    // Fetch customers and organization users on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch customers
                const customerRes = await CustomerApis.getAllCustomers();
                if (customerRes.status === 200) {
                    setCustomers(customerRes.data.customers || []);
                }

                // Fetch organization users
                const orgUserRes = await OrgUserApis.getAllUsers();
                if (orgUserRes.status === 200) {
                    setOrgUsers(orgUserRes.data.users || []);
                }
            } catch (err: any) {
                console.error("Error fetching initial data:", err);
                setError("Failed to fetch initial data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Handle form field changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle customer selection to auto-populate fields
    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const customerId = e.target.value;
        const selectedCustomer = customers.find(c => c._id === customerId);
        setFormData(prev => ({
            ...prev,
            customer_id: customerId,
            email: selectedCustomer?.email || '',
            mobile: selectedCustomer?.phone || '',
        }));
    };
    
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError("");

        try {
            // Find the selected user object to get the name
            const selectedUser = orgUsers.find(user => user._id === formData.assign_to);
            
            const reportData = {
                ...formData,
                org_id: user?.organizationId || "",
                // Replace assign_to ID with the user's name
                assign_to: selectedUser ? selectedUser.name : '',
            }

            const res = await ReportApis.createReport(reportData); // Assuming API call
            if (res.status === 200 || res.status === 201) {
                router.push('/dashboard/report'); // Redirect to reports page
            } else {
                throw new Error(res.data?.message || "Failed to create report");
            }
        } catch (err: any) {
            console.error("Error creating report:", err);
            setError(err.response?.data?.message || err.message || "An error occurred while creating the report.");
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        Create New Report
                    </h1>
                    <p className="text-gray-600">
                        Fill in the details below to create a new helpdesk report.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-6xl mx-auto">
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Customer</label>
                                <select
                                    name="customer_id"
                                    value={formData.customer_id}
                                    onChange={handleCustomerChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">--- Select ---</option>
                                    {customers.map((customer) => (
                                        <option key={customer._id} value={customer._id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <InputField
                                label="Subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                placeholder="Enter report subject"
                                required
                            />

                            {/* Request By */}
                            <InputField
                                label="Request By"
                                name="request_by"
                                value={formData.request_by}
                                onChange={handleInputChange}
                                placeholder="Enter name of requester"
                            />

                            {/* Description */}
                            <div className="md:col-span-2">
                                <InputField
                                    label="Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    type="textarea"
                                    rows={4}
                                    placeholder="Enter detailed description of the report"
                                />
                            </div>

                            {/* Email */}
                            <InputField
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter customer email"
                                required
                            />

                            {/* Request Date */}
                            <InputField
                                label="Request Date"
                                name="request_date"
                                type="date"
                                value={formData.request_date}
                                onChange={handleInputChange}
                                required
                            />

                            {/* Mobile */}
                            <InputField
                                label="Mobile"
                                name="mobile"
                                type="tel"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                placeholder="Enter customer mobile number"
                            />

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">--- Select ---</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">--- Select ---</option>
                                    {/* Add static categories here or fetch from an API */}
                                    <option value="billing">Billing</option>
                                    <option value="technical">Technical</option>
                                    <option value="general_inquiry">General Inquiry</option>
                                </select>
                            </div>

                            {/* Assign to */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Assign to</label>
                                <select
                                    name="assign_to"
                                    value={formData.assign_to}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">--- Please Select ---</option>
                                    {orgUsers.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={formLoading}
                            className="min-w-32"
                        >
                            {formLoading ? 'Creating...' : 'Create Report'}
                        </Button>
                    </div>
                </form>

                {/* Loading Overlay */}
                {formLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="text-gray-700 font-medium">
                                Creating report...
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateReportPage
