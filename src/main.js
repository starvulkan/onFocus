import '@fontsource/comfortaa/latin-400.css'
import '@fontsource/comfortaa/latin-700.css'
import './style.css'
import { mount } from './focus.js'
import * as search from './search.js'
import * as history from './history.js'
import * as background from './background.js'
import * as settings from './settings.js'

const greetingEl = document.querySelector('#greeting')
const clockEl = document.querySelector('#clock')

function greetingFor(hour) {
    if (hour < 5) return 'Still up?'
    if (hour < 12) return 'Good morning!'
    if (hour < 18) return 'Good afternoon!'
    if (hour < 22) return 'Good evening!'
    return 'Good night!'
}

function wallClock() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const init = mount({
  clockEl,
  intentEl: document.querySelector('#intent'),
  primaryEl: document.querySelector('#btn-primary'),
  secondaryEl: document.querySelector('#btn-secondary'),
  statsEl: document.querySelector('#stats'),
  durationEl: document.querySelector('#duration'),
  durationWrapEl: document.querySelector('#duration-wrap'),
  wallClock,
})

function renderGreeting() {
    greetingEl.textContent = greetingFor(new Date().getHours())
}

function scheduleNextTick() {
    const now = new Date()
    setTimeout(() => {
        renderGreeting()
        if (!clockEl.classList.contains('clock--session')) clockEl.textContent = wallClock()
    scheduleNextTick()
  }, (60 - now.getSeconds()) * 1000 - now.getMilliseconds())
}

search.mount(document.querySelector('#search'), document.querySelector('#search-input'))

history.mount({
  openEl: document.querySelector('#history-open'),
  dialogEl: document.querySelector('#history'),
  closeEl: document.querySelector('#history-close'),
  listEl: document.querySelector('#history-list'),
  summaryEl: document.querySelector('#history-summary'),
})

const applyBackground = background.mount({
  photoEl: document.querySelector('#photo'),
  scrimEl: document.querySelector('#scrim'),
  auroraEl: document.querySelector('#aurora'),
  creditEl: document.querySelector('#photo-credit'),
})

settings.mount({
  openEl: document.querySelector('#settings-open'),
  dialogEl: document.querySelector('#settings'),
  closeEl: document.querySelector('#settings-close'),
  bgEl: document.querySelector('#setting-bg'),
  scrimRowEl: document.querySelector('#setting-scrim-row'),
  scrimEl: document.querySelector('#setting-scrim'),
  scrimValueEl: document.querySelector('#setting-scrim-value'),
  engineEl: document.querySelector('#setting-engine'),
  customEl: document.querySelector('#setting-custom'),
  applyBackground,
})

document.querySelector('#search-input').focus()

renderGreeting()
clockEl.textContent = wallClock()
scheduleNextTick()
init()


// the photo is a progressive upgrade rather than something the first paint waits on.
applyBackground()
