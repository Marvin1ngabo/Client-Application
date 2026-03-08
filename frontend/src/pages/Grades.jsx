import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import axios from '../api/axios'
import toast from 'react-hot-toast'

export default function Grades() {
  const { user } = useAuthStore()
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('all')

  useEffect(() => {
    fetchGrades()
  }, [])

  const fetchGrades = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/grades/my')
      setGrades(response.data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch grades')
    } finally {
      setLoading(false)
    }
  }

  const subjects = ['all', ...new Set(grades.map(g => g.subject))]
  const filteredGrades = selectedSubject === 'all' 
    ? grades 
    : grades.filter(g => g.subject === selectedSubject)

  const calculateAverage = () => {
    if (filteredGrades.length === 0) return 0
    const total = filteredGrades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0)
    return (total / filteredGrades.length).toFixed(1)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-navy-900">My Grades</h1>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>
              {subject === 'all' ? 'All Subjects' : subject}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-navy-200 text-sm mb-1">Average Score</p>
            <p className="text-4xl font-bold">{calculateAverage()}%</p>
          </div>
          <div>
            <p className="text-navy-200 text-sm mb-1">Total Grades</p>
            <p className="text-4xl font-bold">{filteredGrades.length}</p>
          </div>
          <div>
            <p className="text-navy-200 text-sm mb-1">Subjects</p>
            <p className="text-4xl font-bold">{subjects.length - 1}</p>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      {filteredGrades.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No grades yet</h3>
          <p className="text-gray-600">Your grades will appear here once your teachers post them.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGrades.map((grade, index) => {
                  const percentage = (grade.score / grade.maxScore * 100).toFixed(1)
                  const isGood = percentage >= 70
                  const isMedium = percentage >= 50 && percentage < 70
                  
                  return (
                    <tr key={grade.id} className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{grade.subject}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{grade.assessmentType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900">{grade.score}/{grade.maxScore}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isGood ? 'bg-green-100 text-green-800' :
                          isMedium ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(grade.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {grade.teacher?.user?.name || 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
