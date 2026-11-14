'use strict'

/*
    Dead-link checker: the parts that don't touch the page or the network, so the background test suite can test them.
    Loaded by the Dead Links page (js/page/dead-links-tool.js does the checking and the display) and included in the
    background service worker for the tests (local.test.dead_links_*). Design: docs/dead-link-checker.md.
*/

const dead_links = {
    'setting': {
        'concurrency'     : 6,      // requests in flight at once, overall
        'host_gap_ms'     : 1500,   // pause between two requests to the same site (was 250 ms; see D21)
        'min_start_gap_ms': 200,    // at most 5 new requests per second overall
        'max_retries'     : 2,      // times a site that says "slow down" (429/503) is retried later before giving up
        'backoff_ms'      : 60000,  // first wait after "slow down" when the site doesn't say how long (doubles each time)
        'max_backoff_ms'  : 600000, // never wait longer than 10 minutes for one site
        'retry_delay_ms'  : 10000,  // wait before the second attempt on a network error
        'timeout_ms'      : 15000   // give up on one request after this long
    },
    'storage_key': 'dead_links' // browser.storage.local key holding results, ignored favorites and the skip-local option
} // dead_links

dead_links.checkable = function dead_links_checkable(url) {
    /*
    Only http and https addresses can be checked.

    @param   {String}   url  Bookmark URL.
    @return  {Boolean}
    */

    try {
        const protocol = new URL(url).protocol
        return protocol === 'http:' || protocol === 'https:'
    } catch (error) {
        return false
    } // try
} // dead_links.checkable

dead_links.is_local = function dead_links_is_local(url) {
    /*
    True for addresses that are usually only reachable on one network: localhost, loopback and private IP ranges,
    .local/.lan/.internal/.home.arpa names, and single-label hostnames like http://wiki/.

    @param   {String}   url  Bookmark URL.
    @return  {Boolean}
    */

    let host = ''

    try {
        host = new URL(url).hostname.toLowerCase()
    } catch (error) {
        return false
    } // try

    host = host.replace(/^\[|\]$/g, '').replace(/\.$/, '') // IPv6 brackets, trailing dot

    if (host === 'localhost' || host.endsWith('.localhost') || host === '::1') {
        return true
    } // if

    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)

    if (ipv4) {
        const a = Number(ipv4[1])
        const b = Number(ipv4[2])

        return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)
    } // if

    if (host.includes(':')) {
        // IPv6: unique local (fc00::/7) and link-local (fe80::/10)
        return /^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)
    } // if

    if (/\.(local|lan|internal|intranet|corp|home\.arpa)$/.test(host)) {
        return true
    } // if

    return host.indexOf('.') < 0 // single label like "wiki" or "nas"
} // dead_links.is_local

dead_links.host = function dead_links_host(url) {
    /*
    @param   {String}  url
    @return  {String}       Lowercase host with port, or '' if the URL can't be parsed.
    */

    try {
        return new URL(url).host.toLowerCase()
    } catch (error) {
        return ''
    } // try
} // dead_links.host

dead_links.same_address = function dead_links_same_address(a, b) {
    /*
    True when two URLs point to the same page, ignoring the #fragment and a trailing slash.

    @param   {String}   a
    @param   {String}   b
    @return  {Boolean}
    */

    const normal = function(url) {
        try {
            const u = new URL(url)
            u.hash = ''
            return u.href.replace(/\/$/, '')
        } catch (error) {
            return url
        } // try
    } // normal

    return normal(a) === normal(b)
} // dead_links.same_address

