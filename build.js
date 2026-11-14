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
       node build.js --zip           also zip deploy/ into dist/sprucemarks-continued-<version>.zip (store upload)
       node build.js --no-tests      leave the background test suite out (for store releases)
*/

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const argv = process.argv.slice(2)
const ROOT = __dirname
const SOURCE = path.join(ROOT, 'source')
const OUT = argv.includes('--out') ? path.resolve(argv[argv.indexOf('--out') + 1]) : path.join(ROOT, 'deploy')
const NO_TESTS = argv.includes('--no-tests')
const IGNORE = new Set(['.DS_Store', 'Thumbs.db'])

function render(file, args) {
    const text = fs.readFileSync(file, 'utf8')
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
        } else {
            fs.copyFileSync(src, dest)
            fs.chmodSync(dest, 0o644) // a few source files are executable; the build output never needs to be
        }
    }
}

fs.rmSync(OUT, { recursive: true, force: true })
build(SOURCE)
const version = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')).version
console.log(`built ${path.relative(ROOT, OUT) || OUT} (version ${version}${NO_TESTS ? ', no tests' : ''})`)

if (argv.includes('--zip')) {
    const dist = path.join(ROOT, 'dist')
    fs.mkdirSync(dist, { recursive: true })
    const zip = path.join(dist, `sprucemarks-continued-${version}.zip`)
    fs.rmSync(zip, { force: true })
    execFileSync('zip', ['-r', '-X', '-q', zip, '.'], { cwd: OUT })
    console.log(`packed ${path.relative(ROOT, zip)}`)
}
