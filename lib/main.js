var Request = require("sdk/request").Request;
var preferences = require("sdk/simple-prefs").prefs;
var ss = require("sdk/simple-storage");
var { setInterval } = require("sdk/timers");

if (!ss.storage.last)
    ss.storage.last = new Date();

setInterval(function () {
    Request({
        url: preferences.instance + "/REST/1.0/search/ticket?query=Updated>%27" + ss.storage.last + "%27&orderby=+Created",
        headers: {Referer: preferences.instance},
        onComplete: function (response) {
            if (response) {
                var lines = response.text.split("\n");
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].match(/^(\d+): (.*)$/g)) {
                        ss.storage.last = new Date();
                    }
                }
            } else {
                console.log("Request Tracker Unreachable !");
            }
        }
    }).get();
}, preferences.interval * 1000);