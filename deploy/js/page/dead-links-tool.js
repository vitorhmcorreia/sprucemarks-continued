'use strict'

/*
    Dead Links page: the checker and its results table. Design: docs/dead-link-checker.md.
    Started by js/page/dead-links.js once the page has its theme and preferences from the background.

    The checking runs here, in the page, not in the background service worker: MV3 service workers are stopped after
    about 30 seconds without extension events, and checking hundreds of favorites can take minutes. Closing the tab
    stops a check; results found so far are saved.

    Depends on js/dead-links.js (pure logic) and js/shared.js (shared, log). Everything here is kept inside one object
    so it can't clash with the page's own names.
*/

const dead_links_page = {
    'origins': ['http://*/*', 'https://*/*'],
    'state': {
        'results'   : {}, // bookmark id: { url, title, location, result, status, new_url, dead, checked_at }
        'ignored'   : [], // bookmark ids
        'skip_local': true,
        'last_run'  : null // { when, checked, problems, skipped_local, stopped }
    },
    'selected'    : {},    // bookmark id: true, for the Remove button
    'show_ignored': false,
    'filter'      : 'all', // result shown in the table ('all' or a result like 'not_found'), see render_filter()
    'running'     : null,  // queue while a check runs
    'element'     : {}
} // dead_links_page

dead_links_page.word = function(plural) {
    // Edge calls bookmarks "favorites"
    const edge = typeof shared === 'object' && shared.browser && shared.browser.edge
    return plural ? (edge ? 'favorites' : 'bookmarks') : (edge ? 'favorite' : 'bookmark')
} // dead_links_page.word

//---------
// Storage
//---------
dead_links_page.load = async function() {
    try {
        const stored = (await browser.storage.local.get(dead_links.storage_key))[dead_links.storage_key]
        if (stored && typeof stored === 'object') {
            Object.assign(dead_links_page.state, stored)
        } // if
    } catch (error) {
        log('dead_links_page.load -> error', error)
    } // try
} // dead_links_page.load

dead_links_page.save = async function() {
    try {
        await browser.storage.local.set({ [dead_links.storage_key]: dead_links_page.state })
    } catch (error) {
        log('dead_links_page.save -> error', error)
    } // try
} // dead_links_page.save

//-----------
// Bookmarks
//-----------
dead_links_page.bookmarks = async function() {
    /*
    Every bookmark with a URL, with its folder path, keyed by id.
    */

    const tree = await browser.bookmarks.getTree()
    const found = {}
    const ignore_roots = ['imported_bookmarks', 'speed_dials', 'trash'] // Opera roots the rest of the extension skips too

    const walk = function(node, path) {
        if (node.url !== undefined) {
            if (node.type !== 'separator') {
                found[node.id] = { 'id': node.id, 'url': node.url, 'title': node.title || '', 'location': path }
            } // if
            return
        } // if

        for (const child of node.children || []) {
            walk(child, path === '' ? (node.title || '') : path + '/' + node.title)
        } // for
    } // walk

    for (const root of tree[0].children || []) {
        if (ignore_roots.indexOf((root.title || '').toLowerCase().replace(/ /g, '_')) >= 0) {
            continue
        } // if

        for (const child of root.children || []) {
            walk(child, root.title || '')
        } // for
    } // for

    return found
} // dead_links_page.bookmarks

dead_links_page.prune = function(bookmarks) {
    /*
    Drop results for favorites that were removed or changed since they were checked.
    */

    const results = dead_links_page.state.results

    for (const id of Object.keys(results)) {
        if (!bookmarks[id] || bookmarks[id].url !== results[id].url) {
            delete results[id]
            delete dead_links_page.selected[id]
        } else {
            results[id].title = bookmarks[id].title
            results[id].location = bookmarks[id].location
        } // if
    } // for

    dead_links_page.state.ignored = dead_links_page.state.ignored.filter(id => bookmarks[id])
} // dead_links_page.prune

