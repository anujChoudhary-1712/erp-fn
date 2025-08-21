"use client"
import ReportApis from '@/actions/Apis/ReportApis'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import Button from '@/components/ReusableComponents/Button';

// TypeScript interfaces for report data
interface Customer {
    _id: string;
    name: string;
    phone: string;
}

interface Report {
    _id: string;
    customer_id: Customer;
    subject: string;
    request_by: string;
    description: string;
    email: string;
    request_date: string;
    mobile: string;
    priority: string;
    category: string;
    assign_to: string;
    status: 'open' | 'resolved'; // Added status field
    created_date: string;
}

interface Tab {
    id: string;
    label: string;
    count: number;
}

const ReportsPage = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [allReports, setAllReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>('open');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const router = useRouter();

    const fetchAllReports = async () => {
        setLoading(true);
        try {
            const res = await ReportApis.getAllReports();
            if (res.status === 200) {
                const fetchedReports = res.data.reportNcomplaints || [];
                setAllReports(fetchedReports);
                // Set initial filtered reports based on 'open' tab
                setReports(fetchedReports.filter((report: { status: string; }) => report.status === 'open'));
            } else {
                setReports([]);
                setAllReports([]);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
            setReports([]);
            setAllReports([]);
        } finally {
            setLoading(false);
        }
    }

    // Filter reports when the active tab changes
    useEffect(() => {
        if (activeTab === 'open') {
            setReports(allReports.filter(report => report.status === 'open'));
        } else if (activeTab === 'resolved') {
            setReports(allReports.filter(report => report.status === 'resolved'));
        }
    }, [activeTab, allReports]);

    useEffect(() => {
        fetchAllReports();
    }, []);

    const handleMarkAsResolved = async (reportId: string) => {
        if (!window.confirm("Are you sure you want to mark this report as resolved?")) {
            return;
        }

        setActionLoading(reportId);
        try {
            // Call the API to update the report status to 'resolved'
            const res = await ReportApis.updateReport(reportId, { status: "resolved" });
            if (res.status === 200) {
                // Update the state to reflect the change
                setAllReports(prevReports => 
                    prevReports.map(report =>
                        report._id === reportId ? { ...report, status: 'resolved' } : report
                    )
                );
                // Show a success message if needed, or simply let the UI update
            } else {
                console.error("Failed to update report status:", res.data);
                alert("Failed to mark report as resolved.");
            }
        } catch (error) {
            console.error("Error updating report status:", error);
            alert("An error occurred while marking the report as resolved.");
        } finally {
            setActionLoading(null);
        }
    };

    const getTabCounts = () => {
        const counts = {
            open: allReports.filter(r => r.status === 'open').length,
            resolved: allReports.filter(r => r.status === 'resolved').length,
        };
        return counts;
    };

    const tabCounts = getTabCounts();
    const tabs: Tab[] = [
        { id: "open", label: "Open", count: tabCounts.open },
        { id: "resolved", label: "Resolved", count: tabCounts.resolved },
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const ReportCard = ({ report }: { report: Report }) => (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-md font-semibold text-gray-900 truncate flex-1">
                        {report.subject}
                    </h3>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                    </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>{report.customer_id.name}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        <span>Assigned to: {report.assign_to || 'N/A'}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-1 16H6a1 1 0 01-1-1V9h14v10a1 1 0 01-1 1z" /></svg>
                        <span>Date: {new Date(report.created_date).toLocaleDateString()}</span>
                    </p>
                </div>
                {report.description && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-xs font-medium text-gray-800">Description:</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">{report.description}</p>
                    </div>
                )}
            </div>

            {activeTab === 'open' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                        variant="success"
                        className="w-full text-sm"
                        onClick={() => handleMarkAsResolved(report._id)}
                        disabled={actionLoading === report._id}
                    >
                        {actionLoading === report._id ? 'Resolving...' : 'Mark as Resolved'}
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">
                    Reports
                </h1>
                <Button
                    variant="primary"
                    className="w-full md:w-auto"
                    onClick={() => router.push("/dashboard/report/create")}
                >
                    + Create Report
                </Button>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeTab === tab.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            {tab.label}
                            <span
                                className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                    activeTab === tab.id
                                        ? "bg-blue-100 text-blue-600"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No {activeTab} reports found
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {activeTab === 'open' ? "There are no open reports at the moment." : "All reports are currently open."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <ReportCard key={report._id} report={report} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
