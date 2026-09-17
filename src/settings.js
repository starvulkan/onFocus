import * as background from './background.js'
import * as search from './search.js'
import * as storage from './storage.js'
import * as weather from './weather.js'

export function mount({
    openEl, dialogEl, closeEl,
    bgEl, scrimRowEl, scrimEl, scrimValueEl,
    engineEl, customEl,
    cityEl, cityResultsEl, cityHintEl, placeEl, locateEl, unitRowEl, unitEl,
    applyBackground, refreshWeather,
}) {
    let searchTimer = null

    function hint(text) {
        cityHintEl.textContent = text || ''
        cityHintEl.hidden = !text
    }

    function clearResults() {
        cityResultsEl.textContent = ''
        cityResultsEl.hidden = true
    }

    async function showPlace() {
        const place = await weather.currentPlace()
        placeEl.textContent = place ? place.label : ''
        placeEl.hidden = !place
        unitRowEl.hidden = !place
    }

    async function choose(place) {
        await weather.setPlace(place)
        cityEl.value = ''
        clearResults()
        hint('')
        await showPlace()
        await refreshWeather({ force: true })
    }
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

        unitEl.value = await weather.currentUnit()
        cityEl.value = ''
        clearResults()
        hint('')
        await showPlace()
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

    cityEl.addEventListener('input', () => {
        clearTimeout(searchTimer)
        const query = cityEl.value.trim()
        if (query.length < 2) { clearResults(); hint(''); return }
        searchTimer = setTimeout(async () => {
            const results = await weather.search(query)
            clearResults()
            if (results.length === 0) { hint('No matching city found.'); return }
            hint('')
            for (const place of results) {
                const btn = document.createElement('button')
                btn.className = 'sheet__result'
                btn.type = 'button'
                btn.textContent = place.label
                btn.addEventListener('click', () => choose(place))
                cityResultsEl.append(btn)
            }
            cityResultsEl.hidden = false
        }, 350)
    })

    locateEl.addEventListener('click', async () => {
        clearResults()
        hint('Asking your browser for your location...')
        locateEl.disabled = true
        const place = await weather.locate()
        locateEl.disabled = false
        if (!place) {
            hint('Could not get your location. Search for a city instead.')
            return
        }
        await choose(place)
    })

    unitEl.addEventListener('change', async () => {
        await weather.setUnit(unitEl.value)
        await refreshWeather()
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