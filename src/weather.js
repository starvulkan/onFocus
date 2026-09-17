// Current weather from Open-Meteo
import * as storage from './storage.js'

const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'
const PLACE_KEY = 'weatherPlace'
const UNIT_KEY = 'weatherUnit'
const CACHE_KEY = 'weatherCache'
const MAX_AGE_MS = 15 * 60_000

const CODES = [
    [[0], 'Clear', 'clear'],
    [[1, 2], 'Partly cloudy', 'partly'],
    [[3], 'Overcast', 'cloudy'],
    [[45, 48], 'Fog', 'fog'],
    [[51, 53, 55, 56, 57], 'Drizzle', 'drizzle'],
    [[61, 63, 65, 66, 67, 80, 81, 82], 'Rain', 'rain'],
    [[71, 73, 75, 77, 85, 86], 'Snow', 'snow'],
    [[95, 96, 99], 'Thunderstorm', 'storm'],
]

export function describe(code) {
    for (const [codes, label, icon] of CODES) {
        if (codes.includes(code)) return { label, icon }
    }
    return { label: 'Unknown', icon: 'clear' }
}

export async function currentUnit() {
    const unit = await storage.get(UNIT_KEY, 'c')
    return unit === 'f' ? 'f' : 'c'
}

export async function setUnit(unit) {
    await storage.set(UNIT_KEY, unit === 'f' ? 'f' : 'c')
}

export async function currentPlace() {
    const place = await storage.get(PLACE_KEY, null)
    if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) return null
    return place
}

export async function setPlace(place) {
    await storage.set(PLACE_KEY, place)
    await storage.remove(CACHE_KEY)
}

export async function clearPlace() {
    await storage.remove(PLACE_KEY)
    await storage.remove(CACHE_KEY)
}

