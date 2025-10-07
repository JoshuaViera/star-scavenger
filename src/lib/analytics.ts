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
    shield: number
    rapidfire: number
    bomb: number
  }
  bossesDefeated: number
  bossesFought: number
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
        bigship: 0,
        shield: 0,
        rapidfire: 0,
        bomb: 0
      },
      bossesDefeated: 0,
      bossesFought: 0
    }

    const data = this.getAnalyticsData()
    data.totalPlays++
    this.saveAnalyticsData(data)
  }

  collectPowerUp(type: 'speed' | 'multishot' | 'bigship' | 'shield' | 'rapidfire' | 'bomb') {
    if (!this.currentSession) return
    this.currentSession.powerUpsCollected[type]++
  }

  updateLevel(level: number) {
    if (!this.currentSession) return
    if (level > this.currentSession.highestLevel) {
      this.currentSession.highestLevel = level
    }
  }

  bossFight() {
    if (!this.currentSession) return
    this.currentSession.bossesFought++
    
    const data = this.getAnalyticsData()
    data.totalBossesFought++
    this.saveAnalyticsData(data)
  }

  bossDefeated() {
    if (!this.currentSession) return
    this.currentSession.bossesDefeated++
    
    const data = this.getAnalyticsData()
    data.totalBossesDefeated++
    this.saveAnalyticsData(data)
  }

  gameOver(finalScore: number) {
    if (!this.currentSession) return
    
    this.currentSession.gameOvers++
    this.currentSession.finalScore = finalScore
    this.currentSession.endTime = Date.now()

    const data = this.getAnalyticsData()
    data.totalGameOvers++
    data.sessions.push({ ...this.currentSession })
    data.lastUpdated = Date.now()
    
    if (data.sessions.length > 100) {
      data.sessions = data.sessions.slice(-100)
    }
    
    this.saveAnalyticsData(data)
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
        bossWinRate: 0
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

    return {
      totalPlays: data.totalPlays,
      retryRate: Math.round(retryRate),
      avgSessionLength: Math.round(totalSessionTime / data.sessions.length / 1000),
      avgScore: Math.round(totalScore / data.sessions.length),
      levelDistribution,
      powerUpUsage: {
        speed: powerUpUsage.speed || 0,
        multishot: powerUpUsage.multishot || 0,
        bigship: powerUpUsage.bigship || 0,
        shield: powerUpUsage.shield || 0,
        rapidfire: powerUpUsage.rapidfire || 0,
        bomb: powerUpUsage.bomb || 0
      },
      totalBossesDefeated: data.totalBossesDefeated || 0,
      totalBossesFought: data.totalBossesFought || 0,
      bossWinRate: Math.round(bossWinRate)
    }
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