dead_links.redirect_kind = function dead_links_redirect_kind(original_url, final_url) {
    /*
    Describe where a redirect ended.

    @param   {String}  original_url  The bookmark's URL.
    @param   {String}  final_url     Where the redirects ended.
    @return  {String}                'none' (same page), 'home' (the site's home page, usually means the page is gone),
                                     'login' (a sign-in page), 'consent' (a cookie-consent page), or 'moved' (a real new
                                     address).
    */

    if (!final_url || dead_links.same_address(original_url, final_url)) {
        return 'none'
    } // if

    let original
    let final

    try {
        original = new URL(original_url)
        final = new URL(final_url)
    } catch (error) {
        return 'none'
    } // try

    const original_path = original.pathname.replace(/\/+$/, '')
    const final_path = final.pathname.replace(/\/+$/, '')

    // Same page with parameters only added (YouTube adds "cbrd=1&ucbcb=1" when there is no consent cookie; other sites
    // add tracking or session parameters): the page is fine, it hasn't moved. Updating the favorite would only pick up
    // the noise. Checked on the user's collection, 2026-11-14.
    if (original.origin === final.origin && original_path === final_path) {
        let only_added = true

        for (const [key, value] of original.searchParams) {
            if (final.searchParams.getAll(key).indexOf(value) < 0) {
                only_added = false
                break
            } // if
        } // for

        if (only_added) {
            return 'none'
        } // if
    } // if

    // a cookie-consent wall (consent.youtube.com, consent.google.com, ...): says nothing about where the page is
    if (/^consent\./.test(final.hostname) || /(^|\/)(consent|cookie-?consent|gdpr)(\/|$)/i.test(final.pathname)) {
        return 'consent'
    } // if

    if (/(^|\/)(log-?in|sign-?in|signon|auth|sso|account\/login)(\/|$|\.)/i.test(final.pathname)) {
        return 'login'
    } // if

    if (final_path === '' && final.search === '' && original_path !== '') {
        // a specific page now lands on a home page
        return 'home'
    } // if

    return 'moved'
} // dead_links.redirect_kind

dead_links.classify = function dead_links_classify(outcome) {
    /*
    Turn the outcome of checking one URL into a result.

    @param   {Object}  outcome  { url, status (Number, 0 if no response), final_url, error ('network', 'timeout' or '') }
    @return  {Object}           { result, dead, preselect, new_url }
                                result: 'ok', 'moved', 'redirect_home', 'redirect_login', 'redirect_consent', 'not_found', 'unreachable',
                                        'unverified' (401, 403, 429, other 4xx), 'server_error' (5xx), 'timeout'
                                dead: true for 'not_found' and 'unreachable'
                                preselect: true only for 'not_found', where a server answered that the page is gone.
                                    'unreachable' is never pre-selected: a Wi-Fi drop makes every site look unreachable.
                                new_url: the new address when result is 'moved', otherwise ''
    */

    const status = outcome.status || 0

    if (outcome.error === 'timeout') {
        return { 'result': 'timeout', 'dead': false, 'preselect': false, 'new_url': '' }
    } // if

    if (outcome.error === 'network' || status === 0) {
        return { 'result': 'unreachable', 'dead': true, 'preselect': false, 'new_url': '' }
    } // if

    if (status === 404 || status === 410) {
        return { 'result': 'not_found', 'dead': true, 'preselect': true, 'new_url': '' }
    } // if

    if (status >= 500) {
        return { 'result': 'server_error', 'dead': false, 'preselect': false, 'new_url': '' }
    } // if

    if (status >= 400) {
        return { 'result': 'unverified', 'dead': false, 'preselect': false, 'new_url': '' }
    } // if

    // 2xx (fetch follows redirects, so 3xx only shows up here if a redirect loop or limit stopped it)
    if (status >= 300) {
        return { 'result': 'unverified', 'dead': false, 'preselect': false, 'new_url': '' }
    } // if

    const kind = dead_links.redirect_kind(outcome.url, outcome.final_url)

    if (kind === 'moved') {
        return { 'result': 'moved', 'dead': false, 'preselect': false, 'new_url': outcome.final_url }
    } else if (kind === 'home') {
        return { 'result': 'redirect_home', 'dead': false, 'preselect': false, 'new_url': '' }
    } else if (kind === 'login') {
        return { 'result': 'redirect_login', 'dead': false, 'preselect': false, 'new_url': '' }
    } else if (kind === 'consent') {
        return { 'result': 'redirect_consent', 'dead': false, 'preselect': false, 'new_url': '' }
    } // if

    return { 'result': 'ok', 'dead': false, 'preselect': false, 'new_url': '' }
} // dead_links.classify

