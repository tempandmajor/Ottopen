import { useState, useEffect } from 'react'
import { dbService } from '@/src/lib/database'
import type { WritingGoal } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'

export function useWritingGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<WritingGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadGoals()
    }
  }, [userId])

  const loadGoals = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const userGoals = await dbService.getWritingGoals(userId)
      setGoals(userGoals)
    } catch (error) {
      console.error('Failed to load writing goals:', error)
      toast.error('Failed to load writing goals')
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async (goalData: Omit<WritingGoal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newGoal = await dbService.createWritingGoal(goalData)
      if (newGoal) {
        setGoals(prev => [newGoal, ...prev])
        toast.success('Goal created successfully!')
        return newGoal
      } else {
        toast.error('Failed to create goal')
        return null
      }
    } catch (error) {
      console.error('Failed to create goal:', error)
      toast.error('Failed to create goal')
      return null
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<WritingGoal>) => {
    try {
      const updatedGoal = await dbService.updateWritingGoal(goalId, updates)
      if (updatedGoal) {
        setGoals(prev =>
          prev.map(goal =>
            goal.id === goalId ? updatedGoal : goal
          )
        )
        toast.success('Goal updated successfully!')
        return updatedGoal
      } else {
        toast.error('Failed to update goal')
        return null
      }
    } catch (error) {
      console.error('Failed to update goal:', error)
      toast.error('Failed to update goal')
      return null
    }
  }

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    return updateGoal(goalId, { current_value: newValue })
  }

  return {
    goals,
    loading,
    loadGoals,
    createGoal,
    updateGoal,
    updateGoalProgress
  }
}