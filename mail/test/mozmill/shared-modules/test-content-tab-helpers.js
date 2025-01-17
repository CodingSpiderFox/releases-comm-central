/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var MODULE_NAME = "content-tab-helpers";
var RELATIVE_ROOT = "../shared-modules";
var MODULE_REQUIRES = ["folder-display-helpers", "window-helpers", "mock-object-helpers"];

var elib = ChromeUtils.import("chrome://mozmill/content/modules/elementslib.jsm");
var utils = ChromeUtils.import("chrome://mozmill/content/modules/utils.jsm");
var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

var NORMAL_TIMEOUT = 6000;
var FAST_TIMEOUT = 1000;
var FAST_INTERVAL = 100;
var EXT_PROTOCOL_SVC_CID = "@mozilla.org/uriloader/external-protocol-service;1";

var folderDisplayHelper;
var mc;
var wh;

var _originalBlocklistURL = null;

// logHelper (and therefore folderDisplayHelper) exports
var mark_failure;
var gMockExtProtSvcReg;

function setupModule() {
  folderDisplayHelper = collector.getModule("folder-display-helpers");
  mc = folderDisplayHelper.mc;
  mark_failure = folderDisplayHelper.mark_failure;

  wh = collector.getModule("window-helpers");
  let moh = collector.getModule("mock-object-helpers");
  gMockExtProtSvcReg = new moh.MockObjectReplacer(EXT_PROTOCOL_SVC_CID,
                                                  MockExtProtConstructor);
}

function installInto(module) {
  setupModule();

  // Now copy helper functions
  module.open_content_tab_with_url = open_content_tab_with_url;
  module.open_content_tab_with_click = open_content_tab_with_click;
  module.plan_for_content_tab_load = plan_for_content_tab_load;
  module.wait_for_content_tab_load = wait_for_content_tab_load;
  module.assert_content_tab_has_url = assert_content_tab_has_url;
  module.assert_content_tab_has_favicon = assert_content_tab_has_favicon;
  module.content_tab_e = content_tab_e;
  module.content_tab_eid = content_tab_eid;
  module.get_content_tab_element_display = get_content_tab_element_display;
  module.assert_content_tab_element_hidden = assert_content_tab_element_hidden;
  module.assert_content_tab_element_visible = assert_content_tab_element_visible;
  module.wait_for_content_tab_element_display_value = wait_for_content_tab_element_display_value;
  module.wait_for_content_tab_element_display = wait_for_content_tab_element_display;
  module.get_element_by_text = get_element_by_text;
  module.assert_content_tab_text_present = assert_content_tab_text_present;
  module.assert_content_tab_text_absent = assert_content_tab_text_absent;
  module.NotificationWatcher = NotificationWatcher;
  module.get_notification_bar_for_tab = get_notification_bar_for_tab;
  module.get_test_plugin = get_test_plugin;
  module.updateBlocklist = updateBlocklist;
  module.setAndUpdateBlocklist = setAndUpdateBlocklist;
  module.resetBlocklist = resetBlocklist;
  module.gMockExtProtSvcReg = gMockExtProtSvcReg;
  module.gMockExtProtSvc = gMockExtProtSvc;
}

/**
 * gMockExtProtocolSvc allows us to capture (most if not all) attempts to
 * open links in the default browser.
 */
var gMockExtProtSvc = {
  _loadedURLs: [],
  QueryInterface: ChromeUtils.generateQI([Ci.nsIExternalProtocolService]),

  externalProtocolHandlerExists(aProtocolScheme) {
  },

  getApplicationDescription(aScheme) {
  },

  getProtocolHandlerInfo(aProtocolScheme) {
  },

  getProtocolHandlerInfoFromOS(aProtocolScheme, aFound) {
  },

  isExposedProtocol(aProtocolScheme) {
  },

  loadURI(aURI, aWindowContext) {
    this._loadedURLs.push(aURI.spec);
  },

  setProtocolHandlerDefaults(aHandlerInfo, aOSHandlerExists) {
  },

  urlLoaded(aURL) {
    return this._loadedURLs.includes(aURL);
  },
};

