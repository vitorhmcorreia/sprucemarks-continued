#!/usr/bin/env node
'use strict'

/*
Build source/ into deploy/ (replaces Feri, which was unpublished from npm in 2026).

Rules, matching the original feri-config.js:
- Files or folders whose name starts with "-" are includes only and are not copied.
- Files ending in ".jss" are templates: text plus <js>...</js> blocks. The output keeps the name without ".jss".
  Inside a template, write(value) adds text to the output, include('/path/from/source', ...args) renders another
  file in place, and args holds the arguments that file was included with. All <js> blocks of one file share scope.
- Everything else is copied as-is.

Usage: node build.js                 build into deploy/
       node build.js --out <dir>     build into another folder
       node build.js --zip           also zip the output into dist/sprucemarks-continued-<version>.zip (store upload)
       node build.js --no-tests      release build: leaves the background test suite out and turns debug logging off
                                     (shared.setting.log); builds into dist/package/ so deploy/ keeps the full build

Every build also writes build-info.json (commit, branch, date, uncommitted changes) for the About page (D20).
*/

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const argv = process.argv.slice(2)
const ROOT = __dirname
const SOURCE = path.join(ROOT, 'source')
const NO_TESTS = argv.includes('--no-tests')
// deploy/ is always the full build (D5): a build without tests goes to dist/package/ unless --out says otherwise
const OUT = argv.includes('--out') ? path.resolve(argv[argv.indexOf('--out') + 1])
    : path.join(ROOT, NO_TESTS ? 'dist/package' : 'deploy')
const IGNORE = new Set(['.DS_Store', 'Thumbs.db'])

// Release builds turn verbose console logging off (D14). Fail loudly if the setting ever moves.
const LOG_ON = "'log': true // verbose logging"
function releaseTransform(rel, text) {
    if (!NO_TESTS || rel !== 'js/shared.js') return text
    if (text.split(LOG_ON).length !== 2) throw new Error(`build: expected exactly one "${LOG_ON}" in source/js/shared.js`)
    return text.replace(LOG_ON, "'log': false // verbose logging")
}
const readSource = (file) => releaseTransform(path.relative(SOURCE, file).split(path.sep).join('/'), fs.readFileSync(file, 'utf8'))

function render(file, args) {
    const text = readSource(file)
    const parts = text.split(/<js>([\s\S]*?)<\/js>/)
    let code = ''
    parts.forEach((part, i) => {
        code += i % 2 === 0 ? `write(${JSON.stringify(part)});\n` : part + ';\n'
    })
    let out = ''
    const write = (value) => { out += String(value) }
    const include = (rel, ...includeArgs) => {
        if (NO_TESTS && rel === '/js/-background-test.js') return
        write(render(path.join(SOURCE, rel), includeArgs))
    }
    new Function('write', 'include', 'args', code)(write, include, args)
    return out
}

function build(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('-') || IGNORE.has(entry.name)) continue
        const src = path.join(dir, entry.name)
        const rel = path.relative(SOURCE, src)
        if (entry.isDirectory()) {
            build(src)
            continue
        }
        const dest = path.join(OUT, rel.replace(/\.jss$/, ''))
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        if (entry.name.endsWith('.jss')) {
            fs.writeFileSync(dest, render(src, []))
        } else if (NO_TESTS && rel.split(path.sep).join('/') === 'js/shared.js') {
            fs.writeFileSync(dest, readSource(src))
        } else {
            fs.copyFileSync(src, dest)
            fs.chmodSync(dest, 0o644) // a few source files are executable; the build output never needs to be
        }
    }
}

fs.rmSync(OUT, { recursive: true, force: true })
build(SOURCE)
// build-info.json: which commit this build came from, shown on the About page (D20). Git-ignored in deploy/ (a commit
// can't contain its own ID), included in store zips. Skipped quietly when git isn't available.
try {
    const git = (...args) => execFileSync('git', args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const info = {
        'commit': git('rev-parse', 'HEAD'),
        'short' : git('rev-parse', '--short', 'HEAD'),
        'branch': git('rev-parse', '--abbrev-ref', 'HEAD'),
        'date'  : git('log', '-1', '--format=%cI', 'HEAD'),
        'dirty' : git('status', '--porcelain', '--untracked-files=no') !== '',
        'source': 'build.js'
    }
    if (info.branch === 'HEAD' && process.env.GITHUB_REF_NAME) {
        info.branch = process.env.GITHUB_REF_NAME // CI checks out a tag or a pull request without a branch
    } // if
    fs.writeFileSync(path.join(OUT, 'build-info.json'), JSON.stringify(info, null, 4) + '\n')
} catch (error) {
    // not a git checkout
}

const version = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')).version
console.log(`built ${path.relative(ROOT, OUT) || OUT} (version ${version}${NO_TESTS ? ', release: no tests, logging off' : ''})`)

if (argv.includes('--zip')) {
    const dist = path.join(ROOT, 'dist')
    fs.mkdirSync(dist, { recursive: true })
    const zip = path.join(dist, `sprucemarks-continued-${version}.zip`)
    fs.rmSync(zip, { force: true })
    execFileSync('zip', ['-r', '-X', '-q', zip, '.'], { cwd: OUT })
    console.log(`packed ${path.relative(ROOT, zip)}`)
}
