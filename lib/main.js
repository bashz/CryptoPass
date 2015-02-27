var self = require("sdk/self");
var Request = require("sdk/request").Request;
var preferences = require("sdk/simple-prefs").prefs;
var ss = require("sdk/simple-storage");
var { setInterval } = require("sdk/timers");
var { ToggleButton } = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");

Notification = function (id, title) {
    this.id = id;
    this.title = title;
    this.description = null;
};

var notifications = new Array();

var button = ToggleButton({
    id: "mainButton",
    label: "RTnotifier",
    icon: {
        "16": "./icon/favicon_16.png",
        "32": "./icon/favicon32.png"
    },
    onChange: Changed,
    badge: 0,
    badgeColor: "#666666"
});

var panel = panels.Panel({
    contentURL: self.data.url("panel.html"),
    contentScriptFile: self.data.url("js/panel.js"),
    onHide: Hide
});

function Changed(state) {
    if (state.checked) {
        button.badge = 0;
        button.badgeColor = "#666666";
        panel.show({
            position: button
        });
    }
}
function Hide() {
    button.state('window', {checked: false});
}

Date.prototype.getFullMonth = function () {
    if (this.getMonth() <= 10) {
        return "0" + (this.getMonth() + 1);
    } else {
        return this.getMonth() + 1;
    }
};
Date.prototype.getFullDay = function () {
    if (this.getDate() < 10) {
        return "0" + this.getDate();
    } else {
        return this.getDate();
    }
};
Date.prototype.getFullHours = function () {
    if (this.getHours() < 10) {
        return "0" + this.getHours();
    } else {
        return this.getHours();
    }
};
Date.prototype.getFullMinutes = function () {
    if (this.getMinutes() < 10) {
        return "0" + this.getMinutes();
    } else {
        return this.getMinutes();
    }
};
Date.prototype.getFullSeconds = function () {
    if (this.getSeconds() < 10) {
        return "0" + this.getSeconds();
    } else {
        return this.getSeconds();
    }
};
function formatedDate() {
    var now = new Date(new Date().getTime() + parseInt(preferences.timezone) * 3600000);
    return now.getFullYear() + "-" +
            now.getFullMonth() + "-" +
            now.getFullDay() + " " +
            now.getFullHours() + ":" +
            now.getFullMinutes() + ":" +
            now.getFullSeconds();
}
//function formatRTenDate(month, date) {
//    var monthsName = {"Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06", "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"};
//    var matchs = date.match(/(\d+) ([\d:]+) (\d{4})/);
//    return matchs[3] + "-" + monthsName[month] + "-" + matchs[1] + " " + matchs[2];
//}
if (!ss.storage.last)
    ss.storage.last = formatedDate();

var current;

setInterval(function () {
    Request({
        url: preferences.instance + "/REST/1.0/search/ticket?query=Updated>%27" + ss.storage.last + "%27&orderby=+Created",
        headers: {Referer: preferences.instance},
        onComplete: function (response) {
            if (response) {
                console.log(ss.storage.last);
                var lines = response.text.split("\n");
                for (var i = 0; i < lines.length; i++) {
                    match = lines[i].match(/^(\d+): (.*)$/);
                    if (match && match[0]) {
                        ss.storage.last = formatedDate();
                        notifications.push(new Notification(match[1], match[2]));
                    }
                }

            } else {
                console.log("Request Tracker Unreachable !");
            }
        }
    }).get();
    if(!current){
        if (current = notifications.shift()) {
            Request({
                url: preferences.instance + "/REST/1.0/ticket/" + current.id + "/history?format=l",
                headers: {Referer: preferences.instance, "Accept-Language": "en-US"},
                onComplete: function (response) {
                    if (response) {
                        var blocks = response.text.split("--");
                        var lines = blocks[blocks.length - 1].split("\n");
                        for (var i = 0; i < lines.length; i++) {
                            match = lines[i].match(/^Description: (.*)$/);
                            if (match && match[0]) {
                                current.description = match[1];
                            }
                        }
                    }
                }
            }).get();
        }
    }
    if (current && current.description) {
        button.badgeColor = "#b03020";
        button.badge++;
        panel.port.emit("buildNotification", current, preferences.instance);
        current = null;
    }
}, preferences.interval * 1000);