function MockExtProtConstructor() {
  return gMockExtProtSvc;
}


/* Allows for planning / capture of notification events within
 * content tabs, for example: plugin crash notifications, theme
 * install notifications.
 */
var ALERT_TIMEOUT = 10000;

var NotificationWatcher = {
  planForNotification(aController) {
    this.alerted = false;
    aController.window.document.addEventListener("AlertActive",
                                                 this.alertActive);
  },
  waitForNotification(aController) {
    if (!this.alerted) {
      aController.waitFor(() => this.alerted, "Timeout waiting for alert",
                          ALERT_TIMEOUT, 100);
    }
    // Double check the notification box has finished animating.
    let notificationBox =
      mc.tabmail.selectedTab.panel.querySelector("notificationbox");
    if (notificationBox && notificationBox._animating)
      aController.waitFor(() => !notificationBox._animating,
                          "Timeout waiting for notification box animation to finish",
                          ALERT_TIMEOUT, 100);

    aController.window.document.removeEventListener("AlertActive",
                                                    this.alertActive);
  },
  alerted: false,
  alertActive() {
    NotificationWatcher.alerted = true;
  },
};

/**
 * Opens a content tab with the given URL.
 *
 * @param aURL The URL to load (string).
 * @param [aBackground] Whether the tab is opened in the background. Defaults to
 *                      false.
 * @param [aController] The controller to open the tab in. Defaults to |mc|.
 *
 * @returns The newly-opened tab.
 */
function open_content_tab_with_url(aURL, aClickHandler, aBackground, aController) {
  if (aClickHandler === undefined)
    aClickHandler = null;
  if (aBackground === undefined)
    aBackground = false;
  if (aController === undefined)
    aController = mc;

  let preCount = mc.tabmail.tabContainer.allTabs.length;
  mc.tabmail.openTab("contentTab", {
    contentPage: aURL,
    background: aBackground,
    clickHandler: aClickHandler,
  });
  utils.waitFor(() => (
                aController.tabmail.tabContainer.allTabs.length == preCount + 1),
                "Timeout waiting for the content tab to open with URL: " + aURL,
                FAST_TIMEOUT, FAST_INTERVAL);

  // We append new tabs at the end, so check the last one.
  let expectedNewTab = aController.tabmail.tabInfo[preCount];
  folderDisplayHelper.assert_selected_tab(expectedNewTab);
  wait_for_content_tab_load(expectedNewTab, aURL);
  return expectedNewTab;
}

/**
 * Opens a content tab with a click on the given element. The tab is expected to
 * be opened in the foreground. The element is expected to be associated with
 * the given controller.
 *
 * @param aElem         The element to click or a function that causes the tab to open.
 * @param aExpectedURL  The URL that is expected to be opened (string).
 * @param [aController] The controller the element is associated with. Defaults
 *                      to |mc|.
 * @param [aTabType]    Optional tab type to expect (string).
 * @returns The newly-opened tab.
 */
function open_content_tab_with_click(aElem, aExpectedURL, aController, aTabType = "contentTab") {
  if (aController === undefined)
    aController = mc;

  let preCount = aController.tabmail.tabContainer.allTabs.length;
  if (typeof(aElem) != "function")
    aController.click(new elib.Elem(aElem));
  else
    aElem();

  utils.waitFor(() => (
                aController.tabmail.tabContainer.allTabs.length == preCount + 1),
                "Timeout waiting for the content tab to open",
                FAST_TIMEOUT, FAST_INTERVAL);

  // We append new tabs at the end, so check the last one.
  let expectedNewTab = aController.tabmail.tabInfo[preCount];
  folderDisplayHelper.assert_selected_tab(expectedNewTab);
  folderDisplayHelper.assert_tab_mode_name(expectedNewTab, aTabType);
  wait_for_content_tab_load(expectedNewTab, aExpectedURL);
  return expectedNewTab;
}

