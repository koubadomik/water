import { computed } from 'vue'
import { useStorage } from './useStorage.js'

const LS_KEY = 'dailyRoutineData_v2'

const DEFAULT = {
  streak: 0,
  lastDate: null,
  weeklyProgress: {},
  xp: 0,
  totalSessions: 0,
}

let state = null

export function useProgress() {
  if (!state) state = useStorage(LS_KEY, { ...DEFAULT })

  const streak = computed(() => state.value.streak ?? 0)
  const xp = computed(() => state.value.xp ?? 0)

  function todayStr() {
    return new Date().toISOString().split('T')[0]
  }

  function completeSession(earnedXp = 0) {
    const today = todayStr()
    const last = state.value.lastDate

    let newStreak = state.value.streak ?? 0
    if (last === today) {
      // already done today, just add XP
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = yesterday.toISOString().split('T')[0]
      newStreak = last === yStr ? newStreak + 1 : 1
    }

    state.value = {
      ...state.value,
      streak: newStreak,
      lastDate: today,
      xp: (state.value.xp ?? 0) + earnedXp,
      totalSessions: (state.value.totalSessions ?? 0) + 1,
      weeklyProgress: { ...state.value.weeklyProgress, [today]: true },
    }
  }

  function addXp(amount) {
    state.value = { ...state.value, xp: (state.value.xp ?? 0) + amount }
  }

  return { state, streak, xp, completeSession, addXp }
}
