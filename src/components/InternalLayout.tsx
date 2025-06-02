"use client"
import React from 'react';
import Sidebar from './ReusableComponents/Sidebar';
import MobileNavigation from './ReusableComponents/MobileNavigation';
import { 
  Building2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

// Define navigation items for organizations
const navigationItems = [
  {
    id: 'organizations',
    label: 'Organizations',
    icon: <Building2 size={20} />,
    href: '/internal/organizations'
  }
];

// Main tab items for mobile navigation (bottom tabs)
const mainTabItems = [
  {
    id: 'organizations',
    label: 'Organizations',
    icon: <Building2 size={20} />,
    href: '/internal/organizations',
    badge: 12
  }
];

interface InternalLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

const InternalLayout: React.FC<InternalLayoutProps> = ({ 
  children, 
  currentPath = '/internal' 
}) => {
  const pathname = usePathname()
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {pathname !== "/internal/login" && <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar 
          navigationItems={navigationItems}
          currentPath={currentPath}
          className="w-full"
          userType='internal'
        />
      </div>}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {/* Add padding bottom on mobile to account for bottom navigation */}
            <div className="pb-20 lg:pb-0 h-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNavigation 
          mainTabItems={mainTabItems}
          moreMenuItems={[]}
          currentPath={currentPath}
        />
      </div>
    </div>
  );
};

export default InternalLayout;