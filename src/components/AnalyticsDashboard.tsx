// src/components/AnalyticsDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export default function AnalyticsDashboard() {
  const [show, setShow] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    if (show) {
      setSummary(analytics.getAnalyticsSummary())
    }
  }, [show])

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm z-50"
      >
        View Analytics
      </button>
    )
  }

  if (!summary) return null

  const levelChartMax = Math.max(...Object.values(summary.levelDistribution as Record<number, number>), 1)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Game Analytics</h2>
          <button
            onClick={() => setShow(false)}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-gray-400 text-sm">Total Plays</div>
            <div className="text-3xl font-bold text-cyan-400">{summary.totalPlays}</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-gray-400 text-sm">Retry Rate</div>
            <div className="text-3xl font-bold text-green-400">{summary.retryRate}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.retryRate > 60 ? 'Excellent!' : summary.retryRate > 40 ? 'Good' : 'Needs work'}
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-gray-400 text-sm">Avg Session</div>
            <div className="text-3xl font-bold text-yellow-400">{summary.avgSessionLength}s</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-gray-400 text-sm">Avg Score</div>
            <div className="text-3xl font-bold text-purple-400">{summary.avgScore}</div>
          </div>
        </div>

        {/* Level Distribution */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Highest Level Reached Distribution</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(level => {
              const count = summary.levelDistribution[level] || 0
              const percentage = summary.totalPlays > 0 ? (count / summary.totalPlays) * 100 : 0
              const barWidth = levelChartMax > 0 ? (count / levelChartMax) * 100 : 0

              return (
                <div key={level} className="flex items-center gap-4">
                  <div className="w-20 text-white">Level {level}</div>
                  <div className="flex-1 bg-gray-700 rounded h-8 relative overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3 text-white text-sm">
                      {count} players ({Math.round(percentage)}%)
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-sm text-gray-400">
            {Object.keys(summary.levelDistribution).length === 0 && 'No data yet - play some games!'}
            {summary.levelDistribution[3] > summary.levelDistribution[4] * 3 && 
              'Notice: High drop-off at Level 3 - consider difficulty adjustment'}
          </div>
        </div>

        {/* Power-Up Usage */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Power-Up Collection Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-yellow-900 bg-opacity-30 p-4 rounded border border-yellow-600">
              <div className="text-yellow-400 font-bold">Speed Boost</div>
              <div className="text-3xl text-white">{summary.powerUpUsage.speed}</div>
              <div className="text-xs text-gray-400">collected</div>
            </div>
            <div className="bg-orange-900 bg-opacity-30 p-4 rounded border border-orange-600">
              <div className="text-orange-400 font-bold">Multi-Shot</div>
              <div className="text-3xl text-white">{summary.powerUpUsage.multishot}</div>
              <div className="text-xs text-gray-400">collected</div>
            </div>
            <div className="bg-yellow-700 bg-opacity-30 p-4 rounded border border-yellow-500">
              <div className="text-yellow-300 font-bold">Big Ship</div>
              <div className="text-3xl text-white">{summary.powerUpUsage.bigship}</div>
              <div className="text-xs text-gray-400">collected</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            {summary.powerUpUsage.bigship < summary.powerUpUsage.speed / 3 && 
              'Insight: Big Ship rarely collected - may need rebalancing'}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center">
          <button
            onClick={() => analytics.exportData()}
            className="px-6 py-3 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
          >
            Export Raw Data (JSON)
          </button>
        </div>

        {/* Insights Section */}
        <div className="mt-8 p-4 bg-gray-900 rounded">
          <h3 className="text-lg font-bold text-white mb-2">Key Insights</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>
              <strong>Retry Rate:</strong> {summary.retryRate}% of players click "Play Again" after game over. 
              {summary.retryRate > 60 && ' This is excellent and validates your core gameplay loop!'}
              {summary.retryRate < 40 && ' This suggests players may be frustrated - consider difficulty adjustments.'}
            </li>
            <li>
              <strong>Session Length:</strong> Average {summary.avgSessionLength} seconds per session.
              {summary.avgSessionLength < 120 && ' Short sessions may indicate difficulty spikes or lack of engagement.'}
            </li>
            <li>
              <strong>Progression:</strong> Review level distribution to identify where players struggle most.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}