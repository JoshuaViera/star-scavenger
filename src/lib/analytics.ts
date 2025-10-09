// src/lib/analytics.ts
import { createClient } from './supabase/client'

interface DeathEvent {
  timestamp: number
  cause: 'asteroid' | 'enemy' | 'boss' | 'enemy_bullet' | 'boss_bullet'
  x: number
  y: number
  level: number
  score: number
  timeAlive: number
}

interface BossFightMetrics {
  bossType: string
  level: number
  startTime: number
  endTime?: number
  outcome: 'victory' | 'defeat' | 'abandoned'
  damageDealt: number
  damageTaken: number
  shotsFired: number
  shotsHit: number
  powerUpsUsedDuringFight: string[]
  deathCount: number
  timeToDefeat?: number
}

interface ShootingMetrics {
  totalShots: number
  shotsHit: number
  shotsMissed: number
  accuracy: number
}

interface MovementMetrics {
  totalDistance: number
  avgSpeed: number
  timeSpentMoving: number
  timeSpentIdle: number
}

interface GameSession {
  sessionId: string
  startTime: number
  endTime?: number
  finalScore: number
  highestLevel: number
  gameOvers: number
  retries: number
  difficulty: 'easy' | 'medium' | 'hard'
  powerUpsCollected: {
    speed: number
    multishot: number
    bigship: number
    shield: number
    rapidfire: number
    bomb: number
  }
  powerUpsUsed: {
    speed: number
    multishot: number
    bigship: number
    shield: number
    rapidfire: number
    bomb: number
  }
  bossesDefeated: number
  bossesFought: number
  deaths: DeathEvent[]
  bossFights: BossFightMetrics[]
  shooting: ShootingMetrics
  movement: MovementMetrics
  levelTimes: Record<number, number>
  quitReason?: 'completion' | 'rage_quit' | 'pause_quit' | 'natural'
}

interface AnalyticsData {
  sessions: GameSession[]
  totalPlays: number
  totalRetries: number
  totalGameOvers: number
  totalBossesDefeated: number
  totalBossesFought: number
  lastUpdated: number
}

class Analytics {
  private currentSession: GameSession | null = null
  private supabase = createClient()
  private currentBossFight: BossFightMetrics | null = null
  private levelStartTime: number = 0
  private lastPlayerPosition = { x: 400, y: 300 }
  private totalDistanceMoved = 0

  private getAnalyticsData(): AnalyticsData {
    if (typeof window === 'undefined') return this.getDefaultData()

    const stored = localStorage.getItem('starScavengerAnalytics')
    if (!stored) return this.getDefaultData()

    try {
      return JSON.parse(stored)
    } catch {
      return this.getDefaultData()
    }
  }

  private getDefaultData(): AnalyticsData {
    return {
      sessions: [],
      totalPlays: 0,
      totalRetries: 0,
      totalGameOvers: 0,
      totalBossesDefeated: 0,
      totalBossesFought: 0,
      lastUpdated: Date.now()
    }
  }

  private saveAnalyticsData(data: AnalyticsData) {
    if (typeof window === 'undefined') return
    localStorage.setItem('starScavengerAnalytics', JSON.stringify(data))
  }

  startSession(level: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.currentSession = {
      sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      finalScore: 0,
      highestLevel: level,
      gameOvers: 0,
      retries: 0,
      difficulty,
      powerUpsCollected: {
        speed: 0,
        multishot: 0,
        bigship: 0,
        shield: 0,
        rapidfire: 0,
        bomb: 0
      },
      powerUpsUsed: {
        speed: 0,
        multishot: 0,
        bigship: 0,
        shield: 0,
        rapidfire: 0,
        bomb: 0
      },
      bossesDefeated: 0,
      bossesFought: 0,
      deaths: [],
      bossFights: [],
      shooting: {
        totalShots: 0,
        shotsHit: 0,
        shotsMissed: 0,
        accuracy: 0
      },
      movement: {
        totalDistance: 0,
        avgSpeed: 0,
        timeSpentMoving: 0,
        timeSpentIdle: 0
      },
      levelTimes: {}
    }

    this.levelStartTime = Date.now()
    this.totalDistanceMoved = 0

    const data = this.getAnalyticsData()
    data.totalPlays++
    this.saveAnalyticsData(data)
  }

