import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '../api/axios'

export default function Fees() {
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [depositData, setDepositData] = useState({ amount: '', reference: '', description: '' })
  const [withdrawData, setWithdrawData] = useState({ amount: '', description: '' })
  const queryClient = useQueryClient()

  const { data: balance } = useQuery({
    queryKey: ['feeBalance'],
    queryFn: async () => {
      const { data } = await api.get('/fees/balance')
      return data.data
    },
  })

  const { data: history } = useQuery({
    queryKey: ['feeHistory'],
    queryFn: async () => {
      const { data } = await api.get('/fees/history')
      return data.data
    },
  })

  const depositMutation = useMutation({
    mutationFn: (data) => api.post('/fees/deposit', data),
    onSuccess: () => {
      toast.success('Deposit successful!')
      queryClient.invalidateQueries(['feeBalance', 'feeHistory'])
      setShowDeposit(false)
      setDepositData({ amount: '', reference: '', description: '' })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Deposit failed')
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (data) => api.post('/fees/withdraw', data),
    onSuccess: () => {
      toast.success('Withdrawal request submitted!')
      queryClient.invalidateQueries(['feeHistory'])
      setShowWithdraw(false)
      setWithdrawData({ amount: '', description: '' })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Withdrawal failed')
    },
  })

  const lowBalance = balance && parseFloat(balance.balance) < 5000

  return (
    <div>
      <h1 className="text-3xl font-heading text-navy-700 mb-6">Fee Management</h1>

      {lowBalance && (
        <div className="bg-gold-100 border-l-4 border-gold-600 p-4 mb-6">
          <p className="text-gold-800 font-medium">
            ⚠️ Low Balance Warning: Your fee balance is below 5,000 RWF
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Balance</h3>
          <p className="text-4xl font-bold text-navy-700">
            {balance ? parseFloat(balance.balance).toLocaleString() : '0'} {balance?.currency || 'RWF'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-around">
          <button
            onClick={() => setShowDeposit(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Deposit
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Withdraw
          </button>
        </div>
      </div>

      {showDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-heading text-navy-700 mb-4">Make Deposit</h3>
            <form onSubmit={(e) => { e.preventDefault(); depositMutation.mutate(depositData); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={depositData.amount}
                    onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input
                    type="text"
                    required
                    value={depositData.reference}
                    onChange={(e) => setDepositData({ ...depositData, reference: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={depositData.description}
                    onChange={(e) => setDepositData({ ...depositData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={depositMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {depositMutation.isPending ? 'Processing...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeposit(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-heading text-navy-700 mb-4">Request Withdrawal</h3>
            <form onSubmit={(e) => { e.preventDefault(); withdrawMutation.mutate(withdrawData); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={withdrawData.description}
                    onChange={(e) => setWithdrawData({ ...withdrawData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500"
                    rows="3"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Note: Withdrawal requests require admin approval
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={withdrawMutation.isPending}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? 'Processing...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history?.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      transaction.type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {parseFloat(transaction.amount).toLocaleString()} RWF
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      transaction.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{transaction.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