//----------
// Checking
//----------
dead_links_page.fetch_once = async function(url, method) {
    /*
    One request. No cookies are sent (credentials: 'omit'). A GET is aborted as soon as the headers arrive, so no page
    body is downloaded.

    @return  {Object}  { status, final_url, error: '' | 'network' | 'timeout' }
    */

    const controller = new AbortController()
    let timed_out = false
    const timer = setTimeout(function() { timed_out = true; controller.abort() }, dead_links.setting.timeout_ms)

    try {
        const response = await fetch(url, {
            'method'     : method,
            'redirect'   : 'follow',
            'credentials': 'omit',
            'cache'      : 'no-store',
            'signal'     : controller.signal
        })

        const result = { 'status': response.status, 'final_url': response.url || url, 'error': '' }

        if (method === 'GET') {
            controller.abort() // headers are enough
        } // if

        return result
    } catch (error) {
        return { 'status': 0, 'final_url': '', 'error': timed_out ? 'timeout' : 'network' }
    } finally {
        clearTimeout(timer)
    } // try
} // dead_links_page.fetch_once

dead_links_page.check_url = async function(url) {
    /*
    HEAD first (cheap). Many servers answer HEAD badly, so anything other than success is confirmed with a GET.
    A network error gets one more try after a pause before the site counts as unreachable.

    @return  {Object}  dead_links.classify() result plus the HTTP status.
    */

    await dead_links_page.wait_online()
    let outcome = await dead_links_page.fetch_once(url, 'HEAD')

    if (outcome.error === 'network' || outcome.status >= 400) {
        outcome = await dead_links_page.fetch_once(url, 'GET')
    } // if

    // A network error while the browser is offline says nothing about the site: wait for the connection and retry.
    while (outcome.error === 'network' && !navigator.onLine && dead_links_page.running) {
        await dead_links_page.wait_online()
        outcome = await dead_links_page.fetch_once(url, 'GET')
    } // while

    if (outcome.error === 'network') {
        await new Promise(resolve => setTimeout(resolve, dead_links.setting.retry_delay_ms))
        await dead_links_page.wait_online()
        outcome = await dead_links_page.fetch_once(url, 'GET')
    } // if

    const classified = dead_links.classify({ 'url': url, 'status': outcome.status, 'final_url': outcome.final_url, 'error': outcome.error })
    classified.status = outcome.status

    return classified
} // dead_links_page.check_url

dead_links_page.wait_online = function() {
    /*
    Resolve straight away when online; otherwise show that the check is paused and resolve when the browser reports
    the connection is back (or the check is stopped).
    */

    if (navigator.onLine) {
        return Promise.resolve()
    } // if

    dead_links_page.element.status.textContent = 'Paused: your connection is offline. The check continues when it is back.'

    return new Promise(function(resolve) {
        const done = function() {
            window.removeEventListener('online', done)
            clearInterval(timer)
            resolve()
        } // done

        window.addEventListener('online', done)
        const timer = setInterval(function() { if (!dead_links_page.running) done() }, 1000) // stopped
    })
} // dead_links_page.wait_online