  playerShot() {
    if (!this.currentSession) return
    this.currentSession.shooting.totalShots++

    if (this.currentBossFight) {
      this.currentBossFight.shotsFired++
    }
  }

  shotHit(targetType: 'asteroid' | 'enemy' | 'boss') {
    if (!this.currentSession) return
    this.currentSession.shooting.shotsHit++

    if (this.currentBossFight && targetType === 'boss') {
      this.currentBossFight.shotsHit++
      this.currentBossFight.damageDealt++
    }
  }

  shotMissed() {
    if (!this.currentSession) return
    this.currentSession.shooting.shotsMissed++
  }

  updatePlayerPosition(x: number, y: number) {
    if (!this.currentSession) return

    const dx = x - this.lastPlayerPosition.x
    const dy = y - this.lastPlayerPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    this.totalDistanceMoved += distance
    this.currentSession.movement.totalDistance = this.totalDistanceMoved

    this.lastPlayerPosition = { x, y }
  }

  playerDied(
    cause: 'asteroid' | 'enemy' | 'boss' | 'enemy_bullet' | 'boss_bullet',
    x: number,
    y: number,
    level: number,
    score: number
  ) {
    if (!this.currentSession) return

    const deathEvent: DeathEvent = {
      timestamp: Date.now(),
      cause,
      x,
      y,
      level,
      score,
      timeAlive: Date.now() - this.currentSession.startTime
    }

    this.currentSession.deaths.push(deathEvent)

    if (this.currentBossFight) {
      this.currentBossFight.deathCount++
    }
  }

  bossFightStart(bossType: string, level: number) {
    if (!this.currentSession) return

    this.currentBossFight = {
      bossType,
      level,
      startTime: Date.now(),
      outcome: 'abandoned',
      damageDealt: 0,
      damageTaken: 0,
      shotsFired: 0,
      shotsHit: 0,
      powerUpsUsedDuringFight: [],
      deathCount: 0
    }

    this.currentSession.bossesFought++

    const data = this.getAnalyticsData()
    data.totalBossesFought++
    this.saveAnalyticsData(data)
  }

  bossDamageDealt(amount: number) {
    if (!this.currentBossFight) return
    this.currentBossFight.damageDealt += amount
  }

  bossDamageTaken(amount: number) {
    if (!this.currentBossFight) return
    this.currentBossFight.damageTaken += amount
  }

  bossDefeated() {
    if (!this.currentSession || !this.currentBossFight) return

    this.currentBossFight.outcome = 'victory'
    this.currentBossFight.endTime = Date.now()
    this.currentBossFight.timeToDefeat = this.currentBossFight.endTime - this.currentBossFight.startTime

    this.currentSession.bossesDefeated++
    this.currentSession.bossFights.push({ ...this.currentBossFight })

    const data = this.getAnalyticsData()
    data.totalBossesDefeated++
    this.saveAnalyticsData(data)

    this.currentBossFight = null
  }

  bossFightLost() {
    if (!this.currentSession || !this.currentBossFight) return

    this.currentBossFight.outcome = 'defeat'
    this.currentBossFight.endTime = Date.now()

    this.currentSession.bossFights.push({ ...this.currentBossFight })
    this.currentBossFight = null
  }

  collectPowerUp(type: 'speed' | 'multishot' | 'bigship' | 'shield' | 'rapidfire' | 'bomb') {
    if (!this.currentSession) return
    this.currentSession.powerUpsCollected[type]++
  }

