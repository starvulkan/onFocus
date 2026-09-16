// The session log !
import * as storage from './storage.js'

const KEY = 'sessions'
const MAX = 500

export function dayKey(date = new Date()) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export async function all() {
    const list = await storage.get(KEY, [])
    return Array.isArray(list) ? list : []
}

export async function record({ minutes, intent = '', at = Date.now() }) {
    if (!Number.isFinite(minutes) || minutes <= 0) return null
    const entry = {
        day: dayKey(new Date(at)),
        at,
        minutes: Math.round(minutes),
        intent: String(intent).slice(0, 200),
    }
    const list = await all()
    list.push(entry)
    await storage.set(KEY, list.slice(-MAX))
    return entry
}

export async function remove(at) {
    const list = await all()
    const index = list.findIndex((s) => s.at === at)
    if (index === -1) return null
    const [removed] = list.splice(index, 1)
    await storage.set(KEY, list)
    return removed
}

export async function restore(entry) {
    if (!entry || !Number.isFinite(entry.at)) return false
    const list = await all()
    if (list.some((s) => s.at === entry.at)) return false
    list.push(entry)

    list.sort((a, b) => a.at - b.at)
    await storage.set(KEY, list.slice(-MAX))
    return true
}

export async function minutesOn(day = dayKey()) {
    const list = await all()
    return list.reduce((sum, s) => (s.day === day ? sum + s.minutes : sum), 0)
}

export async function totalMinutes() {
    const list = await all()
    return list.reduce((sum, s) => sum + s.minutes, 0)
}

export async function streak(today = new Date()) {
    const days = new Set((await all()).map((s) => s.day))
    if (days.size === 0) return 0

    const cursor = new Date(today)
    if (!days.has(dayKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1)
        if (!days.has(dayKey(cursor))) return 0
    }

    let count = 0
    while (days.has(dayKey(cursor))) {
        count++
        cursor.setDate(cursor.getDate() - 1)
    }
    return count
}