dead_links_page.run = async function(only_problems) {
    /*
    Check every favorite (or only the ones with a problem last time), one request per unique URL.
    */

    const state = dead_links_page.state
    const bookmarks = await dead_links_page.bookmarks()
    dead_links_page.prune(bookmarks)

    let candidates = Object.values(bookmarks)

    if (only_problems) {
        candidates = candidates.filter(b => state.results[b.id] && state.ignored.indexOf(b.id) < 0)
    } // if

    let skipped_local = 0

    candidates = candidates.filter(function(bookmark) {
        if (!dead_links.checkable(bookmark.url)) {
            return false
        } // if

        if (state.skip_local && dead_links.is_local(bookmark.url)) {
            skipped_local++
            return false
        } // if

        return true
    })

    // one request per unique URL
    const by_url = {}

    for (const bookmark of candidates) {
        (by_url[bookmark.url] = by_url[bookmark.url] || []).push(bookmark)
    } // for

    const urls = Object.keys(by_url).map(url => ({ 'url': url }))
    let checked = 0

    if (!only_problems) {
        state.results = {}
        dead_links_page.selected = {}
        dead_links_page.filter = 'all'
    } // if

    dead_links_page.set_busy(true)
    dead_links_page.progress(0, urls.length)

    const check_one = async function(item) {
        const result = await dead_links_page.check_url(item.url)

        for (const bookmark of by_url[item.url]) {
            if (result.result === 'ok') {
                delete state.results[bookmark.id]
                delete dead_links_page.selected[bookmark.id]
            } else {
                state.results[bookmark.id] = {
                    'url'       : bookmark.url,
                    'title'     : bookmark.title,
                    'location'  : bookmark.location,
                    'result'    : result.result,
                    'status'    : result.status,
                    'new_url'   : result.new_url,
                    'dead'      : result.dead,
                    'checked_at': Date.now()
                }

                // only "not found" is ticked for removal: "unreachable" may just be a dropped connection
                dead_links_page.selected[bookmark.id] = result.preselect === true
            } // if
        } // for

        checked++
        dead_links_page.progress(checked, urls.length)

        if (checked % 25 === 0) {
            await dead_links_page.save() // keep partial results if the tab closes
        } // if
    } // check_one

    let queue = dead_links.queue(urls, check_one, dead_links.setting)
    dead_links_page.running = queue
    await queue.done
    let stopped = dead_links_page.running === null

    // Final pass: check every "unreachable" address once more, so a connection drop the browser didn't notice
    // (navigator.onLine stays true on many networks) can't leave good favorites marked as unreachable.
    const unreachable = [...new Set(Object.values(state.results).filter(r => r.result === 'unreachable').map(r => r.url))]

    if (!stopped && unreachable.length > 0) {
        checked = 0
        dead_links_page.element.status.textContent = 'Double-checking ' + unreachable.length + ' unreachable addresses…'
        const recheck = unreachable.filter(url => by_url[url]).map(url => ({ 'url': url }))
        queue = dead_links.queue(recheck, async function(item) {
            await check_one(item)
            dead_links_page.element.status.textContent = 'Double-checking unreachable addresses: ' + checked + ' of ' + recheck.length + '…'
        }, dead_links.setting)
        dead_links_page.running = queue
        await queue.done
        stopped = dead_links_page.running === null
        checked = urls.length
    } // if

    dead_links_page.running = null

    state.last_run = {
        'when'         : Date.now(),
        'checked'      : checked,
        'problems'     : Object.keys(state.results).length,
        'skipped_local': skipped_local,
        'stopped'      : stopped
    }

    await dead_links_page.save()
    dead_links_page.set_busy(false)
    dead_links_page.render()
} // dead_links_page.run

//---------
// Actions
//---------
dead_links_page.start_check = function(only_problems) {
    const status = dead_links_page.element.status

    if (!browser.permissions || !browser.permissions.request) {
        // the loaded manifest has no optional permissions: usually a branch switch without reloading the extension
        status.textContent = "Can't ask for website access: the extension needs to be reloaded (in your browser's " +
            'extensions page, click the reload arrow on Sprucemarks Continued), then try again.'
        return
    } // if

    // permissions.request must be called straight from the click, before any await
    browser.permissions.request({ 'origins': dead_links_page.origins }).then(function(granted) {
        if (!granted) {
            dead_links_page.element.status.textContent = 'Checking needs permission to contact the websites in your ' +
                dead_links_page.word(true) + '. Nothing was checked.'
            return
        } // if

        dead_links_page.render_access(true)
        return dead_links_page.run(only_problems)
    }).catch(function(error) {
        // never fail silently: say why nothing happened
        log('dead_links_page.start_check -> error', error)
        dead_links_page.set_busy(false)

        const message = (error && error.message) ? error.message : String(error)
        let text = "Couldn't start the check: " + message

        if (/manifest/i.test(message)) {
            // e.g. "Only permissions specified in the manifest may be requested": an older manifest is still loaded
            text += ' Reload the extension (the reload arrow on its card in the extensions page), then try again.'
        } // if

        status.textContent = text
    })
} // dead_links_page.start_check

