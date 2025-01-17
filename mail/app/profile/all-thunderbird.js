/* -*- Mode: JavaScript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#filter substitution

#ifdef XP_UNIX
#ifndef XP_MACOSX
#define UNIX_BUT_NOT_MAC
#endif
#endif

pref("general.skins.selectedSkin", "classic/1.0");

#ifdef XP_MACOSX
pref("mail.biff.animate_dock_icon", false);
#endif

pref("mail.rights.version", 0);

// Don't show the about:rights notification in debug or non-official builds.
#ifdef DEBUG
pref("mail.rights.override", true);
#endif
#ifndef MOZILLA_OFFICIAL
pref("mail.rights.override", true);
#endif

// The minimum delay in seconds for the timer to fire between the notification
// of each consumer of the timer manager.
// minimum=30 seconds, default=120 seconds, and maximum=300 seconds
pref("app.update.timerMinimumDelay", 120);

// The minimum delay in milliseconds for the first firing after startup of the timer
// to notify consumers of the timer manager.
// minimum=10 seconds, default=30 seconds, and maximum=120 seconds
pref("app.update.timerFirstInterval", 30000);

// App-specific update preferences

// The interval to check for updates (app.update.interval) is defined in
// the branding files.

// Enables some extra Application Update Logging (can reduce performance)
pref("app.update.log", false);

// If set to true, the Update Service will automatically download updates when
// user can apply updates. This pref is no longer used on Windows, except as the
// default value to migrate to the new location that this data is now stored
// (which is in a file in the update directory). Because of this, this pref
// should no longer be used directly. Instead, getAppUpdateAutoEnabled and
// getAppUpdateAutoEnabled from UpdateUtils.jsm should be used.
#ifndef XP_WIN
 pref("app.update.auto", true);
#endif

// If set to true, the Update Service will apply updates in the background
// when it finishes downloading them.
pref("app.update.staging.enabled", true);

// Update service URL:
pref("app.update.url", "https://aus5.mozilla.org/update/6/%PRODUCT%/%VERSION%/%BUILD_ID%/%BUILD_TARGET%/%LOCALE%/%CHANNEL%/%OS_VERSION%/%SYSTEM_CAPABILITIES%/%DISTRIBUTION%/%DISTRIBUTION_VERSION%/update.xml");

// URL user can browse to manually if for some reason all update installation
// attempts fail.
pref("app.update.url.manual", "https://www.thunderbird.net");
// A default value for the "More information about this update" link
// supplied in the "An update is available" page of the update wizard.
pref("app.update.url.details", "https://www.thunderbird.net/%LOCALE%/%APP%/releases/");

// app.update.promptWaitTime is in branding section

// Whether or not to attempt using the service for updates.
#ifdef MOZ_MAINTENANCE_SERVICE
pref("app.update.service.enabled", true);
#endif

#ifdef XP_WIN
// This pref prevents BITS from being used by Thunderbird to download updates.
pref("app.update.BITS.enabled", false);
#endif

// Release notes URL
pref("app.releaseNotesURL", "https://live.thunderbird.net/%APP%/releasenotes?locale=%LOCALE%&version=%VERSION%&channel=%CHANNEL%&os=%OS%&buildid=%APPBUILDID%");

// URL for "Learn More" for Crash Reporter.
pref("toolkit.crashreporter.infoURL",
     "https://www.mozilla.org/thunderbird/legal/privacy/#crash-reporter");

// Base URL for web-based support pages.
pref("app.support.baseURL", "https://support.thunderbird.net/%LOCALE%/%APP%/%APPBUILDID%/");

// Base url for web-based feedback pages.
pref("app.feedback.baseURL", "https://input.mozilla.org/%LOCALE%/feedback/%APP%/%VERSION%/");

// Show error messages in error console.
pref("javascript.options.showInConsole", true);

// Controls enabling of the extension system logging (can reduce performance)
pref("extensions.logging.enabled", false);
pref("extensions.overlayloader.loglevel", "warn");

pref("extensions.abuseReport.enabled", false);

// Strict compatibility makes add-ons incompatible by default.
#ifndef RELEASE_OR_BETA
pref("extensions.strictCompatibility", false);
#else
pref("extensions.strictCompatibility", true);
#endif

pref("extensions.update.autoUpdateDefault", true);

pref("extensions.systemAddon.update.enabled", true);  // See bug 1462160.

pref("extensions.hotfix.id", "thunderbird-hotfix@mozilla.org");
pref("extensions.hotfix.cert.checkAttributes", true);
pref("extensions.hotfix.certs.1.sha1Fingerprint", "91:53:98:0C:C1:86:DF:47:8F:35:22:9E:11:C9:A7:31:04:49:A1:AA");
pref("extensions.hotfix.certs.2.sha1Fingerprint", "39:E7:2B:7A:5B:CF:37:78:F9:5D:4A:E0:53:2D:2F:3D:68:53:C5:60");

// Disable add-ons installed into the shared user and shared system areas by
// default. This does not include the application directory. See the SCOPE
// constants in AddonManager.jsm for values to use here
pref("extensions.autoDisableScopes", 15);

// Enable add-ons installed and owned by the application, like the default theme.
pref("extensions.startupScanScopes", 4);

// Gecko Profiler
pref("extensions.geckoProfiler.acceptedExtensionIds", "geckoprofiler@mozilla.com,quantum-foxfooding@mozilla.com,raptor@mozilla.org");

// Add-on content security policies.
pref("extensions.webextensions.base-content-security-policy", "script-src 'self' https://* moz-extension: blob: filesystem: 'unsafe-eval' 'unsafe-inline'; object-src 'self' https://* moz-extension: blob: filesystem:;");
pref("extensions.webextensions.default-content-security-policy", "script-src 'self'; object-src 'self';");


// Allow "legacy" XUL/XPCOM extensions.
pref("extensions.legacy.enabled", true);

// Preferences for AMO integration
pref("extensions.getAddons.cache.enabled", true);
pref("extensions.getAddons.maxResults", 15);
pref("extensions.getAddons.get.url", "https://services.addons.thunderbird.net/api/v3/addons/search/?guid=%IDS%&lang=%LOCALE%");
pref("extensions.getAddons.compatOverides.url", "https://services.addons.thunderbird.net/api/v3/addons/compat-override/?guid=%IDS%&lang=%LOCALE%");
pref("extensions.getAddons.link.url", "https://addons.thunderbird.net/%LOCALE%/%APP%/");
pref("extensions.getAddons.recommended.url", "https://services.addons.thunderbird.net/%LOCALE%/%APP%/api/%API_VERSION%/list/recommended/all/%MAX_RESULTS%/%OS%/%VERSION%?src=thunderbird");
pref("extensions.getAddons.search.browseURL", "https://addons.thunderbird.net/%LOCALE%/%APP%/search/?q=%TERMS%");
pref("extensions.getAddons.search.url", "https://services.addons.thunderbird.net/%LOCALE%/%APP%/api/%API_VERSION%/search/%TERMS%/all/%MAX_RESULTS%/%OS%/%VERSION%/%COMPATIBILITY_MODE%?src=thunderbird");
pref("extensions.webservice.discoverURL", "https://services.addons.thunderbird.net/%LOCALE%/%APP%/discovery/pane/%VERSION%/%OS%");
pref("extensions.getAddons.siteRegExp", "^https://.*addons\\.thunderbird\\.net");
pref("extensions.getAddons.langpacks.url", "https://services.addons.thunderbird.net/api/v3/addons/language-tools/?app=thunderbird&type=language&appversion=%VERSION%");

// Blocklist preferences
pref("extensions.blocklist.url", "https://blocklists.settings.services.mozilla.com/v1/blocklist/3/%APP_ID%/%APP_VERSION%/%PRODUCT%/%BUILD_ID%/%BUILD_TARGET%/%LOCALE%/%CHANNEL%/%OS_VERSION%/%DISTRIBUTION%/%DISTRIBUTION_VERSION%/%PING_COUNT%/%TOTAL_PING_COUNT%/%DAYS_SINCE_LAST_PING%/");
pref("extensions.blocklist.detailsURL", "https://blocked.cdn.mozilla.net/");
pref("extensions.blocklist.itemURL", "https://blocked.cdn.mozilla.net/%blockID%.html");

// Show new install UI with permission lists
pref("extensions.webextPermissionPrompts", true);

// 1 = allow "Man In The Middle" (local proxy, web filter, etc.) for certificate
//     pinning checks.
pref("security.cert_pinning.enforcement_level", 1);

// Symmetric (can be overridden by individual extensions) update preferences.
// e.g.
//  extensions.{GUID}.update.enabled
//  extensions.{GUID}.update.url
//  extensions.{GUID}.update.interval
//  .. etc ..
//
pref("extensions.update.enabled", true);
pref("extensions.update.url", "https://versioncheck.addons.thunderbird.net/update/VersionCheck.php?reqVersion=%REQ_VERSION%&id=%ITEM_ID%&version=%ITEM_VERSION%&maxAppVersion=%ITEM_MAXAPPVERSION%&status=%ITEM_STATUS%&appID=%APP_ID%&appVersion=%APP_VERSION%&appOS=%APP_OS%&appABI=%APP_ABI%&locale=%APP_LOCALE%&currentAppVersion=%CURRENT_APP_VERSION%&updateType=%UPDATE_TYPE%&compatMode=%COMPATIBILITY_MODE%");

pref("extensions.update.background.url", "https://versioncheck-bg.addons.thunderbird.net/update/VersionCheck.php?reqVersion=%REQ_VERSION%&id=%ITEM_ID%&version=%ITEM_VERSION%&maxAppVersion=%ITEM_MAXAPPVERSION%&status=%ITEM_STATUS%&appID=%APP_ID%&appVersion=%APP_VERSION%&appOS=%APP_OS%&appABI=%APP_ABI%&locale=%APP_LOCALE%&currentAppVersion=%CURRENT_APP_VERSION%&updateType=%UPDATE_TYPE%&compatMode=%COMPATIBILITY_MODE%");

pref("extensions.update.interval", 86400);  // Check for updates to Extensions and
                                            // Themes every day

pref("extensions.dss.switchPending", false);    // Non-dynamic switch pending after next

// Don't show recommendations on the extension and theme list views.
pref("extensions.htmlaboutaddons.recommendations.enabled", false);

pref("lightweightThemes.update.enabled", true);

// Built-in default permissions.
pref("permissions.manager.defaultsUrl", "resource://app/defaults/permissions");

pref("general.smoothScroll", true);
#ifdef UNIX_BUT_NOT_MAC
pref("general.autoScroll", false);
#else
pref("general.autoScroll", true);
#endif

pref("mail.shell.checkDefaultClient", true);
pref("mail.spellcheck.inline", true);

pref("mail.folder.views.version", 0);

pref("mail.folderpane.showColumns", false);
// Force the unit shown for the size of all folders. If empty, the unit
// is determined automatically for each folder. Allowed values: KB/MB/<empty string>
pref("mail.folderpane.sizeUnits", "");
// Summarize messages count and size of subfolders into a collapsed parent?
// Allowed values: true/false
pref("mail.folderpane.sumSubfolders", true);

// target folder URI used for the last move or copy
pref("mail.last_msg_movecopy_target_uri", "");
// last move or copy operation was a move
pref("mail.last_msg_movecopy_was_move", true);

//Set the font color for links to something lighter
pref("browser.anchor_color", "#0B6CDA");

pref("browser.preferences.instantApply", true);
#ifdef XP_MACOSX
pref("browser.preferences.animateFadeIn", true);
#else
pref("browser.preferences.animateFadeIn", false);
#endif

pref("accessibility.typeaheadfind", false);
pref("accessibility.typeaheadfind.timeout", 5000);
pref("accessibility.typeaheadfind.linksonly", false);
pref("accessibility.typeaheadfind.flashBar", 1);

pref("mail.close_message_window.on_delete", false);

// Number of lines of To/CC/BCC address headers to show before "more"
// truncates the list.
pref("mailnews.headers.show_n_lines_before_more", 1);

// We want to keep track of what items are appropriate in
// XULStore.json. We use versioning to scrub out the things
// that have become obsolete.
// The value will always be set by startup code and must not be changed
// here. A value of 0 means a new profile.
pref("mail.ui-rdf.version", 0);

/////////////////////////////////////////////////////////////////
// Overrides of the core mailnews.js and composer.js prefs
/////////////////////////////////////////////////////////////////
pref("mail.showCondensedAddresses", true); // show the friendly display name for people I know

pref("mailnews.attachments.display.start_expanded", false);
// hidden pref for changing how we present attachments in the message pane
pref("mailnews.attachments.display.view", 0);
pref("mail.pane_config.dynamic",            0);
pref("mailnews.reuse_thread_window2",     true);
pref("editor.singleLine.pasteNewlines", 4);  // substitute commas for new lines in single line text boxes
pref("editor.CR_creates_new_p", true);
pref("mail.compose.default_to_paragraph", true);

// hidden pref to ensure a certain number of headers in the message pane
// to avoid the height of the header area from changing when headers are present / not present
pref("mailnews.headers.minNumHeaders", 0); // 0 means we ignore this pref

// 0=no header, 1="<author> wrote:", 2="On <date> <author> wrote:"
// 3="<author> wrote On <date>:", 4=user specified
pref("mailnews.reply_header_type", 2);

pref("mail.operate_on_msgs_in_collapsed_threads", true);
pref("mail.warn_on_collapsed_thread_operation", true);
pref("mail.warn_on_shift_delete", true);

// When using commands like "next message" or "previous message", leave
// at least this percentage of the thread pane visible above / below the
// selected message.
pref("mail.threadpane.padding.top_percent", 10);
pref("mail.threadpane.padding.bottom_percent", 10);

// Use correspondents column instead of from/recipient columns.
pref("mail.threadpane.use_correspondents", true);

// only affects cookies from RSS articles
// 0-Accept, 1-dontAcceptForeign, 2-dontUse
pref("network.cookie.cookieBehavior", 0);

// To allow images to be inserted into a composition with an auth prompt, we
// need the following two.
pref("network.auth.subresource-img-cross-origin-http-auth-allow", true);
pref("network.auth.non-web-content-triggered-resources-http-auth-allow", true);

// clear the SeaMonkey pref, so we don't hear about how we don't have a chrome
// package registered for editor-region while opening about:config
pref("editor.throbber.url", "");

// 0=as attachment 2=default forward as inline with attachments
pref("mail.forward_message_mode", 2);

// 0=ask, 1=plain, 2=html, 3=both
pref("mail.default_html_action", 3);

/////////////////////////////////////////////////////////////////
// End core mailnews.js pref overrides
/////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
// Overrides for generic app behavior from the core all.js
/////////////////////////////////////////////////////////////////

pref("browser.hiddenWindowChromeURL", "chrome://messenger/content/hiddenWindow.xul");

pref("offline.startup_state",            2);
// 0 Ask before sending unsent messages when going online
// 1 Always send unsent messages when going online
// 2 Never send unsent messages when going online
pref("offline.send.unsent_messages",            0);

// 0 Ask before synchronizing the offline mail store when going offline
// 1 Always synchronize the offline store when going offline
// 2 Never synchronize the offline store when going offline
pref("offline.download.download_messages",  0);

// All platforms can automatically move the user offline or online based on
// the network connection.
pref("offline.autoDetect", true);

// Disable preconnect and friends due to privacy concerns. They are not
// sent through content policies.
pref("network.http.speculative-parallel-limit", 0);

// Expose only select protocol handlers. All others should go
// through the external protocol handler route.
// If you are changing this list, you may need to also consider changing the
// list in nsMsgContentPolicy::IsExposedProtocol.
pref("network.protocol-handler.expose-all", false);
pref("network.protocol-handler.expose.mailto", true);
pref("network.protocol-handler.expose.news", true);
pref("network.protocol-handler.expose.snews", true);
pref("network.protocol-handler.expose.nntp", true);
pref("network.protocol-handler.expose.imap", true);
pref("network.protocol-handler.expose.addbook", true);
pref("network.protocol-handler.expose.pop", true);
pref("network.protocol-handler.expose.mailbox", true);
// Although we allow these to be exposed internally, there are various places
// (e.g. message pane) where we may divert them out to external applications.
pref("network.protocol-handler.expose.about", true);
pref("network.protocol-handler.expose.http", true);
pref("network.protocol-handler.expose.https", true);

// suppress external-load warning for standard browser schemes
pref("network.protocol-handler.warn-external.http", false);
pref("network.protocol-handler.warn-external.https", false);
pref("network.protocol-handler.warn-external.ftp", false);

pref("network.hosts.smtp_server",           "mail");
pref("network.hosts.pop_server",            "mail");

// Temporarily add 'preferences' and 'newserror' to the list of about: pages that do not have a CSP specified.
// The list should be kept in sync with the one in m-c/modules/libpref/init/all.js. See bug 1495983.
pref("csp.about_uris_without_csp", "preferences,newserror,blank,printpreview,srcdoc,about,addons,cache-entry,config,crashes,debugging,devtools,downloads,home,memory,networking,newtab,performance,policies,profiles,restartrequired,searchreset,serviceworkers,sessionrestore,support,sync-log,telemetry,url-classifier,webrtc,welcomeback");

pref("security.warn_entering_secure", false);
pref("security.warn_entering_weak", false);
pref("security.warn_leaving_secure", false);
pref("security.warn_viewing_mixed", false);

pref("general.config.obscure_value", 0); // for MCD .cfg files

pref("browser.display.auto_quality_min_font_size", 0);

pref("view_source.syntax_highlight", false);

pref("toolkit.telemetry.infoURL", "https://www.mozilla.org/thunderbird/legal/privacy/#telemetry");

/////////////////////////////////////////////////////////////////
// End core all.js pref overrides
/////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
// Generic browser related prefs.
/////////////////////////////////////////////////////////////////
pref("browser.send_pings", false);
pref("browser.chrome.toolbar_tips",         true);
pref("browser.xul.error_pages.enabled", true);
pref("browser.xul.error_pages.expert_bad_cert", false);

// Attachment download manager settings
pref("browser.download.useDownloadDir", false);
pref("browser.download.folderList", 0);
pref("browser.download.manager.showAlertOnComplete", false);
pref("browser.download.manager.showAlertInterval", 2000);
pref("browser.download.manager.retention", 1);
pref("browser.download.manager.showWhenStarting", false);
pref("browser.download.manager.closeWhenDone", true);
pref("browser.download.manager.focusWhenStarting", false);
pref("browser.download.manager.flashCount", 0);
pref("browser.download.manager.addToRecentDocs", true);
#ifndef XP_MACOSX
pref("browser.helperApps.deleteTempFileOnExit", true);
#endif

pref("spellchecker.dictionary", "");
// Dictionary download preference
pref("spellchecker.dictionaries.download.url", "https://addons.thunderbird.net/%LOCALE%/%APP%/dictionaries/");

// profile.force.migration can be used to bypass the migration wizard, forcing migration from a particular
// mail application without any user intervention. Possible values are:
// seamonkey (mozilla suite) and outlook.
pref("profile.force.migration", "");

// prefs to control the mail alert notification
#ifndef XP_MACOSX
pref("alerts.totalOpenTime", 10000);
#endif

// analyze urls in mail messages for scams
pref("mail.phishing.detection.enabled", true);
// If phishing detection is enabled, allow fine grained control
// of the local, static tests
pref("mail.phishing.detection.ipaddresses", true);
pref("mail.phishing.detection.mismatched_hosts", true);
pref("mail.phishing.detection.disallow_form_actions", true);

pref("browser.safebrowsing.reportPhishURL", "https://%LOCALE%.phish-report.mozilla.com/?hl=%LOCALE%");

// prevent status-bar spoofing even if people are foolish enough to turn on JS
pref("dom.disable_window_status_change",          true);

// If a message is opened using Enter or a double click, what should we do?
// 0 - open it in a new window
// 1 - open it in an existing window
// 2 - open it in a new tab
pref("mail.openMessageBehavior", 2);
pref("mail.openMessageBehavior.version", 0);
// If messages or folders are opened using the context menu or a middle click,
// should we open them in the foreground or in the background?
pref("mail.tabs.loadInBackground", true);

// Tabs
pref("mail.tabs.tabMinWidth", 100);
pref("mail.tabs.tabMaxWidth", 210);
pref("mail.tabs.tabClipWidth", 140);
pref("mail.tabs.autoHide", false);
pref("mail.tabs.closeWindowWithLastTab", true);

// Where to show tab close buttons:
// 0 - active tab only
// 1 - all tabs until tabClipWidth is reached, then active tab only
// 2 - no close buttons
// 3 - at the end of the tabstrip
pref("mail.tabs.closeButtons", 1);

// Allow the tabs to be in the titlebar on supported systems
#ifdef UNIX_BUT_NOT_MAC
pref("mail.tabs.drawInTitlebar", false);
#else
pref("mail.tabs.drawInTitlebar", true);
#endif

// Offer additional drag space to the user. The drag space
// will only be shown if browser.tabs.drawInTitlebar is true.
pref("mail.tabs.extraDragSpace", false);

// The breakpad report server to link to in about:crashes
pref("breakpad.reportURL", "https://crash-stats.mozilla.com/report/index/");

// OS Integrated Search and Indexing
#ifdef XP_WIN
pref("mail.winsearch.enable", false);
pref("mail.winsearch.firstRunDone", false);
#else
#ifdef XP_MACOSX
pref("mail.spotlight.enable", false);
pref("mail.spotlight.firstRunDone", false);
#endif
#endif

// -- Windows Search/Spotlight logging options
#ifdef XP_WIN
// Should we output warnings and errors to the "error console"?
pref("mail.winsearch.logging.console", false);
// Should we output all output levels to stdout via dump?
pref("mail.winsearch.logging.dump", false);
#else
#ifdef XP_MACOSX
// Should we output warnings and errors to the "error console"?
pref("mail.spotlight.logging.console", false);
// Should we output all output levels to stdout via dump?
pref("mail.spotlight.logging.dump", false);
#endif
#endif

// Whether to use a panel that looks like an OS X sheet for customization
#ifdef XP_MACOSX
pref("toolbar.customization.usesheet", true);
#else
pref("toolbar.customization.usesheet", false);
#endif

// Number of recipient rows shown by default
pref("mail.compose.addresswidget.numRowsShownDefault", 3);

// Start compositions with (empty) attachment pane showing
pref("mail.compose.show_attachment_pane", false);
// Check for missing attachments?
pref("mail.compose.attachment_reminder", true);
// Words that should trigger a missing attachments warning.
pref("mail.compose.attachment_reminder_keywords", "chrome://messenger/locale/messengercompose/composeMsgs.properties");
// When no action is taken on the inline missing attachment notification,
// show an alert on send?
pref("mail.compose.attachment_reminder_aggressive", true);

// True if the user should be notified when attaching big files
pref("mail.compose.big_attachments.notify", true);
// Size (in kB) to automatically prompt for conversion of attachments to
// cloud links
pref("mail.compose.big_attachments.threshold_kb", 5120);
// True if the user should be notified that links will be inserted into
// their message when the upload is completed
pref("mail.compose.big_attachments.insert_notification", true);

// While false, display information about editing sending identity in compose.
pref("mail.compose.warned_about_customize_from", false);

// Instrumentation is currently unfinished, do not enable it.
// Set this to false to prevent instrumentation from happening, e.g., user
// has opted out, or an enterprise wants to disable it from the get go.
pref("mail.instrumentation.askUser", true);
pref("mail.instrumentation.userOptedIn", false);
pref("mail.instrumentation.postUrl", "https://www.mozilla.org/instrumentation");
// not sure how this will be formatted - would be nice to make it extensible.
pref("mail.instrumentation.lastNotificationSent", "");

pref("browser.formfill.enable", true);

// Disable autoplay as we don't handle audio elements in emails very well.
// See bug 515082.
pref("media.autoplay.enabled", false);

// whether to hide the timeline view by default in the faceted search display
pref("gloda.facetview.hidetimeline", true);

// Enable gloda by default!
pref("mailnews.database.global.indexer.enabled", true);
// Show gloda errors in the error console
pref("mailnews.database.global.logging.console", true);
// Limit the number of gloda message results
pref("mailnews.database.global.search.msg.limit", 1000);

// Serif fonts look dated.  Switching those language families to sans-serif
// where we think it makes sense.  Worth investigating for other font families
// as well, viz bug 520824.  See all.js for the rest of the font families
// preferences.
pref("font.default", "sans-serif");
pref("font.default.x-unicode", "sans-serif");
pref("font.default.x-western", "sans-serif");
pref("font.default.x-cyrillic", "sans-serif");
pref("font.default.el", "sans-serif");

#ifdef XP_MACOSX
pref("font.name.sans-serif.x-unicode", "Lucida Grande");
pref("font.name.monospace.x-unicode", "Menlo");
pref("font.name-list.sans-serif.x-unicode", "Lucida Grande");
pref("font.name-list.monospace.x-unicode", "Menlo, Monaco");
pref("font.size.variable.x-unicode", 15);
pref("font.size.monospace.x-unicode", 12);

pref("font.name.sans-serif.x-western", "Lucida Grande");
pref("font.name.monospace.x-western", "Menlo");
pref("font.name-list.sans-serif.x-western", "Lucida Grande");
pref("font.name-list.monospace.x-western", "Menlo, Monaco");
pref("font.size.variable.x-western", 15);
pref("font.size.monospace.x-western", 12);

pref("font.name.sans-serif.x-cyrillic", "Lucida Grande");
pref("font.name.monospace.x-cyrillic", "Menlo");
pref("font.name-list.sans-serif.x-cyrillic", "Lucida Grande");
pref("font.name-list.monospace.x-cyrillic", "Menlo, Monaco");
pref("font.size.variable.x-cyrillic", 15);
pref("font.size.monospace.x-cyrillic", 12);

pref("font.name.sans-serif.el", "Lucida Grande");
pref("font.name.monospace.el", "Menlo");
pref("font.name-list.sans-serif.el", "Lucida Grande");
pref("font.name-list.monospace.el", "Menlo, Monaco");
pref("font.size.variable.el", 15);
pref("font.size.monospace.el", 12);
#endif

// Since different versions of Windows need different settings, we'll handle
// this in MailMigrator.jsm.

// Linux, in other words.  Other OSes may wish to override.
#ifdef UNIX_BUT_NOT_MAC
// The font.name-list fallback is defined in case font.name isn't
// present -- e.g. in case a profile that's been used on Windows Vista or above
// is used on Linux.
pref("font.name-list.serif.x-unicode", "serif");
pref("font.name-list.sans-serif.x-unicode", "sans-serif");
pref("font.name-list.monospace.x-unicode", "monospace");

pref("font.name-list.serif.x-western", "serif");
pref("font.name-list.sans-serif.x-western", "sans-serif");
pref("font.name-list.monospace.x-western", "monospace");

pref("font.name-list.serif.x-cyrillic", "serif");
pref("font.name-list.sans-serif.x-cyrillic", "sans-serif");
pref("font.name-list.monospace.x-cyrillic", "monospace");

pref("font.name-list.serif.el", "serif");
pref("font.name-list.sans-serif.el", "sans-serif");
pref("font.name-list.monospace.el", "monospace");
#endif

pref("mail.font.windows.version", 0);

// What level of warning should we send to the error console?
pref("mail.wizard.logging.console", "None");
// What level of warning should we send to stdout via dump?
pref("mail.wizard.logging.dump", "None");

// Handle links targeting new windows (from within content tabs)
// These are the values that Firefox can be set to:
// 0=default window, 1=current window/tab, 2=new window,
// 3=new tab in most recent window
//
// Thunderbird only supports a value of 3. Other values can be set, but are
// not implemented or supported.
pref("browser.link.open_newwindow", 3);

// These are the values that Firefox can be set to:
// 0: no restrictions - divert everything
// 1: don't divert window.open at all
// 2: don't divert window.open with features
//
// Thunderbird only supports a value of 0. Other values can be set, but are
// not implemented or supported.
pref("browser.link.open_newwindow.restriction", 0);

pref("browser.tabs.loadDivertedInBackground", false);

// No e10s in Thunderbird for now.
pref("browser.tabs.remote.autostart", false);

// Browser icon prefs
pref("browser.chrome.site_icons", true);
pref("browser.chrome.favicons", true);

// Enable places by default as we want to store global history for visited links
// Below we define reasonable defaults as copied from Firefox so that we have
// something sensible.
pref("places.history.enabled", true);

// the (maximum) number of the recent visits to sample
// when calculating frecency
pref("places.frecency.numVisits", 10);

// buckets (in days) for frecency calculation
pref("places.frecency.firstBucketCutoff", 4);
pref("places.frecency.secondBucketCutoff", 14);
pref("places.frecency.thirdBucketCutoff", 31);
pref("places.frecency.fourthBucketCutoff", 90);

// weights for buckets for frecency calculations
pref("places.frecency.firstBucketWeight", 100);
pref("places.frecency.secondBucketWeight", 70);
pref("places.frecency.thirdBucketWeight", 50);
pref("places.frecency.fourthBucketWeight", 30);
pref("places.frecency.defaultBucketWeight", 10);

// bonus (in percent) for visit transition types for frecency calculations
pref("places.frecency.embedVisitBonus", 0);
pref("places.frecency.framedLinkVisitBonus", 0);
pref("places.frecency.linkVisitBonus", 100);
pref("places.frecency.typedVisitBonus", 2000);
pref("places.frecency.bookmarkVisitBonus", 75);
pref("places.frecency.downloadVisitBonus", 0);
pref("places.frecency.permRedirectVisitBonus", 0);
pref("places.frecency.tempRedirectVisitBonus", 0);
pref("places.frecency.reloadVisitBonus", 0);
pref("places.frecency.defaultVisitBonus", 0);

// bonus (in percent) for place types for frecency calculations
pref("places.frecency.unvisitedBookmarkBonus", 140);
pref("places.frecency.unvisitedTypedBonus", 200);

// Windows taskbar support
#ifdef XP_WIN
pref("mail.taskbar.lists.enabled", true);
pref("mail.taskbar.lists.tasks.enabled", true);
#endif

// Disable hardware accelerated layers
pref("layers.acceleration.disabled", true);
#ifdef XP_WIN
// and direct2d support on Windows.
pref("gfx.direct2d.disabled", true);
#endif

// Account provisioner.
pref("mail.provider.providerList", "https://broker.thunderbird.net/provider/list");
pref("mail.provider.suggestFromName", "https://broker.thunderbird.net/provider/suggest");
pref("mail.provider.enabled", true);
pref("mail.provider.realname", "");

// Developer Tools related preferences
pref("devtools.debugger.log", false);
pref("devtools.chrome.enabled", true);
pref("devtools.debugger.remote-enabled", true);
pref("devtools.selfxss.count", 5);

pref("mail.chat.enabled", true);
// Whether to show chat notifications or not.
pref("mail.chat.show_desktop_notifications", true);
// Decide how much information is to be shown in the notification.
// 0 == Show all info (sender, chat message message preview),
// 1 == Show sender's info only (not message preview),
// 2 == No info (fill dummy values).
pref("mail.chat.notification_info", 0);
pref("mail.chat.play_sound", true);
// 0 == default system sound, 1 == user specified wav
pref("mail.chat.play_sound.type", 0);
// if sound is user specified, this needs to be a file url
pref("mail.chat.play_sound.url", "");
// Enable/Disable support for OTR chat encryption.
pref("chat.otr.enable", false);
// Default values for chat account prefs.
pref("chat.otr.default.requireEncryption", false);
pref("chat.otr.default.verifyNudge", true);
pref("chat.otr.default.allowMsgLog", true);

// BigFiles
pref("mail.cloud_files.enabled", true);
pref("mail.cloud_files.inserted_urls.footer.link", "https://www.thunderbird.net");
pref("mail.cloud_files.learn_more_url", "https://support.thunderbird.net/kb/filelink-large-attachments");

// Ignore threads
pref("mail.ignore_thread.learn_more_url", "https://support.thunderbird.net/kb/ignore-threads");

// Sanitize dialog window
pref("privacy.cpd.history", true);
pref("privacy.cpd.cookies", true);
pref("privacy.cpd.cache", true);

// What default should we use for the time span in the sanitizer:
// 0 - Clear everything
// 1 - Last Hour
// 2 - Last 2 Hours
// 3 - Last 4 Hours
// 4 - Today
pref("privacy.sanitize.timeSpan", 1);

// Enable Contextual Identity Containers
pref("privacy.userContext.enabled", false);

// PgpMime Proxy
pref("mail.pgpmime.addon_url", "https://addons.thunderbird.net/thunderbird/addon/enigmail/");

// If set to true, Thunderbird will collapse the main menu for new profiles
// (or, more precisely, profiles that start with no accounts created).
pref("mail.main_menu.collapse_by_default", true);

// If set to true, when saving a message to a file, use underscore
// instead of space in the file name.
pref("mail.save_msg_filename_underscores_for_space", false);

#ifdef MOZ_SANDBOX
// This controls the strength of the Windows content process sandbox for testing
// purposes. This will require a restart.
// On windows these levels are:
// See - security/sandbox/win/src/sandboxbroker/sandboxBroker.cpp
// SetSecurityLevelForContentProcess() for what the different settings mean.
pref("security.sandbox.content.level", 0);
#endif

#if defined(NIGHTLY_BUILD) && defined(XP_MACOSX) && defined(MOZ_SANDBOX)
// Start the Mac sandbox immediately during child process startup instead
// of when messaged by the parent after the message loop is running.
pref("security.sandbox.content.mac.earlyinit", false);
#endif

// Enable FIDO U2F
pref("security.webauth.u2f", true);

// Use OS date and time settings by default.
pref("intl.regional_prefs.use_os_locales", true);

// Multi-lingual preferences
pref("intl.multilingual.enabled", false);

// We don't support yet language pack download from ATN
pref("intl.multilingual.downloadEnabled", false);

// Dark in-content pages
pref("browser.in-content.dark-mode", true);
