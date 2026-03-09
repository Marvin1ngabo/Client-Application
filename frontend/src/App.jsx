import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DevicePending from './pages/DevicePending'
import Fees from './pages/Fees'
import Grades from './pages/Grades'
import Attendance from './pages/Attendance'
import Timetable from './pages/Timetable'
import Notifications from './pages/Notifications'
import Layout from './components/Layout'

function App() {
  const { user, isAuthenticated } = useAuthStore()

  // Client app is for STUDENT and PARENT only (not TEACHER or ADMIN)
  // Redirect teachers and admins to staff portal
  if (isAuthenticated && user && (user.role === 'TEACHER' || user.role === 'ADMIN')) {
    window.location.href = 'http://localhost:3001'
    return null
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/device-pending" element={isAuthenticated ? <DevicePending /> : <Navigate to="/login" />} />
      
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="fees" element={<Fees />} />
        <Route path="grades" element={<Grades />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  )
}

export default App
