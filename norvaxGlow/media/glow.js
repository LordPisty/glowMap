(function(){
"use strict";

glow.data = {
    count: {},
    map: {},
    sector: {}
};

var ROOT = "../norvaxGlow/data/";
var adjustOffset = 248;
var targetHeight = 1650;

// Load the next file of json data before timeout seconds have elapsed.
glow.fetchCount = function(timeout) {
    // We don't request data.sector until the page flips, but
    // but we want to be ready with the right url.
    var sector = glow.data.count.next.next.replace('count', 'arc');
    getData(glow.data.count.next.next, timeout, function(r) {
        glow.data.count.next = r;
        glow.data.sector.next = sector;
    });
};

// Load the next file of json data before timeout seconds have elapsed.
glow.fetchMap = function(timeout) {
    getData(glow.data.map.next.next, timeout, function(r) {
        glow.data.map.next = r;
    });
};

// $.getJSON with an error parameter.
var getJSON = function(url, success, error) {
    $.ajax({url: ROOT + url, dataType: 'json',
            success: success, error: error});
};

// Reload the page if we couldn't fetch any data after a few retries. This
// drops us back into the loading screen with error messaging.
var fetchFailure = function() {
    window.location.reload();
};

// We have timeout seconds to pull the next chunk of data.
// Start by waiting timeout/2 seconds before the first attempt.
// If that fails, retry every 5 seconds until we run out of time.
var getData = function(url, timeout, success) {
    var error = setTimeout(fetchFailure, timeout * 1000),
        remaining = timeout / 2;

    var success_ = function(data, textStatus, xhr) {
        dbg('Success', url);
        clearTimeout(error);
        success(data, textStatus, xhr);
    };

    var fetch = function(timeout) {
        setTimeout(function() {
            getJSON(url, success_, function() {
                dbg('Error, retrying', url);
                if (!glow.stop) {
                    remaining -= 5;
                    fetch(5);
                }
            });
        }, timeout * 1000);
    };
    fetch(remaining);
};

function bindHistory() {
    $(window).bind("hashchange popstate", function() {
        glow.sector.zoomTo(location.hash.split("/").slice(1));
    });
}

function loading() {
    var c = $('#chart'),
        ctx = c[0].getContext('2d'),
        wedges = 8,
        cnt = 0;
    return setInterval(function(){
        ctx.save();
        ctx.fillStyle = 'rgba(227, 159, 28, .1)';
        ctx.translate(c[0].width / 2, c[0].height / 2);
        ctx.rotate(-Math.PI/16);
        ctx.clearRect(-70, -70, 140, 140);
        for (var i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            if (i == cnt) {
                ctx.save();
                ctx.shadowColor = 'rgba(227, 159, 28, .8)';
                ctx.shadowBlur = 5;
                ctx.fillStyle = 'rgb(227, 159, 28)';
                wedge();
                ctx.restore();
            } else {
                wedge();
            }
        }
        function wedge() {
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, Math.PI / 8, 0);
            ctx.arc(0, 0, 20, Math.PI / 8, 0, 1);
            ctx.lineTo(60, 0);
            ctx.stroke();
            ctx.fill();
        }
        cnt = ++cnt % 8;
        ctx.restore();
    }, 90);
}

function processGeo(_data, cb) {
    $.getScript("locale/" + glow.locale + "/countries.js", function() {
        dbg('loaded countries');
        $.getScript("media/regions.js", function() {
            dbg('loaded regions');
            cb.call(null, [null, _data[1], decodeGeo(_data[2], 1)]);
        });
    });
}

var _continents = {
    "EU": "Europe",
    "NA": "North America",
    "AS": "Asia",
    "SA": "South America",
    "AF": "Africa",
    "OC": "Oceania"
};
function decodeGeo(data, depth, parent) {
    if (!data) return;
    var i, name, row,
        ret = [], o;
    for (i=0; i < data.length; i++) {
        row = data[i];
        name = row[0] || "Other";
        switch (depth) {
            case 1:
                name = gettext(_continents[row[0]]) || name;
                break;
            case 2:
                name = _countries[row[0]] || name;
                break;
            case 3:
                if (_regions[parent]) {
                    name = _regions[parent][row[0]] || name;
                    row[0] = name;
                }
                name = _countries[name] || name;
                break;
            case 4:
                name = _countries[name] || name;
        }
        ret.push([name, row[1], decodeGeo(row[2], depth+1, row[0]), row[0]]);
    }
    return ret;
}

function pushState(loc, name) {
    dbg("pushState", loc);
    if (vast.capabilities.history) {
        history.pushState(loc, name, loc);
    } else {
        location.hash = loc;
    }
};


glow.init = function() {
    if (location.hash.slice(1, 9) == "timewarp") {
        $(document.body).addClass("timewarp");
        initCounter();
        initMap();
        loadMap(function(){});
        return;
    }

    glow.data.sector.next = glow.time + "/arc.json";
    $.getJSON(ROOT + "count"+starting_path, function(r) {
        glow.data.count.next = r;
        glow.count.playNext();
        
	$.getJSON(ROOT + starting_path, function(r) {
		glow.data.map.next = r;
		glow.map.playNext();
	});
    });

    initCounter();
    initMap();
};

var pad = function(x){
    return ("" + x).length == 1 ? "0" + x : x;
};

var path = function(date) {
    var d = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
             date.getUTCHours(), date.getUTCMinutes()];
    return ROOT + $.map(d, pad).join("/");
};


})();
