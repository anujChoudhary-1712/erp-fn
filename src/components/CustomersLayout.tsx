/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from "react";
import Sidebar from "./ReusableComponents/Sidebar";
import MobileNavigation from "./ReusableComponents/MobileNavigation";
import {
  ShoppingCart,
  Calendar,
  Package,
  Users,
  Factory,
  CheckCircle,
  Truck,
  RotateCcw,
  FileText,
  Home,
  Settings,
  MoreHorizontal,
  User,
} from "lucide-react";
import MobileHeader from "./ReusableComponents/MobileHeader";

// Define navigation items
const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Home size={20} />,
    href: "/dashboard",
  },
  {
    id: 'purchase-orders',
    label: 'Purchase Orders',
    icon: <ShoppingCart size={20} />,
    href: '/dashboard/orders',
    // children: [
    //   { id: 'po-review', label: 'Order Review', icon: <CheckCircle size={16} />, href: '/dashboard/purchase-orders/review' },
    //   { id: 'po-checklist', label: 'Order Checklist', icon: <FileText size={16} />, href: '/dashboard/purchase-orders/checklist' },
    //   { id: 'finished-goods', label: 'Finished Goods Store', icon: <Package size={16} />, href: '/dashboard/purchase-orders/finished-goods' }
    // ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Package size={20} />,
    href: '/dashboard/inventory',
    children: [
      { id: 'finished-goods', label: 'Finished Goods', icon: <Package size={16} />, href: '/dashboard/inventory/finished-goods' },
      // { id: 'raw-materials', label: 'Raw Materials', icon: <Package size={16} />, href: '/dashboard/inventory/raw-materials' }
    ]
  },
  //   {
  //     id: 'production',
  //     label: 'Production Planning',
  //     icon: <Calendar size={20} />,
  //     href: '/dashboard/production',
  //     children: [
  //       { id: 'monthly-planning', label: 'Monthly Planning', icon: <Calendar size={16} />, href: '/dashboard/production/monthly' },
  //       { id: 'weekly-planning', label: 'Weekly Planning', icon: <Calendar size={16} />, href: '/dashboard/production/weekly' },
  //       { id: 'daily-planning', label: 'Daily Planning', icon: <Calendar size={16} />, href: '/dashboard/production/daily' },
  //       { id: 'raw-materials', label: 'Raw Material Requirements', icon: <Package size={16} />, href: '/dashboard/production/raw-materials' }
  //     ]
  //   },
  //   {
  //     id: 'vendors',
  //     label: 'Vendor Management',
  //     icon: <Users size={20} />,
  //     href: '/dashboard/vendors',
  //     children: [
  //       { id: 'vendor-evaluation', label: 'Vendor Evaluation', icon: <CheckCircle size={16} />, href: '/dashboard/vendors/evaluation' },
  //       { id: 'purchase-verification', label: 'Purchase Verification', icon: <FileText size={16} />, href: '/dashboard/vendors/verification' }
  //     ]
  //   },
  //   {
  //     id: 'production-stage',
  //     label: 'Production Stage',
  //     icon: <Factory size={20} />,
  //     href: '/dashboard/production-stage',
  //     children: [
  //       { id: 'cutting', label: 'Cutting', icon: <Factory size={16} />, href: '/dashboard/production-stage/cutting' },
  //       { id: 'stitching', label: 'Stitching', icon: <Factory size={16} />, href: '/dashboard/production-stage/stitching' },
  //       { id: 'folding', label: 'Folding', icon: <Factory size={16} />, href: '/dashboard/production-stage/folding' },
  //       { id: 'packing', label: 'Packing', icon: <Package size={16} />, href: '/dashboard/production-stage/packing' }
  //     ]
  //   },
  //   {
  //     id: 'quality-check',
  //     label: 'Quality Control',
  //     icon: <CheckCircle size={20} />,
  //     href: '/dashboard/quality-check',
  //     children: [
  //       { id: 'qc-inspection', label: 'Quality Inspection', icon: <CheckCircle size={16} />, href: '/dashboard/quality-check/inspection' },
  //       { id: 'rework', label: 'Rework Management', icon: <RotateCcw size={16} />, href: '/dashboard/quality-check/rework' },
  //       { id: 'rejection', label: 'Rejection Handling', icon: <FileText size={16} />, href: '/dashboard/quality-check/rejection' }
  //     ]
  //   },
  //   {
  //     id: 'dispatch',
  //     label: 'Dispatch & Accounts',
  //     icon: <Truck size={20} />,
  //     href: '/dashboard/dispatch',
  //     children: [
  //       { id: 'dispatch-approval', label: 'Dispatch Approval', icon: <CheckCircle size={16} />, href: '/dashboard/dispatch/approval' },
  //       { id: 'invoicing', label: 'Invoicing', icon: <FileText size={16} />, href: '/dashboard/dispatch/invoicing' }
  //     ]
  //   },
  //   {
  //     id: 'returns',
  //     label: 'Returns & Complaints',
  //     icon: <RotateCcw size={20} />,
  //     href: '/dashboard/returns',
  //     children: [
  //       { id: 'return-handling', label: 'Return Handling', icon: <RotateCcw size={16} />, href: '/dashboard/returns/handling' },
  //       { id: 'complaints', label: 'Complaint Management', icon: <FileText size={16} />, href: '/dashboard/returns/complaints' }
  //     ]
  //   },
  //   {
  //     id: 'documents',
  //     label: 'Document Management',
  //     icon: <FileText size={20} />,
  //     href: '/dashboard/documents',
  //     children: [
  //       { id: 'iso-docs', label: 'ISO Documents', icon: <FileText size={16} />, href: '/dashboard/documents/iso' },
  //       { id: 'bis-docs', label: 'BIS Documents', icon: <FileText size={16} />, href: '/dashboard/documents/bis' },
  //       { id: 'qms-docs', label: 'QMS Documents', icon: <FileText size={16} />, href: '/dashboard/documents/qms' },
  //       { id: 'doc-review', label: 'Document Review', icon: <CheckCircle size={16} />, href: '/dashboard/documents/review' }
  //     ]
  //   },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   icon: <Settings size={20} />,
  //   href: "/dashboard/settings",
  // },
  {
    id: "team",
    label: "Team",
    icon: <User size={20} />,
    href: "/dashboard/team",
  },
];