export async function search(name) {
    const query = String(name || '').trim()
    if (query.length < 2) return []
    try {
        const url = `${GEOCODE}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`geocoding returned ${response.status}`)
        const data = await response.json()
        if (!Array.isArray(data.results)) return []
        return data.results.map((r) => ({
            name: r.name,
            label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
            lat: r.latitude,
            lon: r.longitude
        }))
    } catch (error) {
        console.warn('weather: geocoding failed', error)
        return[]
    }
}

export function locate(timeoutMs = 10_000) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null)
        let settled = false
        const done = (value) => { if (!settled) { settled = true; resolve(value) } }
        const timer = setTimeout(() => done(null), timeoutMs)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(timer)
                const lat = Number(pos.coords.latitude.toFixed(3))
                const lon = Number(pos.coords.longitude.toFixed(3))
                done({ name: 'My location', label: `${lat}, ${lon}`, lat, lon })
            },
            () => { clearTimeout(timer); done(null) },
            { timeout: timeoutMs, maximumAge: 600_000 },
        )
    })
}

export async function get({ force = false } = {}) {
    const place = await currentPlace()
    if (!place) return null
    
    const cached = await storage.get(CACHE_KEY, null)
    const fresh =
        cached &&
        cached.lat === place.lat &&
        cached.lon === place.lon &&
        Date.now() - cached.at < MAX_AGE_MS
    if (fresh && !force) return cached.data

    try {
        const url =
            `${FORECAST}?latitude=${place.lat}&longitude=${place.lon}` + 
            `&current=temperature_2m,weather_code,is_day&timezone=auto`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`forecast returned ${response.status}`)
        const raw = await response.json()
        const c = raw.current
        if (!c || !Number.isFinite(c.temperature_2m)) throw new Error('no current block')
        const data = {
            celsius: c.temperature_2m,
            code: Number(c.weather_code),
            isDay: c.is_day !== 0,
            place: place.label,
        }
        await storage.set(CACHE_KEY, { lat: place.lat, lon: place.lon, at: Date.now(), data })
        return data
    } catch (error) {
        console.warn('weather: fetch failed', error)
        return cached && cached.data ? cached.data : null
    }
}

export function format(celsius, unit) {
    const value = unit === 'f' ? celsius * 9 / 5 + 32 : celsius
    return `${Math.round(value)}°${unit === 'f' ? 'F' : 'C'}`
}

const NS = 'http://www.w3.org/2000/svg'

const ICONS = {
  clear:   ['circle:12,12,4.2', 'M12 3.2v2.1', 'M12 18.7v2.1', 'M3.2 12h2.1', 'M18.7 12h2.1',
            'M5.8 5.8l1.5 1.5', 'M16.7 16.7l1.5 1.5', 'M18.2 5.8l-1.5 1.5', 'M7.3 16.7l-1.5 1.5'],
  night:   ['M20 14.5A8 8 0 0 1 9.5 4a7.2 7.2 0 1 0 10.5 10.5z'],
  partly:  ['M8 6.2a3.6 3.6 0 0 1 6.6 1.6', 'M5.5 4.6l.9.9', 'M3 8.2h1.3',
            'M7 17.5h9.6a3.4 3.4 0 0 0 0-6.8 4.8 4.8 0 0 0-9.3 1.2A2.8 2.8 0 0 0 7 17.5z'],
  cloudy:  ['M7 17.5h9.6a3.4 3.4 0 0 0 0-6.8 4.8 4.8 0 0 0-9.3 1.2A2.8 2.8 0 0 0 7 17.5z'],
  fog:     ['M7 13.5h9.6a3.4 3.4 0 0 0 0-6.8 4.8 4.8 0 0 0-9.3 1.2A2.8 2.8 0 0 0 7 13.5z',
            'M4 17h16', 'M6 20.5h12'],
  drizzle: ['M7 14.5h9.6a3.4 3.4 0 0 0 0-6.8 4.8 4.8 0 0 0-9.3 1.2A2.8 2.8 0 0 0 7 14.5z',
            'M9 18v1.6', 'M13 18v1.6', 'M17 18v1.6'],
  rain:    ['M7 13.5h9.6a3.4 3.4 0 0 0 0-6.8 4.8 4.8 0 0 0-9.3 1.2A2.8 2.8 0 0 0 7 13.5z',
            'M9 16.5l-1.2 3.4', 'M13 16.5l-1.2 3.4', 'M17 16.5l-1.2 3.4'],
  snow:    ['M7 13.5h9.6a3.4 3.4 0 0 0 0-6.8 4.8 4.8 0 0 0-9.3 1.2A2.8 2.8 0 0 0 7 13.5z',
            'M9 17.5v3', 'M7.7 18.4l2.6 1.2', 'M10.3 18.4l-2.6 1.2',
            'M15 17.5v3', 'M13.7 18.4l2.6 1.2', 'M16.3 18.4l-2.6 1.2'],
  storm:   ['M7 13.5h9.6a3.4 3.4 0 0 0 0-6.8 4.8 4.8 0 0 0-9.3 1.2A2.8 2.8 0 0 0 7 13.5z',
            'M13 16l-3 4h3l-1 3.2'],
}

function icon(name) {
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('class', 'weather__icon')
    svg.setAttribute('aria-hidden', 'true')
    for (const spec of ICONS[name] || ICONS.clear) {
        if (spec.startsWith('circle:')) {
            const [cx, cy, r] = spec.slice(7).split(',')
            const c = document.createElementNS(NS, 'circle')
            c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r)
            svg.append(c)
        } else {
            const p = document.createElementNS(NS, 'path')
            p.setAttribute('d', spec)
            svg.append(p)
        }
    }
    return svg
}

export function mount(rootEl) {
    return async function refresh({ force = false } = {}) {
        const data = await get({ force })
        if (!data) {
            rootEl.hidden = true
            rootEl.textContent = ''
            return null
        }

        const unit = await currentUnit()
        const { label, icon: glyph } = describe(data.code)
        const name = glyph === 'clear' && !data.isDay ? 'night' : glyph

        rootEl.textContent = ''
        rootEl.append(
            icon(name),
            Object.assign(document.createElement('span'), {
                className: 'weather__temp', textContent: format(data.celsius, unit),
            }), 
            Object.assign(document.createElement('span'), {
                className: 'weather__label', textContent: label,
            }),
        )
        rootEl.title = `${label} in ${data.place}`
        rootEl.hidden = false
        return data
    }
}