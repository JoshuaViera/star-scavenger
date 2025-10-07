'use client'

import { useState, useEffect } from 'react'
import { analytics } from '@/lib/analytics'
import Link from 'next/link'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [summary, setSummary] = useState<ReturnType<typeof analytics.getAnalyticsSummary> | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'starscavenger2024') {
      setAuthenticated(true)
      setSummary(analytics.getAnalyticsSummary())
    } else {
      alert('Incorrect password')
    }
  }

  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(() => {
        setSummary(analytics.getAnalyticsSummary())
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [authenticated])

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl text-white mb-6 font-bold">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="px-4 py-2 rounded bg-gray-700 text-white mb-4 w-full"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-cyan-500 rounded hover:bg-cyan-600 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    )
  }

  if (!summary) return null

  const levelChartMax = Math.max(...Object.values(summary.levelDistribution as Record<number, number>), 1)

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Star Scavenger Analytics</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setSummary(analytics.getAnalyticsSummary())}
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              Refresh Data
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Back to Game
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Total Plays</div>
            <div className="text-4xl font-bold text-cyan-400">{summary.totalPlays}</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Retry Rate</div>
            <div className="text-4xl font-bold text-green-400">{summary.retryRate}%</div>
            <div className="text-xs text-gray-500 mt-2">
              {summary.retryRate > 60 ? '🎯 Excellent!' : summary.retryRate > 40 ? '✓ Good' : '⚠ Needs work'}
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Avg Session</div>
            <div className="text-4xl font-bold text-yellow-400">{summary.avgSessionLength}s</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Avg Score</div>
            <div className="text-4xl font-bold text-purple-400">{summary.avgScore}</div>
          </div>
        </div>

        {/* Level Distribution */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">Highest Level Reached</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(level => {
              const count = summary.levelDistribution[level] || 0
              const percentage = summary.totalPlays > 0 ? (count / summary.totalPlays) * 100 : 0
              const barWidth = levelChartMax > 0 ? (count / levelChartMax) * 100 : 0

              return (
                <div key={level} className="flex items-center gap-4">
                  <div className="w-24 text-white font-semibold">Level {level}</div>
                  <div className="flex-1 bg-gray-700 rounded h-10 relative overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-4 text-white font-medium">
                      {count} players ({Math.round(percentage)}%)
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Power-Up Usage - ALL 6 POWER-UPS */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">Power-Up Collection</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-yellow-900 bg-opacity-30 p-6 rounded border-2 border-yellow-600">
              <div className="text-yellow-400 font-bold text-lg mb-2">Speed Boost</div>
              <div className="text-4xl font-bold text-white">{summary.powerUpUsage.speed}</div>
              <div className="text-sm text-gray-400 mt-1">collected</div>
            </div>
            <div className="bg-orange-900 bg-opacity-30 p-6 rounded border-2 border-orange-600">
              <div className="text-orange-400 font-bold text-lg mb-2">Multi-Shot</div>
              <div className="text-4xl font-bold text-white">{summary.powerUpUsage.multishot}</div>
              <div className="text-sm text-gray-400 mt-1">collected</div>
            </div>
            <div className="bg-yellow-700 bg-opacity-30 p-6 rounded border-2 border-yellow-500">
              <div className="text-yellow-300 font-bold text-lg mb-2">Big Ship</div>
              <div className="text-4xl font-bold text-white">{summary.powerUpUsage.bigship}</div>
              <div className="text-sm text-gray-400 mt-1">collected</div>
            </div>
            <div className="bg-blue-900 bg-opacity-30 p-6 rounded border-2 border-blue-600">
              <div className="text-blue-400 font-bold text-lg mb-2">Shield</div>
              <div className="text-4xl font-bold text-white">{summary.powerUpUsage.shield || 0}</div>
              <div className="text-sm text-gray-400 mt-1">collected</div>
            </div>
            <div className="bg-red-900 bg-opacity-30 p-6 rounded border-2 border-red-600">
              <div className="text-red-400 font-bold text-lg mb-2">Rapid-Fire</div>
              <div className="text-4xl font-bold text-white">{summary.powerUpUsage.rapidfire}</div>
              <div className="text-sm text-gray-400 mt-1">collected</div>
            </div>
            <div className="bg-purple-900 bg-opacity-30 p-6 rounded border-2 border-purple-600">
              <div className="text-purple-400 font-bold text-lg mb-2">Bomb</div>
              <div className="text-4xl font-bold text-white">{summary.powerUpUsage.bomb}</div>
              <div className="text-sm text-gray-400 mt-1">collected</div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">Key Insights</h3>
          <div className="space-y-3 text-gray-300">
            <div className="p-4 bg-gray-900 rounded">
              <strong className="text-white">Engagement:</strong> {summary.retryRate}% retry rate 
              {summary.retryRate > 60 && ' indicates excellent core gameplay loop.'}
              {summary.retryRate > 40 && summary.retryRate <= 60 && ' shows good player engagement.'}
              {summary.retryRate <= 40 && ' suggests frustration - consider difficulty adjustments.'}
            </div>
            <div className="p-4 bg-gray-900 rounded">
              <strong className="text-white">Session Duration:</strong> Average {summary.avgSessionLength}s per session
              {summary.avgSessionLength < 120 && ' - short sessions may indicate difficulty spikes.'}
            </div>
            <div className="p-4 bg-gray-900 rounded">
              <strong className="text-white">Power-Up Balance:</strong> Most collected: {
                Object.entries(summary.powerUpUsage)
                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
              }, Least collected: {
                Object.entries(summary.powerUpUsage)
                  .filter(([,count]) => count > 0)
                  .sort(([,a], [,b]) => a - b)[0]?.[0] || 'none'
              }
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="flex justify-center">
          <button
            onClick={() => analytics.exportData()}
            className="px-8 py-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-lg font-semibold"
          >
            Export Raw Data (JSON)
          </button>
        </div>
      </div>
    </div>
  )
}