/**
 * Call this before triggering a page load that you are going to wait for using
 * |wait_for_content_tab_load|. This ensures that if a page is already displayed
 * in the given tab that state is sufficiently cleaned up so it doesn't trick us
 * into thinking that there is no need to wait.
 *
 * @param [aTab] optional tab, defaulting to the current tab.
 */
function plan_for_content_tab_load(aTab) {
  if (aTab === undefined)
    aTab = mc.tabmail.currentTabInfo;
  aTab.pageLoaded = false;
}

/**
 * Waits for the given content tab to load completely with the given URL. This
 * is expected to be accompanied by a |plan_for_content_tab_load| right before
 * the action triggering the page load takes place.
 *
 * Note that you cannot call |plan_for_content_tab_load| if you're opening a new
 * tab. That is fine, because pageLoaded is initially false.
 *
 * @param [aTab]      Optional tab, defaulting to the current tab.
 * @param aURL        The URL being loaded in the tab.
 * @param [aTimeout]  Optional time to wait for the load.
 */
function wait_for_content_tab_load(aTab, aURL, aTimeout) {
  if (aTab === undefined)
    aTab = mc.tabmail.currentTabInfo;

  function isLoadedChecker() {
    // Require that the progress listener think that the page is loaded.
    if (!aTab.pageLoaded)
      return false;
    // Also require that our tab infrastructure thinks that the page is loaded.
    return (!aTab.busy);
  }

  utils.waitFor(isLoadedChecker,
                "Timeout waiting for the content tab page to load.", aTimeout);
  // The above may return immediately, meaning the event queue might not get a
  // chance. Give it a chance now.
  mc.sleep(0);
  // Finally, require that the tab's browser thinks that no page is being loaded.
  wh.wait_for_browser_load(aTab.browser, aURL);
}

/**
 * Assert that the given content tab has the given URL (string) loaded.
 */
function assert_content_tab_has_url(aTab, aURL) {
  if (aTab.browser.currentURI.spec != aURL)
    mark_failure(["The tab", aTab, "should have URL", aURL, "but instead has",
                  aTab.browser.currentURI.spec]);
}

/**
 * Gets the element with the given ID from the content tab's displayed page.
 */
function content_tab_e(aTab, aId) {
  return aTab.browser.contentDocument.getElementById(aId);
}

/**
 * Assert that the given content tab has the given URL loaded as a favicon.
 */
function assert_content_tab_has_favicon(aTab, aURL) {
  if (aTab.browser.mIconURL != aURL)
    mark_failure(["The tab", aTab, "should have a favicon with URL", aURL,
                  "but instead has", aTab.browser.mIconURL]);
}

/**
 * Gets the element with the given ID from the content tab's displayed page,
 * wrapped in an elib.Elem.
 */
function content_tab_eid(aTab, aId) {
  return new elib.Elem(content_tab_e(aTab, aId));
}

/**
 * Returns the current "display" style property of an element.
 */
function get_content_tab_element_display(aTab, aElem) {
  let style = aTab.browser.contentWindow.getComputedStyle(aElem);
  return style.getPropertyValue("display");
}

/**
 * Asserts that the given element is hidden from view on the page.
 */
function assert_content_tab_element_hidden(aTab, aElem) {
  let display = get_content_tab_element_display(aTab, aElem);
  if (display != "none") {
    mark_failure(["Element", aElem, "should be hidden but has display", display,
                  "instead"]);
  }
}

/**
 * Asserts that the given element is visible on the page.
 */
function assert_content_tab_element_visible(aTab, aElem) {
  let display = get_content_tab_element_display(aTab, aElem);
  if (display == "none") {
    mark_failure(["Element", aElem, "should be visible but has display", display,
                  "instead"]);
  }
}

