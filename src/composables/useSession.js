import { ref } from 'vue'

const PHASES = ['palace-walk', 'random-review', 'new-verse-drill', 'celebration']

export function useSession() {
  const phaseIndex = ref(0)
  const phase = ref(PHASES[0])
  const xp = ref(0)

  function advance() {
    if (phaseIndex.value < PHASES.length - 1) {
      phaseIndex.value++
      phase.value = PHASES[phaseIndex.value]
    }
  }

  function addXp(amount) {
    xp.value += amount
  }

  function reset() {
    phaseIndex.value = 0
    phase.value = PHASES[0]
    xp.value = 0
  }

  return { phase, xp, advance, addXp, reset }
}
