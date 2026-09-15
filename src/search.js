import * as storage from './storage.js'

export const ENGINES = {
    duckygo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
    google: { name: 'Google', url: 'https://www.google.com/search?q=%s' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
    brave: { name: 'Brave', url: 'https://search.brave.com/search?q=%s' },
    ecosia: { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=%s' },
    startpage: { name: 'Startpage', url: 'https://www.startpage.com/sp/search?query=%s' }, 
}

export const DEFAULT_ENGINE = 'duckygo'

export function buildUrl(template, query) {
    return template.replace('%s', encodeURIComponent(query))
}

export async function currentTemplate() {
    const custom = await storage.get('searchCustom', null)
    if (custom && custom.includes('%s')) return custom
    const key = await storage.get('searchEngine', DEFAULT_ENGINE)
    return (ENGINES[key] || ENGINES[DEFAULT_ENGINE]).url
}

export function mount(formEl, inputEl) {
    formEl.addEventListener('submit', async (event) => {
        event.preventDefault()
        const query = inputEl.value.trim()
        if (!query) return
        window.location.href = buildUrl(await currentTemplate(), query)
    })
}