dead_links_page.stop_check = function() {
    if (dead_links_page.running) {
        const queue = dead_links_page.running
        dead_links_page.running = null // tells run() it was stopped
        queue.stop()
        dead_links_page.element.status.textContent = 'Stopping after the requests already in progress…'
    } // if
} // dead_links_page.stop_check

dead_links_page.save_backup = function(ids) {
    /*
    Download a bookmarks file with the favorites about to be removed (see dead_links.backup_html). The page builds the
    file itself, so no "downloads" permission is needed. Returns the file name.
    */

    const now = new Date()
    const items = ids.map(id => dead_links_page.state.results[id])
    const html = dead_links.backup_html(items, now)
    const name = 'sprucemarks-removed-' + now.toISOString().slice(0, 16).replace('T', '-').replace(':', '') + '.html'

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([html], { 'type': 'text/html' }))
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(function() { URL.revokeObjectURL(link.href) }, 60000)

    return name
} // dead_links_page.save_backup

dead_links_page.remove_selected = async function() {
    const ids = Object.keys(dead_links_page.selected).filter(id => dead_links_page.selected[id] && dead_links_page.state.results[id])

    if (ids.length === 0) {
        return
    } // if

    // a backup file first, so removing is never a one-way trip
    let backup = ''

    try {
        backup = dead_links_page.save_backup(ids)
    } catch (error) {
        log('dead_links_page.remove_selected -> backup failed', error)
        dead_links_page.element.status.textContent = "Couldn't save the backup file, so nothing was removed: " + (error && error.message ? error.message : error)
        return
    } // try

    for (const id of ids) {
        try {
            await browser.bookmarks.remove(id)
        } catch (error) {
            log('dead_links_page.remove_selected -> could not remove ' + id, error)
        } // try

        delete dead_links_page.state.results[id]
        delete dead_links_page.selected[id]
    } // for

    await dead_links_page.save()
    dead_links_page.render()

    const word = dead_links_page.word(ids.length !== 1)
    dead_links_page.element.status.textContent = 'Removed ' + ids.length + ' ' + word + '. A backup was saved to your downloads as ' +
        backup + ': to restore, import it as a bookmarks HTML file in your browser settings.'
} // dead_links_page.remove_selected

dead_links_page.update_address = async function(id) {
    const result = dead_links_page.state.results[id]

    if (!result || !result.new_url) {
        return
    } // if

    try {
        await browser.bookmarks.update(id, { 'url': result.new_url })
        delete dead_links_page.state.results[id]
        delete dead_links_page.selected[id]
    } catch (error) {
        log('dead_links_page.update_address -> error', error)
    } // try

    await dead_links_page.save()
    dead_links_page.render()
} // dead_links_page.update_address

dead_links_page.toggle_ignore = async function(id) {
    const ignored = dead_links_page.state.ignored
    const index = ignored.indexOf(id)

    if (index >= 0) {
        ignored.splice(index, 1)
    } else {
        ignored.push(id)
        delete dead_links_page.selected[id]
    } // if

    await dead_links_page.save()
    dead_links_page.render()
} // dead_links_page.toggle_ignore