/**
 * Waits for the element's display property to be the given value.
 */
function wait_for_content_tab_element_display_value(aTab, aElem, aValue) {
  function isValue() {
    return get_content_tab_element_display(aTab, aElem) == aValue;
  }
  try {
    utils.waitFor(isValue);
  } catch (e) {
    if (e instanceof utils.TimeoutError) {
      mark_failure(["Timeout waiting for element", aElem, "to have display value",
                    aValue]);
    } else {
      throw e;
    }
  }
}

/**
 * Waits for the element's display property indicate it is visible.
 */
function wait_for_content_tab_element_display(aTab, aElem) {
  function isValue() {
    return get_content_tab_element_display(aTab, aElem) != "none";
  }
  try {
    utils.waitFor(isValue);
  } catch (e) {
    if (e instanceof utils.TimeoutError) {
      mark_failure(["Timeout waiting for element", aElem, "to become visible"]);
    } else {
      throw e;
    }
  }
}

/**
 * Finds element in document fragment, containing only the specified text
 * as its textContent value.
 *
 * @param aRootNode  Root node of the node tree where search should start.
 * @param aText      The string to search.
 */
function get_element_by_text(aRootNode, aText) {
  // Check every node existing.
  let nodes = aRootNode.querySelectorAll("*");
  for (let node of nodes) {
    // We ignore surrounding whitespace.
    if (node.textContent.trim() == aText)
      return node;
  }

  return null;
}

/**
 * Finds element containing only the specified text in the content tab's page.
 */
function get_content_tab_element_by_text(aTab, aText) {
  let doc = aTab.browser.contentDocument.documentElement;
  return get_element_by_text(doc, aText);
}

/**
 * Asserts that the given text is present on the content tab's page.
 */
function assert_content_tab_text_present(aTab, aText) {
  if (!get_content_tab_element_by_text(aTab, aText)) {
    mark_failure(["Unable to find string \"" + aText + "\" on the content tab's page"]);
  }
}

/**
 * Asserts that the given text is absent on the content tab's page.
 */
function assert_content_tab_text_absent(aTab, aText) {
  if (get_content_tab_element_by_text(aTab, aText)) {
    mark_failure(["Found string \"" + aText + "\" on the content tab's page"]);
  }
}

/**
 * Returns the notification bar for a tab if one is currently visible,
 * null if otherwise.
 */
function get_notification_bar_for_tab(aTab) {
  let notificationBoxEls = mc.tabmail.selectedTab.panel.querySelector("notificationbox");
  if (!notificationBoxEls)
    return null;

  return notificationBoxEls;
}

/**
 * Returns the nsIPluginTag for the test plug-in, if it is available.
 * Returns null otherwise.
 */
function get_test_plugin() {
  let ph = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
  var tags = ph.getPluginTags();

  // Find the test plugin
  for (var i = 0; i < tags.length; i++) {
    if (tags[i].name == "Test Plug-in")
      return tags[i];
  }
  return null;
}

function updateBlocklist(aController, aCallback) {
  let observer = function() {
    Services.obs.removeObserver(observer, "blocklist-updated");
    aController.window.setTimeout(aCallback, 0);
  };
  Services.obs.addObserver(observer, "blocklist-updated");
  Services.blocklist.QueryInterface(Ci.nsITimerCallback).notify(null);
}

function setAndUpdateBlocklist(aController, aURL, aCallback) {
  if (!_originalBlocklistURL) {
    _originalBlocklistURL = Services.prefs.getCharPref("extensions.blocklist.url");
  }
  Services.prefs.setCharPref("extensions.blocklist.url", aURL);
  updateBlocklist(aController, aCallback);
}

function resetBlocklist(aController, aCallback) {
  Services.prefs.setCharPref("extensions.blocklist.url", _originalBlocklistURL);
  updateBlocklist(aController, aCallback);
}
