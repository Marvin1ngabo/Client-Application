import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID()
      localStorage.setItem('deviceId', deviceId)

      const { data } = await api.post('/auth/login', {
        ...formData,
        deviceId,
      })

      // Client app is for STUDENT, PARENT, TEACHER only (not ADMIN)
      if (data.data.user.role === 'ADMIN') {
        toast.error('Access denied. Administrators should use the admin portal.')
        toast.info('Please use the admin portal at http://localhost:3001')
        setLoading(false)
        return
      }

      setAuth(data.data.user, data.data.accessToken, data.data.deviceVerified)
      toast.success('Login successful!')

      if (!data.data.deviceVerified) {
        navigate('/device-pending')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-700 to-navy-900 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-heading text-navy-700 mb-2">Welcome Back</h1>
        <p className="text-gray-600 mb-6">Sign in to access your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-700 text-white py-2 rounded-lg hover:bg-navy-600 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-gold-600 hover:text-gold-700 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
