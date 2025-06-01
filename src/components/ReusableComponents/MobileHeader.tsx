import React from 'react';
import { Bell, Menu } from 'lucide-react';

interface MobileHeaderProps {
  companyName: string;
  userName?: string;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onUserClick?: () => void;
  notificationCount?: number;
  className?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  companyName,
  userName = 'John Smith',
  onMenuClick,
  onNotificationClick,
  onUserClick,
  notificationCount = 0,
  className = ''
}) => {
  // Extract first two letters from user name for avatar
  const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const initials = getInitials(userName);

  return (
    <header className={`bg-blue-600 text-white shadow-lg ${className} lg:hidden`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu (optional) and Company Name */}
        <div className="flex items-center space-x-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold truncate max-w-[200px]">
              {companyName}
            </h1>
          </div>
        </div>

        {/* Right side - Notifications and User Avatar */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          {onNotificationClick && (
            <button
              onClick={onNotificationClick}
              className="relative p-2 rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* User Avatar */}
          <button
            onClick={onUserClick}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-blue-700 transition-colors"
            aria-label={`User menu for ${userName}`}
          >
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {initials}
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-medium truncate max-w-[100px]">
                {userName.split(' ')[0]}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;