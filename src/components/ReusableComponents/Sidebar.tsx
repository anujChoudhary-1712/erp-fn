"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, LogOut, Bell } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import NotificationApis from "@/actions/Apis/NotificationApis";
import Image from "next/image";
import proscaLogo from "../../../public/images/logo.png"

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  children?: NavItem[];
}

interface SidebarProps {
  navigationItems: NavItem[];
  currentPath?: string;
  className?: string;
  userType: "internal" | "organization";
  logoSrc?: string;
}

interface Notification {
  _id: string;
  materialId?: string;
  materialName?: string;
  currentStock?: number;
  triggerValue?: number;
  message?: string;
  planId?: string;
  access?: string[];
  isRead: boolean;
  org_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  currentPath = "/",
  className = "",
  userType,
  logoSrc
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(["production"]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const { user, logout } = useUser();
  const router = useRouter();

  // Function to check if user has access to a notification
  const hasNotificationAccess = (notification: Notification) => {
    // If no access array is defined, default to allowing access (backward compatibility)
    if (!notification.access || notification.access.length === 0) {
      return true;
    }

    // If access array contains "all", show to everyone
    if (notification.access.includes('all')) {
      return true;
    }

    // If no user or user roles, deny access
    if (!user?.roles || user.roles.length === 0) {
      return false;
    }

    // Check if user has any of the roles specified in the access array
    return notification.access.some(accessRole => user.roles.includes(accessRole));
  };

  // Filter notifications based on user access
  const filterNotificationsByAccess = (notifications: Notification[]) => {
    return notifications.filter(notification => hasNotificationAccess(notification));
  };

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const res = await NotificationApis.getAllNotifications(`isRead=false`);
      if (res.status === 200) {
        // Filter notifications based on user access before counting
        const filteredNotifications = filterNotificationsByAccess(res.data || []);
        setUnreadCount(filteredNotifications.length);
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  // Setup polling for notifications, only for organization users
  useEffect(() => {
    if (userType === "organization" && user) {
      // Initial fetch - only after user is loaded
      fetchUnreadCount();

      // Setup polling interval
      const pollInterval = setInterval(() => {
        if (isPolling && user) {
          fetchUnreadCount();
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup on unmount
      return () => clearInterval(pollInterval);
    }
  }, [isPolling, userType, user]); // Added user as dependency

  // Pause polling when tab is not visible (optional optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPolling(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.id);
    } else {
      router.push(item.href);
    }
  };

  const handleNotificationClick = () => {
    router.push("/dashboard/notifications");
  };

  const handleLogout = () => {
    logout(userType);
  };

  const isActive = (href: string) => currentPath === href;
  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some((child) => isActive(child.href)) || false;
  };

  // Get the first letter of user's name for avatar
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Determine which name to display based on userType
  const companyName = userType === "internal" ? "Prosca" : user?.orgName || "Organization";

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const itemIsActive = isActive(item.href);
    const parentIsActive = isParentActive(item);

    return (
      <div key={item.id} className="mb-1">
        <div
          onClick={() => handleItemClick(item)}
          className={`
            flex items-center justify-between w-full px-3 py-2 text-left rounded-lg cursor-pointer transition-colors duration-200
            ${level > 0 ? "ml-6 text-sm" : "text-base"}
            ${
              itemIsActive
                ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500"
                : parentIsActive && level === 0
                ? "bg-gray-100 text-gray-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }
          `}
        >
          <div className="flex items-center space-x-3">
            <span className={itemIsActive ? "text-blue-600" : "text-gray-500"}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </div>

          {hasChildren && (
            <span className="text-gray-400">
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-full ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header with Notification Bell */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image
                src={logoSrc ? logoSrc : proscaLogo}
                alt="Prosca Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h2 className="text-xl font-bold text-gray-800">{companyName}</h2>
            </div>

            {/* Notification Bell - visible only for organization users with proper access */}
            {userType === "organization" && user && (
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className={`
                    p-2 rounded-lg transition-colors duration-200 relative
                    ${currentPath === '/dashboard/notifications'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  aria-label="View notifications"
                >
                  <Bell size={20} />

                  {/* Unread Count Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => renderNavItem(item))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userInitial}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </p>
                {/* Optional: Show connection status */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <p className="text-xs text-gray-500">
                    {isPolling ? 'Connected' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;