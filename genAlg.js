//scan in written portion

var math = require('mathjs');
/*2. Ranking using Genetic Algorithm
	You are requested to build a ranking system for a sport tournament using Genetic Algorithm. First of all, we have data like this
		P(a>b) = 0.92
		P(b>c) = 0.73
		P(c>d) = 0.88
		P(b>d) = 0.26
		etc.
Let’s interpret a, b, c, d as names of football teams and P(x>y) is the probability that x wins over y.
	For a certain ranking, the probability of the ranking is evaluated by the ranking probability. For example, if there are four teams, 
	P(abcd) = P(a>b)P(b>c)P(c>d) and
	P(bacd) = (1-P(a>b))P(a>c)P(c>d)
	The most reasonable ranking is the one yielding maximum probability.

Task 1. (Genetic Algorithm Design) (20 pts) 
Design a genetic algorithm to obtain an optimal ranking. Specify your setup of the genetic algorithm, including the fitness function, 
mutation operator, and crossover operator.
*/
//initialize
function Gene(leng) { // this algorithm will be turned into a Jags ranking algorithm
    var result = [];
    for (var i = 0; i < leng; i++) {
        var checker = true;
        var newb;
        if (i !== 0)
            while (checker) {
                newb = math.floor(math.random() * leng);
                checker = false;
                for (var q = i - 1; q > 0; q--) {
                    if (newb === result[q]) checker = true;
                }
            }
        else result.push(math.floor(math.random() * leng));
        result.push(newb);
    }
    //console.log(result.toString());
    this.geneLength = leng;
    this.teamnum = leng;
    this.gstring = result; //hahahah
    this.fit = this.fitness();
}

Gene.prototype.mutate = function(mutationchance) {
    if (mutationchance === undefined) { //mutation chance auto-selects 10%
        mutationchance = 0.1;
    }
    for (var i = 0; i < this.gstring.length; i++) {
        if (math.random() < mutationchance) {
            var newval = math.floor(math.random() * this.teamnum);
            while (this.gstring[i] === newval) {
                newval = math.floor(math.random() * this.teamnum);
            }
            for (var q = 0; q < this.teamnum; q++) {
                if (this.gstring[q] === newval) this.gstring[q] === this.gstring[i];
            }
            this.gstring[i] = newval; //this.gstring(0, i) + newval.toString() + this.gstring(i + 1);
        }
    }
};


Gene.prototype.cross = function(gene) {
    var swappoint = math.floor(math.random() * this.gstring.length);
    var child = [];
    for (var i = 0; i < swappoint; i++) {
        child.push(this.gstring[i]);
        this.gstring[i] = gene[i];
    }
    for (i = swappoint + 1; i < gene.length; i++) {
        child.push(gene[i]);
    }
    return child;
};

// fitness ex : ln(P(a>b)+ln(P(b>c))
Gene.prototype.fitness = function() { //converts gene fitness into an int for easy comparison
    var newb = 1;
    for (var i = 0; i < this.gstring.length - 1; i++) {
        if (rules[this.gstring[i]][this.gstring[i + 1]] !== "----") {
            newb = newb * math.log(rules[this.gstring[i]][this.gstring[i + 1]]);
        }
        else newb = newb * math.log(rules[this.gstring[i + 1]][this.gstring[i]]);
    }
    return newb;
};

//-----------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------

function Population(Probabilities, Cross, teamamount, popTotal) {
    this.genes = [];
    this.CR = Cross;
    this.rules = Probabilities;

    for (var i = 0; i < popTotal; i++) {
        this.genes.push(new Gene(teamamount));
    }
}

Population.prototype.sort = function() {
    for (var i = 0; i < this.genes.length; i++) {
        for (var j = i; j < this.genes.length; j++) {
            if (this.genes[i].fitness() > this.genes[j].fitness()) {
                var temp = this.genes[i];
                this.genes[i] = this.genes[j];
                this.genes[j] = temp;
            }
        }
    }
};


Population.prototype.runAround = function() { //WHYYYY you wanna give me tha run arouuund

    //apply fitness proportion selection
    this.sort();

    var fitness = [];
    var counter = 0;
    for (var i = 0; i < this.genes.length; i++) {
        fitness.push(this.genes[i].fitness());
        counter += this.genes[i].fitness();
    }

    for (var i = 0; i < this.genes.length; i++) {
        if (i === 0) {
            fitness[i] = fitness[i] / counter;
        }
        else {
            fitness[i] = (fitness[i] / counter) + fitness[i - 1];
        }
    }
    //match for crossover
    var crossOverMatch = [];
    var whoIsLucky = 0;
    for (var i = 0; i < this.genes.length; i++) {
        whoIsLucky = math.random();
        for (var j = 0; j < fitness.length; j++) {
            if (whoIsLucky < fitness[j] && (j === 0 || (whoIsLucky > fitness[j - 1]))) {
                crossOverMatch.push(j);
            }
        }
    }
    console.log(crossOverMatch.toString());
    // perform crossover
    for (var i = 0; i < fitness.length; i++) {
        if (math.random() < this.CR) {
            this.genes[crossOverMatch[i]].gstring = this.genes[i].cross(this.genes[crossOverMatch[i]].gstring);
        }
    }

    // mutate
    for (var i = 0; i < this.genes.length; i++) {
        this.genes[i].mutate();
    }
};

Population.prototype.run = function() {
    console.log("Let's play a game of football...");
    for (var runAmount = 0; runAmount < 1000; runAmount++) {
        this.sort();
        console.log("Season #" + runAmount);
        console.log("Current Prediction: " + this.genes[0].name);
        this.runAround();
    }
};

/*
Task 2. (Implementation) (20 pts)
Implement your genetic algorithm given the following ranking probability matrix (rankingmatrix.txt). Provide the optimal solution 
you obtain. (Hint: Multiplication of probabilities many times may lead to an extremely small value. Apply logarithm to the probability 
may solve this problem).
*/

/*------------------------------------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------*/

var rules = [];
var names = [];
var dataToParse = "";
//read in text
// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}
// Read the file and print its contents.
var fs = require('fs'),
    filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + filename);
    dataToParse = data;


    ///parse text

    dataToParse = dataToParse.split("\n");
    for (var i = 1; i < dataToParse.length; i++) {
        var temp = dataToParse[i].split(" ");
        var newRow = [];
        names.push(temp[0]);
        for (var j = 1; j < temp.length; j++) {
            newRow.push(temp[j]);
        }
        rules.push(newRow);
    }

    var crossoverchance = 0.5;
    //Probabilities, Cross, stringlength, teamamount, popTotal
    var letsPlayAGame = new Population(rules, crossoverchance, (rules.length * 4), rules.length, 20);
    letsPlayAGame.run();

});
