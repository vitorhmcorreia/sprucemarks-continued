<js>
    const theme = args[0]
    const icon  = args[1]
    const page  = 'about'
</js><!doctype html>
<html lang="en" class="<js>write(theme)</js>" id="html">
<head>
    <js>include('/page/include/-head.html')</js>
    <link rel="icon" href="/images/icon/icon-<js>write(icon)</js>-32.png?version=2025.6.26.0" type="image/png">
</head>
<body class="<js>write(theme)</js>">

    <div class="wrapper">
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
                <li>
                    <a class="page" href="/page/<js>write(theme)</js>/<js>write(icon)</js>/preferences.html">
                        <span>Preferences</span>
                    </a>
                </li>
                <li class="active">
                    <a class="page active" tabindex="-1">
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

        <div id="content" class="content visibility-hidden">
            <js>include('/page/include/-show-message.html.jss')</js>

            <h1>About</h1>

            <div class="box">
                <div class="box-inner">
                    <p>
                        You are running Sprucemarks Continued version
                        <strong id="about-version">1.0</strong>
                        <span id="about-browser"></span>
                    </p>

                    <p class="no-margin-bottom">
                        Build: <span id="about-build">unknown</span>
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <h2>About This Fork</h2>

            <div class="box">
                <div class="box-inner">
                    <p>
                        Sprucemarks Continued is a community fork of Sprucemarks, created by Kai Nightmode and dedicated to the public domain under <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="noopener noreferrer" target="_blank">CC0 1.0</a> when the original was archived in August 2026. The goal is simply to keep it alive. This fork is not affiliated with or endorsed by the original author.
                    </p>

                    <p>
                        Sprucemarks Continued does not collect, transmit, or sell any data. Your <span class="only-non-edge">bookmarks</span><span class="only-edge">favorites</span> and options never leave your browser. Source code and issues are on <a href="https://github.com/vitorhmcorreia/sprucemarks-continued" rel="noopener noreferrer" target="_blank">GitHub</a>, and the extension is on <a href="https://microsoftedge.microsoft.com/addons/detail/sprucemarks-continued/kbnolfoleaklmdmejgffhmbodflkojeh" rel="noopener noreferrer" target="_blank">Microsoft Edge Add-ons</a>.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <h2>Change Log</h2>

            <div class="box">
                <div class="box-inner">
                    <h3>November 14, 2026 &middot; version 2026.11.14.1</h3>

                    <ul>
                        <li>
                            Much faster Tools page on large collections: finding similar <span class="only-non-edge">bookmarks</span><span class="only-edge">favorites</span> is about 15 times faster.
                        </li>
                        <li>
                            Troubleshooting on this page now shows how long recent work took (Timing) and which build you are running.
                        </li>
                        <li>
                            New green logo at the top of every page, matching the new icon.
                        </li>
                        <li>
                            Quieter: the developer console log is off in store builds.
                        </li>
                        <li>
                            Links to the Microsoft Edge Add-ons listing.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>November 14, 2026 &middot; version 2026.11.14.0</h3>

                    <ul>
                        <li>
                            First release of Sprucemarks Continued, a community fork of the archived Sprucemarks.
                        </li>
                        <li>
                            Updated name, about page, and messages to identify the fork.
                        </li>
                        <li>
                            New icon: the familiar trees with a small teal arrow, so you can tell the fork from the original.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <h3>Before the fork</h3>

            <div class="box">
                <div class="box-inner">
                    <h3>August 28, 2026</h3>

                    <p>
                        Archive version. No further changes planned.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>June 26, 2025</h3>

                    <p>
                        Added support for duplicate bookmark ancestors.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>January 3, 2025</h3>

                    <p>
                        Updated license to be in the public domain.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>May 17, 2024</h3>

                    <p>
                        Updated to Manifest V3 behind the scenes.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>April 1, 2024</h3>

                    <p>
                        Updated to a no-contact and no-support model.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>November 27, 2022</h3>

                    <p>
                        Updated contact information.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>July 5, 2022</h3>

                    <p>
                        Sprucemarks is now free.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>December 4, 2021</h3>

                    <p>
                        New unlock option. Keep using Sprucemarks without support with any previous Patreon membership.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>January 28, 2021</h3>

                    <ul>
                        <li>
                            New troubleshooting information feature. Visit the about page for a behind the scenes look at your <span class="only-non-edge">bookmarks</span><span class="only-edge">favorites</span>, options, account information, and more.
                        </li>
                        <li>
                            Improved content, guidance, and USD specifications since Patreon is supporting additional currencies.
                        </li>
                        <li>
                            Improved server privacy. Accounts that have not checked in for 90 days or accounts with scrubbed information are automatically removed from the database.
                        </li>
                        <li>
                            Improved server caching. Accounts in good standing should be even more resistant to Patreon API issues.
                        </li>
                        <li>
                            Improved offline availability. Sprucemarks can remain unlocked without a network connection for up to 90 days.
                        </li>
                        <li>
                            Improved server performance by completing certain intensive tasks ahead of time.
                        </li>
                        <li>
                            Improved contact information in more places.
                        </li>
                        <li>
                            Fixed an issue with scrolling restoration on the about page.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>October 27, 2020</h3>

                    <ul>
                        <li>
                            Official support for Microsoft Edge on Linux.
                        </li>
                        <li>
                            Updated content, author, and contact information.
                        </li>
                        <li>
                            Improved caching and ongoing access for Patrons without a monthly membership.
                        </li>
                        <li>
                            Improved the display of similar
                            <span class="only-non-edge">bookmarks</span>
                            <span class="only-edge">favorites</span>
                            with long titles, locations, or links.
                        </li>
                        <li>
                            Fixed an issue which caused navigation elements to appear purple for a short time after loading.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>August 7, 2020</h3>

                    <ul>
                        <li>
                            Additional ways to get to the options page in all browsers.
                        </li>
                        <li>
                            Tools that can show all results now have a less results link too.
                        </li>
                        <li>
                            Improved the safety of checkbox based tools.
                        </li>
                        <li>
                            More flexible demo mode controlled by the server.
                        </li>
                        <li>
                            One-time help message when a demo expires.
                        </li>
                        <li>
                            One-time help message for Chrome since it hides extension icons by default.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>July 1, 2020</h3>

                    <ul>
                        <li>
                            New tool. Check for and optionally remove duplicate <span class="only-edge">favorites</span><span class="only-non-edge">bookmarks</span>.
                        </li>
                        <li>
                            New tool. Check for and optionally remove similar <span class="only-edge">favorites</span><span class="only-non-edge">bookmarks</span>.
                        </li>
                        <li>
                            New demo mode. Login and activate a free demo.
                        </li>
                        <li>
                            New scroll to top navigation link that appears when needed.
                        </li>
                        <li>
                            Improved tab navigation and text wrapping for all tools.
                        </li>
                        <li>
                            Improved the refresh efficiency and experience of all tools.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>June 1, 2020</h3>

                    <ul>
                        <li>
                            Unofficial support for Brave and Opera browsers.
                        </li>
                        <li>
                            Unofficial support for all Chromium based browsers, in theory.
                        </li>
                        <li>
                            New tools page.
                        </li>
                        <li>
                            New tool. Check for and optionally remove empty folders.
                        </li>
                        <li>
                            New tool. View and optionally clear your
                            <span class="only-edge">favorite</span>
                            <span class="only-non-edge">bookmark</span>
                            history.
                        </li>
                        <li>
                            Fixed an issue which caused premature sorting in unexpected folders.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->


            <div class="box">
                <div class="box-inner">
                    <h3>May 1, 2020</h3>

                    <ul>
                        <li>
                            New fonts, icons, layout, logo, navigation, scrollbars, and themes.
                        </li>
                        <li>
                            New login page with improved guidance.
                        </li>
                        <li>
                            New preferences page.
                        </li>
                        <li>
                            New theme preference. Automatic, light, or dark.
                        </li>
                        <li>
                            New icon color preference. Automatic, light, dark, or green.
                        </li>
                        <li>
                            New icon action preference. Choose which page opens by default.
                        </li>
                        <li>
                            New about page with author, change log, copyright, privacy policy, and version information.
                        </li>
                        <li>
                            Updated options page with improved guidance.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>April 1, 2020</h3>

                    <ul>
                        <li>
                            New automatic sorting option allows you to turn Sprucemarks on/off without having to disable the extension.
                        </li>
                        <li>
                            New one click options and smarter defaults.
                        </li>
                        <li>
                            New privacy policy link.
                        </li>
                        <li>
                            Improved sorting for underscores, numbers, and multilingual characters.
                        </li>
                        <li>
                            Improved options page content and layout.
                        </li>
                        <li>
                            Removed the delay sort option which was no longer needed in modern browsers.
                        </li>
                        <li>
                            Removed the tabs permission requirement and the save button on the options page thanks to a complete rewiring of the options system.
                        </li>
                        <li>
                            Fix for Firefox so occasional network errors no longer cause a logout.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>March 1, 2020</h3>

                    <p>
                        Official support for Microsoft Edge.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>February 1, 2020</h3>

                    <ul>
                        <li>
                            Official support for Mozilla Firefox.
                        </li>
                        <li>
                            New high resolution checkboxes, icons, screenshots, and sort lists.
                        </li>
                        <li>
                            New extension icon takes you to the options page with one click.
                        </li>
                        <li>
                            New extension icon badge will display "login" if needed.
                        </li>
                        <li>
                            New automatic light and dark theme support for various icons.
                        </li>
                        <li>
                            Improved login page no longer needs to show itself after every restart.
                        </li>
                        <li>
                            Improved keyboard navigation.
                        </li>
                        <li>
                            Fixed a version compare issue for older versions of Sprucemarks.
                        </li>
                    </ul>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>January 21, 2020</h3>

                    <p>
                        Rewrote nearly everything in Sprucemarks so the source code is easier to understand, maintain, and improve.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <div class="box">
                <div class="box-inner">
                    <h3>January 1, 2020</h3>

                    <p>
                        Sprucemarks officially relaunched as Patreon supported software.
                    </p>
                </div><!-- box-inner -->
            </div><!-- box -->

            <h2>Troubleshooting</h2>

            <div class="box">
                <div class="box-inner">
                    <p>
                        The information below is what Sprucemarks sees behind the scenes. It may be useful for troubleshooting and as long as this page is open, it will continually update to reflect any changes.
                    </p>

                    <hr>

                    <p>
                        <strong>
                            <span class="only-non-edge">Bookmark</span>
                            <span class="only-edge">Favorite</span> Ancestors
                        </strong><br>
                        <span id="trouble-ancestors" class="word-break-all">Unknown</span>
                    </p>

                    <p>
                        <strong>
                            <span class="only-non-edge">Bookmark</span>
                            <span class="only-edge">Favorite</span>
                            Hashes
                        </strong><br>
                        <span id="trouble-hashes" class="word-break-all">Unknown</span>
                    </p>

                    <p>
                        <strong>Options</strong><br>
                        <span id="trouble-options" class="word-break-all">Unknown</span>
                    </p>

                    <p>
                        <strong>Sprucemarks Continued Version</strong><br>
                        <span id="trouble-version">1.0</span>
                    </p>

                    <p>
                        <strong>Build</strong><br>
                        <span id="trouble-build" class="word-break-all">Unknown</span>
                    </p>

                    <p>
                        <strong>Web Browser Version</strong><br>
                        <span id="trouble-browser">Unknown</span>
                    </p>

                    <p>
                        <strong>Timing</strong> (how long recent work took, slowest first; times in milliseconds)<br>
                        <span id="trouble-timing" class="trouble-timing">Unknown</span>
                    </p>

                    <hr>

                    <div>
                        <input id="trouble-copy" type="button" value="Copy Information" class="smaller">
                        <input id="trouble-copy-busy" type="button" value="Copied" class="hidden smaller" disabled>
                    </div>
                </div><!-- box-inner -->
            </div><!-- box -->
        </div><!-- content -->
    </div><!-- wrapper -->

    <js>include('/page/include/-scroll-nav.html')</js>

    <script src="/js/browser-polyfill.js?version=2025.6.26.0"></script>
    <script src="/js/shared.js?version=2025.6.26.0"></script>
    <script src="/js/page/about.js?version=2025.6.26.0"></script>

</body>
</html>