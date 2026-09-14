import '@fontsource/comfortaa/latin-400.css'
import '@fontsource/comfortaa/latin-700.css'
import './style.css'
import * as storage from './storage.js'

const greetingEl = document.querySelector('#greeting')
const clockEl = document.querySelector('#clock')

function greetingFor(hour) {
    if (hour < 5) return 'Still up?'
    if (hour < 12) return 'Good morning!'
    if (hour < 18) return 'Good afternoon!'
    return 'Good evening!'
}

function renderClock() {
    const now = new Date()
    clockEl.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })
    greetingEl.textContent = greetingFor(now.getHours())
}

/*
Tick on the second the minute changes rather than every second. 
A new tab can sit open for hours, and a "once per second" tick is unnecessary and wasteful.
*/
function scheduleNextTick() {
    const now = new Date()
    const msToNextMinute =
        (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    setTimeout(() => {
        renderClock()
        scheduleNextTick()
    }, msToNextMinute)
}  

renderClock()
scheduleNextTick()

/*
Smoke test for the storage layer:
prove it round-trips in whichever target we're running in.
*/
storage.get('opened', 0).then((count) => {
    storage.set('opened', count + 1)
    console.log(`onFocus opened ${count + 1} time(s)`)
})