dead_links_page.start_over = async function() {
    /*
    Forget everything from earlier checks: results, ticks, the last-run summary and the ignore list. Favorites are not
    touched. Asks first, since the ignore list may hold choices the user made by hand.
    */

    const state = dead_links_page.state
    const results = Object.keys(state.results).length
    const ignored = state.ignored.length
    const count = (n) => n + ' ' + dead_links_page.word(n !== 1) // "1 favorite", "2 favorites"

    let question = 'Start over? This forgets the results of earlier checks'
    question += results > 0 ? ' (' + count(results) + ' listed)' : ''
    question += ignored > 0 ? ' and your ignore list (' + count(ignored) + ')' : ''
    question += '. Your ' + dead_links_page.word(true) + ' themselves are not changed.'

    if (!window.confirm(question)) {
        return
    } // if

    state.results = {}
    state.ignored = []
    state.last_run = null
    dead_links_page.selected = {}
    dead_links_page.show_ignored = false
    dead_links_page.filter = 'all'

    await dead_links_page.save()
    dead_links_page.render()
} // dead_links_page.start_over

dead_links_page.revoke = async function() {
    try {
        await browser.permissions.remove({ 'origins': dead_links_page.origins })
    } catch (error) {
        log('dead_links_page.revoke -> error', error)
    } // try

    dead_links_page.render_access(false)
} // dead_links_page.revoke

//---------
// Display
//---------
dead_links_page.set_busy = function(busy) {
    const e = dead_links_page.element
    e.button_check.classList.toggle('hidden', busy)
    e.button_recheck.classList.toggle('hidden', busy)
    e.button_stop.classList.toggle('hidden', !busy)
    e.button_start_over.classList.toggle('hidden', busy)
    e.skip_local.disabled = busy
    if (busy) {
        e.button_remove.disabled = true
    } else {
        dead_links_page.render_buttons()
    } // if
} // dead_links_page.set_busy

dead_links_page.progress = function(checked, total) {
    dead_links_page.element.status.textContent = 'Checking: ' + checked + ' of ' + total + ' addresses…'
} // dead_links_page.progress

dead_links_page.render_access = function(granted) {
    dead_links_page.element.revoke.classList.toggle('hidden', !granted)
} // dead_links_page.render_access

dead_links_page.render_buttons = function() {
    const e = dead_links_page.element
    const state = dead_links_page.state
    const problems = Object.keys(state.results).filter(id => state.ignored.indexOf(id) < 0)

    e.button_recheck.disabled = problems.length === 0
    e.button_remove.disabled = !Object.keys(dead_links_page.selected).some(id => dead_links_page.selected[id] && state.results[id])
    e.button_start_over.disabled = !state.last_run && Object.keys(state.results).length === 0 && state.ignored.length === 0
} // dead_links_page.render_buttons

