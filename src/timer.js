// The focus timer! Make those minutes count!
export const DEFAULT_MINUTES = 25

export function idle(minutes = DEFAULT_MINUTES) {
    return {
        status: 'idle',
        endsAt: null,
        leftMs: null,
        durationMs: minutes * 60_000,
        intent: '',
    }
}

export function start(state, now = Date.now()) {
    return { ...state, status: 'running', endsAt: now + state.durationMs, leftMs: null }
}

export function pause(state, now = Date.now()) {
    if (state.status !== 'running') return state
    return { ...state, status: 'paused', leftMs: Math.max(0, state.endsAt - now), endsAt: null }
}

export function resume(state, now = Date.now()) {
    if (state.status !== 'paused') return state
    return { ...state, status: 'running', endsAt: now + state.leftMs, leftMs: null }
}

export function reset(state) {
    return { ...idle(state.durationMs / 60_000), intent: state.intent }
}

export function remainingMs(state, now = Date.now()) {
    if (state.status === 'running') return Math.max(0, state.endsAt - now)
    if (state.status === 'paused') return state.leftMs
    return state.durationMs
}

export function hasFinished(state, now = Date.now()) {
    return state.status === 'running' && now >= state.endsAt
}

export function elapsedMinutes(state, now = Date.now()) {
    return Math.round((state.durationMs - remainingMs(state, now)) / 60_000)
}

export function format(ms) {
    const total = Math.max(0, Math.round(ms / 1000))
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}