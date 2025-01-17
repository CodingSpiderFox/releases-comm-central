/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/* global MozElements, MozXULElement */

{
  const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

  /**
   * The MozTabs widget holds all the tabs for the main tab UI.
   * @extends {MozTabs}
   */
  class MozTabmailTabs extends customElements.get("tabs") {
    constructor() {
      super();

      this.addEventListener("dragstart", (event) => {
        let draggedTab = this._getDragTargetTab(event);

        if (!draggedTab)
          return;

        let tab = this.tabmail.selectedTab;

        if (!tab || !tab.canClose)
          return;

        let dt = event.dataTransfer;

        // If we drag within the same window, we use the tab directly
        dt.mozSetDataAt("application/x-moz-tabmail-tab", draggedTab, 0);

        // Otherwise we use session restore & JSON to migrate the tab.
        let uri = this.tabmail.persistTab(tab);

        // In case the tab implements session restore, we use JSON to convert
        // it into a string.
        //
        // If a tab does not support session restore it returns null. We can't
        // moved such tabs to a new window. However moving them within the same
        // window works perfectly fine.
        if (uri)
          uri = JSON.stringify(uri);

        dt.mozSetDataAt("application/x-moz-tabmail-json", uri, 0);

        dt.mozCursor = "default";

        // Create Drag Image.
        let panel = document.getElementById("tabpanelcontainer");

        let thumbnail = document.createElementNS("http://www.w3.org/1999/xhtml",
                                                 "canvas");
        thumbnail.width = Math.ceil(screen.availWidth / 5.75);
        thumbnail.height = Math.round(thumbnail.width * 0.5625);

        let snippetWidth = panel.getBoundingClientRect().width * .6;
        let scale = thumbnail.width / snippetWidth;

        let ctx = thumbnail.getContext("2d");

        ctx.scale(scale, scale);

        ctx.drawWindow(window,
          panel.screenX - window.mozInnerScreenX,
          panel.screenY - window.mozInnerScreenY,
          snippetWidth,
          snippetWidth * 0.5625,
          "rgb(255,255,255)");

        dt = event.dataTransfer;
        dt.setDragImage(thumbnail, 0, 0);

        event.stopPropagation();
      });

      this.addEventListener("dragover", (event) => {
        let dt = event.dataTransfer;

        if (dt.mozItemCount == 0)
          return;

        if (dt.mozGetDataAt("text/toolbarwrapper-id/messengerWindow", 0) !=
            null) {
          event.preventDefault();
          event.stopPropagation();

          // Dispatch event to the toolbar
          let evt = document.createEvent("DragEvent");
          evt.initDragEvent("dragover", true, true, window, 0, 0, 0, 0, 0,
            false, false, false, false, 0, null,
            event.dataTransfer);

          if (this.mToolbar.firstChild) {
            this.mToolbar.firstChild.dispatchEvent(evt);
          } else {
            this.mToolbar.dispatchEvent(evt);
          }

          return;
        }

        // Bug 516247:
        // in case the user is dragging something else than a tab, and
        // keeps hovering over a tab, we assume he wants to switch to this tab.
        if ((dt.mozTypesAt(0)[0] != "application/x-moz-tabmail-tab") &&
            (dt.mozTypesAt(0)[1] != "application/x-moz-tabmail-json")) {
          let tab = this._getDragTargetTab(event);

          if (!tab)
            return;

          event.preventDefault();
          event.stopPropagation();

          if (!this._dragTime) {
            this._dragTime = Date.now();
            return;
          }

          if (Date.now() <= this._dragTime + this._dragOverDelay)
            return;

          if (this.tabmail.tabContainer.selectedItem == tab)
            return;

          this.tabmail.tabContainer.selectedItem = tab;

          return;
        }

        // As some tabs do not support session restore they can't be
        // moved to a different or new window. We should not show
        // a dropmarker in such a case.
        if (!dt.mozGetDataAt("application/x-moz-tabmail-json", 0)) {
          let draggedTab = dt.mozGetDataAt("application/x-moz-tabmail-tab", 0);

          if (!draggedTab)
            return;

          if (this.tabmail.tabContainer.getIndexOfItem(draggedTab) == -1)
            return;
        }

        dt.effectAllowed = "copyMove";

        event.preventDefault();
        event.stopPropagation();

        let ltr = (window.getComputedStyle(this).direction == "ltr");
        let ind = this._tabDropIndicator;

        // Let's scroll
        if (this.hasAttribute("overflow")) {
          let target = event.originalTarget.getAttribute("anonid");

          let pixelsToScroll = 0;

          if (target == "scrollbutton-up")
            pixelsToScroll = this.arrowScrollbox.scrollIncrement;

          if (target == "scrollbutton-down")
            pixelsToScroll = this.arrowScrollbox.scrollIncrement * -1;

          if (ltr)
            pixelsToScroll = pixelsToScroll * -1;

          if (pixelsToScroll) {
            // Hide Indicator while Scrolling
            ind.setAttribute("hidden", "true");
            this.arrowScrollbox.scrollByPixels(pixelsToScroll);
            return;
          }
        }

        let newIndex = this._getDropIndex(event);

        // Fix the DropIndex in case it points to tab that can't be closed.
        let tabInfo = this.tabmail.tabInfo;

        while ((newIndex < tabInfo.length) && !(tabInfo[newIndex].canClose)) {
          newIndex++;
        }

        let scrollRect = this.arrowScrollbox.scrollClientRect;
        let rect = this.getBoundingClientRect();
        let minMargin = scrollRect.left - rect.left;
        let maxMargin = Math.min(minMargin + scrollRect.width, scrollRect.right);

        if (!ltr)
          [minMargin, maxMargin] = [this.clientWidth - maxMargin, this.clientWidth - minMargin];

        let newMargin;
        let tabs = this.allTabs;

        if (newIndex == tabs.length) {
          let tabRect = tabs[newIndex - 1].getBoundingClientRect();

          if (ltr)
            newMargin = tabRect.right - rect.left;
          else
            newMargin = rect.right - tabRect.left;
        } else {
          let tabRect = tabs[newIndex].getBoundingClientRect();

          if (ltr)
            newMargin = tabRect.left - rect.left;
          else
            newMargin = rect.right - tabRect.right;
        }

        ind.setAttribute("hidden", "false");

        newMargin += ind.clientWidth / 2;
        if (!ltr)
          newMargin *= -1;

        ind.style.transform = "translate(" + Math.round(newMargin) + "px)";
        ind.style.marginInlineStart = (-ind.clientWidth) + "px";
      });

      this.addEventListener("drop", (event) => {
        let dt = event.dataTransfer;

        if (dt.mozItemCount != 1)
          return;

        // If we're dragging a toolbar button, let's prepend the tabs toolbar
        // with that button, and then bail out.
        let buttonId = dt.mozGetDataAt("text/toolbarwrapper-id/messengerWindow", 0);

        if (buttonId != null) {
          event.preventDefault();
          event.stopPropagation();

          let evt = document.createEvent("DragEvent");
          evt.initDragEvent("drop", true, true, window, 0, 0, 0, 0, 0,
            false, false, false, false, 0, null,
            event.dataTransfer);

          if (this.mToolbar.firstChild) {
            this.mToolbar.firstChild.dispatchEvent(evt);
          } else {
            this.mToolbar.dispatchEvent(evt);
          }

          return;
        }

        let draggedTab = dt.mozGetDataAt("application/x-moz-tabmail-tab", 0);

        if (!draggedTab)
          return;

        event.stopPropagation();
        this._tabDropIndicator.setAttribute("hidden", "true");

        // Is the tab one of our children?
        if (this.tabmail.tabContainer.getIndexOfItem(draggedTab) == -1) {
          // It's a tab from an other window, so we have to trigger session
          // restore to get our tab

          let tabmail2 = draggedTab.ownerDocument.getElementById("tabmail");
          if (!tabmail2)
            return;

          let draggedJson = dt.mozGetDataAt("application/x-moz-tabmail-json", 0);
          if (!draggedJson)
            return;

          draggedJson = JSON.parse(draggedJson);

          // Some tab exist only once, so we have to gamble a bit. We close
          // the tab and try to reopen it. If something fails the tab is gone.

          tabmail2.closeTab(draggedTab, true);

          if (!this.tabmail.restoreTab(draggedJson))
            return;

          draggedTab = this.tabmail.tabContainer.allTabs[
            this.tabmail.tabContainer.allTabs.length - 1];
        }

        let idx = this._getDropIndex(event);

        // Fix the DropIndex in case it points to tab that can't be closed
        let tabInfo = this.tabmail.tabInfo;
        while ((idx < tabInfo.length) && !(tabInfo[idx].canClose)) {
          idx++;
        }

        this.tabmail.moveTabTo(draggedTab, idx);

        this.tabmail.switchToTab(draggedTab);
        this.tabmail.updateCurrentTab();
      });

      this.addEventListener("dragend", (event) => {
        // Note: while this case is correctly handled here, this event
        // isn't dispatched when the tab is moved within the tabstrip,
        // see bug 460801.

        // The user pressed ESC to cancel the drag, or the drag succeeded.
        let dt = event.dataTransfer;
        if ((dt.mozUserCancelled) || (dt.dropEffect != "none"))
          return;

        // Disable detach within the browser toolbox.
        let eX = event.screenX;
        let wX = window.screenX;

        // Check if the drop point is horizontally within the window.
        if (eX > wX && eX < (wX + window.outerWidth)) {
          let bo = this.arrowScrollbox;
          // Also avoid detaching if the the tab was dropped too close to
          // the tabbar (half a tab).
          let endScreenY = bo.screenY + 1.5 * bo.getBoundingClientRect().height;
          let eY = event.screenY;

          if (eY < endScreenY && eY > window.screenY)
            return;
        }

        // User wants to deatach tab from window...
        if (dt.mozItemCount != 1)
          return;

        let draggedTab = dt.mozGetDataAt("application/x-moz-tabmail-tab", 0);

        if (!draggedTab)
          return;

        this.tabmail.replaceTabWithWindow(draggedTab);
      });

      this.addEventListener("dragexit", (event) => {
        this._dragTime = 0;

        this._tabDropIndicator.setAttribute("hidden", "true");
        event.stopPropagation();
      });

      this.addEventListener("click", (event) => {
        if (event.button != 0) {
          return;
        }

        if (!event.originalTarget.classList.contains("tabs-closebutton")) {
          return;
        }

        let tabbedBrowser = document.getElementById("tabmail");
        if (this.localName == "tab") {
          // The only sequence in which a second click event (i.e. dblclik)
          // can be dispatched on an in-tab close button is when it is shown
          // after the first click (i.e. the first click event was dispatched
          // on the tab). This happens when we show the close button only on
          // the active tab. (bug 352021)
          // The only sequence in which a third click event can be dispatched
          // on an in-tab close button is when the tab was opened with a
          // double click on the tabbar. (bug 378344)
          // In both cases, it is most likely that the close button area has
          // been accidentally clicked, therefore we do not close the tab.
          if (event.detail > 1)
            return;

          tabbedBrowser.removeTabByNode(this);
          tabbedBrowser._blockDblClick = true;
          let tabContainer = tabbedBrowser.tabContainer;

          // XXXmano hack (see bug 343628):
          // Since we're removing the event target, if the user
          // double-clicks this button, the dblclick event will be dispatched
          // with the tabbar as its event target (and explicit/originalTarget),
          // which treats that as a mouse gesture for opening a new tab.
          // In this context, we're manually blocking the dblclick event
          // (see onTabBarDblClick).
          let clickedOnce = false;
          let enableDblClick = function enableDblClick(event) {
            let target = event.originalTarget;
            if (target.className == "tab-close-button")
              target._ignoredClick = true;
            if (!clickedOnce) {
              clickedOnce = true;
              return;
            }
            tabContainer._blockDblClick = false;
            tabContainer.removeEventListener("click", enableDblClick, true);
          };
          tabContainer.addEventListener("click", enableDblClick, true);
        } else { // "tabs"
          tabbedBrowser.removeCurrentTab();
        }
      });

      this.addEventListener("dblclick", (event) => {
        if (event.button != 0) {
          return;
        }

        // for the one-close-button case
        event.stopPropagation();
      }, true);
    }

    connectedCallback() {
      if (this.delayConnectedCallback()) {
        return;
      }
      super.connectedCallback();

      this.tabmail = document.getElementById("tabmail");

      this.arrowScrollboxWidth = 0;

      this.arrowScrollbox = this.querySelector("arrowscrollbox");

      this.arrowScrollboxClosebutton = this.querySelector(".tabs-closebutton-box");

      this.mToolbar = document.getElementById(this.getAttribute("tabtoolbar"));

      this.mCollapseToolbar = document.getElementById(this.getAttribute("collapsetoolbar"));

      // @implements {nsIObserver}
      this._prefObserver = (subject, topic, data) => {
        if (topic == "nsPref:changed") {
          subject.QueryInterface(Ci.nsIPrefBranch);
          switch (data) {
            case "mail.tabs.closeButtons":
              this.mCloseButtons = subject.getIntPref("mail.tabs.closeButtons");
              this._updateCloseButtons();
              break;
            case "mail.tabs.autoHide":
              this.mAutoHide = subject.getBoolPref("mail.tabs.autoHide");
              break;
          }
        }
      };

      this._tabDropIndicator = this.querySelector(".tab-drop-indicator");

      this._dragOverDelay = 350;

      this._dragTime = 0;

      this.mTabMinWidth = 100;

      this.mTabMaxWidth = 250;

      this.mTabClipWidth = 140;

      this.mCloseButtons = 1;

      this._mAutoHide = false;

      this.mAllTabsButton = document.getElementById(this.getAttribute("alltabsbutton"));
      this.mAllTabsPopup = this.mAllTabsButton.menu;

      // this.mAllTabsBoxAnimate = document.getAnonymousElementByAttribute(this,
      //  "anonid",
      //  "alltabs-box-animate");
      // TODO ^^^ alltabs-box-animate seems to be dead code. remove all refs?

      this.mDownBoxAnimate = this.arrowScrollbox._scrollButtonDownBoxAnimate;

      this._animateTimer = null;

      this._animateStep = -1;

      this._animateDelay = 25;

      this._animatePercents = [1.00, 0.85, 0.80, 0.75, 0.71, 0.68, 0.65, 0.62, 0.59, 0.57,
        0.54, 0.52, 0.50, 0.47, 0.45, 0.44, 0.42, 0.40, 0.38, 0.37,
        0.35, 0.34, 0.32, 0.31, 0.30, 0.29, 0.28, 0.27, 0.26, 0.25,
        0.24, 0.23, 0.23, 0.22, 0.22, 0.21, 0.21, 0.21, 0.20, 0.20,
        0.20, 0.20, 0.20, 0.20, 0.20, 0.20, 0.19, 0.19, 0.19, 0.18,
        0.18, 0.17, 0.17, 0.16, 0.15, 0.14, 0.13, 0.11, 0.09, 0.06,
      ];

      this.mTabMinWidth = Services.prefs.getIntPref("mail.tabs.tabMinWidth");
      this.mTabMaxWidth = Services.prefs.getIntPref("mail.tabs.tabMaxWidth");
      this.mTabClipWidth = Services.prefs.getIntPref("mail.tabs.tabClipWidth");
      this.mCloseButtons = Services.prefs.getIntPref("mail.tabs.closeButtons");
      this.mAutoHide = Services.prefs.getBoolPref("mail.tabs.autoHide");

      if (this.mAutoHide)
        this.mCollapseToolbar.collapsed = true;

      this.arrowScrollbox.firstChild.minWidth = this.mTabMinWidth;
      this.arrowScrollbox.firstChild.maxWidth = this.mTabMaxWidth;
      this._updateCloseButtons();

      Services.prefs.addObserver("mail.tabs.", this._prefObserver);

      window.addEventListener("resize", this);

      // Listen to overflow/underflow events on the tabstrip,
      // we cannot put these as xbl handlers on the entire binding because
      // they would also get called for the all-tabs popup scrollbox.
      // Also, we can't rely on event.target because these are all
      // anonymous nodes.
      this.arrowScrollbox.addEventListener("overflow", this);
      this.arrowScrollbox.addEventListener("underflow", this);

      this.addEventListener("select", (event) => {
        this._handleTabSelect();

        if (!("updateCurrentTab" in this.tabmail) ||
          event.target.localName != "tabs")
          return;

        this.tabmail.updateCurrentTab();
      });

      this.addEventListener("TabSelect", (event) => { this._handleTabSelect(); });
    }

    get tabbox() {
      return document.getElementById("tabmail-tabbox");
    }

    // Accessor for tabs.
    get allTabs() {
      if (!this.arrowScrollbox) {
        return [];
      }

      return Array.from(this.arrowScrollbox.children);
    }

    appendChild(tab) {
      return this.insertBefore(tab, null);
    }

    insertBefore(tab, node) {
      if (!this.arrowScrollbox) {
        return;
      }

      if (node == null) {
        this.arrowScrollbox.appendChild(tab);
        return;
      }

      this.arrowScrollbox.insertBefore(tab, node);
    }

    set mAutoHide(val) {
      if (val != this._mAutoHide) {
        if (this.allTabs.length == 1)
          this.mCollapseToolbar.collapsed = val;
        this._mAutoHide = val;
      }
      return val;
    }

    get mAutoHide() {
      return this._mAutoHide;
    }

    set selectedIndex(val) {
      let tab = this.getItemAtIndex(val);
      let alreadySelected = tab && tab.selected;

      this.__proto__.__proto__.__lookupSetter__("selectedIndex").call(this, val);

      if (!alreadySelected) {
        // Fire an onselect event for the tabs element.
        let event = document.createEvent("Events");
        event.initEvent("select", true, true);
        this.dispatchEvent(event);
      }

      return val;
    }

    get selectedIndex() {
      return this.__proto__.__proto__.__lookupGetter__("selectedIndex").call(this);
    }

    _updateCloseButtons() {
      // modes for tabstrip
      // 0 - activetab  = close button on active tab only
      // 1 - alltabs    = close buttons on all tabs
      // 2 - noclose    = no close buttons at all
      // 3 - closeatend = close button at the end of the tabstrip
      switch (this.mCloseButtons) {
        case 0:
          this.setAttribute("closebuttons", "activetab");
          break;
        case 1:
          let width = this.arrowScrollbox.firstChild.getBoundingClientRect().width;
          // 0 width is an invalid value and indicates
          // an item without display, so ignore.
          if (width > this.mTabClipWidth || width == 0)
            this.setAttribute("closebuttons", "alltabs");
          else
            this.setAttribute("closebuttons", "activetab");
          break;
        case 2:
        case 3:
          this.setAttribute("closebuttons", "noclose");
          break;
      }
      this.arrowScrollboxClosebutton.collapsed = this.mCloseButtons != 3;
    }

    _handleTabSelect() {
      this.arrowScrollbox.ensureElementIsVisible(this.selectedItem);
    }

    handleEvent(aEvent) {
      let alltabsButton = document.getElementById("alltabs-button");

      switch (aEvent.type) {
        case "overflow":
          this.arrowScrollbox.ensureElementIsVisible(this.selectedItem);

          // filter overflow events which were dispatched on nested scrollboxes
          if (aEvent.target != this.arrowScrollbox)
            return;

          // Ignore vertical events.
          if (aEvent.detail == 0)
            return;

          this.arrowScrollbox.removeAttribute("notoverflowing");
          alltabsButton.removeAttribute("hidden");
          break;
        case "underflow":
          // filter underflow events which were dispatched on nested scrollboxes
          if (aEvent.target != this.arrowScrollbox)
            return;

          // Ignore vertical events.
          if (aEvent.detail == 0)
            return;

          this.arrowScrollbox.setAttribute("notoverflowing", "true");
          alltabsButton.setAttribute("hidden", "true");
          break;
        case "resize":
          let width = this.arrowScrollbox.getBoundingClientRect().width;
          if (width != this.arrowScrollboxWidth) {
            this._updateCloseButtons();
            // XXX without this line the tab bar won't budge
            this.arrowScrollbox.scrollByPixels(1);
            this._handleTabSelect();
            this.arrowScrollboxWidth = width;
          }
          break;
      }
    }

    _stopAnimation() {
      if (this._animateStep != -1) {
        if (this._animateTimer)
          this._animateTimer.cancel();

        this._animateStep = -1;
        this.mAllTabsBoxAnimate.style.opacity = 0.0;
        this.mDownBoxAnimate.style.opacity = 0.0;
      }
    }

    _notifyBackgroundTab(aTab) {
      let tsbo = this.arrowScrollbox;
      let tsboStart = tsbo.screenX;
      let tsboEnd = tsboStart + tsbo.getBoundingClientRect().width;

      let ctboStart = aTab.screenX;
      let ctboEnd = ctboStart + aTab.getBoundingClientRect().width;

      // only start the flash timer if the new tab (which was loaded in
      // the background) is not completely visible
      if (tsboStart > ctboStart || ctboEnd > tsboEnd) {
        this._animateStep = 0;

        if (!this._animateTimer)
          this._animateTimer =
          Cc["@mozilla.org/timer;1"]
          .createInstance(Ci.nsITimer);
        else
          this._animateTimer.cancel();

        this._animateTimer.initWithCallback(this,
          this._animateDelay,
          Ci.nsITimer.TYPE_REPEATING_SLACK);
      }
    }

    notify(aTimer) {
      if (!document)
        aTimer.cancel();

      let percent = this._animatePercents[this._animateStep];
      this.mAllTabsBoxAnimate.style.opacity = percent;
      this.mDownBoxAnimate.style.opacity = percent;

      if (this._animateStep < (this._animatePercents.length - 1))
        this._animateStep++;
      else
        this._stopAnimation();
    }

    _getDragTargetTab(event) {
      let tab = event.target;
      while (tab && tab.localName != "tab") {
        tab = tab.parentNode;
      }

      if ((event.type != "drop") && (event.type != "dragover"))
        return tab;

      let tabRect = tab.getBoundingClientRect();
      if (event.screenX < tab.screenX + tabRect.width * .25)
        return null;

      if (event.screenX > tab.screenX + tabRect.width * .75)
        return null;

      return tab;
    }

    _getDropIndex(event) {
      let tabs = this.allTabs;

      if (window.getComputedStyle(this).direction == "ltr") {
        for (let i = 0; i < tabs.length; i++)
          if (event.screenX < (tabs[i].screenX + (tabs[i].getBoundingClientRect().width / 2)))
            return i;
      } else {
        for (let i = 0; i < tabs.length; i++)
          if (event.screenX > (tabs[i].screenX + (tabs[i].getBoundingClientRect().width / 2)))
            return i;
      }

      return tabs.length;
    }

    disconnectedCallback() {
      Services.prefs.removeObserver("mail.tabs.", this._prefObserver);

      // Release timer to avoid reference cycles.
      if (this._animateTimer) {
        this._animateTimer.cancel();
        this._animateTimer = null;
      }

      this.arrowScrollbox.removeEventListener("overflow", this);
      this.arrowScrollbox.removeEventListener("underflow", this);
    }
  }

  MozXULElement.implementCustomInterface(MozTabmailTabs, [Ci.nsITimerCallback]);
  customElements.define("tabmail-tabs", MozTabmailTabs, { extends: "tabs" });
}
