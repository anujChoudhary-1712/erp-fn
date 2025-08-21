"use client"
import NotificationApis from '@/actions/Apis/NotificationApis'
import React, { useEffect, useState } from 'react'
import { Bell, Package, AlertTriangle, Check, Eye, FileText, ArrowRight } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import MaterialRequestApis from '@/actions/Apis/MaterialRequestApis'

interface Notification {
  _id: string
  materialId?: string
  materialName?: string
  currentStock?: number
  triggerValue?: number
  message?: string
  planId?: string
  access?: string[]
  isRead: boolean
  org_id: string
  createdAt: string
  updatedAt: string
  __v: number
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const { user } = useUser()
  const router = useRouter()

  // Function to check if user has access to a notification
  const hasNotificationAccess = (notification: Notification) => {
    // If no access array is defined, default to allowing access (backward compatibility)
    if (!notification.access || notification.access.length === 0) {
      return true
    }

    // If access array contains "all", show to everyone
    if (notification.access.includes('all')) {
      return true
    }

    // If no user or user roles, deny access
    if (!user?.roles || user.roles.length === 0) {
      return false
    }

    // Check if user has any of the roles specified in the access array
    return notification.access.some(accessRole => user.roles.includes(accessRole))
  }

  // Filter notifications based on user access
  const filterNotificationsByAccess = (notifications: Notification[]) => {
    return notifications.filter(notification => hasNotificationAccess(notification))
  }

  const fetchNotifications = async (isRead: boolean) => {
    try {
      setLoading(true)
      const res = await NotificationApis.getAllNotifications()
      if (res.status === 200) {
        // Filter notifications based on user access
        const filteredNotifications = filterNotificationsByAccess(res.data)
        setNotifications(filteredNotifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markNotificationAsRead = async (id: string) => {
    try {
      setMarkingAsRead(id)
      const res = await NotificationApis.updateNotification(id)
      if (res.status === 200) {
        // Remove from current list if we're on unread tab
        if (activeTab === 'unread') {
          setNotifications(prev => prev.filter(notif => notif._id !== id))
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setMarkingAsRead(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.isRead)
      
      // Mark all unread notifications as read
      for (const notification of unreadNotifications) {
        await NotificationApis.updateNotification(notification._id)
      }
      
      // Refresh the current view
      fetchNotifications(activeTab === 'read')
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // REFACTORED: This function now fetches the requestId first
  const handlePlanNotificationClick = async (notification: Notification) => {
    if (!notification.planId) return;

    try {
      // Mark as read first
      await markNotificationAsRead(notification._id);

      // Fetch pending requests for this plan
      const response = await MaterialRequestApis.getAllMaterialRequests({ 
        planId: notification.planId, 
        status: 'Pending' 
      });

      if (response.status === 200 && response.data?.requests?.length > 0) {
        // If a pending request exists, navigate to the approval page for the first one found
        const requestId = response.data.requests[0]._id;
        router.push(`/dashboard/material-request?requestId=${requestId}`);
      } else {
        // If no pending request is found, navigate to the general plan details page
        router.push(`/dashboard/planning/${notification.planId}`);
      }
    } catch (error) {
      console.error('Error handling plan notification click:', error);
      // In case of an error, still navigate to the plan page as a fallback
      router.push(`/dashboard/planning/${notification.planId}`);
    }
  }

  const getStockStatusColor = (currentStock: number, triggerValue: number) => {
    const percentage = (currentStock / triggerValue) * 100
    if (percentage <= 25) return 'text-red-600 bg-red-50 border-red-200'
    if (percentage <= 50) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }

  const getUrgencyLevel = (currentStock: number, triggerValue: number) => {
    const percentage = (currentStock / triggerValue) * 100
    if (percentage <= 25) return 'Critical'
    if (percentage <= 50) return 'Low'
    return 'Warning'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  // Check if notification is a plan-based notification
  const isPlanNotification = (notification: Notification) => {
    return notification.planId && notification.message
  }

  // Check if notification is a stock-based notification
  const isStockNotification = (notification: Notification) => {
    return notification.materialId && notification.materialName && notification.currentStock !== undefined && notification.triggerValue !== undefined
  }

  useEffect(() => {
    fetchNotifications(activeTab === 'read')
  }, [activeTab])

  const unreadCount = activeTab === 'unread' ? notifications.length : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">Inventory alerts and system updates</p>
              </div>
            </div>
            
            {activeTab === 'unread' && notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'unread'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'read'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            Read
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} notifications
              </h3>
              <p className="text-gray-500">
                {activeTab === 'unread' 
                  ? "You're all caught up! No new notifications to show."
                  : "No read notifications found."
                }
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="p-6">
                  {/* Plan-based Notification */}
                  {isPlanNotification(notification) && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-semibold text-gray-900">
                              Action Required
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium rounded-full text-blue-600 bg-blue-50 border border-blue-200">
                              Plan Update
                            </span>
                          </div>
                          
                          <p className="text-gray-700 mb-4">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                            
                            <button
                              onClick={() => handlePlanNotificationClick(notification)}
                              disabled={markingAsRead === notification._id}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {markingAsRead === notification._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  View Details
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stock-based Notification */}
                  {isStockNotification(notification) && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${getStockStatusColor(notification.currentStock!, notification.triggerValue!)}`}>
                          <Package className="w-5 h-5" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              Low Stock Alert
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(notification.currentStock!, notification.triggerValue!)}`}>
                              {getUrgencyLevel(notification.currentStock!, notification.triggerValue!)}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 mb-3">
                            <span className="font-medium">{notification.materialName}</span> is running low on stock. 
                            Current stock is <span className="font-semibold text-red-600">{notification.currentStock}</span> units, 
                            which is below the trigger level of <span className="font-semibold">{notification.triggerValue}</span> units.
                          </p>
                          
                          {/* Stock Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Current Stock</span>
                              <span>{notification.currentStock} / {notification.triggerValue}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  (notification.currentStock! / notification.triggerValue!) <= 0.25 
                                    ? 'bg-red-500' 
                                    : (notification.currentStock! / notification.triggerValue!) <= 0.5 
                                    ? 'bg-orange-500' 
                                    : 'bg-yellow-500'
                                }`}
                                style={{ 
                                  width: `${Math.min((notification.currentStock! / notification.triggerValue!) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                            
                            {!notification.isRead && (
                              <button
                                onClick={() => markNotificationAsRead(notification._id)}
                                disabled={markingAsRead === notification._id}
                                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                              >
                                {markingAsRead === notification._id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback for other notification types */}
                  {!isPlanNotification(notification) && !isStockNotification(notification) && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                          <Bell className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Notification
                          </h3>
                          
                          <p className="text-gray-700 mb-3">
                            {notification.message || 'No message available'}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                            
                            {!notification.isRead && (
                              <button
                                onClick={() => markNotificationAsRead(notification._id)}
                                disabled={markingAsRead === notification._id}
                                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                              >
                                {markingAsRead === notification._id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
