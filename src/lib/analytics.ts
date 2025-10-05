// src/lib/analytics.ts

interface GameSession {
  sessionId: string
  startTime: number
  endTime?: number
  finalScore: number
  highestLevel: number
  gameOvers: number
  retries: number
  powerUpsCollected: {
    speed: number
    multishot: number
    bigship: number
  }
}

interface AnalyticsData {
  sessions: GameSession[]
  totalPlays: number
  totalRetries: number
  totalGameOvers: number
  lastUpdated: number
}

class Analytics {
  private currentSession: GameSession | null = null

  // Initialize or load existing analytics data
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
      lastUpdated: Date.now()
    }
  }

  private saveAnalyticsData(data: AnalyticsData) {
    if (typeof window === 'undefined') return
    localStorage.setItem('starScavengerAnalytics', JSON.stringify(data))
  }

  // Start a new game session
  startSession(level: number) {
    this.currentSession = {
      sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      finalScore: 0,
      highestLevel: level,
      gameOvers: 0,
      retries: 0,
      powerUpsCollected: {
        speed: 0,
        multishot: 0,
        bigship: 0
      }
    }

    const data = this.getAnalyticsData()
    data.totalPlays++
    this.saveAnalyticsData(data)
  }

  // Track power-up collection
  collectPowerUp(type: 'speed' | 'multishot' | 'bigship') {
    if (!this.currentSession) return
    this.currentSession.powerUpsCollected[type]++
  }

  // Update highest level reached
  updateLevel(level: number) {
    if (!this.currentSession) return
    if (level > this.currentSession.highestLevel) {
      this.currentSession.highestLevel = level
    }
  }

  // Track game over event
  gameOver(finalScore: number) {
    if (!this.currentSession) return
    
    this.currentSession.gameOvers++
    this.currentSession.finalScore = finalScore
    this.currentSession.endTime = Date.now()

    const data = this.getAnalyticsData()
    data.totalGameOvers++
    data.sessions.push({ ...this.currentSession })
    data.lastUpdated = Date.now()
    
    // Keep only last 100 sessions to avoid localStorage bloat
    if (data.sessions.length > 100) {
      data.sessions = data.sessions.slice(-100)
    }
    
    this.saveAnalyticsData(data)
  }

  // Track retry (play again)
  retry() {
    const data = this.getAnalyticsData()
    data.totalRetries++
    this.saveAnalyticsData(data)
  }

  // Get analytics summary for display
  getAnalyticsSummary() {
    const data = this.getAnalyticsData()
    
    if (data.sessions.length === 0) {
      return {
        totalPlays: 0,
        retryRate: 0,
        avgSessionLength: 0,
        avgScore: 0,
        levelDistribution: {},
        powerUpUsage: { speed: 0, multishot: 0, bigship: 0 }
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

    const powerUpUsage = data.sessions.reduce((acc, s) => ({
      speed: acc.speed + s.powerUpsCollected.speed,
      multishot: acc.multishot + s.powerUpsCollected.multishot,
      bigship: acc.bigship + s.powerUpsCollected.bigship
    }), { speed: 0, multishot: 0, bigship: 0 })

    const retryRate = data.totalGameOvers > 0 
      ? (data.totalRetries / data.totalGameOvers) * 100 
      : 0

    return {
      totalPlays: data.totalPlays,
      retryRate: Math.round(retryRate),
      avgSessionLength: Math.round(totalSessionTime / data.sessions.length / 1000), // in seconds
      avgScore: Math.round(totalScore / data.sessions.length),
      levelDistribution,
      powerUpUsage
    }
  }

  // Export data as JSON for external analysis
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