dead_links.slow_down = function dead_links_slow_down(status) {
    /*
    True when a site is asking us to slow down: 429 Too Many Requests, or 503 Service Unavailable (also used for it).

    @param   {Number}   status  HTTP status.
    @return  {Boolean}
    */

    return status === 429 || status === 503
} // dead_links.slow_down

dead_links.backoff_ms = function dead_links_backoff_ms(retry_after, attempt, now, settings) {
    /*
    How long to leave a site alone after it asked us to slow down.

    @param   {String}  retry_after  The Retry-After header: seconds ("120") or an HTTP date, or '' / null.
    @param   {Number}  attempt      0 for the first "slow down", 1 for the second, ...
    @param   {Number}  now          Date.now().
    @param   {Object}  settings     { backoff_ms, max_backoff_ms }.
    @return  {Number}               Milliseconds: what the site asked for, or backoff_ms doubled per attempt; never
                                    less than the doubled default, never more than max_backoff_ms.
    */

    let asked = 0
    const text = String(retry_after || '').trim()

    if (/^\d+$/.test(text)) {
        asked = Number(text) * 1000
    } else if (text !== '') {
        const date = Date.parse(text)

        if (!isNaN(date)) {
            asked = date - now
        } // if
    } // if

    const doubled = settings.backoff_ms * Math.pow(2, attempt)

    return Math.min(settings.max_backoff_ms, Math.max(asked, doubled))
} // dead_links.backoff_ms

dead_links.describe = function dead_links_describe(result, status) {
    /*
    Human text for a result.

    @param   {String}  result  Result from dead_links.classify().
    @param   {Number}  status  HTTP status, if any.
    @return  {String}
    */

    switch (result) {
        case 'not_found'     : return 'Not found' + (status ? ' (' + status + ')' : '')
        case 'unreachable'   : return 'Unreachable: the site did not respond'
        case 'moved'         : return 'Moved to a new address'
        case 'redirect_home' : return "Redirects to the site's home page"
        case 'redirect_login': return 'Redirects to a sign-in page'
        case 'redirect_consent': return 'Redirects to a cookie-consent page'
        case 'unverified'    : return "Couldn't verify" + (status === 429 ? ' (rate limited, 429)' : (status ? ' (' + status + ')' : ''))
        case 'server_error'  : return 'Server error' + (status ? ' (' + status + ')' : '')
        case 'timeout'       : return 'Timed out'
        case 'skipped_local' : return 'Not checked: local address'
        default              : return 'OK'
    } // switch
} // dead_links.describe

