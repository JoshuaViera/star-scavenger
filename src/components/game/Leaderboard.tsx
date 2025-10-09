// src/components/game/Leaderboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LeaderboardEntry {
  id: string
  username: string
  score: number
  level_reached: number
  difficulty: string
  session_duration: number
  bosses_defeated: number
  created_at: string
}

interface LeaderboardProps {
  difficulty?: 'easy' | 'medium' | 'hard' | 'all'
  limit?: number
}

export function Leaderboard({ difficulty = 'all', limit = 100 }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(difficulty)
  const supabase = createClient()

  useEffect(() => {
    fetchLeaderboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit)

      if (filter !== 'all') {
        query = query.eq('difficulty', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'easy', 'medium', 'hard'].map((diff) => (
          <button
            key={diff}
            onClick={() => setFilter(diff)}
            className={`px-4 py-2 rounded font-medium transition-colors whitespace-nowrap ${
              filter === diff
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Loading leaderboard...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No scores yet. Be the first!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-800 text-gray-300 text-sm sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left">Rank</th>
                  <th className="px-3 py-3 text-left">Player</th>
                  <th className="px-3 py-3 text-right">Score</th>
                  <th className="px-3 py-3 text-center">Level</th>
                  <th className="px-3 py-3 text-center">Difficulty</th>
                  <th className="px-3 py-3 text-center">Bosses</th>
                  <th className="px-3 py-3 text-center">Time</th>
                  <th className="px-3 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-gray-200">
                {entries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`border-t border-gray-800 ${
                      index < 3 ? 'bg-gray-800/50' : 'hover:bg-gray-800/30'
                    }`}
                  >
                    <td className="px-3 py-3">
                      <span
                        className={`font-bold text-sm ${
                          index === 0
                            ? 'text-yellow-500'
                            : index === 1
                            ? 'text-gray-400'
                            : index === 2
                            ? 'text-orange-700'
                            : 'text-gray-500'
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-sm">{entry.username}</td>
                    <td className="px-3 py-3 text-right font-bold text-blue-400 text-sm">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center text-sm">{entry.level_reached}</td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.difficulty === 'easy'
                            ? 'bg-green-900 text-green-300'
                            : entry.difficulty === 'medium'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {entry.difficulty}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-purple-400 text-sm">
                      {entry.bosses_defeated}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-400">
                      {formatDuration(entry.session_duration || 0)}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-gray-400">
                      {formatDate(entry.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={fetchLeaderboard}
          className="px-6 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  )
}