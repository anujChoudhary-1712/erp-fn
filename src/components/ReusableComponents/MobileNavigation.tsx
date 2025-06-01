import React, { useState } from 'react';
import { 
  MoreHorizontal,
//   Bell,
  ChevronLeft
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  children?: NavItem[];
}

interface MainTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface MobileNavProps {
  mainTabItems: MainTabItem[];
  moreMenuItems: NavItem[];
  currentPath?: string;
  className?: string;
}

const MobileNavigation: React.FC<MobileNavProps> = ({ 
  mainTabItems,
  moreMenuItems,
  currentPath = '/', 
  className = '' 
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState<string | null>(null);

  const handleTabClick = (item: MainTabItem) => {
    if (item.id === 'more') {
      setShowMoreMenu(true);
    } else {
      // Navigate using Next.js router or window.location
      window.location.href = item.href;
    }
  };

  const handleMoreItemClick = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      setShowSubMenu(item.id);
    } else {
      window.location.href = item.href;
      setShowMoreMenu(false);
    }
  };

  const handleSubItemClick = (href: string) => {
    window.location.href = href;
    setShowMoreMenu(false);
    setShowSubMenu(null);
  };

  const isActive = (href: string) => currentPath === href;

  const renderBottomTabs = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pb-safe z-40">
      <div className="flex justify-around items-center h-16">
        {mainTabItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item)}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 relative ${
              isActive(item.href) 
                ? 'text-blue-600' 
                : 'text-gray-600'
            }`}
          >
            <div className="relative">
              {item.icon}
              {/* {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )} */}
            </div>
            <span className="text-xs mt-1 truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMoreMenu = () => (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white">
        <h2 className="text-lg font-semibold">More Options</h2>
        <div className="flex items-center space-x-4">
          {/* <Bell size={20} /> */}
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">JS</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {moreMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMoreItemClick(item)}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  item.id === 'dispatch' ? 'bg-blue-100 text-blue-600' :
                  item.id === 'returns' ? 'bg-orange-100 text-orange-600' :
                  item.id === 'documents' ? 'bg-purple-100 text-purple-600' :
                  item.id === 'vendors' ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{item.label}</h3>
                  {item.children && item.children[0] && (
                    <p className="text-sm text-gray-500 mt-1">
                      {item.children[0].label}
                    </p>
                  )}
                </div>
              </div>
              {/* <div className="flex items-center space-x-2">
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge} {item.badge === 1 ? 'New' : 'Ready'}
                  </span>
                )}
              </div> */}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation for More Menu */}
      <div className="bg-white border-t border-gray-200 px-4 pb-safe">
        <div className="flex justify-around items-center h-16">
          {mainTabItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setShowMoreMenu(false);
                handleTabClick(item);
              }}
              className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 text-gray-600"
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 truncate">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowMoreMenu(false)}
            className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 text-blue-600"
          >
            <MoreHorizontal size={20} />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSubMenu = () => {
    const parentItem = moreMenuItems.find(item => item.id === showSubMenu);
    if (!parentItem || !parentItem.children) return null;

    return (
      <div className="fixed inset-0 bg-white z-60">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200 bg-blue-600 text-white">
          <button
            onClick={() => setShowSubMenu(null)}
            className="mr-4"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">{parentItem.label}</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {parentItem.children.map((child) => (
              <div
                key={child.id}
                onClick={() => handleSubItemClick(child.href)}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  {child.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{child.label}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Bottom Tab Navigation */}
      {!showMoreMenu && renderBottomTabs()}
      
      {/* More Menu Overlay */}
      {showMoreMenu && !showSubMenu && renderMoreMenu()}
      
      {/* Sub Menu Overlay */}
      {showMoreMenu && showSubMenu && renderSubMenu()}
    </div>
  );
};

export default MobileNavigation;