// Main tab items for mobile navigation (bottom tabs)
const mainTabItems = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={20} />,
    href: "/dashboard",
  },
  {
    id: "orders",
    label: "Orders",
    icon: <ShoppingCart size={20} />,
    href: "/dashboard/orders",
    badge: 5,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: <Package size={20} />,
    href: "/dashboard/inventory",
  },
  //   {
  //     id: 'production',
  //     label: 'Production',
  //     icon: <Factory size={20} />,
  //     href: '/dashboard/production',
  //     badge: 4
  //   },
  //   {
  //     id: 'quality',
  //     label: 'Quality',
  //     icon: <CheckCircle size={20} />,
  //     href: '/dashboard/quality-check',
  //     badge: 3
  //   },
  //   {
  //     id: 'more',
  //     label: 'More',
  //     icon: <MoreHorizontal size={20} />,
  //     href: '/dashboard/more'
  //   }
  // {
  //   id: "settings",
  //   label: "Settings",
  //   icon: <Settings size={20} />,
  //   href: "/dashboard/settings",
  // },
  {
    id: "team",
    label: "Team",
    icon: <User size={20} />,
    href: "/dashboard/team",
  },
];

// More menu items for mobile navigation
const moreMenuItems: { id: string; label: string; icon: JSX.Element; href: string; badge?: number; children?: { id: string; label: string; icon: JSX.Element; href: string; }[]; }[] = [
  //   {
  //     id: 'dispatch',
  //     label: 'Dispatch & Accounts',
  //     icon: <Truck size={20} />,
  //     href: '/dashboard/dispatch',
  //     badge: 2,
  //     children: [
  //       { id: 'dispatch-approval', label: 'Dispatch Approval', icon: <CheckCircle size={16} />, href: '/dashboard/dispatch/approval' },
  //       { id: 'invoicing', label: 'Invoicing', icon: <FileText size={16} />, href: '/dashboard/dispatch/invoicing' }
  //     ]
  //   },
  //   {
  //     id: 'returns',
  //     label: 'Returns & Complaints',
  //     icon: <RotateCcw size={20} />,
  //     href: '/dashboard/returns',
  //     badge: 1,
  //     children: [
  //       { id: 'return-handling', label: 'Handle returns and customer issues', icon: <RotateCcw size={16} />, href: '/dashboard/returns/handling' },
  //       { id: 'complaints', label: 'Complaint Management', icon: <FileText size={16} />, href: '/dashboard/returns/complaints' }
  //     ]
  //   },
  //   {
  //     id: 'documents',
  //     label: 'Documents',
  //     icon: <FileText size={20} />,
  //     href: '/dashboard/documents',
  //     children: [
  //       { id: 'iso-docs', label: 'Access all company documents', icon: <FileText size={16} />, href: '/dashboard/documents/all' },
  //       { id: 'doc-review', label: 'Document Review', icon: <CheckCircle size={16} />, href: '/dashboard/documents/review' }
  //     ]
  //   },
  //   {
  //     id: 'vendors',
  //     label: 'Vendor Management',
  //     icon: <Users size={20} />,
  //     href: '/dashboard/vendors',
  //     children: [
  //       { id: 'vendor-evaluation', label: 'Vendor Evaluation', icon: <CheckCircle size={16} />, href: '/dashboard/vendors/evaluation' },
  //       { id: 'purchase-verification', label: 'Purchase Verification', icon: <FileText size={16} />, href: '/dashboard/vendors/verification' }
  //     ]
  //   },
  //   {
  //     id: 'production-stage',
  //     label: 'Production Stage',
  //     icon: <Factory size={20} />,
  //     href: '/dashboard/production-stage',
  //     children: [
  //       { id: 'cutting', label: 'Cutting Stage', icon: <Factory size={16} />, href: '/dashboard/production-stage/cutting' },
  //       { id: 'stitching', label: 'Stitching Stage', icon: <Factory size={16} />, href: '/dashboard/production-stage/stitching' },
  //       { id: 'folding', label: 'Folding Stage', icon: <Factory size={16} />, href: '/dashboard/production-stage/folding' },
  //       { id: 'packing', label: 'Packing Stage', icon: <Package size={16} />, href: '/dashboard/production-stage/packing' }
  //     ]
  //   },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   icon: <Settings size={20} />,
  //   href: "/dashboard/settings",
  //   children: [
  //     {
  //       id: "profile",
  //       label: "Manage your profile and preferences",
  //       icon: <Settings size={16} />,
  //       href: "/dashboard/settings/profile",
  //     },
  //   ],
  // },
];

interface CustomersLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

const CustomersLayout: React.FC<CustomersLayoutProps> = ({
  children,
  currentPath = "/",
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar
          navigationItems={navigationItems}
          currentPath={currentPath}
          className="w-full"
          userType="organization"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content Header */}
        <MobileHeader companyName="test org" userName="Anuj Choudhary" />
        {/* Main Content */}
        <main className="flex-1 md:overflow-auto pb-20 md:pb-0">
          <div className="h-full">
            {/* Add padding bottom on mobile to account for bottom navigation */}
            <div className="pb-20 lg:pb-0 h-full">{children}</div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNavigation
          mainTabItems={mainTabItems}
          moreMenuItems={moreMenuItems}
          currentPath={currentPath}
        />
      </div>
    </div>
  );
};

export default CustomersLayout;