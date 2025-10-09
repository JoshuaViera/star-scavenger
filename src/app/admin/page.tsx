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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🎮 Star Scavenger Analytics</h1>
            <p className="text-gray-400">Advanced Game Balance Dashboard</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setSummary(analytics.getAnalyticsSummary())}
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => analytics.exportData()}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              📥 Export Data
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              ← Back to Game
            </Link>
          </div>
        </div>

        {/* AI Recommendations - Top Priority */}
        {summary.recommendations && summary.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-red-900 to-orange-900 p-6 rounded-lg mb-8 border-2 border-red-500">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🤖 AI-Powered Recommendations
            </h2>
            <div className="space-y-3">
              {summary.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-black bg-opacity-40 p-4 rounded-lg text-white">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-cyan-500">
            <div className="text-gray-400 text-sm mb-2">Total Plays</div>
            <div className="text-4xl font-bold text-cyan-400">{summary.totalPlays}</div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500">
            <div className="text-gray-400 text-sm mb-2">Retry Rate</div>
            <div className="text-4xl font-bold text-green-400">{summary.retryRate}%</div>
            <div className="text-xs text-gray-500 mt-2">
              {summary.retryRate > 60 ? '🎯 Excellent!' : summary.retryRate > 40 ? '✓ Good' : '⚠ Needs work'}
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
            <div className="text-gray-400 text-sm mb-2">Avg Session</div>
            <div className="text-4xl font-bold text-yellow-400">{summary.avgSessionLength}s</div>
            <div className="text-xs text-gray-500 mt-2">
              {summary.avgSessionLength < 120 ? '⚠ Too short' : '✓ Good length'}
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
            <div className="text-gray-400 text-sm mb-2">Avg Accuracy</div>
            <div className="text-4xl font-bold text-purple-400">{summary.avgAccuracy}%</div>
            <div className="text-xs text-gray-500 mt-2">
              {summary.avgAccuracy < 30 ? '⚠ Too hard to aim' : '✓ Good'}
            </div>
          </div>
        </div>

        {/* Boss Battle Deep Dive */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8 border-t-4 border-red-500">
          <h2 className="text-2xl font-bold text-white mb-6">⚔️ Boss Battle Analysis</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-900 bg-opacity-30 p-6 rounded border-2 border-red-600">
              <div className="text-red-400 font-bold text-lg mb-2">Total Encounters</div>
              <div className="text-4xl font-bold text-white">{summary.totalBossesFought}</div>
            </div>
            
            <div className="bg-green-900 bg-opacity-30 p-6 rounded border-2 border-green-600">
              <div className="text-green-400 font-bold text-lg mb-2">Victories</div>
              <div className="text-4xl font-bold text-white">{summary.totalBossesDefeated}</div>
            </div>
            
            <div className="bg-blue-900 bg-opacity-30 p-6 rounded border-2 border-blue-600">
              <div className="text-blue-400 font-bold text-lg mb-2">Win Rate</div>
              <div className="text-4xl font-bold text-white">{summary.bossWinRate}%</div>
              <div className="text-sm text-gray-400 mt-1">
                {summary.bossWinRate < 30 && '🔴 Too Hard'}
                {summary.bossWinRate >= 30 && summary.bossWinRate <= 70 && '✅ Well Balanced'}
                {summary.bossWinRate > 70 && '⚠️ Too Easy'}
              </div>
            </div>
          </div>

          {/* Boss Difficulty Ranking */}
          {summary.bossDifficultyRanking && summary.bossDifficultyRanking.length > 0 && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Boss Difficulty Ranking (Hardest → Easiest)</h3>
              <div className="space-y-3">
                {summary.bossDifficultyRanking.map((boss, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-gray-800 p-4 rounded">
                    <div className="text-3xl font-bold text-gray-500 w-12">{idx + 1}</div>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-white">{boss.name}</div>
                      <div className="text-sm text-gray-400">
                        {boss.fights} fights • Avg time: {boss.avgTimeToDefeat}s
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        boss.winRate < 30 ? 'text-red-500' :
                        boss.winRate > 70 ? 'text-green-500' :
                        'text-yellow-500'
                      }`}>
                        {boss.winRate}%
                      </div>
                      <div className="text-xs text-gray-400">win rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Death Analysis */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8 border-t-4 border-purple-500">
          <h2 className="text-2xl font-bold text-white mb-4">💀 Death Analysis</h2>
          
          <div className="bg-gray-900 p-4 rounded-lg mb-4">
            <div className="text-lg text-gray-300 mb-4">
              Most Common Death Cause: <span className="font-bold text-red-400">{summary.mostCommonDeathCause}</span>
            </div>
            
            <div className="space-y-2">
              {Object.entries(summary.deathHeatmap as Record<string, number>).map(([cause, count]) => {
                const total = Object.values(summary.deathHeatmap as Record<string, number>)
                  .reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={cause} className="flex items-center gap-4">
                    <div className="w-32 text-white capitalize">{cause.replace('_', ' ')}</div>
                    <div className="flex-1 bg-gray-700 rounded h-8 relative overflow-hidden">
                      <div
                        className="bg-red-500 h-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-4 text-white font-medium text-sm">
                        {count} deaths ({Math.round(percentage)}%)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Difficulty Comparison */}
        {summary.difficultyBreakdown && Object.keys(summary.difficultyBreakdown).length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8 border-t-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-white mb-6">🎚️ Difficulty Balance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(summary.difficultyBreakdown).map(([difficulty, stats]: [string, any]) => (
                <div key={difficulty} className="bg-gray-900 p-6 rounded-lg border-2 border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4 capitalize">{difficulty}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-400">Games Played</div>
                      <div className="text-2xl font-bold text-white">{stats.plays}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400">Avg Score</div>
                      <div className="text-2xl font-bold text-cyan-400">{stats.avgScore}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400">Avg Time</div>
                      <div className="text-2xl font-bold text-yellow-400">{stats.avgTime}s</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400">Completion Rate</div>
                      <div className={`text-2xl font-bold ${
                        stats.winRate < 10 ? 'text-red-400' :
                        stats.winRate > 30 ? 'text-green-400' :
                        'text-yellow-400'
                      }`}>
                        {stats.winRate}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Level Distribution */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8 border-t-4 border-cyan-500">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Level Progression</h2>
          <p className="text-gray-400 mb-6">Where players are getting stuck</p>
          
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(level => {
              const count = (summary.levelDistribution as Record<number, number>)[level] || 0
              const percentage = summary.totalPlays > 0 ? (count / summary.totalPlays) * 100 : 0
              const barWidth = levelChartMax > 0 ? (count / levelChartMax) * 100 : 0
              
              return (
                <div key={level} className="flex items-center gap-4">
                  <div className="w-24 text-white font-semibold">Level {level}</div>
                  <div className="flex-1 bg-gray-700 rounded h-12 relative overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percentage > 50 ? 'bg-red-500' : 
                        percentage > 30 ? 'bg-yellow-500' : 
                        'bg-cyan-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-4 text-white font-medium">
                      {count} players ({Math.round(percentage)}%)
                      {percentage > 50 && ' 🔴 MAJOR DROP-OFF POINT'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Power-Up Usage & Effectiveness */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8 border-t-4 border-green-500">
          <h2 className="text-2xl font-bold text-white mb-6">💊 Power-Up Analytics</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(summary.powerUpUsage).map(([type, count]) => {
              const popularity = summary.totalPlays > 0 ? ((count as number) / summary.totalPlays) : 0
              return (
                <div key={type} className="bg-gray-900 p-6 rounded border-2 border-gray-700">
                  <div className="text-lg font-bold text-white capitalize mb-2">{type}</div>
                  <div className="text-3xl font-bold text-cyan-400 mb-2">{count}</div>
                  <div className="text-sm text-gray-400">
                    {popularity.toFixed(1)} per game
                  </div>
                  {popularity < 0.5 && (
                    <div className="text-xs text-yellow-500 mt-2">⚠️ Underused</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary Insights */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">📈 Key Insights</h2>
          <div className="space-y-3 text-gray-300">
            <div className="p-4 bg-gray-900 rounded">
              <strong className="text-white">Player Engagement:</strong> {summary.retryRate}% retry rate
              {summary.retryRate > 60 && ' indicates excellent core gameplay loop. Players are hooked! ✅'}
              {summary.retryRate > 40 && summary.retryRate <= 60 && ' shows good player engagement. Room for improvement. 👍'}
              {summary.retryRate <= 40 && ' suggests players are getting frustrated. Consider difficulty adjustments. ⚠️'}
            </div>
            
            <div className="p-4 bg-gray-900 rounded">
              <strong className="text-white">Session Length:</strong> Average {summary.avgSessionLength}s per session
              {summary.avgSessionLength < 120 && ' - Short sessions may indicate difficulty spikes causing early quits. ⚠️'}
              {summary.avgSessionLength >= 120 && summary.avgSessionLength < 300 && ' - Good session length. ✅'}
              {summary.avgSessionLength >= 300 && ' - Excellent engagement! Players are staying for long sessions. 🎯'}
            </div>
            
            <div className="p-4 bg-gray-900 rounded">
              <strong className="text-white">Combat Balance:</strong> {summary.avgAccuracy}% average accuracy
              {summary.avgAccuracy < 30 && ' - Low accuracy suggests targets are too small or fast. Consider larger hitboxes. ⚠️'}
              {summary.avgAccuracy >= 30 && summary.avgAccuracy < 50 && ' - Accuracy is reasonable. ✅'}
              {summary.avgAccuracy >= 50 && ' - High accuracy may mean enemies are too easy to hit. Consider increasing challenge. 💡'}
            </div>
            
            <div className="p-4 bg-gray-900 rounded">
              <strong className="text-white">Boss Balance:</strong> {summary.bossWinRate}% boss win rate
              {summary.bossWinRate < 30 && ' - Bosses are too difficult. Players are losing hope. 🔴'}
              {summary.bossWinRate >= 30 && summary.bossWinRate <= 70 && ' - Perfect boss difficulty! Challenging but achievable. ✅'}
              {summary.bossWinRate > 70 && ' - Bosses may be too easy. Consider adding complexity. 💡'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}