dead_links_page.time_ago = function(when) {
    const minutes = Math.round((Date.now() - when) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago')
    const hours = Math.round(minutes / 60)
    if (hours < 48) return hours + (hours === 1 ? ' hour ago' : ' hours ago')
    return Math.round(hours / 24) + ' days ago'
} // dead_links_page.time_ago

dead_links_page.render_status = function() {
    const run = dead_links_page.state.last_run
    const state = dead_links_page.state

    if (!run) {
        dead_links_page.element.status.textContent = 'Not checked yet.'
        return
    } // if

    const to_review = Object.keys(state.results).filter(id => state.ignored.indexOf(id) < 0).length
    let text = (run.stopped ? 'Stopped ' : 'Last checked ') + dead_links_page.time_ago(run.when) + ': ' +
        run.checked + ' addresses checked, ' + to_review + ' to review'

    if (run.skipped_local > 0) {
        text += ', ' + run.skipped_local + ' local addresses skipped'
    } // if

    dead_links_page.element.status.textContent = text + '.'
} // dead_links_page.render_status

dead_links_page.order = { 'not_found': 0, 'unreachable': 1, 'moved': 2, 'redirect_home': 3, 'redirect_login': 4, 'unverified': 5, 'server_error': 6, 'timeout': 7 }

dead_links_page.render_filter = function(ids) {
    /*
    Fill the "Show" list with the results that occur among ids, with counts. Rows hidden by the filter are unticked,
    so Remove Selected only ever removes favorites the user can see (the Tools page does the same).

    @param   {Object}  ids  Bookmark ids in the current view (results or ignored).
    @return  {Object}       The ids that pass the filter.
    */

    const e = dead_links_page.element
    const state = dead_links_page.state
    const counts = {}

    for (const id of ids) {
        counts[state.results[id].result] = (counts[state.results[id].result] || 0) + 1
    } // for

    const present = Object.keys(counts).sort((a, b) => dead_links_page.order[a] - dead_links_page.order[b])

    if (dead_links_page.filter !== 'all' && counts[dead_links_page.filter] === undefined) {
        dead_links_page.filter = 'all' // that result is gone (removed, updated, ignored)
    } // if

    e.filter.textContent = ''

    const add = function(value, text) {
        const option = document.createElement('option')
        option.value = value
        option.textContent = text
        option.selected = (value === dead_links_page.filter)
        e.filter.appendChild(option)
    } // add

    add('all', 'All results (' + ids.length + ')')

    for (const result of present) {
        add(result, dead_links.describe(result).replace(/ \(.*\)$/, '').replace(/: .*$/, '') + ' (' + counts[result] + ')')
    } // for

    e.filter_label.classList.toggle('hidden', present.length < 2) // nothing to choose between

    const shown = ids.filter(id => dead_links_page.filter === 'all' || state.results[id].result === dead_links_page.filter)

    for (const id of ids) {
        if (shown.indexOf(id) < 0) {
            delete dead_links_page.selected[id]
        } // if
    } // for

    return shown
} // dead_links_page.render_filter

dead_links_page.render = function() {
    const e = dead_links_page.element
    const state = dead_links_page.state
    const rows = e.grid_rows
    const order = dead_links_page.order

    rows.textContent = ''

    const in_view = Object.keys(state.results)
        .filter(id => (state.ignored.indexOf(id) >= 0) === dead_links_page.show_ignored)

    const ids = dead_links_page.render_filter(in_view)
        .sort(function(a, b) {
            const ra = state.results[a]
            const rb = state.results[b]
            return (order[ra.result] - order[rb.result]) || ra.location.localeCompare(rb.location) || ra.title.localeCompare(rb.title)
        })

    if (ids.length === 0) {
        const template = e.template_no_results.content.cloneNode(true)
        template.querySelector('.message').textContent = dead_links_page.show_ignored
            ? 'No ignored ' + dead_links_page.word(true) + '.'
            : (state.last_run ? 'No dead links found.' : 'Click "Check Links" to look for ' + dead_links_page.word(true) + ' whose page no longer exists.')
        rows.appendChild(template)
    } // if

    for (const id of ids) {
        const result = state.results[id]
        const template = e.template_row.content.cloneNode(true)

        template.querySelector('.title').textContent = result.title.trim() || '(no title)'
        template.querySelector('.location').textContent = result.location.split('/').join(' / ') || '(no location)'

        const link = template.querySelector('.url')
        link.href = result.url
        link.textContent = result.url

        template.querySelector('.result-text').textContent = dead_links.describe(result.result, result.status)

        const new_url = template.querySelector('.new-url')
        const update = template.querySelector('.update')

        if (result.result === 'moved' && result.new_url) {
            new_url.querySelector('a').href = result.new_url
            new_url.querySelector('a').textContent = result.new_url
            update.dataset.id = id
        } else {
            new_url.remove()
            update.remove()
        } // if

        const ignore = template.querySelector('.ignore')
        ignore.textContent = dead_links_page.show_ignored ? 'Stop ignoring' : 'Ignore'
        ignore.dataset.id = id

        const checkbox = template.querySelector('input')
        checkbox.dataset.id = id
        checkbox.checked = !!dead_links_page.selected[id]
        checkbox.disabled = dead_links_page.show_ignored

        rows.appendChild(template)
    } // for

    const ignored_count = state.ignored.filter(id => state.results[id]).length
    e.show_ignored.textContent = dead_links_page.show_ignored
        ? 'Back to results'
        : 'Show ' + ignored_count + ' ignored'
    e.show_ignored.classList.toggle('hidden', !dead_links_page.show_ignored && ignored_count === 0)

    dead_links_page.render_status()
    dead_links_page.render_buttons()
} // dead_links_page.render

//-------
// Start
//-------
dead_links_page.start = async function() {
    const root = document.getElementById('tool-dead-links')

    if (!root) {
        return
    } // if

    const e = dead_links_page.element
    e.grid_rows = root.querySelector('.grid-rows')
    e.status = root.querySelector('.dead-links-status')
    e.skip_local = root.querySelector('#dead-links-skip-local')
    e.button_check = root.querySelector('#button-check-links')
    e.button_recheck = root.querySelector('#button-recheck-links')
    e.button_stop = root.querySelector('#button-stop-links')
    e.button_remove = root.querySelector('#button-remove-dead-links')
    e.button_start_over = root.querySelector('#button-start-over')
    e.show_ignored = root.querySelector('.dead-links-show-ignored')
    e.filter = root.querySelector('#dead-links-filter')
    e.filter_label = root.querySelector('.dead-links-filter')
    e.revoke = root.querySelector('.dead-links-revoke')
    e.template_row = document.getElementById('template-dead-links-grid-row')
    e.template_no_results = document.getElementById('template-dead-links-no-results')

    await dead_links_page.load()

    try {
        dead_links_page.prune(await dead_links_page.bookmarks())
        dead_links_page.render_access(await browser.permissions.contains({ 'origins': dead_links_page.origins }))
    } catch (error) {
        log('dead_links_page.start -> error', error)
    } // try

    e.skip_local.checked = dead_links_page.state.skip_local

    e.skip_local.addEventListener('change', async function() {
        dead_links_page.state.skip_local = this.checked
        await dead_links_page.save()
    })

    e.button_check.addEventListener('click', function(event) { event.preventDefault(); dead_links_page.start_check(false) })
    e.button_recheck.addEventListener('click', function(event) { event.preventDefault(); dead_links_page.start_check(true) })
    e.button_stop.addEventListener('click', function(event) { event.preventDefault(); dead_links_page.stop_check() })
    e.button_remove.addEventListener('click', function(event) { event.preventDefault(); dead_links_page.remove_selected() })
    e.button_start_over.addEventListener('click', function(event) { event.preventDefault(); dead_links_page.start_over() })

    e.show_ignored.addEventListener('click', function(event) {
        event.preventDefault()
        dead_links_page.show_ignored = !dead_links_page.show_ignored
        dead_links_page.filter = 'all'
        dead_links_page.render()
    })

    e.filter.addEventListener('change', function() {
        dead_links_page.filter = this.value
        dead_links_page.render()
    })

    e.revoke.addEventListener('click', function(event) { event.preventDefault(); dead_links_page.revoke() })

    // one listener for the row links and checkboxes, since rows are rebuilt on every render
    e.grid_rows.addEventListener('click', function(event) {
        const target = event.target

        if (target.classList.contains('update')) {
            event.preventDefault()
            dead_links_page.update_address(target.dataset.id)
        } else if (target.classList.contains('ignore')) {
            event.preventDefault()
            dead_links_page.toggle_ignore(target.dataset.id)
        } else if (target.type === 'checkbox') {
            dead_links_page.selected[target.dataset.id] = target.checked
            dead_links_page.render_buttons()
        } // if
    })

    // keep the list honest when favorites change in another tab
    browser.bookmarks.onRemoved.addListener(dead_links_page.on_bookmarks_changed)
    browser.bookmarks.onChanged.addListener(dead_links_page.on_bookmarks_changed)

    dead_links_page.render()
} // dead_links_page.start

dead_links_page.on_bookmarks_changed = async function() {
    if (dead_links_page.running) {
        return // run() prunes and renders when it finishes
    } // if

    dead_links_page.prune(await dead_links_page.bookmarks())
    dead_links_page.render()
} // dead_links_page.on_bookmarks_changed
