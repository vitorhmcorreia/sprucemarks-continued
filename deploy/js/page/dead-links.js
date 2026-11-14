'use strict'

/*
    Dead Links page start-up: connect to the background service worker, get the theme and preferences, then start the
    checker (js/page/dead-links-tool.js). Same pattern as preferences.js; it reuses the "init-preferences" message
    because this page needs exactly that data and nothing about the bookmark tree, so opening it starts no scans.
*/

//-----------
// Variables
//-----------
const local = {
    'element': {
        'content'   : document.getElementById('content'),
        'html'      : document.getElementById('html'),
        'loading'   : document.getElementById('loading'),
        'scroll_nav': document.getElementById('scroll-nav')
    },
    'function': { // will hold various functions
        // listener_port_disconnect
        // listener_port_message
        // port_connect
        // port_listeners
        // show_content
        // start
        // start_continue
    },
    'port': null, // will be set by port_connect() and used to communicate with the background service worker
    'preference': { // will hold values from background.js
        // browser_is_dark
        // icon_action
        // icon_color
        // theme
    },
    'setting': { // will hold values from background.js
        // show_message
    },
    'started': false
} // local

//-----------
// Functions
//-----------
const listener_port_disconnect = local.function.listener_port_disconnect = function listener_port_disconnect() {
    /*
    Listener for local.port.onDisconnect events. Reconnect after a second.
    */

    log('listener_port_disconnect -> disconnected')

    local.port = null

    setTimeout(function() {
        port_connect()
        port_listeners()
    }, 1000)
} // listener_port_disconnect

const listener_port_message = local.function.listener_port_message = function listener_port_message(obj, info) {
    /*
    Listener for local.port.onMessage events.

    @param  {Object}  obj   Object like {subject:'preference-set'}
    @param  {Object}  info  Not used.
    */

    switch (obj.subject) {
        case 'init-preferences':
            log('listener_port_message -> init-preferences')

            local.preference = obj.preference
            local.setting    = obj.setting

            if (local.started === false) {
                local.started = true
                start_continue()
            } // if

            break
        case 'preference-set':
            local.preference[obj.name] = obj.value

            if (obj.name === 'theme' || obj.name === 'icon_color' || obj.name === 'browser_is_dark') {
                theme_and_icon() // from shared.js
            } // if

            break
        default:
            // messages for other pages (ancestor-and-option, tool-bookmark-history, ...) are not used here
            break
    } // switch
} // listener_port_message

const port_connect = local.function.port_connect = function port_connect() {
    local.port = browser.runtime.connect()
} // port_connect

const port_listeners = local.function.port_listeners = function port_listeners() {
    local.port.onMessage.addListener(listener_port_message)
    local.port.onDisconnect.addListener(listener_port_disconnect)
} // port_listeners

const show_content = local.function.show_content = function show_content() {
    local.element.loading.classList.add('hidden')
    local.element.content.classList.remove('hidden')
} // show_content

const start = local.function.start = async function start() {
    /*
    Start the Dead Links page.
    */

    await shared_start() // from shared.js

    browser_customize() // from shared.js: shows "favorites" or "bookmarks" wording for this browser
    browser_body_add_class() // from shared.js

    listen_mouse_events() // from shared.js
    listen_scroll_nav() // from shared.js
    listen_show_message_dismiss() // from shared.js

    port_connect()
    port_listeners()

    local.port.postMessage({ 'subject': 'init-preferences' })

    // continues in start_continue() once the "init-preferences" answer arrives
} // start

const start_continue = local.function.start_continue = async function start_continue() {
    theme_and_icon() // from shared.js
    theme_monitor() // from shared.js

    show_message() // from shared.js

    show_content()

    scroll_nav() // from shared.js

    await dead_links_page.start() // from dead-links-tool.js
} // start_continue

//-------
// Start
//-------
start()
