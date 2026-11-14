#!/usr/bin/env node
'use strict'

/*
Make the Sprucemarks Continued icons from the original Sprucemarks art (DECISIONS D10).

- Store/manifest icon (icon-default-*): the original two-tree logo (original/logo.svg) in spruce green.
- Every icon (store, toolbar dark/light/green, and the toolbar pictures in the help messages) gets a small teal
  "continued" arrow badge in the bottom-right corner, cut out of the art with a transparent ring.

Inputs stay untouched in art/original/, so running this again gives the same result instead of a second badge.
Each size is drawn from the original PNG of that same size (they are hand-tuned for small sizes).

Rendering uses a headless Chromium-family browser (Edge, Chrome or Chromium). Set BROWSER to pick one.
Usage: node art/make-icons.js      then: node build.js
*/

const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const ORIGINAL = path.join(__dirname, 'original')
const OUT_ICON = path.join(ROOT, 'source/images/icon')
const OUT_MESSAGES = path.join(ROOT, 'source/images/messages')

const TEAL = '#0a7d74'
const GREEN_BACK = '#1b5e20'
const GREEN_FRONT = '#2e7d32'
const SIZES = [16, 24, 32, 48, 64, 96, 128]

function findBrowser() {
    const candidates = [process.env.BROWSER, 'microsoft-edge', 'google-chrome', 'chromium', 'chromium-browser'].filter(Boolean)
    for (const name of candidates) {
        try {
            return execFileSync('which', [name]).toString().trim()
        } catch (error) {
            // try the next one
        }
    }
    throw new Error('No Chromium-family browser found. Set BROWSER to its path.')
}

const dataUri = (file) => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64')

function greenLogo() {
    // original logo: first path is the back (outline) tree, second the front (filled) tree
    let body = fs.readFileSync(path.join(ORIGINAL, 'logo.svg'), 'utf8').replace(/<svg[^>]*>/, '').replace('</svg>', '')
    let count = 0
    body = body.replace(/fill="#5f6368"/g, () => `fill="${count++ === 0 ? GREEN_BACK : GREEN_FRONT}"`)
    return `<svg viewBox="0 0 500 500" width="100" height="100">${body}</svg>`
}

function iconSvg(art) {
    // 100-unit box; badge centred at (81, 81)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
<defs><mask id="cut"><rect width="100" height="100" fill="#fff"/><circle cx="81" cy="81" r="22" fill="#000"/></mask></defs>
<g mask="url(#cut)">${art}</g>
<circle cx="81" cy="81" r="18" fill="${TEAL}"/>
<path d="M88.5 78a8 8 0 1 1-3-6.6" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/>
<path d="M89.6 66.6l-0.4 7.6l-7.2-1.6z" fill="#fff"/>
</svg>`
}

function renderAll(browser, jobs, tmp) {
    // One headless run: the page draws every SVG onto a canvas at its exact size and writes the PNGs into the DOM,
    // which --dump-dom prints. (One browser launch per icon tends to hang.)
    const html = path.join(tmp, 'icons.html')
    const list = jobs.map((job) => ({ size: job.size, svg: 'data:image/svg+xml;base64,' + Buffer.from(job.svg).toString('base64') }))
    fs.writeFileSync(html, `<!doctype html><html><body><pre id="out"></pre><script>
const jobs = ${JSON.stringify(list)}
async function run() {
    const results = []
    for (const job of jobs) {
        const img = new Image()
        img.src = job.svg
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = job.size
        canvas.getContext('2d').drawImage(img, 0, 0, job.size, job.size)
        results.push(canvas.toDataURL('image/png'))
    }
    document.getElementById('out').textContent = 'ICONS:' + JSON.stringify(results) + ':END'
}
run()
</script></body></html>`)
    const dom = execFileSync(browser, [
        '--headless=new', '--disable-gpu', '--no-first-run',
        `--user-data-dir=${path.join(tmp, 'profile')}`,
        '--virtual-time-budget=10000', '--dump-dom', 'file://' + html
    ], { timeout: 60000, maxBuffer: 64 * 1024 * 1024 }).toString()
    const match = dom.match(/ICONS:(.*?):END/s)
    if (!match) throw new Error('the browser did not return the icons')
    JSON.parse(match[1].replace(/&quot;/g, '"')).forEach((uri, index) => {
        fs.writeFileSync(jobs[index].out, Buffer.from(uri.split(',')[1], 'base64'))
        fs.chmodSync(jobs[index].out, 0o644)
    })
}

const browser = findBrowser()
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sprucemarks-icons-'))

const jobs = []
const job = (svg, size, out) => jobs.push({ svg, size, out })

for (const size of SIZES) {
    job(iconSvg(greenLogo()), size, path.join(OUT_ICON, `icon-default-${size}.png`))
    for (const colour of ['dark', 'light', 'green']) {
        const base = path.join(ORIGINAL, 'icon', `icon-${colour}-${size}.png`)
        job(iconSvg(`<image href="${dataUri(base)}" width="100" height="100"/>`), size,
            path.join(OUT_ICON, `icon-${colour}-${size}.png`))
    }
}

for (const brand of ['chrome', 'edge', 'firefox']) {
    const base = path.join(ORIGINAL, 'messages', `tree-${brand}.png`)
    // these are 36x36 pictures of the toolbar icon, shown inline in the help messages
    job(iconSvg(`<image href="${dataUri(base)}" width="100" height="100"/>`), 36, path.join(OUT_MESSAGES, brand, 'tree.png'))
}

renderAll(browser, jobs, tmp)

fs.rmSync(tmp, { recursive: true, force: true })
console.log(`icons written with ${path.basename(browser)}; run "node build.js" next`)
