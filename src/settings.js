// Settings panel
import * as background from './background.js'
import * as search from './search.js'
import * as storage from './storage.js'

export function mount({
    openEl, dialogEl, closeEl,
    bgEl, scrimRowEl, scrimEl, scrimValueEl,
    engineEl, customEl,
    applyBackground,
}) {
    async function load() {
        const mode = await background.currentMode()
        bgEl.value = mode
        scrimRowEl.hidden = mode !== 'apod'

        const scrim = await background.currentScrim()
        scrimEl.value = String(Math.round(scrim * 100))
        scrimValueEl.textContent = `${Math.round(scrim * 100)}%`

        const engine = await storage.get('searchEngine', search.DEFAULT_ENGINE)
        engineEl.value = engine in search.ENGINES ? engine : search.DEFAULT_ENGINE
        customEl.value = (await storage.get('searchCustom', '')) || ''
    }

    openEl.addEventListener('click', async () => {
        await load()
        dialogEl.showModal()
    })
    closeEl.addEventListener('click', () => dialogEl.close())
    dialogEl.addEventListener('click', (event) => {
        if (event.target === dialogEl) dialogEl.close()
    })

    bgEl.addEventListener('change', async () => {
        await background.setMode(bgEl.value)
        scrimRowEl.hidden = bgEl.value !== 'apod'
        await applyBackground()
    })

    scrimEl.addEventListener('input', async () => {
        const pct = Number(scrimEl.value)
        scrimValueEl.textContent = `${pct}%`
        await background.setScrim(pct / 100)
        document.documentElement.style.setProperty('--scrim-strength', String(pct / 100))
    })

    engineEl.addEventListener('change', async () => {
        await storage.set('searchEngine', engineEl.value)
    })

    customEl.addEventListener('change', async () => {
        const value = customEl.value.trim()
        await storage.set('searchCustom', value.includes('%s') ? value : '')
        if (value && !value.includes('%s')) customEl.value = ''
    })

    return load
}