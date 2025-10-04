'use client'

import { useState, useEffect } from 'react'

/**
 * Progressive Disclosure Hook
 * Tracks user's editor experience to progressively reveal features
 */

export type ExperienceTier = 'beginner' | 'intermediate' | 'advanced'

interface EditorStats {
  totalWordCount: number
  sessionsCount: number
  featuresUsed: Set<string>
  lastSessionAt: Date | null
}

const STORAGE_KEY = 'ottopen_editor_stats'

// Thresholds for experience tiers
const THRESHOLDS = {
  beginner: { wordCount: 0, sessions: 0, features: 0 },
  intermediate: { wordCount: 100, sessions: 1, features: 2 },
  advanced: { wordCount: 1000, sessions: 5, features: 5 },
}

export function useProgressiveDisclosure() {
  const [stats, setStats] = useState<EditorStats>({
    totalWordCount: 0,
    sessionsCount: 0,
    featuresUsed: new Set(),
    lastSessionAt: null,
  })

  const [tier, setTier] = useState<ExperienceTier>('beginner')
  const [isLoading, setIsLoading] = useState(true)

  // Load stats from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setStats({
          ...parsed,
          featuresUsed: new Set(parsed.featuresUsed || []),
          lastSessionAt: parsed.lastSessionAt ? new Date(parsed.lastSessionAt) : null,
        })
      }
    } catch (error) {
      console.error('Failed to load editor stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Calculate tier based on stats
  useEffect(() => {
    const { totalWordCount, sessionsCount, featuresUsed } = stats

    if (
      totalWordCount >= THRESHOLDS.advanced.wordCount &&
      sessionsCount >= THRESHOLDS.advanced.sessions &&
      featuresUsed.size >= THRESHOLDS.advanced.features
    ) {
      setTier('advanced')
    } else if (
      totalWordCount >= THRESHOLDS.intermediate.wordCount &&
      sessionsCount >= THRESHOLDS.intermediate.sessions &&
      featuresUsed.size >= THRESHOLDS.intermediate.features
    ) {
      setTier('intermediate')
    } else {
      setTier('beginner')
    }
  }, [stats])

  // Persist stats to localStorage
  const persistStats = (newStats: EditorStats) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...newStats,
          featuresUsed: Array.from(newStats.featuresUsed),
        })
      )
    } catch (error) {
      console.error('Failed to persist editor stats:', error)
    }
  }

  // Track word count
  const trackWordCount = (count: number) => {
    setStats(prev => {
      const newStats = { ...prev, totalWordCount: prev.totalWordCount + count }
      persistStats(newStats)
      return newStats
    })
  }

  // Track session start
  const trackSession = () => {
    setStats(prev => {
      const newStats = {
        ...prev,
        sessionsCount: prev.sessionsCount + 1,
        lastSessionAt: new Date(),
      }
      persistStats(newStats)
      return newStats
    })
  }

  // Track feature usage
  const trackFeatureUsed = (featureName: string) => {
    setStats(prev => {
      const newFeaturesUsed = new Set(prev.featuresUsed)
      newFeaturesUsed.add(featureName)
      const newStats = { ...prev, featuresUsed: newFeaturesUsed }
      persistStats(newStats)
      return newStats
    })
  }

  // Reset stats (for testing or user request)
  const resetStats = () => {
    const emptyStats: EditorStats = {
      totalWordCount: 0,
      sessionsCount: 0,
      featuresUsed: new Set(),
      lastSessionAt: null,
    }
    setStats(emptyStats)
    persistStats(emptyStats)
  }

  // Check if feature should be visible based on tier
  const shouldShowFeature = (requiredTier: ExperienceTier): boolean => {
    const tierOrder: Record<ExperienceTier, number> = {
      beginner: 0,
      intermediate: 1,
      advanced: 2,
    }
    return tierOrder[tier] >= tierOrder[requiredTier]
  }

  // Check if user is new (first session)
  const isFirstSession = stats.sessionsCount === 0

  // Check if user has written anything
  const hasWrittenContent = stats.totalWordCount > 0

  return {
    tier,
    stats,
    isLoading,
    trackWordCount,
    trackSession,
    trackFeatureUsed,
    resetStats,
    shouldShowFeature,
    isFirstSession,
    hasWrittenContent,
  }
}
