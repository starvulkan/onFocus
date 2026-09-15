// NASA Astronomy Picture of the Day Wallpaper!
import * as storage from './storage.js'

const ENDPOINT = 'https://api.nasa.gov/planetary/apod'
const KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'

function today() {
    return new Date().toISOString().slice(0, 10)
}

function normalise(raw) {
    const isVideo = raw.media_type === 'video'
    return {
        title: raw.title || 'Untitled',
        explanation: raw.explanation || '',
        image: isVideo ? raw.thumbnail_url || null : raw.url || null,
        hd: isVideo ? null : raw.hdurl || raw.url || null,
        link: raw.url || null,
        isVideo,
        credit: raw.copyright ? raw.copyright.trim() : null,
        apodDate: raw.date || null,
    }
}

export async function getApod() {
    const cached = await storage.get('apod', null)
    if (cached && cached.date === today() && cached.data) {
        return cached.data
    }

    try {
        const url = `${ENDPOINT}?api_key=${encodeURIComponent(KEY)}&thumbs=true`
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`NASA API returned ${response.status}`)
        }
        const data = normalise(await response.json())
        await storage.set('apod', { date: today(), data })
        return data
    } catch (error) {
        console.warn('apod: fetch failed', error)
        // rikitiki rikitiki rikitiki rikitiki omg im so bored lol
        return cached && cached.data ? cached.data : null
    }
}