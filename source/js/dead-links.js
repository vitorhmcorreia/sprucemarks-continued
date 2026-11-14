'use strict'

/*
    Dead-link checker: the parts that don't touch the page or the network, so the background test suite can test them.
    Loaded by the Dead Links page (js/page/dead-links-tool.js does the checking and the display) and included in the
    background service worker for the tests (local.test.dead_links_*). Design: docs/dead-link-checker.md.
*/

const dead_links = {
    'setting': {
        'concurrency'    : 6,     // requests in flight at once, overall
        'host_gap_ms'    : 250,   // pause between two requests to the same host
        'retry_delay_ms' : 10000, // wait before the second attempt on a network error
        'timeout_ms'     : 15000  // give up on one request after this long
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
                                     'login' (a sign-in page), or 'moved' (a real new address).
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
                                result: 'ok', 'moved', 'redirect_home', 'redirect_login', 'not_found', 'unreachable',
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
    } // if

    return { 'result': 'ok', 'dead': false, 'preselect': false, 'new_url': '' }
} // dead_links.classify

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
        case 'unverified'    : return "Couldn't verify" + (status ? ' (' + status + ')' : '')
        case 'server_error'  : return 'Server error' + (status ? ' (' + status + ')' : '')
        case 'timeout'       : return 'Timed out'
        case 'skipped_local' : return 'Not checked: local address'
        default              : return 'OK'
    } // switch
} // dead_links.describe

dead_links.queue = function dead_links_queue(items, worker, settings) {
    /*
    Run worker(item) for every item, with at most settings.concurrency at once, one at a time per host, and
    settings.host_gap_ms between two requests to the same host.

    @param   {Array}     items     Objects with a "url" property.
    @param   {Function}  worker    async function(item), its return value is ignored.
    @param   {Object}    settings  { concurrency, host_gap_ms }.
    @return  {Object}              { done: Promise that resolves when everything finished, stop: function }
    */

    const waiting = items.slice()
    const busy_hosts = {}  // host: true while a request to it is in flight
    const host_ready = {}  // host: time (ms) when the next request to it may start
    let running = 0
    let stopped = false

    let finish
    const done = new Promise(function(resolve) { finish = resolve })

    const pump = function() {
        if (stopped || (waiting.length === 0 && running === 0)) {
            if (running === 0) finish()
            return
        } // if

        const now = Date.now()
        let next_wake = Infinity

        for (let index = 0; index < waiting.length && running < settings.concurrency; index++) {
            const item = waiting[index]
            const host = dead_links.host(item.url)

            if (busy_hosts[host]) {
                continue
            } // if

            if ((host_ready[host] || 0) > now) {
                next_wake = Math.min(next_wake, host_ready[host])
                continue
            } // if

            waiting.splice(index, 1)
            index--

            running++
            busy_hosts[host] = true

            Promise.resolve().then(function() { return worker(item) }).catch(function() {}).then(function() {
                running--
                busy_hosts[host] = false
                host_ready[host] = Date.now() + settings.host_gap_ms
                pump()
            })
        } // for

        if (next_wake !== Infinity && running < settings.concurrency) {
            setTimeout(pump, Math.max(0, next_wake - Date.now()))
        } // if
    } // pump

    pump()

    return {
        'done': done,
        'stop': function() {
            stopped = true
            waiting.length = 0
            if (running === 0) finish()
        }
    }
} // dead_links.queue
