"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

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
}

const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  currentPath = "/",
  className = "",
  userType,
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(["production"]);
  const { user, logout } = useUser();
  const router = useRouter();

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
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">test org</h2>
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
