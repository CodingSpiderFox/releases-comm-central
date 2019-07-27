/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var gFilterList;
var gLogFilters;
var gFilterLogsResultsTree = null;

function onLoad() {
  gFilterList = window.arguments[0].filterList;

  gLogFilters = document.getElementById("logFilters");
  gLogFilters.checked = gFilterList.loggingEnabled;

  if (!gFilterLogsResultsTree) {
    gFilterLogsResultsTree = document.getElementById("filterLogsResultsTree");
    Services.prompt.alert(null, null, gFilterList.logURL);
  }
}

function toggleLogFilters() {
  gFilterList.loggingEnabled =  gLogFilters.checked;
}

function clearLog() {
  gFilterList.clearLog();
}

