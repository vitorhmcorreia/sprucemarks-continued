<js>
    const theme = args[0]
    const icon  = args[1]
    const page  = 'dead-links'
</js><!doctype html>
<html lang="en" class="<js>write(theme)</js>" id="html">
<head>
    <js>include('/page/include/-head.html')</js>
    <link rel="icon" href="/images/icon/icon-<js>write(icon)</js>-32.png?version=2025.6.26.0" type="image/png">
</head>
<body class="<js>write(theme)</js> wide">

    <div id="wrapper" class="wrapper wide">
        <header>
            <js>include('/images/-logo.svg')</js>
            <h1>Sprucemarks Continued</h1>
        </header>

        <nav>
            <ul>
                <li>
                    <a class="page" href="/page/<js>write(theme)</js>/<js>write(icon)</js>/options.html">
                        <span>Options</span>
                    </a>
                </li>
                <li>
                    <a class="page" href="/page/<js>write(theme)</js>/<js>write(icon)</js>/tools.html">
                        <span>Tools</span>
                    </a>
                </li>
                <li class="active">
                    <a class="page active" tabindex="-1">
                        <span>Dead Links</span>
                    </a>
                </li>
                <li>
                    <a class="page" href="/page/<js>write(theme)</js>/<js>write(icon)</js>/preferences.html">
                        <span>Preferences</span>
                    </a>
                </li>
                <li>
                    <a class="page" href="/page/<js>write(theme)</js>/<js>write(icon)</js>/about.html">
                        <span>About</span>
                    </a>
                </li>
            </ul>
        </nav>

        <div id="loading" class="loading">
            <div>
                <js>include('/images/-loading.svg')</js>
                LOADING
            </div>
        </div><!-- loading -->

        <div id="content" class="content hidden">
            <js>include('/page/include/-show-message.html.jss')</js>

            <h1 class="wide">Dead Links</h1>

            <div class="box wide">
                <div class="box-inner">

                    <div id="tool-dead-links">
                        <div class="tool-content">
                            <p class="no-margin-top">
                                Find <span class="only-edge">favorites</span><span class="only-non-edge">bookmarks</span> whose page no longer exists, has moved, or could not be verified, then update, ignore, or remove them.
                                Nothing is checked until you click <strong>Check Links</strong>. Checking asks your permission once, then contacts each website directly from your browser, without cookies. Nothing is sent anywhere else.
                                A large collection can take a few minutes; keep this tab open while it runs.
                            </p>

                            <label class="dead-links-option">
                                <input type="checkbox" id="dead-links-skip-local" checked>
                                <span>Skip local and intranet addresses (localhost, private networks, single-word names like <em>wiki</em>)</span>
                            </label>

                            <p class="dead-links-status">Not checked yet.</p>

                            <div class="dead-links-filters">
                                <label class="dead-links-filter hidden">
                                    <span>Show</span>
                                    <select id="dead-links-filter"></select>
                                </label>

                                <label class="dead-links-site-filter hidden">
                                    <span>Site</span>
                                    <select id="dead-links-site-filter"></select>
                                </label>
                            </div>

                            <div class="grid-area">
                                <div class="grid">
                                    <div class="grid-header">
                                        <div class="grid-item">Title</div>
                                        <div class="grid-item">Location</div>
                                        <div class="grid-item">URL</div>
                                        <div class="grid-item">Result</div>
                                        <div class="grid-item">Select</div>
                                    </div><!-- grid-header -->

                                    <div class="grid-rows">
                                        <!-- populated by dead-links-tool.js -->
                                    </div><!-- grid-rows -->
                                </div><!-- grid -->
                            </div><!-- grid-area -->

                            <div class="tool-control">
                                <p>
                                    <a href class="dead-links-show-ignored hidden">Show ignored</a>
                                    <a href class="dead-links-revoke hidden">Revoke website access</a>
                                    <a href id="button-start-over" class="hidden">Start over</a>
                                </p>

                                <div>
                                    <input id="button-check-links" type="button" value="Check Links" class="smaller"><input id="button-recheck-links" type="button" value="Recheck Problems" class="smaller" disabled><input id="button-stop-links" type="button" value="Stop" class="smaller hidden"><input id="button-select-all-links" type="button" value="Select All" class="smaller" disabled><input id="button-remove-dead-links" type="button" value="Remove Selected" class="smaller" disabled>
                                </div>
                            </div><!-- tool-control -->
                        </div><!-- tool-content -->
                    </div><!-- tool-dead-links -->

                </div><!-- box-inner -->
            </div><!-- box -->
        </div><!-- content -->
    </div><!-- wrapper -->

    <template id="template-dead-links-grid-row">
        <div class="grid-row">
            <div class="grid-item overflow-wrap-anywhere">
                <span class="title">...</span>
            </div><!-- grid-item -->

            <div class="grid-item overflow-wrap-anywhere">
                <div class="location">...</div>
            </div><!-- grid-item -->

            <div class="grid-item grid-url word-break-all">
                <div>
                    <a class="url" href rel="noopener noreferrer" target="_blank"></a>
                    <div class="new-url">&rarr; <a href rel="noopener noreferrer" target="_blank"></a></div>
                </div>
            </div><!-- grid-item -->

            <div class="grid-item">
                <div>
                    <div class="result-text"></div>
                    <div class="result-actions"><a href class="update">Update address</a> <a href class="ignore">Ignore</a></div>
                </div>
            </div><!-- grid-item -->

            <div class="grid-item grid-checkbox">
                <input type="checkbox" data-id="none">
            </div><!-- grid-item -->
        </div><!-- grid-row -->
    </template>

    <template id="template-dead-links-no-results">
        <div class="grid-row">
            <div class="grid-item grid-col-span-5">
                <div class="message"></div>
            </div><!-- grid-item -->
        </div><!-- grid-row -->
    </template>

    <js>include('/page/include/-scroll-nav.html')</js>

    <script src="/js/browser-polyfill.js?version=2025.6.26.0"></script>
    <script src="/js/shared.js?version=2025.6.26.0"></script>
    <script src="/js/dead-links.js?version=2026.11.14.0"></script>
    <script src="/js/page/dead-links-tool.js?version=2026.11.14.0"></script>
    <script src="/js/page/dead-links.js?version=2026.11.14.0"></script>

</body>
</html>
