var Evaluator = function(){
    this.mu = 0;
    this.sigma = 20.0;
    this.noise = 0.01;
    this.func = 0;

    this.evaluate = evaluate;

    function evaluate(p){
        var x = p.x;
        var error = Math.random() * this.noise;
        var result = 0;
        switch(+this.func) {
        case 0: result = gaussian(x, this.mu, this.sigma); break;
        case 1: result = Math.max(gaussian(x, this.mu, this.sigma), gaussian(x, -this.mu, this.sigma)); break;
        case 2: result = Math.max(gaussian(x, this.mu, this.sigma), 0.9*gaussian(x, -this.mu, this.sigma)); break;
        case 3: result = Math.max((Math.abs(this.mu-x) < this.sigma/5) ? 1 : 0, (Math.abs(-this.mu-x) < this.sigma/5) ? 0.5 : 0); break;
        }
        return result + error; 
    }
    
    function gaussian(x, mu, sigma) {
        var d2 = (x - mu) * (x - mu);
        return Math.exp(-d2 / sigma);
    }
};