dead_links.queue = function dead_links_queue(items, worker, settings) {
    /*
    Run worker(item) for every item, politely (D21):
    - at most settings.concurrency at once, and at most one new request every settings.min_start_gap_ms overall;
    - one at a time per host, with settings.host_gap_ms between two requests to the same host;
    - if worker returns { retry_after: ms } (the site asked us to slow down), that host is left alone for ms and the
      item is tried again later, up to settings.max_retries times. item.attempts counts the tries so far, and
      item.final is true on the last allowed try, so the worker records the result instead of asking again.

    @param   {Array}     items     Objects with a "url" property.
    @param   {Function}  worker    async function(item), may return { retry_after: ms }.
    @param   {Object}    settings  { concurrency, host_gap_ms, min_start_gap_ms, max_retries }.
    @return  {Object}              { done: Promise resolved when everything finished, stop: function,
                                     waiting_hosts: function returning how many hosts are in a slow-down pause }
    */

    const waiting = items.slice()
    const busy_hosts = {}  // host: true while a request to it is in flight
    const host_ready = {}  // host: time (ms) when the next request to it may start
    const paused = {}      // host: true while it is in a slow-down pause
    let running = 0
    let stopped = false
    let next_start = 0     // earliest time the next request (to any host) may start
    let timer = null

    let finish
    const done = new Promise(function(resolve) { finish = resolve })

    const pump = function() {
        clearTimeout(timer)

        if (stopped || (waiting.length === 0 && running === 0)) {
            if (running === 0) finish()
            return
        } // if

        const now = Date.now()
        let next_wake = Infinity

        for (let index = 0; index < waiting.length && running < (settings.concurrency || 1); index++) {
            const item = waiting[index]
            const host = dead_links.host(item.url)

            if (busy_hosts[host]) {
                continue
            } // if

            if ((host_ready[host] || 0) > Date.now()) {
                next_wake = Math.min(next_wake, host_ready[host])
                continue
            } // if

            if (next_start > Date.now()) {
                next_wake = Math.min(next_wake, next_start)
                break // overall pace: wait before starting anything else
            } // if

            paused[host] = false
            waiting.splice(index, 1)
            index--

            item.attempts = item.attempts || 0
            item.final = item.attempts >= (settings.max_retries || 0)

            running++
            busy_hosts[host] = true
            next_start = Date.now() + (settings.min_start_gap_ms || 0)

            Promise.resolve().then(function() { return worker(item) }).catch(function() {}).then(function(answer) {
                running--
                busy_hosts[host] = false

                if (answer && answer.retry_after > 0 && !item.final && !stopped) {
                    // the site asked us to slow down: leave it alone, try this item again later
                    item.attempts += 1
                    host_ready[host] = Date.now() + answer.retry_after
                    paused[host] = true
                    waiting.push(item)
                } else {
                    host_ready[host] = Math.max(host_ready[host] || 0, Date.now() + (settings.host_gap_ms || 0))
                } // if

                pump()
            })
        } // for

        if (next_wake !== Infinity && running < (settings.concurrency || 1)) {
            timer = setTimeout(pump, Math.max(0, next_wake - Date.now()))
        } // if
    } // pump

    pump()

    return {
        'done': done,
        'stop': function() {
            stopped = true
            waiting.length = 0
            clearTimeout(timer)
            if (running === 0) finish()
        },
        'waiting_hosts': function() {
            return Object.keys(paused).filter(host => paused[host]).length
        }
    }
} // dead_links.queue

dead_links.backup_html = function dead_links_backup_html(items, when) {
    /*
    A standard bookmarks file (the "Netscape" HTML format every browser can import) holding the favorites that are
    about to be removed, in their original folders, under one folder named after the date. Restore with the browser's
    "import favorites / bookmarks from HTML file".

    @param   {Object}  items  Array of { title, url, location } (location like "Favorites bar/Recipes").
    @param   {Date}    when   When the backup is made.
    @return  {String}         The file's contents.
    */

    const escape = function(text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    } // escape

    const seconds = Math.floor(when.getTime() / 1000)
    const stamp = when.toISOString().slice(0, 16).replace('T', ' ')

    // build a folder tree from the locations
    const root = { 'folders': {}, 'order': [], 'links': [] }

    for (const item of items) {
        let folder = root

        for (const name of String(item.location || '').split('/').filter(part => part !== '')) {
            if (folder.folders[name] === undefined) {
                folder.folders[name] = { 'folders': {}, 'order': [], 'links': [] }
                folder.order.push(name)
            } // if

            folder = folder.folders[name]
        } // for

        folder.links.push(item)
    } // for

    const lines = []

    const write = function(folder, indent) {
        for (const item of folder.links) {
            lines.push(indent + '<DT><A HREF="' + escape(item.url) + '" ADD_DATE="' + seconds + '">' + escape(item.title || item.url) + '</A>')
        } // for

        for (const name of folder.order) {
            lines.push(indent + '<DT><H3 ADD_DATE="' + seconds + '">' + escape(name) + '</H3>')
            lines.push(indent + '<DL><p>')
            write(folder.folders[name], indent + '    ')
            lines.push(indent + '</DL><p>')
        } // for
    } // write

    write(root, '            ')

    return [
        '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
        '<!-- Favorites removed by Sprucemarks Continued on ' + stamp + ' UTC. Import this file to restore them. -->',
        '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
        '<TITLE>Bookmarks</TITLE>',
        '<H1>Bookmarks</H1>',
        '<DL><p>',
        '    <DT><H3 ADD_DATE="' + seconds + '">Removed by Sprucemarks Continued ' + escape(stamp) + '</H3>',
        '    <DL><p>',
        ...lines.map(line => line.replace(/^ {4}/, '')),
        '    </DL><p>',
        '</DL><p>',
        ''
    ].join('\n')
} // dead_links.backup_html
