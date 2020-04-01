var App = function() {
'use strict';

    var canvas, con2d;
    var delay = 100;
    var domain = [{ start:-30, end:30 }];

    // Evaluator
    var config = new (function() {
        this.update = update;
        this.run = run;
        this.processNoise = 3.0;
    });

    var evaluator = null;
    var filter = null;
    var yscale = 30.0;

    var nSamples = 250;
    var timeoutId = null;
    var running = false;

    setup();

    function setup() {
        canvas = document.getElementById('pf');
        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight - 25;
        con2d = canvas.getContext('2d');

        evaluator = new Evaluator();
        filter = new ParticleFilter(evaluator);

        var gui = new dat.GUI({width:280});
        gui.add(config, 'update').name('Update');
        gui.add(config, 'run').name('Run');

        var filterFolder = gui.addFolder('Filter');
        filterFolder.add(filter, 'useWeightRatio').name('Use Weight Ratio');
        filterFolder.add(filter, 'recalculateWeightAfterDrift').name('Re-eval after Noise');

        var evaluatorFolder = gui.addFolder('Evaluator');
        evaluatorFolder.add(evaluator, 'func')
            .options({'function 0':0, 'function 1':1, 'function 2':2, 'function 3':3 })
            .name('Strength Function')
            .onChange(repaint);
        evaluatorFolder.add(evaluator, 'mu', -10, 10).name('&mu;').onChange(repaint);
        evaluatorFolder.add(evaluator, 'sigma', 0.5, 60.0, 0.5).name('&sigma;').onChange(repaint);
        evaluatorFolder.add(evaluator, 'noise', 0.0, 1.0, 0.01).onChange(repaint);

        gui.add(filter, 'nextParticleCount', 1, 2000)
        gui.add(config, 'processNoise', 0.0, 10.0, 0.1)

        for (var i = 0; i < filter.nextParticleCount; i++) {
            var x = (domain[0].end - domain[0].start) * (Math.random() - 0.5)
            filter.addParticle(new Particle(x));
        }

        repaint();
    }

    function repaint(){
        drawFunction();
        drawFilter();
    }

    function drawLine(x1, y1, x2, y2) {
        var rap = canvas.width / (domain[0].end - domain[0].start);
        var cy = canvas.height / 2;
        var ax = canvas.width / nSamples;
        var x1 = (x1 - domain[0].start) * rap;
        var y1 = cy - y1 * ax * yscale;
        var x2 = (x2 - domain[0].start) * rap;
        var y2 = cy - y2 * ax * yscale;

        con2d.moveTo(x1, y1);
        con2d.lineTo(x2, y2);
    }

    function drawCircle(x, y) {
        var rap = canvas.width / (domain[0].end - domain[0].start);
        var cy = canvas.height / 2;
        var ax = canvas.width / nSamples;
        var x1 = (x - domain[0].start) * rap;
        var y1 = cy - y * ax * yscale;

        con2d.beginPath();
        con2d.arc(x1, y1, 5, 0, Math.PI*2, true);
        con2d.closePath();
        con2d.stroke();
    }

    function drawFunction() {
        con2d.fillStyle = '#FFF';
        con2d.fillRect(0, 0, canvas.width, canvas.height);
        
        con2d.strokeStyle = '#888';
        con2d.lineWidth = 2.2;
         
        con2d.beginPath();
        var lastx, lasty;
        for (var x=domain[0].start; x<domain[0].end; x+=(domain[0].end-domain[0].start)/nSamples) {
            var p = new Particle(x);
            var y = evaluator.evaluate(p);
            if (typeof(lasty) !== 'undefined') drawLine(lastx, lasty, x, y);
            lastx = x; lasty = y;
        }
        con2d.stroke();
    }

    function drawFilter(){
        var histo = new Histogram();
        for (var i=0; i<filter.getParticleCount(); i++){
            var value = Math.round(filter.get(i).x);
            histo.addEvidence(value);
        }

        var maxCount = histo.getMaxCount();
        if (maxCount > 0){
            //var width = histo.getBinWidth();
            con2d.lineWidth = 1;        
            con2d.strokeStyle = 'blue';
            con2d.fillStyle = 'cyan';
            con2d.beginPath();
            for (var i=0; i<histo.getNumberOfBins(); i++){
                drawCircle(histo.getBinLower(i), histo.getBinCount(i)/maxCount);
                //Rectangle2D.Double rect = new Rectangle2D.Double(lower, 0, width, 10.0*histo.getBinCount(i)/maxCount);
            }
            con2d.stroke();
        }
    }

    function update(){
        filter.evaluateStrength();
        filter.resample(); // TODO: add a condition to vary particle count
        filter.disperseDistribution(config.processNoise); // TODO: build a dispersion model?

        drawFunction();
        drawFilter();
    }

    function theGreatLoop(){
        if (running){
            update();
            timeoutId = setTimeout(theGreatLoop,delay);
        }
    }

    function run(){
        if (!running){
            running = true;
            theGreatLoop();
        }else{
            if (timeoutId !== null){
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            running = false;
        }
    }
};

window.addEventListener('load', function(){
    var app = new App();
});
