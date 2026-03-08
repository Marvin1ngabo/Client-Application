import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import axios from '../api/axios'
import toast from 'react-hot-toast'

export default function Notifications() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/notifications')
      setNotifications(response.data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`)
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ))
      toast.success('Marked as read')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as read')
    }
  }

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.isRead)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'FEE':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'GRADE':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'ATTENDANCE':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      case 'ANNOUNCEMENT':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'FEE': return 'text-green-600 bg-green-100'
      case 'GRADE': return 'text-blue-600 bg-blue-100'
      case 'ATTENDANCE': return 'text-purple-600 bg-purple-100'
      case 'ANNOUNCEMENT': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">
            {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border ${
                notification.isRead ? 'border-gray-200' : 'border-navy-300 bg-navy-50/30'
              } p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm text-navy-600 hover:text-navy-700 font-medium whitespace-nowrap"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100">
                      {notification.type}
                    </span>
                    <span>
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
