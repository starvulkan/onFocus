// The session history panel.
//
// Rendered from the same session array everything else derives from, so
// there is nothing extra to keep in sync — open it and it is current.

import * as sessions from './sessions.js'

function fmtDuration(mins) {
  const h = Math.floor(mins / 60)
  return h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`
}

function fmtDayLabel(day) {
  const today = sessions.dayKey()
  const yest = sessions.dayKey(new Date(Date.now() - 86_400_000))
  if (day === today) return 'Today'
  if (day === yest) return 'Yesterday'
  // day is YYYY-MM-DD; split it rather than letting Date parse it as UTC
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function fmtTime(at) {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export async function render(listEl, summaryEl) {
  const all = await sessions.all()

  if (all.length === 0) {
    summaryEl.textContent = 'No sessions yet.'
    listEl.innerHTML = ''
    return
  }

  const total = all.reduce((sum, s) => sum + s.minutes, 0)
  const days = new Set(all.map((s) => s.day)).size
  summaryEl.textContent =
    `${fmtDuration(total)} across ${all.length} session${all.length === 1 ? '' : 's'}` +
    ` on ${days} day${days === 1 ? '' : 's'}`

  // newest first, grouped by day
  const byDay = new Map()
  for (const s of all) {
    if (!byDay.has(s.day)) byDay.set(s.day, [])
    byDay.get(s.day).push(s)
  }

  listEl.innerHTML = ''
  for (const day of [...byDay.keys()].sort().reverse()) {
    const entries = byDay.get(day).sort((a, b) => b.at - a.at)
    const dayTotal = entries.reduce((sum, s) => sum + s.minutes, 0)

    const head = document.createElement('div')
    head.className = 'history__day'
    head.append(
      Object.assign(document.createElement('span'), { textContent: fmtDayLabel(day) }),
      Object.assign(document.createElement('span'), {
        className: 'history__day-total',
        textContent: fmtDuration(dayTotal),
      }),
    )
    listEl.append(head)

    for (const s of entries) {
      const row = document.createElement('div')
      row.className = 'history__row'
      // textContent throughout: the intent is text the user typed, and it
      // must never be parsed as markup.
      row.append(
        Object.assign(document.createElement('span'), {
          className: 'history__time', textContent: fmtTime(s.at),
        }),
        Object.assign(document.createElement('span'), {
          className: 'history__intent',
          textContent: s.intent || 'Untitled session',
        }),
        Object.assign(document.createElement('span'), {
          className: 'history__mins', textContent: `${s.minutes}m`,
        }),
      )
      listEl.append(row)
    }
  }
}

export function mount({ openEl, dialogEl, closeEl, listEl, summaryEl }) {
  openEl.addEventListener('click', async () => {
    await render(listEl, summaryEl)
    dialogEl.showModal()
  })
  closeEl.addEventListener('click', () => dialogEl.close())
  dialogEl.addEventListener('click', (event) => {
    // click the backdrop (the dialog element itself) to dismiss
    if (event.target === dialogEl) dialogEl.close()
  })
}
