// choose your background (backdrop) and stuff soo coooool!
import * as storage from './storage.js'
import { getApod } from './apod.js'

export const MODES = { aurora: 'Aurora Blobs', apod: 'NASA photo' }
export const DEFAULT_SCRIM = 0.62

const KEY = 'background'

export async function currentMode() {
    const mode = await storage.get(KEY, 'aurora')
    return mode in MODES ? mode : 'aurora'
}

export async function setMode(mode) {
    await storage.set(KEY, mode in MODES ? mode : 'aurora')
}

export async function currentScrim() {
    const value = Number(await storage.get('scrim', DEFAULT_SCRIM))
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : DEFAULT_SCRIM
}

export async function setScrim(value) {
    await storage.set('scrim', Math.min(1, Math.max(0, Number(value) || 0)))
}

function safeCssUrl(raw) {
    try {
        const url = new URL(raw)
        if (url.protocol !== 'https:') return null
        return `url(${JSON.stringify(url.href)})`
    } catch {
        return null
    }
}

function preload(src, timeoutMs = 8000) {
    return new Promise((resolve) => {
        const img = new Image()
        const done = (ok) => resolve(ok)
        const timer = setTimeout(() => done(false), timeoutMs)
        img.onload = () => { clearTimeout(timer); done(true) }
        img.onerror = () => { clearTimeout(timer); done(false) }
        img.src = src
    })
}

export function mount({ photoEl, scrimEl, auroraEl, creditEl }) {
    function showAurora() {
        auroraEl.hidden = false
        photoEl.hidden = true
        scrimEl.hidden = true
        creditEl.hidden = true
    }

    function renderCredit(data) {
        creditEl.textContent = ''
        const title = document.createElement('span')
        title.className = 'photo-credit__title'
        title.textContent = data.title
        creditEl.append(title)
        if (data.credit) {
            const by = document.createElement('span')
            by.className = 'photo-credit__by'
            by.textContent = ` - ${data.credit}`
            by.style.display = 'block'
            creditEl.append(by)
        }
        creditEl.hidden = false
    }

    return async function apply() {
        document.documentElement.style.setProperty('--scrim-strength', String(await currentScrim()))

        if (await currentMode() !== 'apod') {
            showAurora()
            return 'aurora'
        }

        const data = await getApod()
        const css = data && data.image ? safeCssUrl(data.image) : null
        if (!css) {
            showAurora()
            return 'aurora-fallback'
        }

        if (!(await preload(data.image))) {
            showAurora()
            return 'aurora-fallback'
        }

        photoEl.style.backgroundImage = css
        photoEl.hidden = false
        scrimEl.hidden = false
        auroraEl.hidden = true
        renderCredit(data)
        return 'apod'
    }
}