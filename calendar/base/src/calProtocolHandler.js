/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

/**
 * Generic webcal constructor
 *
 * @param scheme        The scheme to init for (webcal, webcals)
 */
function calProtocolHandler(scheme) {
    this.scheme = scheme;
    this.mHttpProtocol = Services.io.getProtocolHandler(this.scheme == "webcal" ? "http" : "https");
    this.wrappedJSObject = this;
}

calProtocolHandler.prototype = {
    get defaultPort() { return this.mHttpProtocol.defaultPort; },
    get protocolFlags() { return this.mHttpProtocol.protocolFlags; },

    newURI: function(aSpec, anOriginalCharset, aBaseURI) {
        return Cc["@mozilla.org/network/standard-url-mutator;1"]
            .createInstance(Ci.nsIStandardURLMutator)
            .init(Ci.nsIStandardURL.URLTYPE_STANDARD, this.mHttpProtocol.defaultPort, aSpec, anOriginalCharset, aBaseURI)
            .finalize()
            .QueryInterface(Ci.nsIStandardURL);
    },

    newChannel: function(aUri) {
        return this.newChannel2(aUri, null);
    },

    newChannel2: function(aUri, aLoadInfo) {
        let uri = aUri.mutate().setScheme(this.mHttpProtocol.scheme).finalize();

        let channel;
        if (aLoadInfo) {
            channel = Services.io.newChannelFromURIWithLoadInfo(uri, aLoadInfo);
        } else {
            channel = Services.io.newChannelFromURI2(uri,
                                                     null,
                                                     Services.scriptSecurityManager.getSystemPrincipal(),
                                                     null,
                                                     Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_DATA_IS_NULL,
                                                     Ci.nsIContentPolicy.TYPE_OTHER);
        }
        channel.originalURI = aUri;
        return channel;
    },

    // We are not overriding any special ports
    allowPort: function(aPort, aScheme) { return false; }
};

/** Constructor for webcal: protocol handler */
function calProtocolHandlerWebcal() {
    calProtocolHandler.call(this, "webcal");
}
calProtocolHandlerWebcal.prototype = {
    __proto__: calProtocolHandler.prototype,

    QueryInterface: ChromeUtils.generateQI([Ci.nsIProtocolHandler]),
    classID: Components.ID("{1153c73a-39be-46aa-9ba9-656d188865ca}"),
};

/** Constructor for webcals: protocl handler */
function calProtocolHandlerWebcals() {
    calProtocolHandler.call(this, "webcals");
}
calProtocolHandlerWebcals.prototype = {
    __proto__: calProtocolHandler.prototype,

    QueryInterface: ChromeUtils.generateQI([Ci.nsIProtocolHandler]),
    classID: Components.ID("{bdf71224-365d-4493-856a-a7e74026f766}"),
};
