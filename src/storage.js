/*
One storage API for both of onFocus's targets.

In the extension, chrome.storage.local exists and is asynchronous.
On the website it doesn't, so we fall back to localStorage, which is synchronous and only stores strings.
*/

const PREFIX = 'onFocus:'

const useChromeStorage =
    typeof chrome !== 'undefined' &&
    chrome.storage != null &&
    chrome.storage.local != null

export async function get(key, fallback = null) {
    const k = PREFIX + key
    try {
        if (useChromeStorage) {
            const result = await chrome.storage.local.get(k)
            return k in result ? result[k] : fallback
        }
        const raw = localStorage.getItem(k)
        return raw === null ? fallback : JSON.parse(raw)
    } catch (error) {
        console.warn(`storage: could not read "${key}"`, error)
        return fallback
    }
}

export async function set(key, value) {
    const k = PREFIX + key
    try {
        if (useChromeStorage) {
            await chrome.storage.local.set({ [k]: value })
      } else {
        localStorage.setItem(k, JSON.stringify(value))
      }
        return true
    } catch (error) {
        console.warn(`storage: could not write "${key}"`, error)
        return false
    }   
}

export async function remove(key) {
    const k = PREFIX + key
    try {
        if (useChromeStorage) {
            await chrome.storage.local.remove(k)
        } else {
            localStorage.removeItem(k)
        }
        return true
    } catch (error) {
        console.warn(`storage: could not remove "${key}"`, error)
        return false
    }
}
