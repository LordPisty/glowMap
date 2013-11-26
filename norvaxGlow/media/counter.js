function initCounter() {
    "use strict";
    glow.count = {};

    	var elD = document.getElementById('dailycounter').firstChild;
	var elW = document.getElementById('weeklycounter').firstChild;
	var elM = document.getElementById('monthlycounter').firstChild;
	
    glow.count.playNext = function() {
        var response = glow.data.count.next,
            data = response.data;
        var targetD = data[3][1];
        var currentD = data[2][1];
		var deltaD = targetD - currentD;
		
        var targetW = data[5][1];
        var currentW = data[4][1];
		var deltaW = targetW - currentW;

        var targetM = data[7][1];
        var currentM = data[6][1];
		var deltaM = targetM - currentM;

        function drawCounter(i) {
			drawCounterD(i);
			drawCounterW(i);
			drawCounterM(i);
		}
		
        function drawCounterD(i) {
            elD.textContent = numberfmt(parseInt(currentD + i * deltaD));
        }

		function drawCounterW(i) {
            elW.textContent = numberfmt(parseInt(currentW + i * deltaW));
        }
		
		function drawCounterM(i) {
            elM.textContent = numberfmt(parseInt(currentM + i * deltaM));
        }
        vast.animate.over(response.interval * 1000, drawCounter, this,
                          {after: glow.count.playNext});
		
        glow.fetchCount(response.interval);
    };
}
