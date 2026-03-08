import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: balance } = useQuery({
    queryKey: ['feeBalance'],
    queryFn: async () => {
      const { data } = await api.get('/fees/balance')
      return data.data
    },
    enabled: user?.role === 'STUDENT' || user?.role === 'PARENT',
  })

  const lowBalance = balance && parseFloat(balance.balance) < 10000
  const isStudent = user?.role === 'STUDENT'
  const isParent = user?.role === 'PARENT'

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading text-primary mb-2">
          {greeting()}, {user?.firstName}! {isStudent ? '🎓' : '👋'}
        </h1>
        <p className="text-gray-600">
          {isStudent ? 'You have 4 classes today' : 'Welcome to your parent portal'}
        </p>
      </div>

      {/* Low Balance Alert */}
      {lowBalance && (
        <div className="card p-6 mb-6 border-l-4 border-accent bg-amber-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-1">⚠️ LOW FEE BALANCE</h3>
              <p className="text-sm text-amber-700">
                {isStudent ? 'Your' : "Your child's"} balance is {parseFloat(balance.balance).toLocaleString()} RWF.
                Please top up before the end of the month to avoid disruption to school services.
              </p>
            </div>
            <Link to="/fees" className="btn bg-accent text-white hover:bg-amber-600 whitespace-nowrap">
              Pay Now
            </Link>
          </div>
        </div>
      )}

      {/* Today's Classes (Student Only) */}
      {isStudent && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">TODAY'S CLASSES</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">08:00 — Mathematics</p>
                <p className="text-sm text-gray-600">Mr. Mutesi, Room 12</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">10:00 — English</p>
                <p className="text-sm text-gray-600">Ms. Uwera, Room 7</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">13:00 — Physics</p>
                <p className="text-sm text-gray-600">Mr. Nkusi, Room Lab-A</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">15:00 — History</p>
                <p className="text-sm text-gray-600">Ms. Ingabire, Room 4</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {isStudent ? 'Average Grade' : 'Fee Balance'}
          </h3>
          <p className="text-4xl font-bold text-primary">
            {isStudent ? '81.4%' : balance ? `${parseFloat(balance.balance).toLocaleString()} RWF` : '0 RWF'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {isStudent ? 'Term 2, 2025' : lowBalance ? '⚠️ Pay Soon' : 'Current balance'}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Attendance</h3>
          <p className="text-4xl font-bold text-success">96%</p>
          <p className="text-sm text-gray-500 mt-1">2 absences this term</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last Grade</h3>
          <p className="text-4xl font-bold text-primary">87/100</p>
          <p className="text-sm text-gray-500 mt-1">Math — Senior 2A</p>
        </div>
      </div>

      {/* Pay Fees CTA (Parent Only) */}
      {isParent && (
        <div className="mb-8">
          <Link
            to="/fees"
            className="block w-full btn btn-primary text-center text-lg py-4 h-auto"
          >
            💰 PAY FEES NOW
          </Link>
        </div>
      )}

      {/* Recent Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Last: 50,000 RWF</span>
              <span className="text-sm text-gray-500">12 May 2025</span>
            </div>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Grades</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Math</span>
              <span className="font-mono font-bold text-primary">87/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">English</span>
              <span className="font-mono font-bold text-primary">79/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Science</span>
              <span className="font-mono font-bold text-primary">91/100</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Term 2, 2025</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Upcoming Events / Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded">
              <span className="text-xl">📢</span>
              <div>
                <p className="text-sm font-medium text-gray-900">School fees due: 31 May 2025</p>
                <p className="text-xs text-gray-600 mt-1">Please ensure payment is made before the deadline</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Parent-Teacher Meeting: 20 May 2025</p>
                <p className="text-xs text-gray-600 mt-1">Location: Main Hall, 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
