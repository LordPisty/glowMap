function initMap() {
    "use strict";
    var ctx = document.getElementById("pings").getContext("2d"),
        currentData = [],
        start = 0, total = 0, duration = 0, extra = 0;

    glow.map = {};
    glow.map.scale = 3000 / 1419;

    
    /* Shuffle the array in place. (Fisher-Yates) */
    var shuffle = function(xs) {
        var i = xs.length, j, tmp;
        if (i == 0) { return; }
        while (--i) {
            j = Math.floor(Math.random() * (i + 1));
            tmp = xs[j];
            xs[j] = xs[i];
            xs[i] = tmp;
        }
    };

    glow.map.preparePings = function(pings) {
        var rv = [];
        /* Add `count` [lat, long] pairs to newData, then shuffle the whole
         * thing. */
        var maxLat = 0, maxLon = 0, maxCount = 0;
        for (var j = 0, jj = pings.length; j < jj; j++) {
	    var ping = pings[j];
            var latitude = Math.round((parseFloat(ping[0]) + 180) *100)/100;
            var longitude = Math.round((90-parseFloat(ping[1])) *100)/100;
            var count = ping[2];
	    var colors = ping[3];
                if (count > maxCount) {
                    maxLat = ping[0];
                    maxLon = ping[1];
                    maxCount = count;
                }
            for (var k = 0; k < count; k++) {
                rv.push([0, latitude, longitude, colors]);
            }
        }
        glow.map.max = maxLon + "," + maxLat + " " + maxCount;

	return rv;
    };

    /* Each ping looks like [latitude, longitude, count]. It represents the
     * numbers of downloads in the timeframe from this location. */
    glow.map.playNext = function() {

 var response = glow.data.map.next,
            /* [date, total, [pings]] */
            data = response.data,
            newData = glow.map.preparePings(data[2]);

        shuffle(newData);
	shuffle(newData);

        /* Ping animations last 1 second so some are going to roll over. This
         * updates the time left to work with the reset timer and adds them to
         * the front of newData. */
        extra = Math.max(0, currentData.length - 1 - start);
        if (extra > 0) {
            for (var i = start, ii = currentData.length; i < ii; i++) {
                currentData[i][0] = currentData[i][0] - response.interval;
            }
            newData.unshift.apply(newData, currentData.slice(start));
        }

        /* Reset all the globals and kick off a new animation interval. */
        currentData = newData;
        start = 0;
        total = currentData.length;
        duration = response.interval * 1000;
        dbg('map total', total);

        glow.fetchMap(response.interval);
        vast.animate.over(response.interval * 1000, iteratePings, this,
                          {after: glow.map.playNext});
    };


    function iteratePings(t) {
        // t marks our progress through the interval from 0..1.
        if (start == total) {
            return;
        }
        /* We ignore the extra items when figuring out how many new pings to
         * play this iteration. The extra items get picked up as start moves
         * along. */
        var end = extra + (t * (total - extra)),
            currentAge = -1,
            progress = t * (duration / 1000),
            i, ping, age;

        // Clear out the canvas.
        for (i = start; i < end; i++) {
            ping = currentData[i];
            ctx.clearRect(Math.round(ping[1] * 10 * glow.map.scale * 100)/100 - 70, Math.round(ping[2] * 10 * glow.map.scale * 100)/100 - 70, 180, 180); 
        }

        for (i = start; i < end; i++) {
            ping = currentData[i];
            if (ping[0] == 0) {
                ping[0] = progress;
            } else {
                age = progress - ping[0];
                if (age > 10) {
                    // This ping has played out, don't come back to it.
                    start++;
                } else {
                    /* Setting fillStyle is expensive according to Chrome's
                     * profiler, so only set it if the fillStyle has
                     * changed. */
                    if (age != currentAge) {
                        /* Bound the alpha between 0.01 and .99 so JavaScript
                         * doesn't write scientific notation. */
                        ctx.fillStyle = "rgba(236,127,45, "+
                                        Math.max(.01, Math.min(.99, (1 - age/10))) + ")";
                        currentAge = age;
                    }
                    ctx.beginPath();
                    // Firefox 3.6 requires the anticlockwise argument.
		    ctx.arc(Math.round(ping[1] * 10 * glow.map.scale) * 100/100, Math.round(ping[2] * 10 * glow.map.scale) * 100/100,
                            (Math.log(age+0.1)-Math.log(0.1))/(Math.log(1.1)-Math.log(0.1))*10 , 0, Math.PI * 2, false);

		    ctx.fill();
                }
            }
        }
    }

    glow.map.showAll = function(data) {
        var ping;
        ctx.clearRect(0, 0, 3600, 1800);
        ctx.fillStyle = "rgba(255, 255, 255, .3)";
        dbg(data.length);
        for (var i = 0, ii = data.length; i < ii; i++) {
            ping = data[i];
            ctx.beginPath();
            // Firefox 3.6 requires the anticlockwise argument.
            ctx.arc((ping[1] * 10 * 3000 / 1419), (ping[2] * 10 * glow.map.scale),
                    1, 0, Math.PI * 2, false);
            ctx.fill();
        }
    };
}
