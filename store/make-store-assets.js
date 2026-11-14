#!/usr/bin/env node
'use strict'

/*
Make the store listing images in store/ (D13):
- logo-300.png               store logo (1:1, 300x300 recommended by Edge Add-ons)
- tile-small-440x280.png     small promotional tile (optional)
- tile-large-1400x560.png    large promotional tile (optional)
- screenshots/*.png          1280x800 screenshots of the real extension

Screenshots come from the built extension in deploy/ (run "node build.js" first), loaded into a throwaway headless
Edge/Chromium profile seeded with made-up sample favorites (test/browser.js), driven over the DevTools protocol.
Needs Node 22+ (built-in WebSocket) and a browser that honours --load-extension (set BROWSER to pick one).

Usage: node store/make-store-assets.js
*/

const fs = require('fs')
const os = require('os')
const path = require('path')
const { sleep, connect, launch } = require('../test/browser') // browser driving and sample favorites, shared with the tests

const ROOT = path.join(__dirname, '..')
const DEPLOY = path.join(ROOT, 'deploy')
const OUT = __dirname

//-------------
// Screenshots
//-------------
const wait = (ms) => `await new Promise((r) => setTimeout(r, ${ms}))`
const scrollTo = (expr, offset) => `{ const e = ${expr}; window.scrollTo(0, e.getBoundingClientRect().top + scrollY - ${offset}) }`
const SHOTS = [
    { name: '1-options', url: 'page/light/dark/options.html',
        js: `const s = document.getElementById('sort-options'); const auto = [...document.querySelectorAll('input[type=checkbox]')].find((c) => !s.contains(c)); if (!auto.checked) auto.click(); ${wait(500)}` },
    { name: '2-sort-options', url: 'page/light/dark/options.html',
        js: `const s = document.getElementById('sort-options');
            for (const c of [...s.querySelectorAll('input[type=checkbox]')].slice(0, 2)) { if (!c.checked) c.click(); ${wait(400)} }
            [...s.querySelectorAll('select')].slice(0, 2).forEach((x, i) => { x.value = ['alpha', 'date'][i]; x.dispatchEvent(new Event('change', { bubbles: true })) });
            ${wait(800)}; ${scrollTo('s', 110)}`, wait: 2000 },
    { name: '3-dead-links', url: 'page/light/dark/dead-links.html',
        // results are filled in (the screenshot browser can't check real websites); same shapes a real check produces
        js: `const bm = await dead_links_page.bookmarks()
            const pick = (title) => Object.values(bm).find((b) => b.title === title)
            const row = (title, result, status, new_url) => { const b = pick(title); return [b.id, { url: b.url, title: b.title, location: b.location, result, status, new_url: new_url || '', dead: result === 'not_found' || result === 'unreachable', preselect: result === 'not_found', checked_at: Date.now() }] }
            dead_links_page.state.results = Object.fromEntries([
                row('Sourdough starter guide', 'not_found', 404),
                row('Wikipedia - Spruce', 'not_found', 410),
                row('Rome2Rio', 'unreachable', 0),
                row('Archive.org', 'moved', 200, 'https://archive.org/details/booksbylanguage'),
                row('MusicBrainz', 'timeout', 0),
                row('Hacker News', 'unverified', 403)
            ])
            dead_links_page.selected = Object.fromEntries(Object.entries(dead_links_page.state.results).filter(([id, r]) => r.preselect).map(([id]) => [id, true]))
            dead_links_page.state.last_run = { when: Date.now() - 180000, checked: 26, problems: 6, skipped_local: 0, stopped: false }
            dead_links_page.render()
            ${scrollTo(`document.querySelector('.dead-links-status')`, 120)}`, wait: 1000 },
    { name: '4-similar', url: 'page/light/dark/tools.html', js: scrollTo(`document.getElementById('tool-similar-bookmarks')`, 30) },
    { name: '5-preferences-dark', url: 'page/light/dark/preferences.html',
        js: `[...document.querySelectorAll('label')].find((l) => l.textContent.trim() === 'Dark').click()`, wait: 3000 },
    { name: '6-about-dark', url: 'page/dark/light/about.html',
        js: scrollTo(`[...document.querySelectorAll('h2')].find((x) => x.textContent.includes('About This Fork'))`, 30) }
]

//----------------------
// Logo and promo tiles
//----------------------

