/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* globals currentView MozElements MozXULElement */

/* import-globals-from calendar-ui-utils.js */

"use strict";

// Wrap in a block to prevent leaking to window scope.
{
    const { cal } = ChromeUtils.import("resource://calendar/modules/calUtils.jsm");

    /**
     * Implements the Drag and Drop class for the Month Day Box view.
     *
     * @extends {MozElements.CalendarDnDContainer}
     */
    class CalendarMonthDayBox extends MozElements.CalendarDnDContainer {
        static get inheritedAttributes() {
            return {
                ".calendar-week-label": "relation,selected",
                ".calendar-day-label": "relation,selected,value",
            };
        }

        constructor() {
            super();
            this.addEventListener("mousedown", this.onMouseDown);
            this.addEventListener("dblclick", this.onDblClick);
            this.addEventListener("click", this.onClick);
            this.addEventListener("wheel", this.onWheel);
        }

        connectedCallback() {
            if (this.delayConnectedCallback() || this.hasConnected) {
                return;
            }
            // this.hasConnected is set to true in super.connectedCallback.
            super.connectedCallback();

            this.mDate = null;
            this.mItemHash = {};
            this.mShowMonthLabel = false;

            this.setAttribute("orient", "vertical");

            let monthDayLabels = document.createXULElement("hbox");
            monthDayLabels.style.overflow = "hidden";

            let weekLabel = document.createXULElement("label");
            weekLabel.setAttribute("data-label", "week");
            weekLabel.setAttribute("flex", "1");
            weekLabel.setAttribute("crop", "end");
            weekLabel.setAttribute("hidden", "true");
            weekLabel.setAttribute("mousethrough", "always");
            weekLabel.classList.add("calendar-month-day-box-week-label",
                "calendar-month-day-box-date-label",
                "calendar-week-label");

            let dayLabel = document.createXULElement("label");
            dayLabel.setAttribute("data-label", "day");
            dayLabel.setAttribute("flex", "1");
            dayLabel.setAttribute("mousethrough", "always");
            dayLabel.classList.add("calendar-month-day-box-date-label",
                "calendar-day-label");

            monthDayLabels.appendChild(weekLabel);
            monthDayLabels.appendChild(dayLabel);

            this.dayItems = document.createXULElement("vbox");
            this.dayItems.setAttribute("flex", "1");
            this.dayItems.classList.add("calendar-month-day-box-items-box",
                "calendar-day-items");

            this.appendChild(monthDayLabels);
            this.appendChild(this.dayItems);

            this.initializeAttributeInheritance();
        }

        get date() {
            return this.mDate;
        }

        set date(val) {
            this.setDate(val);
            return val;
        }

        get selected() {
            let sel = this.getAttribute("selected");
            if (sel && sel == "true") {
                return true;
            }

            return false;
        }

        set selected(val) {
            if (val) {
                this.setAttribute("selected", "true");
            } else {
                this.removeAttribute("selected");
            }
            return val;
        }

        get showMonthLabel() {
            return this.mShowMonthLabel;
        }

        set showMonthLabel(val) {
            if (this.mShowMonthLabel == val) {
                return val;
            }
            this.mShowMonthLabel = val;

            if (!this.mDate) {
                return val;
            }
            if (val) {
                this.setAttribute("value", cal.getDateFormatter()
                    .formatDateWithoutYear(this.mDate));
            } else {
                this.setAttribute("value", this.mDate.day);
            }
            return val;
        }

        setDate(aDate) {
            if (!aDate) {
                throw Cr.NS_ERROR_NULL_POINTER;
            }

            // Remove all the old events.
            this.mItemHash = {};
            removeChildren(this.dayItems);

            if (this.mDate && this.mDate.compare(aDate) == 0) {
                return;
            }

            this.mDate = aDate;

            // Set up DOM attributes for custom CSS coloring.
            let weekTitle = cal.getWeekInfoService().getWeekTitle(aDate);
            this.setAttribute("year", aDate.year);
            this.setAttribute("month", aDate.month + 1);
            this.setAttribute("week", weekTitle);
            this.setAttribute("day", aDate.day);

            if (this.mShowMonthLabel) {
                let monthName = cal.l10n.getDateFmtString(`month.${aDate.month + 1}.Mmm`);
                this.setAttribute("value", aDate.day + " " + monthName);
            } else {
                this.setAttribute("value", aDate.day);
            }
        }

        addItem(aItem) {
            if (aItem.hashId in this.mItemHash) {
                this.deleteItem(aItem);
            }

            let cssSafeId = cal.view.formatStringForCSSRule(aItem.calendar.id);
            let box = document.createXULElement("calendar-month-day-box-item");
            let context = this.getAttribute("item-context") ||
                this.getAttribute("context");
            box.setAttribute("context", context);
            box.style.setProperty("--item-backcolor", `var(--calendar-${cssSafeId}-backcolor)`);
            box.style.setProperty("--item-forecolor", `var(--calendar-${cssSafeId}-forecolor)`);

            cal.data.binaryInsertNode(this.dayItems, box, aItem, cal.view.compareItems, false);

            box.calendarView = this.calendarView;
            box.item = aItem;
            box.parentBox = this;
            box.occurrence = aItem;

            this.mItemHash[aItem.hashId] = box;
            return box;
        }

        selectItem(aItem) {
            if (aItem.hashId in this.mItemHash) {
                this.mItemHash[aItem.hashId].selected = true;
            }
        }

        unselectItem(aItem) {
            if (aItem.hashId in this.mItemHash) {
                this.mItemHash[aItem.hashId].selected = false;
            }
        }

        deleteItem(aItem) {
            if (aItem.hashId in this.mItemHash) {
                let node = this.mItemHash[aItem.hashId];
                node.remove();
                delete this.mItemHash[aItem.hashId];
            }
        }

        onDropItem(aItem) {
            // When item's timezone is different than the default one, the
            // item might get moved on a day different than the drop day.
            // Changing the drop day allows to compensate a possible difference.

            // Figure out if the timezones cause a days difference.
            let start = (aItem[cal.dtz.startDateProp(aItem)] ||
                aItem[cal.dtz.endDateProp(aItem)]).clone();
            let dayboxDate = this.mDate.clone();
            if (start.timezone != dayboxDate.timezone) {
                let startInDefaultTz = start.clone().getInTimezone(dayboxDate.timezone);
                start.isDate = true;
                startInDefaultTz.isDate = true;
                startInDefaultTz.timezone = start.timezone;
                let dayDiff = start.subtractDate(startInDefaultTz);
                // Change the day where to drop the item.
                dayboxDate.addDuration(dayDiff);
            }

            return cal.item.moveToDate(aItem, dayboxDate);
        }

        onMouseDown(event) {
            event.stopPropagation();
            if (this.mDate) {
                this.calendarView.selectedDay = this.mDate;
            }
        }

        onDblClick(event) {
            event.stopPropagation();
            this.calendarView.controller.createNewEvent();
        }

        onClick(event) {
            if (event.button != 0) {
                return;
            }

            if (!(event.ctrlKey || event.metaKey)) {
                this.calendarView.setSelectedItems(0, []);
            }
        }

        onWheel(event) {
            if (cal.view.getParentNodeOrThisByAttribute(event.originalTarget, "data-label", "day") == null) {
                if (this.dayItems.scrollHeight > this.dayItems.clientHeight) {
                    event.stopPropagation();
                }
            }
        }
    }
    customElements.define("calendar-month-day-box", CalendarMonthDayBox);
}
