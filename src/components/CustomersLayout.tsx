/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Wrench,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import MobileHeader from "./ReusableComponents/MobileHeader";
import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";

// Define all navigation items with their required roles
const allNavigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Home size={20} />,
    href: "/dashboard",
    requiredRoles: ["dashboard", "admin"],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: <ShoppingCart size={20} />,
    href: '/dashboard/orders',
    requiredRoles: ["order_mgt", "admin"],
  },
  {
    id: 'store',
    label: 'Store',
    icon: <Package size={20} />,
    href: '/dashboard/inventory',
    requiredRoles: ["store_mgt", "admin"],
    children: [
      { id: 'finished-goods', label: 'Finished Goods', icon: <Package size={16} />, href: '/dashboard/inventory/finished-goods', requiredRoles: ["store_mgt", "admin"] },
      { id: 'raw-materials', label: 'Raw Materials', icon: <Package size={16} />, href: '/dashboard/inventory/materials', requiredRoles: ["store_mgt", "admin"] }
    ]
  },
  {
    id: 'purchase-request',
    label: 'Purchase Request',
    icon: <ClipboardList size={20} />,
    href: '/dashboard/purchases',
    requiredRoles: ["*"], // Available to everyone
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: <Users size={20} />,
    href: '/dashboard/vendors',
    requiredRoles: ["vendors_mgt", "admin"],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: <FileText size={20} />,
    href: '/dashboard/documents',
    requiredRoles: ["document_mgt", "admin"],
  },
  {
    id: 'machinery',
    label: 'Machinery',
    icon: <Wrench size={20} />,
    href: '/dashboard/machinery',
    requiredRoles: ["machinery_mgt", "admin"],
  },
  {
    id: 'report-n-complaint',
    label: 'Report & Complaint',
    icon: <FileText size={20} />,
    href: '/dashboard/report',
    requiredRoles: ["report", "admin"],
  },
  {
    id: 'personnel',
    label: 'Personnel',
    icon: <User size={20} />,
    href: '/dashboard/personnel',
    requiredRoles: ["admin"], // Only admin can access personnel management
    children: [
      { id: 'personnel-team', label: 'Team', icon: <Users size={16} />, href: '/dashboard/personnel/team', requiredRoles: ["admin"] },
      { id: 'training-plans', label: 'Training plans', icon: <Calendar size={16} />, href: '/dashboard/personnel/training-plan', requiredRoles: ["admin"] }
    ]
  },
];

// Define mobile tab priorities (items that should appear in bottom navigation)
const mobilePriorityItems = [
  "dashboard",
  "orders", 
  "store",
  "personnel"
];

interface CustomersLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

const CustomersLayout: React.FC<CustomersLayoutProps> = ({
  children,
  currentPath = "/",
}) => {
  const { user } = useUser();
  const pathname = usePathname();

  // Function to check if user has access to a specific item
  const hasAccess = (requiredRoles: string[]) => {
    if (!user?.roles || user.roles.length === 0) return false;
    
    // If "*" is in required roles, it's available to everyone
    if (requiredRoles.includes("*")) return true;
    
    // Check if user has any of the required roles
    return requiredRoles.some(role => user.roles.includes(role));
  };

  // Filter navigation items based on user roles
  const getFilteredNavigationItems = () => {
    return allNavigationItems
      .filter(item => hasAccess(item.requiredRoles))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => 
          hasAccess(child.requiredRoles || item.requiredRoles)
        )
      }));
  };

  // Check if current path is accessible
  const isCurrentPathAccessible = () => {
    if (pathname === "/" || pathname === "/dashboard") {
      return hasAccess(["dashboard", "admin"]);
    }

    // Find the navigation item that matches the current path
    const findItemByPath = (items: typeof allNavigationItems): any => {
      for (const item of items) {
        if (pathname.startsWith(item.href)) {
          return item;
        }
        if (item.children) {
          for (const child of item.children) {
            if (pathname.startsWith(child.href)) {
              return child;
            }
          }
        }
      }
      return null;
    };

    const currentItem = findItemByPath(allNavigationItems);
    if (!currentItem) return true; // If no matching item found, allow access

    return hasAccess(currentItem.requiredRoles);
  };

  // Get filtered navigation items
  const navigationItems = getFilteredNavigationItems();

  // Create mobile navigation items
  const createMobileNavigationItems = () => {
    // Get priority items that user has access to
    const priorityItems = navigationItems.filter(item => 
      mobilePriorityItems.includes(item.id)
    ).slice(0, 4); // Take first 4 items

    // Remaining items go to "More" menu
    const moreItems = navigationItems.filter(item => 
      !mobilePriorityItems.includes(item.id)
    );

    const mainTabItems = [
      ...priorityItems,
      ...(moreItems.length > 0 ? [{
        id: 'more',
        label: 'More',
        icon: <MoreHorizontal size={20} />,
        href: '/dashboard/more'
      }] : [])
    ];

    return { mainTabItems, moreMenuItems: moreItems };
  };

  const { mainTabItems, moreMenuItems } = createMobileNavigationItems();

  // Show loader if user doesn't have access to current path and it's not root
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (pathname !== "/" && !isCurrentPathAccessible()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-6"></div>
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600 mb-4">
              You don&apos;t have permission to access this section. Please contact your administrator if you believe this is an error.
            </p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <MobileHeader companyName={user?.orgName || "Company"} userName={user?.name || "User"} />
        
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