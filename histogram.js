var Histogram = function(){
    var bins = {};

    this.addEvidence = addEvidence;
    this.getNumberOfBins = getNumberOfBins;
    this.getMaxCount = getMaxCount;
    this.getBinLower = getBinLower;
    this.getBinCount = getBinCount;

    function addEvidence(value){
        if (bins.hasOwnProperty(value))
            bins[value]++;
        else
            bins[value] = 1;
    }

    function getNumberOfBins(){
        var count = 0;
        for (var k in bins) count++;
        return count;
    }

    function getMaxCount(){
        getNumberOfBins();
        var maxCount = 0;
        for (var k in bins){
            if (maxCount <= bins[k]) maxCount = bins[k];
        }
        return maxCount;
    }

    function getBinLower(i){
        var index = 0;
        for (var k in bins) if (index++ == i) break;
        return k;
    }

    function getBinCount(i){
        var index = 0;
        for (var k in bins) if (index++ == i) break;
        return bins[k];
    }
};