  usePowerUp(type: 'speed' | 'multishot' | 'bigship' | 'shield' | 'rapidfire' | 'bomb') {
    if (!this.currentSession) return
    this.currentSession.powerUpsUsed[type]++

    if (this.currentBossFight) {
      this.currentBossFight.powerUpsUsedDuringFight.push(type)
    }
  }

  updateLevel(level: number) {
    if (!this.currentSession) return

    if (this.levelStartTime > 0) {
      const timeSpent = Date.now() - this.levelStartTime
      this.currentSession.levelTimes[this.currentSession.highestLevel] = timeSpent
    }

    if (level > this.currentSession.highestLevel) {
      this.currentSession.highestLevel = level
      this.levelStartTime = Date.now()
    }
  }
  async gameOver(finalScore: number, level: number, difficulty: string, quitReason: 'completion' | 'rage_quit' | 'pause_quit' | 'natural' = 'natural') {
    if (!this.currentSession) return

    this.currentSession.gameOvers++
    this.currentSession.finalScore = finalScore
    this.currentSession.endTime = Date.now()
    this.currentSession.quitReason = quitReason

    if (this.currentSession.shooting.totalShots > 0) {
      this.currentSession.shooting.accuracy =
        (this.currentSession.shooting.shotsHit / this.currentSession.shooting.totalShots) * 100
    }

    if (this.currentBossFight) {
      this.currentBossFight.outcome = 'abandoned'
      this.currentBossFight.endTime = Date.now()
      this.currentSession.bossFights.push({ ...this.currentBossFight })
      this.currentBossFight = null
    }

    const data = this.getAnalyticsData()
    data.totalGameOvers++
    data.sessions.push({ ...this.currentSession })
    data.lastUpdated = Date.now()

    if (data.sessions.length > 100) {
      data.sessions = data.sessions.slice(-100)
    }

    this.saveAnalyticsData(data)
    await this.submitToLeaderboard(finalScore, level, difficulty)
  }

  async submitToLeaderboard(score: number, level: number, difficulty: string) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()

      if (!user) {
        console.log('No user logged in - skipping leaderboard submission')
        return
      }

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (!profile) {
        console.log('No profile found - skipping leaderboard submission')
        return
      }

      const sessionDuration = this.currentSession?.endTime && this.currentSession?.startTime
        ? Math.round((this.currentSession.endTime - this.currentSession.startTime) / 1000)
        : 0

      const bossesDefeated = this.currentSession?.bossesDefeated || 0

      const { error } = await this.supabase.from('leaderboard').insert({
        user_id: user.id,
        username: profile.username,
        score,
        level_reached: level,
        difficulty,
        session_duration: sessionDuration,
        bosses_defeated: bossesDefeated
      })

