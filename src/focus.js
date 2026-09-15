// The focus panel
import * as storage from './storage.js'
import * as timer from './timer.js'
import * as sessions from './sessions.js'

const KEY = 'timer'

export function mount({ clockEl, intentEl, primaryEl, secondaryEl, statsEl, durationEl, durationWrapEl, wallClock }) {
    let state = timer.idle()
    let ticking = null

    async function save() {
        await storage.set(KEY, state)
    }

    async function renderStats() {
    const [mins, days] = await Promise.all([sessions.minutesOn(), sessions.streak()])
    if (mins === 0 && days === 0) {
      statsEl.hidden = true
      return
    }
    const h = Math.floor(mins / 60)
    const focused = h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`
    statsEl.hidden = false
    statsEl.textContent =
      days > 1 ? `${focused} focused today · ${days} day streak` : `${focused} focused today`
  }

  function render() {
    const active = state.status !== 'idle'

    clockEl.textContent = active ? timer.format(timer.remainingMs(state)) : wallClock()
    clockEl.classList.toggle('clock--session', active)

    intentEl.readOnly = active
    intentEl.value = active ? state.intent : intentEl.value
    durationWrapEl.hidden = active
    if (!active) durationEl.value = String(Math.round(state.durationMs / 60_000))

    if (state.status ==='idle') {
        primaryEl.textContent = 'Start focus'
        secondaryEl.hidden = true
    } else if (state.status === 'running') {
        primaryEl.textContent = 'Pause'
        secondaryEl.hidden = false
        secondaryEl.textContent = 'Give up'
    }
  }

  async function finish() {
    await sessions.record({ minutes: state.durationMs / 60_000, intent: state.intent })
    state = timer.reset(state)
    await save()
    stopTicking()
    render()
    await renderStats()
    document.body.classList.add('is-celebrating')
    setTimeout(() => document.body.classList.remove('is-celebrating'), 2400)
  }

  function startTicking() {
    if (ticking) return
    ticking = setInterval(async () => {
      if (timer.hasFinished(state)) {
        await finish()
      } else {
        render()
      }
    }, 1000)
  }

  function stopTicking() {
    clearInterval(ticking)
    ticking = null
  }

  function chosenMinutes() {

    const raw = Number.parseInt(durationEl.value, 10)

    if (!Number.isFinite(raw)) return timer.DEFAULT_MINUTES

    return Math.min(180, Math.max(1, raw))

  }


  durationEl.addEventListener('change', async () => {

    if (state.status !== 'idle') return

    const mins = chosenMinutes()

    durationEl.value = String(mins)

    state = { ...state, durationMs: mins * 60_000 }

    await storage.set('duration', mins)

    await save()

    render()

  })


  primaryEl.addEventListener('click', async () => {
    if (state.status === 'idle') {
      const mins = chosenMinutes()
      await storage.set('duration', mins)
      state = timer.start({ ...state, durationMs: mins * 60_000, intent: intentEl.value.trim() })
      startTicking()
    } else if (state.status === 'running') {
      state = timer.pause(state)
      stopTicking()
    } else {
      state = timer.resume(state)
      startTicking()
    }
    await save()
    render()
  })

  secondaryEl.addEventListener('click', async () => {
    const done = timer.elapsedMinutes(state)
    if (done >= 1) {
        await sessions.record({ minutes: done, intent: state.intent })
    }
    state = timer.reset(state)
    stopTicking()
    await save()
    render()
    await renderStats()
  })

  intentEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && state.status === 'idle') primaryEl.click()
  })

  return async function init() {
    const saved = await storage.get(KEY, null)
    if (saved && saved.status) state = saved

    if (state.status === 'idle') {
      const mins = await storage.get('duration', timer.DEFAULT_MINUTES)
      state = { ...state, durationMs: mins * 60_000 }
    }

    if (timer.hasFinished(state)) {
        await finish()
    } else {
      if (state.status === 'running') startTicking()
      render()
      await renderStats()  
    }
  }

}