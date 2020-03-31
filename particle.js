var ParticleFilter = function(evaluator){
    var me = this;
    var particles = [];
    var selectionSum = []

    this.nextParticleCount = 500;
    this.useWeightRatio = false;
    this.recalculateWeightAfterDrift = false;
    
    this.addParticle = addParticle;
    this.getParticleCount = getParticleCount;
    this.get = get;
    this.evaluateStrength = evaluateStrength;
    this.resample = resample;
    this.disperseDistribution = disperseDistribution;
    
    function addParticle(p){
        particles.push(new ParticleWeight(p));
    }

    function getParticleCount(){
        return particles.length;
    }

    function get(i){
        return particles[i].data;
    }

    function evaluateStrength(){
        for (var i=0; i<particles.length; i++){
            var p = particles[i];
            var weight = evaluator.evaluate(p.data);
            if (p.lastWeight == 0)
                p.weightRatio = weight;
            else
                p.weightRatio = weight / p.lastWeight;
            p.weight = weight;
        }
    }

    function search(array, key){
        if (key > array[array.length]) return array.length;
        for (var i in array) if (key <= array[i]) return i;
    }

    function strengthComparator(arg0,arg1){
        var s0 = getSelectionWeight(arg0);
        var s1 = getSelectionWeight(arg1);
        return s0 - s1;
    }

    function prepareResampling(){
        particles.sort(strengthComparator);
        selectionSum = [];
        var sum = 0;
        for (var i = 0; i<particles.length; i++) {
            var p = particles[i];
            sum += getSelectionWeight(p);
            selectionSum.push(sum);
        }
        return sum;
    }

    function resample(){
        var sum = prepareResampling();
        var selectionDistribution = [];
        for (var i=0; i<particles.length; i++) selectionDistribution[i] = 0;

        var nextDistribution = [];
        for (var i=0; i<me.nextParticleCount; i++) {
            var sel = sum * Math.random();
            var index = search(selectionSum, sel); //Arrays.binarySearch(this.selectionSum, sel);
            var p = particles[index];
            var particleWeight = new ParticleWeight(p.data.clone(), p.weight, selectionDistribution[index]);
            nextDistribution.push(particleWeight);
            selectionDistribution[index]++;
        }
        particles = nextDistribution;
    }

    function disperseDistribution(spread){
        for (var i=0; i<particles.length; i++){
            var p = particles[i];
            // do not add error to one copy of the particle
            if (p.copyCount > 0){
                p.data.addNoise(spread);
                if (me.recalculateWeightAfterDrift){
                    // The weight ratio depends on small changes in strength after noise is added.
                    // The filter can be made more accurate by finding the exact strength of the new particle for the previous timestep.
                    p.lastWeight = evaluator.evaluate(p.data);
                }
            }
        }
    }
    
    function getSelectionWeight(p){
        return this.useWeightRatio ? p.weightRatio : p.weight;
    }
};

var ParticleWeight = function(p, lastWeight, copyCount){
    this.data = p;
    this.weight = 1.0;
    this.weightRatio = 1.0;
    this.lastWeight = 1.0;
    this.copyCount = 0;

    if (typeof(lastWeight) !== 'undefined')
        this.lastWeight = lastWeight;
    if (typeof(copyCount) !== 'undefined')
        this.copyCount = copyCount;
};

var Particle = function(x){
	this.x = x;
    this.haveNextNextGaussian = false;
    this.nextNextGaussian;

    this.clone = clone;
    this.addNoise = addNoise;

    function clone(){
        return new Particle(this.x);
    }

    // Knuth 3.4.1
    function nextGaussian(){
        if (this.haveNextNextGaussian){
            this.haveNextNextGaussian = false;
            return this.nextNextGaussian;
        }
        do{
            var v1 = 2*Math.random()-1;
            var v2 = 2*Math.random()-1;
            var s = v1*v1 + v2*v2;
        }while (s >= 1 || s == 0);
        var c = Math.sqrt(-2*Math.log(s)/s);
        this.nextNextGaussian = v2 * c;
        this.haveNextNextGaussian = true;
        return v1*c;
    }
	
	function addNoise(spread){
        var r = nextGaussian();
		this.x += spread*r;
	}
};