      if (error) {
        console.error('Leaderboard insert error:', error)
      } else {
        console.log('✅ Successfully submitted to leaderboard!')
      }
    } catch (error) {
      console.error('Failed to submit to leaderboard:', error)
    }
  }

  retry() {
    const data = this.getAnalyticsData()
    data.totalRetries++
    this.saveAnalyticsData(data)
  }

  getAnalyticsSummary() {
    const data = this.getAnalyticsData()

    if (data.sessions.length === 0) {
      return {
        totalPlays: 0,
        retryRate: 0,
        avgSessionLength: 0,
        avgScore: 0,
        levelDistribution: {},
        powerUpUsage: {
          speed: 0,
          multishot: 0,
          bigship: 0,
          shield: 0,
          rapidfire: 0,
          bomb: 0
        },
        totalBossesDefeated: 0,
        totalBossesFought: 0,
        bossWinRate: 0,
        avgAccuracy: 0,
        deathHeatmap: {},
        mostCommonDeathCause: 'none',
        difficultyBreakdown: {},
        bossDifficultyRanking: [],
        powerUpEffectiveness: {},
        recommendations: []
      }
    }

    const totalSessionTime = data.sessions.reduce((sum, s) => {
      if (!s.endTime) return sum
      return sum + (s.endTime - s.startTime)
    }, 0)

    const totalScore = data.sessions.reduce((sum, s) => sum + s.finalScore, 0)

    const levelDistribution: Record<number, number> = {}
    data.sessions.forEach(s => {
      levelDistribution[s.highestLevel] = (levelDistribution[s.highestLevel] || 0) + 1
    })

    const powerUpUsage = data.sessions.reduce((acc, s) => {
      const collected = s.powerUpsCollected || { speed: 0, multishot: 0, bigship: 0, shield: 0, rapidfire: 0, bomb: 0 }
      return {
        speed: acc.speed + (collected.speed || 0),
        multishot: acc.multishot + (collected.multishot || 0),
        bigship: acc.bigship + (collected.bigship || 0),
        shield: acc.shield + (collected.shield || 0),
        rapidfire: acc.rapidfire + (collected.rapidfire || 0),
        bomb: acc.bomb + (collected.bomb || 0)
      }
    }, { speed: 0, multishot: 0, bigship: 0, shield: 0, rapidfire: 0, bomb: 0 })

    const retryRate = data.totalGameOvers > 0
      ? (data.totalRetries / data.totalGameOvers) * 100
      : 0

    const bossWinRate = data.totalBossesFought > 0
      ? (data.totalBossesDefeated / data.totalBossesFought) * 100
      : 0

    const totalAccuracy = data.sessions.reduce((sum, s) => sum + (s.shooting?.accuracy || 0), 0)
    const avgAccuracy = data.sessions.length > 0 ? totalAccuracy / data.sessions.length : 0

    const deathCauses: Record<string, number> = {}
    data.sessions.forEach(s => {
      s.deaths?.forEach(d => {
        deathCauses[d.cause] = (deathCauses[d.cause] || 0) + 1
      })
    })

    const mostCommonDeathCause = Object.entries(deathCauses)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none'

    const difficultyStats: Record<string, { plays: number; avgScore: number; avgTime: number; winRate: number; totalScore: number; totalTime: number; wins: number }> = {}
    data.sessions.forEach(s => {
      const diff = s.difficulty || 'medium'
      if (!difficultyStats[diff]) {
        difficultyStats[diff] = {
          plays: 0,
          avgScore: 0,
          avgTime: 0,
          winRate: 0,
          totalScore: 0,
          totalTime: 0,
          wins: 0
        }
      }
      difficultyStats[diff].plays++
      difficultyStats[diff].totalScore += s.finalScore
      if (s.endTime) {
        difficultyStats[diff].totalTime += (s.endTime - s.startTime)
      }
      if (s.highestLevel >= 5) {
        difficultyStats[diff].wins++
      }
    })

    Object.keys(difficultyStats).forEach(diff => {
      const stats = difficultyStats[diff]
      stats.avgScore = Math.round(stats.totalScore / stats.plays)
      stats.avgTime = Math.round(stats.totalTime / stats.plays / 1000)
      stats.winRate = Math.round((stats.wins / stats.plays) * 100)
    })

    const bossStats: Record<string, { fights: number, wins: number, avgTime: number, totalTime: number }> = {}
    data.sessions.forEach(s => {
      s.bossFights?.forEach(bf => {
        if (!bossStats[bf.bossType]) {
          bossStats[bf.bossType] = { fights: 0, wins: 0, avgTime: 0, totalTime: 0 }
        }
        bossStats[bf.bossType].fights++
        if (bf.outcome === 'victory') {
          bossStats[bf.bossType].wins++
          if (bf.timeToDefeat) {
            bossStats[bf.bossType].totalTime += bf.timeToDefeat
          }
        }
      })
    })

    const bossDifficultyRanking = Object.entries(bossStats)
      .map(([name, stats]) => ({
        name,
        winRate: stats.fights > 0 ? Math.round((stats.wins / stats.fights) * 100) : 0,
        avgTimeToDefeat: stats.wins > 0 ? Math.round(stats.totalTime / stats.wins / 1000) : 0,
        fights: stats.fights
      }))
      .sort((a, b) => a.winRate - b.winRate)

    const recommendations = this.generateRecommendations({
      retryRate,
      bossWinRate,
      avgAccuracy,
      mostCommonDeathCause,
      levelDistribution,
      bossDifficultyRanking
    })

    return {
      totalPlays: data.totalPlays,
      retryRate: Math.round(retryRate),
      avgSessionLength: Math.round(totalSessionTime / data.sessions.length / 1000),
      avgScore: Math.round(totalScore / data.sessions.length),
      levelDistribution,
      powerUpUsage,
      totalBossesDefeated: data.totalBossesDefeated || 0,
      totalBossesFought: data.totalBossesFought || 0,
      bossWinRate: Math.round(bossWinRate),
      avgAccuracy: Math.round(avgAccuracy),
      deathHeatmap: deathCauses,
      mostCommonDeathCause,
      difficultyBreakdown: difficultyStats,
      bossDifficultyRanking,
      recommendations
    }
  }

  private generateRecommendations(metrics: {
    retryRate: number
    bossWinRate: number
    avgAccuracy: number
    mostCommonDeathCause: string
    levelDistribution: Record<number, number>
    bossDifficultyRanking: Array<{ name: string; winRate: number }>
  }): string[] {
    const recommendations: string[] = []

    if (metrics.retryRate < 30) {
      recommendations.push('🔴 CRITICAL: Low retry rate suggests players are frustrated. Consider reducing difficulty or adding more generous checkpoints.')
    } else if (metrics.retryRate < 50) {
      recommendations.push('⚠️ Warning: Moderate retry rate. Game may have difficulty spikes that frustrate players.')
    }

    if (metrics.bossWinRate < 25) {
      recommendations.push('🔴 BOSS: Bosses are too difficult. Consider reducing boss health by 20-30% or increasing player damage.')
    } else if (metrics.bossWinRate > 75) {
      recommendations.push('⚠️ BOSS: Bosses may be too easy. Consider adding more attack patterns or increasing boss health.')
    }

    if (metrics.avgAccuracy < 30) {
      recommendations.push('💡 Consider adding aim assist or making enemy hitboxes slightly larger.')
    }

    if (metrics.mostCommonDeathCause === 'asteroid') {
      recommendations.push('💡 Players dying mostly to asteroids - consider reducing asteroid speed or spawn rate.')
    } else if (metrics.mostCommonDeathCause === 'boss') {
      recommendations.push('💡 Boss attacks are the main killer - consider telegraphing boss attacks more clearly.')
    }

    // Fix: Proper type handling for reduce
    const levelValues = Object.values(metrics.levelDistribution) as number[]
    const totalLevelPlays = levelValues.reduce((sum, val) => sum + val, 0)
    const level1Count = (metrics.levelDistribution[1] as number) || 0
    const level1Percent = totalLevelPlays > 0 ? (level1Count / totalLevelPlays) * 100 : 0

    if (level1Percent > 50) {
      recommendations.push('🔴 CRITICAL: Over 50% of players don\'t make it past Level 1. This is a major difficulty spike.')
    }

    if (metrics.bossDifficultyRanking.length > 0) {
      const hardestBoss = metrics.bossDifficultyRanking[0]
      if (hardestBoss.winRate < 20) {
        recommendations.push(`🔴 BOSS: "${hardestBoss.name}" has only ${hardestBoss.winRate}% win rate - needs significant rebalancing.`)
      }
    }

    return recommendations
  }

  exportData() {
    const data = this.getAnalyticsData()
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `star-scavenger-analytics-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
}

export const analytics = new Analytics()