// src/lib/game-state.ts
import { createClient } from './supabase/client'

export interface GameProgress {
  current_level: number
  unlocked_levels: number[]
  high_score: number
  difficulty: string
  total_playtime: number
  achievements: string[]
}

export interface SavedGameState {
  level: number
  score: number
  health: number
  game_state: {
    player: unknown
    bullets: unknown[]
    asteroids: unknown[]
    enemies: unknown[]
    powerUps: unknown[]
    boss: unknown
    activePowerUps: {
      speed: number
      multishot: number
      bigship: number
      shield: number
      rapidfire: number
      bomb: number
    }
  }
}

class GameStateManager {
  private supabase = createClient()

  // ============ PROGRESS MANAGEMENT ============
  
  async getProgress(): Promise<GameProgress | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return this.getLocalProgress()

      const { data, error } = await this.supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      
      return {
        current_level: data.current_level,
        unlocked_levels: data.unlocked_levels,
        high_score: data.high_score,
        difficulty: data.difficulty,
        total_playtime: data.total_playtime,
        achievements: data.achievements || []
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
      return this.getLocalProgress()
    }
  }

  async updateProgress(progress: Partial<GameProgress>): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      // Always update localStorage
      this.updateLocalProgress(progress)
      
      if (!user) return

      const { error } = await this.supabase
        .from('game_progress')
        .update(progress)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  async unlockLevel(level: number): Promise<void> {
    const progress = await this.getProgress()
    if (!progress) return

    if (!progress.unlocked_levels.includes(level)) {
      const updatedLevels = [...progress.unlocked_levels, level].sort((a, b) => a - b)
      await this.updateProgress({ unlocked_levels: updatedLevels })
    }
  }

  async updateHighScore(score: number): Promise<void> {
    const progress = await this.getProgress()
    if (!progress || score <= progress.high_score) return

    await this.updateProgress({ high_score: score })
  }

  // ============ SAVED GAME MANAGEMENT ============

  async saveGame(state: SavedGameState): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      // Always save to localStorage as backup
      this.saveLocalGame(state)
      
      if (!user) return

      const { error } = await this.supabase
        .from('saved_games')
        .upsert({
          user_id: user.id,
          level: state.level,
          score: state.score,
          health: state.health,
          game_state: state.game_state
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving game:', error)
    }
  }

  async loadGame(): Promise<SavedGameState | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return this.loadLocalGame()

      const { data, error } = await this.supabase
        .from('saved_games')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If no saved game in DB, try localStorage
        return this.loadLocalGame()
      }

      return {
        level: data.level,
        score: data.score,
        health: data.health,
        game_state: data.game_state
      }
    } catch (error) {
      console.error('Error loading game:', error)
      return this.loadLocalGame()
    }
  }

  async deleteSavedGame(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      // Clear localStorage
      this.deleteLocalGame()
      
      if (!user) return

      const { error } = await this.supabase
        .from('saved_games')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting saved game:', error)
    }
  }

  // ============ MIGRATION: LocalStorage -> Supabase ============

  async migrateLocalDataToSupabase(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return

      // Migrate progress
      const localProgress = this.getLocalProgress()
      if (localProgress) {
        const { data: existingProgress } = await this.supabase
          .from('game_progress')
          .select('high_score, unlocked_levels')
          .eq('user_id', user.id)
          .single()

        if (existingProgress) {
          // Merge: keep highest score and most unlocked levels
          const mergedUnlockedLevels = Array.from(
            new Set([
              ...(existingProgress.unlocked_levels || [1]),
              ...localProgress.unlocked_levels
            ])
          ).sort((a, b) => a - b)

          await this.updateProgress({
            high_score: Math.max(existingProgress.high_score || 0, localProgress.high_score),
            unlocked_levels: mergedUnlockedLevels
          })
        } else {
          // First time: save all local data
          await this.updateProgress(localProgress)
        }
      }

      // Migrate saved game
      const localSave = this.loadLocalGame()
      if (localSave) {
        await this.saveGame(localSave)
      }
    } catch (error) {
      console.error('Error migrating local data:', error)
    }
  }

  // ============ LOCALSTORAGE FALLBACKS ============

  private getLocalProgress(): GameProgress {
    if (typeof window === 'undefined') {
      return {
        current_level: 1,
        unlocked_levels: [1],
        high_score: 0,
        difficulty: 'medium',
        total_playtime: 0,
        achievements: []
      }
    }

    const stored = localStorage.getItem('starScavengerProgress')
    if (!stored) {
      return {
        current_level: 1,
        unlocked_levels: [1],
        high_score: 0,
        difficulty: 'medium',
        total_playtime: 0,
        achievements: []
      }
    }

    try {
      return JSON.parse(stored)
    } catch {
      return {
        current_level: 1,
        unlocked_levels: [1],
        high_score: 0,
        difficulty: 'medium',
        total_playtime: 0,
        achievements: []
      }
    }
  }

  private updateLocalProgress(progress: Partial<GameProgress>): void {
    if (typeof window === 'undefined') return

    const current = this.getLocalProgress()
    const updated = { ...current, ...progress }
    localStorage.setItem('starScavengerProgress', JSON.stringify(updated))
  }

  private saveLocalGame(state: SavedGameState): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('starScavengerSavedGame', JSON.stringify(state))
  }

  private loadLocalGame(): SavedGameState | null {
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem('starScavengerSavedGame')
    if (!stored) return null

    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  private deleteLocalGame(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('starScavengerSavedGame')
  }
}

export const gameState = new GameStateManager()