/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/*
 * Test suite for getting mailbox urls via the protocol handler.
 */
var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

var defaultProtocolFlags =
  Ci.nsIProtocolHandler.URI_NORELATIVE |
  Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD |
  Ci.nsIProtocolHandler.URI_FORBIDS_AUTOMATIC_DOCUMENT_REPLACEMENT |
  Ci.nsIProtocolHandler.URI_FORBIDS_COOKIE_ACCESS |
  Ci.nsIProtocolHandler.ORIGIN_IS_FULL_SPEC;

var protocols = [{
  protocol: "mailbox",
  urlSpec: "mailbox://user@localhost/",
  // mailbox protocol doesn't use a port
  defaultPort: -1,
}];

function run_test() {
  for (var part = 0; part < protocols.length; ++part) {
    print("protocol: " + protocols[part].protocol);

    var pH = Cc["@mozilla.org/network/protocol;1?name=" +
                protocols[part].protocol]
               .createInstance(Ci.nsIProtocolHandler);

    Assert.equal(pH.scheme, protocols[part].protocol);
    Assert.equal(pH.defaultPort, protocols[part].defaultPort);
    Assert.equal(pH.protocolFlags, defaultProtocolFlags);

    // Whip through some of the ports to check we get the right results.
    for (let i = 0; i < 1024; ++i)
      Assert.equal(pH.allowPort(i, ""), false);

    // Check we get a URI when we ask for one
    var uri = Services.io.newURI(protocols[part].urlSpec);

    uri.QueryInterface(Ci.nsIMailboxUrl);

    Assert.equal(uri.spec, protocols[part].urlSpec);

    // XXX This fails on Windows
    // do_check_neq(pH.newChannel(uri), null);
  }
}
