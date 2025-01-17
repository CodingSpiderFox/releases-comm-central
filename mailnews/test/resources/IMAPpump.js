/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file provides a simple interface to the imap fake server. Demonstration
 *  of its use can be found in test_imapPump.js
 *
 * The code that forms the core of this file, in its original incarnation,
 *  was test_imapFolderCopy.js  There have been several iterations since
 *  then.
 */

var EXPORTED_SYMBOLS = [
  "IMAPPump",
  "setupIMAPPump",
  "teardownIMAPPump",
];

var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
var {MailServices} = ChromeUtils.import("resource:///modules/MailServices.jsm");
var {XPCOMUtils} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
var {localAccountUtils} = ChromeUtils.import("resource://testing-common/mailnews/localAccountUtils.js");
var {gThreadManager, nsMailServer} = ChromeUtils.import("resource://testing-common/mailnews/maild.js");
var {
  AuthPLAIN,
  AuthLOGIN,
  AuthCRAM,
} = ChromeUtils.import("resource://testing-common/mailnews/auth.js");
var imapd = {};
ChromeUtils.import("resource://testing-common/mailnews/imapd.js", imapd);
var {updateAppInfo} = ChromeUtils.import("resource://testing-common/AppInfo.jsm");

// define globals
var IMAPPump = {
  daemon: null,         // the imap fake server daemon
  server: null,         // the imap fake server
  incomingServer: null, // nsIMsgIncomingServer for the imap server
  inbox: null,          // nsIMsgFolder/nsIMsgImapMailFolder for imap inbox
  mailbox: null,        // imap fake server mailbox
};

function setupIMAPPump(extensions) {
  // Create Application info if we need it.
  updateAppInfo();

  // These are copied from imap's head_server.js to here so we can run
  //   this from any directory.
  function makeServer(daemon, infoString) {
    if (infoString in imapd.configurations)
      return makeServer(daemon, imapd.configurations[infoString].join(","));

    function createHandler(d) {
      var handler = new imapd.IMAP_RFC3501_handler(d);
      if (!infoString)
        infoString = "RFC2195";

      var parts = infoString.split(/ *, */);
      for (var part of parts) {
        imapd.mixinExtension(handler, imapd["IMAP_" + part + "_extension"]);
      }
      return handler;
    }
    var server = new nsMailServer(createHandler, daemon);
    server.start();
    return server;
  }

  function createLocalIMAPServer() {
    let server = localAccountUtils.create_incoming_server("imap",
      IMAPPump.server.port, "user", "password");
    server.QueryInterface(Ci.nsIImapIncomingServer);
    return server;
  }

  // end copy from head_server.js

  IMAPPump.daemon = new imapd.imapDaemon();
  IMAPPump.server = makeServer(IMAPPump.daemon, extensions);

  IMAPPump.incomingServer = createLocalIMAPServer();

  if (!localAccountUtils.inboxFolder)
    localAccountUtils.loadLocalMailAccount();

  // We need an identity so that updateFolder doesn't fail
  let localAccount = MailServices.accounts.createAccount();
  let identity = MailServices.accounts.createIdentity();
  localAccount.addIdentity(identity);
  localAccount.defaultIdentity = identity;
  localAccount.incomingServer = localAccountUtils.incomingServer;

  // Let's also have another account, using the same identity
  let imapAccount = MailServices.accounts.createAccount();
  imapAccount.addIdentity(identity);
  imapAccount.defaultIdentity = identity;
  imapAccount.incomingServer = IMAPPump.incomingServer;
  MailServices.accounts.defaultAccount = imapAccount;

  // The server doesn't support more than one connection
  Services.prefs.setIntPref("mail.server.default.max_cached_connections", 1);
  // We aren't interested in downloading messages automatically
  Services.prefs.setBoolPref("mail.server.default.download_on_biff", false);
  Services.prefs.setBoolPref("mail.biff.play_sound", false);
  Services.prefs.setBoolPref("mail.biff.show_alert", false);
  Services.prefs.setBoolPref("mail.biff.show_tray_icon", false);
  Services.prefs.setBoolPref("mail.biff.animate_dock_icon", false);
  Services.prefs.setBoolPref("mail.biff.alert.show_preview", false);

  IMAPPump.incomingServer.performExpand(null);

  IMAPPump.inbox = IMAPPump.incomingServer.rootFolder.getChildNamed("INBOX");
  IMAPPump.mailbox = IMAPPump.daemon.getMailbox("INBOX");
  IMAPPump.inbox instanceof Ci.nsIMsgImapMailFolder;
}

// This will clear not only the imap accounts but also local accounts.
function teardownIMAPPump() {
  // try to finish any pending operations
  let thread = gThreadManager.currentThread;
  while (thread.hasPendingEvents())
    thread.processNextEvent(true);

  IMAPPump.inbox = null;
  try {
    let serverSink = IMAPPump.incomingServer.QueryInterface(Ci.nsIImapServerSink);
    serverSink.abortQueuedUrls();
    IMAPPump.incomingServer.closeCachedConnections();
    IMAPPump.server.resetTest();
    IMAPPump.server.stop();
    MailServices.accounts.removeIncomingServer(IMAPPump.incomingServer, false);
    IMAPPump.incomingServer = null;
    localAccountUtils.clearAll();
  } catch (ex) { dump(ex); }
}
