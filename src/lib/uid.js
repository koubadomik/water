// Ids must stay unique even when two records are created in the same
// millisecond — a timestamp alone collides, and colliding ids silently merge
// two things that should be separate.
let counter = 0

export function uid(prefix = '') {
  counter += 1
  return `${prefix}${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}