function tileHtml(width, height, iconSize, titleSize, tagSize) {
    const font = 'data:font/woff;base64,' + fs.readFileSync(path.join(ROOT, 'source/fonts/national-park.woff')).toString('base64')
    const inter = 'data:font/woff;base64,' + fs.readFileSync(path.join(ROOT, 'source/fonts/inter.woff')).toString('base64')
    return `<!doctype html><html><head><style>
@font-face { font-family: 'National Park'; src: url(${font}) format('woff'); }
@font-face { font-family: 'Inter'; src: url(${inter}) format('woff'); }
html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
body { display: flex; align-items: center; justify-content: center; gap: ${Math.round(iconSize * 0.25)}px;
    background: linear-gradient(135deg, #f4f7f4 0%, #dfeee2 100%); color: #2b3a2e; }
h1 { font-family: 'National Park'; font-weight: normal; font-size: ${titleSize}px; margin: 0; line-height: 1.05; }
p { font-family: 'Inter'; font-size: ${tagSize}px; margin: ${Math.round(tagSize * 0.6)}px 0 0; color: #4a5a4d; }
</style></head><body>
${logoSvg(iconSize)}
<div><h1>Sprucemarks<br>Continued</h1><p>Automatically sort your favorites</p></div>
</body></html>`
}

function logoSvg(size) {
    // Drawn from the vector art (same drawing as art/make-icons.js), so it stays sharp at any size.
    const logo = fs.readFileSync(path.join(ROOT, 'art/original/logo.svg'), 'utf8').replace(/<svg[^>]*>/, '').replace('</svg>', '')
    let count = 0
    const body = logo.replace(/fill="#5f6368"/g, () => `fill="${count++ === 0 ? '#1b5e20' : '#2e7d32'}"`)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
<defs><mask id="cut"><rect width="100" height="100" fill="#fff"/><circle cx="81" cy="81" r="22" fill="#000"/></mask></defs>
<g mask="url(#cut)"><svg viewBox="0 0 500 500" width="100" height="100">${body}</svg></g>
<circle cx="81" cy="81" r="18" fill="#0a7d74"/>
<path d="M88.5 78a8 8 0 1 1-3-6.6" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/>
<path d="M89.6 66.6l-0.4 7.6l-7.2-1.6z" fill="#fff"/></svg>`
}

//--------
// Driver
//--------
async function main() {
    if (!fs.existsSync(path.join(DEPLOY, 'manifest.json'))) throw new Error('deploy/ is missing: run "node build.js" first')
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sprucemarks-store-'))
    fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true })
    const browser = await launch(DEPLOY, 9333)

    try {
        await sleep(3000) // let the service worker finish starting (it opens its own first-install tab)
        const page = (await browser.targets()).find((t) => t.type === 'page' && t.url === 'about:blank')
        const tab = await connect(page.webSocketDebuggerUrl)
        const send = tab.send
        const capture = async (file, width, height, transparent) => {
            await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
            if (transparent) await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
            const result = await send('Page.captureScreenshot', { format: 'png' }) // the viewport, already sized above
            if (transparent) await send('Emulation.setDefaultBackgroundColorOverride', {})
            fs.writeFileSync(file, Buffer.from(result.result.data, 'base64'))
            console.log('wrote', path.relative(ROOT, file))
        }
        const openHtml = async (html) => {
            const file = path.join(tmp, 'page.html')
            fs.writeFileSync(file, html)
            await send('Page.navigate', { url: 'file://' + file })
            await sleep(1000)
        }

        await send('Page.bringToFront') // a background tab can't be captured

        for (const shot of SHOTS) {
            await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
            await send('Page.navigate', { url: `chrome-extension://${browser.id}/${shot.url}` })
            // pages keep #content hidden until the service worker has answered
            await send('Runtime.evaluate', { awaitPromise: true, expression: `(async () => {
                for (let i = 0; i < 100; i++) {
                    const c = document.getElementById('content')
                    if (c && !c.classList.contains('visibility-hidden')) return
                    await new Promise((r) => setTimeout(r, 100))
                }
            })()` })
            await sleep(800)
            await send('Runtime.evaluate', { expression: `(async () => { ${shot.js} })()`, awaitPromise: true })
            await sleep(shot.wait || 1500)
            await capture(path.join(OUT, 'screenshots', shot.name + '.png'), 1280, 800)
        }

        await openHtml(`<!doctype html><html><body style="margin:0;background:transparent">${logoSvg(300)}</body></html>`)
        await capture(path.join(OUT, 'logo-300.png'), 300, 300, true)
        await openHtml(tileHtml(440, 280, 120, 40, 15))
        await capture(path.join(OUT, 'tile-small-440x280.png'), 440, 280)
        await openHtml(tileHtml(1400, 560, 300, 104, 36))
        await capture(path.join(OUT, 'tile-large-1400x560.png'), 1400, 560)

        tab.close()
    } finally {
        await browser.close()
        fs.rmSync(tmp, { recursive: true, force: true })
    }
}

main().catch((error) => { console.error(error); process.exit(1) })
