#!/usr/bin/env node
'use strict'

/*
Run the extension's own test suite (source/js/-background-test.js, the same as "await test()" in the service worker
console) in a headless browser, against the full build in deploy/ and a fresh profile with sample favorites.
Exits 0 only when the suite reports "all N tests passed" with no exceptions.

Usage: node build.js && node test/run-tests.js       (BROWSER=/path/to/browser to choose one)
*/

const path = require('path')
const { sleep, connect, launch } = require('./browser')

const DEPLOY = path.join(__dirname, '..', 'deploy')

async function main() {
    const browser = await launch(DEPLOY, 9335)
    try {
        await sleep(3000) // let start() finish its first sort
        const worker = await connect(browser.worker.webSocketDebuggerUrl)
        await worker.send('Runtime.enable')
        await worker.send('Runtime.evaluate', { expression: 'test()', awaitPromise: true }, 120000)
        await sleep(500)
        worker.close()

        const lines = worker.console.filter((line) => /test|expected|error|exception/i.test(line))
        lines.forEach((line) => console.log(line))
        const passed = worker.console.find((line) => /all \d+ tests passed/.test(line))
        const failed = worker.console.some((line) => /^(error|exception)/.test(line))
        if (!passed || failed) {
            console.error('FAILED: the test suite did not report a clean pass')
            process.exitCode = 1
        } else {
            console.log('OK: ' + passed.replace(/^log: test -> /, ''))
        }
    } finally {
        await browser.close()
    }
}

main().catch((error) => { console.error(error); process.exit(1) })
