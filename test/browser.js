'use strict'

/*
Shared helpers for driving a headless Chromium-family browser with the extension loaded:
used by test/run-tests.js and store/make-store-assets.js.

Branded Google Chrome ignores --load-extension since version 137; Microsoft Edge, Chromium and Chrome for Testing
still honour it. Set BROWSER to the executable to use; otherwise Edge, then Chromium, then Chrome is tried.
*/

const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const { spawn, execFileSync } = require('child_process')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function findBrowser() {
    for (const name of [process.env.BROWSER, 'microsoft-edge', 'chromium', 'chromium-browser', 'google-chrome'].filter(Boolean)) {
        if (path.isAbsolute(name) && fs.existsSync(name)) return name
        try { return execFileSync('which', [name]).toString().trim() } catch (error) { /* next */ }
    }
    throw new Error('No Chromium-family browser found. Set BROWSER to its path.')
}

// Unpacked extensions get an ID derived from their absolute folder path.
function extensionId(dir) {
    return [...crypto.createHash('sha256').update(path.resolve(dir)).digest('hex').slice(0, 32)]
        .map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('')
}

function sampleBookmarks() {
    // Made-up favorites of public websites: deliberately unsorted, one exact duplicate (MDN), near-duplicates
    // (Open Library, Project Gutenberg) and an empty folder, so every tool has something to show.
    let id = 10
    const stamp = () => String(13370000000000000 + id * 1000000)
    const guid = () => '00000000-0000-4000-8000-' + String(id).padStart(12, '0')
    const bm = (name, url) => ({ type: 'url', id: String(id++), name, url, date_added: stamp(), guid: guid() })
    const folder = (name, children) => ({ type: 'folder', id: String(id++), name, children, date_added: stamp(), date_modified: stamp(), guid: guid() })
    const root = (rid, name, children, g) => ({ type: 'folder', id: rid, name, children, date_added: stamp(), date_modified: stamp(), guid: g })
    const bar = [
        folder('Recipes', [bm('Sourdough starter guide', 'https://www.kingarthurbaking.com/recipes/sourdough-starter-recipe'), bm('BBC Good Food', 'https://www.bbcgoodfood.com/'), bm('Allrecipes', 'https://www.allrecipes.com/')]),
        bm('Wikipedia', 'https://www.wikipedia.org/'),
        bm('MDN Web Docs', 'https://developer.mozilla.org/'),
        folder('Travel', [bm('Rome2Rio', 'https://www.rome2rio.com/'), bm('OpenStreetMap', 'https://www.openstreetmap.org/'), bm('Wikivoyage', 'https://www.wikivoyage.org/')]),
        bm('Hacker News', 'https://news.ycombinator.com/'),
        bm('GitHub', 'https://github.com/'),
        folder('Reading', []),
        bm('Wikipedia - Spruce', 'https://en.wikipedia.org/wiki/Spruce')
    ]
    const other = [
        folder('Music', [bm('Bandcamp', 'https://bandcamp.com/'), bm('MusicBrainz', 'https://musicbrainz.org/')]),
        bm('MDN Web Docs', 'https://developer.mozilla.org/'),
        bm('Open Library', 'https://openlibrary.org/'),
        bm('Project Gutenberg', 'https://www.gutenberg.org/'),
        bm('Archive', 'https://archive.org/'),
        bm('Archive.org', 'https://archive.org/details/texts'),
        bm('Project Gutenberg (English)', 'http://www.gutenberg.org/?lang=en'),
        bm('Open Library search', 'https://openlibrary.org/#search')
    ]
    return { version: 1, roots: {
        bookmark_bar: root('1', 'Favorites bar', bar, '0bc5d13f-2cba-5d74-951f-3f233fe6c908'),
        other: root('2', 'Other favorites', other, '82b081ec-3dd3-529c-8475-ab6c344590dd'),
        synced: root('3', 'Mobile favorites', [], '4cf2e351-0e85-532b-bb37-df045d8f8d0f')
    } }
}

// One DevTools-protocol session on a target (page or service worker), with console capture.
async function connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject) })
    let n = 0
    const pending = {}
    const console = []
    ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data)
        if (message.method === 'Runtime.consoleAPICalled') {
            console.push(message.params.type + ': ' + message.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
        } else if (message.method === 'Runtime.exceptionThrown') {
            const details = message.params.exceptionDetails
            console.push('exception: ' + (details.exception?.description || details.text))
        }
        if (message.id && pending[message.id]) { pending[message.id](message); delete pending[message.id] }
    })
    const send = (method, params = {}, timeout = 30000) => new Promise((resolve, reject) => {
        const id = ++n
        pending[id] = resolve
        ws.send(JSON.stringify({ id, method, params }))
        setTimeout(() => reject(new Error('timeout: ' + method)), timeout)
    })
    return { send, console, close: () => ws.close() }
}

// Start the browser with the extension in `extDir` and a fresh profile holding the sample favorites.
async function launch(extDir, port) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sprucemarks-browser-'))
    fs.mkdirSync(path.join(tmp, 'profile/Default'), { recursive: true })
    fs.writeFileSync(path.join(tmp, 'profile/Default/Bookmarks'), JSON.stringify(sampleBookmarks()))
    const args = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
        `--user-data-dir=${path.join(tmp, 'profile')}`, `--load-extension=${extDir}`, `--disable-extensions-except=${extDir}`,
        `--remote-debugging-port=${port}`, '--window-size=1280,800', 'about:blank']
    if (process.env.CI) args.unshift('--no-sandbox') // GitHub-hosted runners have no user namespace sandbox
    const proc = spawn(findBrowser(), args, { stdio: 'ignore' })
    const targets = async () => (await fetch(`http://127.0.0.1:${port}/json`)).json()
    for (let i = 0; i < 100; i++) {
        try { await targets(); break } catch (error) { await sleep(200) }
    }
    const id = extensionId(extDir)
    // wait for the extension's service worker to register
    let worker
    for (let i = 0; i < 100 && !worker; i++) {
        worker = (await targets()).find((t) => t.type === 'service_worker' && t.url.startsWith(`chrome-extension://${id}/`))
        if (!worker) await sleep(200)
    }
    if (!worker) throw new Error(`extension ${id} did not start: check that this browser honours --load-extension`)
    return {
        id, targets, worker,
        async close() {
            proc.kill()
            await sleep(500)
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    }
}

module.exports = { sleep, findBrowser, extensionId, sampleBookmarks, connect, launch }
