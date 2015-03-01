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

var current = null;
var notifications = new Array();
if (preferences.interval < 30)
    preferences.interval = 30;

var button = ToggleButton({
    id: "mainButton",
    label: "Reuqest Tracker Tracker",
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

function formatRTenDate(month, date) {
    var monthsName = {"Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06", "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"};
    var matchs = date.match(/(\d+) ([\d:]+) (\d{4})/);
    return matchs[3] + "-" + monthsName[month] + "-" + matchs[1] + " " + matchs[2];
}

var check = setInterval(function () {
    if (!ss.storage.last) {
        Request({
            url: preferences.instance + "/REST/1.0/search/ticket?query=Updated>%272015-02-22%27&orderby=+LastUpdated&format=l",
            headers: {Referer: preferences.instance, "Accept-Language": "en-US"},
            onComplete: function (response) {
                if(response.text){
                    if(response.text.match(/401 Credentials required/)){
                        button.badgeColor = "#b03020";
                        button.badge = '?';
                        panel.port.emit("error", "You are not logged into Request Tracker, Please ", "login.", preferences.instance);
                    }else{
                        var blocks = response.text.split("--");
                        var lines = blocks[blocks.length - 1].split("\n");
                        for (var i = 0; i < lines.length; i++) {
                            match = lines[i].match(/^LastUpdated: \w+ (\w{3}) (.*)$/);
                            if (match) {
                                ss.storage.last = formatRTenDate(match[1], match[2]);
                            }
                        }
                    }
                } else {
                    button.badgeColor = "#b03020";
                    button.badge = '!';
                    panel.port.emit("error", "Request Tracker is unavailable, please provide the right request URL ","on the add-on setting.", "about:addons");
                }
            }
        }).get();
    } else {
        Request({
            url: preferences.instance + "/REST/1.0/search/ticket?query=Updated>%27" + ss.storage.last + "%27&orderby=+LastUpdated&format=l",
            headers: {Referer: preferences.instance, "Accept-Language": "en-US"},
            onComplete: function (response) {
                if(response.text){
                    if(response.text.match(/401 Credentials required/)){
                        button.badgeColor = "#b03020";
                        button.badge = '?';
                        panel.port.emit("error", "You are not logged into Request Tracker, Please ", "login.", preferences.instance);
                    }else{
                        var blocks = response.text.split("--");
                        var lines = blocks[blocks.length - 1].split("\n");
                        for (var i = 0; i < lines.length; i++) {
                            match = lines[i].match(/^LastUpdated: \w+ (\w{3}) (.*)$/);
                            if (match) {
                                ss.storage.last = formatRTenDate(match[1], match[2]);
                            }
                        }
                        for (var j = 0; j < blocks.length; j++) {
                            var id = null, title = null;
                            var lines = blocks[j].split("\n");
                            for (var i = 0; i < lines.length; i++) {
                                tMatch = lines[i].match(/^id: ticket\/(\d+)$/);
                                if (tMatch)
                                    id = tMatch[1];
                                sMatch = lines[i].match(/^Subject: (.*)$/);
                                if (sMatch)
                                    title = sMatch[1];
                            }
                            if (id && title) {
                                notifications.push(new Notification(id, title));
                            }
                        }
                    }
                } else {
                    button.badgeColor = "#b03020";
                    button.badge = '!';
                    panel.port.emit("error", "Request Tracker is unavailable, please provide the right request URL ","on the add-on setting.", "about:addons");
                }
            }
        }).get();
    }
}, preferences.interval * 1000);

var history = setInterval(function () {
    if (!current) {
        if (current = notifications.shift()) {
            Request({
                url: preferences.instance + "/REST/1.0/ticket/" + current.id + "/history?format=l",
                headers: {Referer: preferences.instance, "Accept-Language": "en-US"},
                onComplete: function (response) {
                    if(response.text){
                        if(response.text.match(/401 Credentials required/)){
                            button.badgeColor = "#b03020";
                            button.badge = '?';
                            panel.port.emit("error", "You are not logged into Request Tracker, Please ", "login.", preferences.instance);
                        }else{
                            var blocks = response.text.split("--");
                            var lines = blocks[blocks.length - 1].split("\n");
                            for (var i = 0; i < lines.length; i++) {
                                match = lines[i].match(/^Description: (.*)$/);
                                if (match && match[0]) {
                                    current.description = match[1];
                                }
                            }
                        }
                    } else {
                        button.badgeColor = "#b03020";
                        button.badge = '!';
                        panel.port.emit("error", "Request Tracker is unavailable, please provide the right request URL ","on the add-on setting.", "about:addons");
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