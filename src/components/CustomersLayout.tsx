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
  FileText,
  Home,
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
    id: "orders",
    label: "Orders",
    icon: <ShoppingCart size={20} />,
    href: "/dashboard/orders",
    requiredRoles: ["orders", "admin"],
  },
  {
    id: "store",
    label: "Store",
    icon: <Package size={20} />,
    href: "/dashboard/inventory",
    requiredRoles: ["store_finished_goods", "store_raw_materials", "admin"],
    children: [
      {
        id: "finished-goods",
        label: "Finished Goods",
        icon: <Package size={16} />,
        href: "/dashboard/inventory/finished-goods",
        requiredRoles: ["store_finished_goods", "admin"],
      },
      {
        id: "raw-materials",
        label: "Raw Materials",
        icon: <Package size={16} />,
        href: "/dashboard/inventory/materials",
        requiredRoles: ["store_raw_materials", "admin"],
      },
    ],
  },
  {
    id: "purchase-request",
    label: "Purchase Request",
    icon: <ClipboardList size={20} />,
    href: "/dashboard/purchases",
    requiredRoles: ["purchase_request", "admin"],
  },
  {
    id: "vendors",
    label: "Vendors",
    icon: <Users size={20} />,
    href: "/dashboard/vendors",
    requiredRoles: ["vendors", "admin"],
  },
  {
    id: "production",
    label: "Production",
    icon: <Factory size={20} />,
    href: "/dashboard/production",
    requiredRoles: ["production_plans", "production_batch_mgt", "admin"],
    children: [
      {
        id: "production-plans",
        label: "Production plans",
        icon: <CheckCircle size={16} />,
        href: "/dashboard/planning",
        requiredRoles: ["production_plans", "admin"],
      },
      {
        id: "batch-management",
        label: "Batch management",
        icon: <Factory size={16} />,
        href: "/dashboard/production",
        requiredRoles: ["production_batch_mgt", "admin"],
      },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: <FileText size={20} />,
    href: "/dashboard/documents",
    requiredRoles: ["documents", "admin"],
  },
  {
    id: "machinery",
    label: "Machinery",
    icon: <Wrench size={20} />,
    href: "/dashboard/machinery",
    requiredRoles: ["machinery", "admin"],
  },
  {
    id: "report-n-complaint",
    label: "Report & Complaint",
    icon: <FileText size={20} />,
    href: "/dashboard/report",
    requiredRoles: ["reports", "admin"],
  },
  {
    id: "personnel",
    label: "Personnel",
    icon: <User size={20} />,
    href: "/dashboard/personnel",
    requiredRoles: ["personnel_team", "personnel_training", "admin"],
    children: [
      {
        id: "personnel-team",
        label: "Team",
        icon: <Users size={16} />,
        href: "/dashboard/personnel/team",
        requiredRoles: ["personnel_team", "admin"],
      },
      {
        id: "training-plans",
        label: "Training plans",
        icon: <Calendar size={16} />,
        href: "/dashboard/personnel/training-plan",
        requiredRoles: ["personnel_training", "admin"],
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Wrench size={20} />,
    href: "/dashboard/settings",
    requiredRoles: ["admin"],
  },
];

// Define mobile tab priorities (items that should appear in bottom navigation)
const mobilePriorityItems = ["dashboard", "orders", "store", "production"];

interface CustomersLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

const CustomersLayout: React.FC<CustomersLayoutProps> = ({
  children,
  currentPath = "/",
}) => {
  const { user, organization, isLoading } = useUser(); // Now we get organization from context
  const pathname = usePathname();

  // Function to check if user has access to a specific item
  const hasAccess = (itemId: string, requiredRoles: string[]) => {

    // Explicitly grant access to the purchase request page for everyone
    if (itemId === "purchase-request") {
      console.log("Purchase request - granting access");
      return true;
    }

    if (!user?.roles || user.roles.length === 0) {
      console.log("❌ No user roles found");
      return false;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => {
      const hasThisRole = user.roles.includes(role);
      console.log(`Checking role "${role}": ${hasThisRole}`);
      return hasThisRole;
    });

    console.log(`✅ Final access result for ${itemId}:`, hasRole);
    return hasRole;
  };

  // Filter navigation items based on user roles
  const getFilteredNavigationItems = () => {
    if (!user) return []; // Return empty array if no user

    return allNavigationItems
      .filter((item) => hasAccess(item.id, item.requiredRoles))
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) =>
          hasAccess(child.id, child.requiredRoles || item.requiredRoles)
        ),
      }));
  };

  // Check if current path is accessible
  const isCurrentPathAccessible = () => {
    console.log("=== PATH ACCESS CHECK ===");
    console.log("Pathname:", pathname);
    console.log("User:", user);
    console.log("User roles:", user?.roles);

    // If user is not loaded, we can't determine access yet
    if (!user) {
      console.log("No user - denying access");
      return false;
    }

    if (pathname === "/" || pathname === "/dashboard") {
      const dashboardAccess = hasAccess("dashboard", ["dashboard", "admin"]);
      console.log("Dashboard access result:", dashboardAccess);
      return dashboardAccess;
    }

    // Find the navigation item that matches the current path
    const findItemByPath = (items: typeof allNavigationItems): any => {
      console.log("Looking for path match:", pathname);

      // Create a comprehensive list of all possible routes with their items
      const allRoutes: Array<{
        path: string;
        item: any;
        type: "parent" | "child";
        parent?: any;
      }> = [];

      // Add all items and their paths
      items.forEach((item) => {
        allRoutes.push({
          path: item.href,
          item: item,
          type: "parent",
        });

        // Add children
        if (item.children) {
          item.children.forEach((child) => {
            allRoutes.push({
              path: child.href,
              item: child,
              type: "child",
              parent: item,
            });
          });
        }
      });

      // Sort by path length (descending) - longest/most specific paths first
      allRoutes.sort((a, b) => b.path.length - a.path.length);

      console.log("All routes sorted by specificity:");
      allRoutes.forEach((route) => {
        console.log(`  ${route.path} → ${route.item.id} (${route.type})`);
      });

      // Find the best match
      let bestMatch = null;

      // 1. First try exact matches
      console.log("\n--- Checking exact matches ---");
      for (const route of allRoutes) {
        console.log(`Checking exact: "${pathname}" === "${route.path}"`);
        if (pathname === route.path) {
          console.log(`✅ EXACT MATCH: ${route.item.id}`);
          bestMatch = route;
          break;
        }
      }

      // 2. If no exact match, try prefix matches (but only if the remaining path starts with /)
      if (!bestMatch) {
        console.log("\n--- Checking prefix matches ---");
        for (const route of allRoutes) {
          // Skip dashboard for prefix matching unless it's exactly /dashboard
          if (route.path === "/dashboard" && pathname !== "/dashboard") {
            console.log(`Skipping dashboard prefix match for: ${pathname}`);
            continue;
          }

          console.log(
            `Checking prefix: "${pathname}".startsWith("${route.path}")`
          );
          if (pathname.startsWith(route.path)) {
            const remainder = pathname.substring(route.path.length);
            console.log(`  Remainder: "${remainder}"`);

            // Only match if:
            // 1. It's an exact match (remainder is empty), OR
            // 2. The remainder starts with / (indicating a sub-path)
            if (remainder === "" || remainder.startsWith("/")) {
              console.log(`✅ PREFIX MATCH: ${route.item.id}`);
              bestMatch = route;
              break;
            }
          }
        }
      }

      if (bestMatch) {
        console.log(
          `\n🎯 FINAL MATCH: ${bestMatch.item.id} (${bestMatch.type})`
        );
        return bestMatch.item;
      }

      console.log("\n❌ No matching item found");
      return null;
    };

    const currentItem = findItemByPath(allNavigationItems);
    console.log("Current item found:", currentItem);

    if (!currentItem) {
      console.log("No item found - allowing access as fallback");
      return true; // If no matching item found, allow access as a fallback
    }

    console.log(
      `Checking access for ${currentItem.id} with required roles:`,
      currentItem.requiredRoles
    );
    const accessResult = hasAccess(currentItem.id, currentItem.requiredRoles);
    console.log("Final access result:", accessResult);

    return accessResult;
  };

  // Create mobile navigation items
  const createMobileNavigationItems = () => {
    const navigationItems = getFilteredNavigationItems();

    // Get priority items that user has access to
    const priorityItems = navigationItems
      .filter((item) => mobilePriorityItems.includes(item.id))
      .slice(0, 4); // Take first 4 items

    // Remaining items go to "More" menu
    const moreItems = navigationItems.filter(
      (item) => !mobilePriorityItems.includes(item.id)
    );

    const mainTabItems = [
      ...priorityItems,
      ...(moreItems.length > 0
        ? [
            {
              id: "more",
              label: "More",
              icon: <MoreHorizontal size={20} />,
              href: "/dashboard/more",
            },
          ]
        : []),
    ];

    return { mainTabItems, moreMenuItems: moreItems };
  };

  // Show loading screen while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading but no user, redirect to login (this shouldn't happen in your protected routes)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 mb-4">
            Please log in to access this section.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Now check if user has access to current path
  const pathAccessible = isCurrentPathAccessible();

  if (pathname !== "/" && !pathAccessible) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600 mb-4">
              You don&apos;t have permission to access this section. Please
              contact your administrator if you believe this is an error.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Current roles: {user.roles?.join(", ") || "None"}
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
      </div>
    );
  }

  const navigationItems = getFilteredNavigationItems();
  const { mainTabItems, moreMenuItems } = createMobileNavigationItems();

  // Get organization logo or fallback to empty string
  const organizationLogo = organization?.logo || "";
  const companyName = organization?.name || user?.orgName || "Company";

  console.log("Organization details:", {
    organizationExists: !!organization,
    logoUrl: organizationLogo,
    orgName: companyName,
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar
          navigationItems={navigationItems}
          currentPath={currentPath}
          className="w-full"
          userType="organization"
          logoSrc={organizationLogo}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content Header */}
        <MobileHeader
          companyName={companyName}
          userName={user?.name || "User"}
        />

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
