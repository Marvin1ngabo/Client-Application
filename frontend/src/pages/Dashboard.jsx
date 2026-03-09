import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'

export default function Dashboard() {
  const { user } = useAuthStore()

  // Fetch dashboard stats from backend
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats')
      return data.data
    },
  })

  const isStudent = user?.role === 'STUDENT'
  const isParent = user?.role === 'PARENT'
  const isTeacher = user?.role === 'TEACHER'

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  // STUDENT DASHBOARD
  if (isStudent) {
    const lowBalance = stats?.balance && parseFloat(stats.balance) < 10000

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-primary mb-2">
            {greeting()}, {user?.firstName}! 🎓
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-gray-600">Class: {stats?.className || 'Not assigned'}</p>
            {stats?.studentNumber && (
              <div className="flex items-center gap-2 bg-navy-100 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-navy-700">Student Number:</span>
                <span className="text-lg font-bold text-navy-900">{stats.studentNumber}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(stats.studentNumber);
                    alert('Student number copied to clipboard!');
                  }}
                  className="ml-2 text-navy-600 hover:text-navy-800"
                  title="Copy student number"
                >
                  📋
                </button>
              </div>
            )}
          </div>
          {stats?.studentNumber && (
            <p className="text-xs text-gray-500 mt-2">
              💡 Share your student number with your parent so they can link their account
            </p>
          )}
        </div>

        {/* Low Balance Alert */}
        {lowBalance && (
          <div className="card p-6 mb-6 border-l-4 border-accent bg-amber-50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-1">⚠️ LOW FEE BALANCE</h3>
                <p className="text-sm text-amber-700">
                  Your balance is {parseFloat(stats.balance).toLocaleString()} RWF.
                  Please top up to avoid disruption to school services.
                </p>
              </div>
              <Link to="/fees" className="btn bg-accent text-white hover:bg-amber-600 whitespace-nowrap">
                Pay Now
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-navy-600 to-navy-700 text-white">
            <h3 className="text-sm font-medium text-navy-200 mb-2">Your Student Number</h3>
            <p className="text-2xl font-bold mb-2">{stats?.studentNumber || 'N/A'}</p>
            <button
              onClick={() => {
                if (stats?.studentNumber) {
                  navigator.clipboard.writeText(stats.studentNumber);
                  alert('Student number copied!');
                }
              }}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
            >
              📋 Copy Number
            </button>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Fee Balance</h3>
            <p className="text-3xl font-bold text-primary">
              {stats?.balance ? `${parseFloat(stats.balance).toLocaleString()}` : '0'} RWF
            </p>
            <p className="text-sm text-gray-500 mt-1">{lowBalance ? '⚠️ Pay Soon' : 'Current balance'}</p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Attendance Rate</h3>
            <p className="text-3xl font-bold text-success">{stats?.attendanceRate || 0}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.presentDays || 0} present, {stats?.absentDays || 0} absent
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Grade</h3>
            <p className="text-3xl font-bold text-primary">{stats?.averageGrade || 0}%</p>
            <p className="text-sm text-gray-500 mt-1">{stats?.totalGrades || 0} grades recorded</p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Late Days</h3>
            <p className="text-3xl font-bold text-amber-600">{stats?.lateDays || 0}</p>
            <p className="text-sm text-gray-500 mt-1">This term</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/fees" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-700">Pay Fees</h3>
          </Link>
          <Link to="/grades" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-700">View Grades</h3>
          </Link>
          <Link to="/attendance" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">📅</div>
            <h3 className="font-semibold text-gray-700">Attendance</h3>
          </Link>
        </div>
      </div>
    )
  }

  // PARENT DASHBOARD
  if (isParent) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-primary mb-2">
            {greeting()}, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600">Managing {stats?.totalChildren || 0} {stats?.totalChildren === 1 ? 'child' : 'children'}</p>
        </div>

        {/* Children List */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Children</h3>
          {stats?.children && stats.children.length > 0 ? (
            <div className="space-y-3">
              {stats.children.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{child.name}</p>
                    <p className="text-sm text-gray-600">Class: {child.className}</p>
                  </div>
                  <Link
                    to={`/fees?studentId=${child.id}`}
                    className="btn btn-sm bg-primary text-white hover:bg-navy-600"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No children linked to your account</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/fees" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-700">Pay Fees</h3>
            <p className="text-sm text-gray-500 mt-1">Manage payments</p>
          </Link>
          <Link to="/grades" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-700">View Grades</h3>
            <p className="text-sm text-gray-500 mt-1">Check performance</p>
          </Link>
          <Link to="/attendance" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">📅</div>
            <h3 className="font-semibold text-gray-700">Attendance</h3>
            <p className="text-sm text-gray-500 mt-1">Track attendance</p>
          </Link>
        </div>
      </div>
    )
  }

  // TEACHER DASHBOARD
  if (isTeacher) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-primary mb-2">
            {greeting()}, {user?.firstName}! 👨‍🏫
          </h1>
          <p className="text-gray-600">Teaching {stats?.totalClasses || 0} {stats?.totalClasses === 1 ? 'class' : 'classes'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Classes</h3>
            <p className="text-4xl font-bold text-primary">{stats?.totalClasses || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Classes assigned</p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Students</h3>
            <p className="text-4xl font-bold text-success">{stats?.totalStudents || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Across all classes</p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Subjects</h3>
            <p className="text-4xl font-bold text-primary">{stats?.subjects?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.subjects && stats.subjects.length > 0 ? stats.subjects.join(', ') : 'None assigned'}
            </p>
          </div>
        </div>

        {/* Teacher Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/attendance" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-semibold text-gray-700">Mark Attendance</h3>
            <p className="text-sm text-gray-500 mt-1">Record student attendance</p>
          </Link>
          <Link to="/grades" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-700">Enter Grades</h3>
            <p className="text-sm text-gray-500 mt-1">Record student grades</p>
          </Link>
          <Link to="/timetable" className="card p-6 hover:shadow-lg transition text-center">
            <div className="text-4xl mb-2">📅</div>
            <h3 className="font-semibold text-gray-700">View Timetable</h3>
            <p className="text-sm text-gray-500 mt-1">Check your schedule</p>
          </Link>
        </div>

        {/* Info Card */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Teacher Portal</h3>
          <p className="text-gray-600 mb-4">
            Welcome to your teacher dashboard. Here you can manage attendance, enter grades, and view your class schedules.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Use the Attendance page to quickly mark students present, absent, or late. 
              Use the Grades page to enter and update student scores.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
