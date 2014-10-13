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
function Gene(leng, teamamount) {// this algorithm will be turned into a Jags ranking algorithm
    var geneLength = leng;
    var name = "";
    var fit = this.fitness();
    var teamnum = teamamount;
    var gstring = this.init(teamamount); //hahahah
}

Gene.prototype.init = function(numbOfTeams) { //initialize gene as a random 10-digit binary number
    var result = "";
    for (var i = 0; i < this.geneLength; i++) {
        result.concat((math.random() % numbOfTeams).toString)
    return result;
};


Gene.prototype.mutate = function(mutationchance) {
    if (mutationchance === undefined) { //mutation chance auto-selects 10%
        mutationchance = 0.1;
    }
    for (var i = 0; i < this.gstring.length; i++) {
        if (math.random() < mutationchance) {
            var newval = (math.random() % this.teamnum);
            while(this.gstring.charAt(i) === newval.toString()) {
                newval = (math.random() % this.teamnum);
            }
            this.gstring = this.gstring(0, i) + newval.toString() + this.gstring(i + 1);
        }
    }
};


Gene.prototype.cross = function(gene) {
    var swappoint = math.floor(math.random() * this.gstring.length);

    var child1 = this.gstring.substr(0, swappoint) + gene.gstring.substr(swappoint);
    var child2 = gene.gstring.substr(0, swappoint) + this.gstring.substr(swappoint);

    return [child1, child2];
};

// fitness ex : ln(P(a>b)+ln(P(b>c))
Gene.prototype.fitness = function() { //converts gene fitness into an int for easy comparison
    var result = 0;
    var possibilities = [];
    for (var i = 0; i < this.gstring.length - this.teamnum; i++) {
        var temp = "";
        var checker = true;
        for(var j = 0; j < this.teamnum; j++) {
            temp.concat(this.gstring.charAt(i+j));
        }
        for(var q = 1; q < temp.length; q++) {
            for(var p = q - 1; p >= 0; p--) {
                if(temp.charAt(q) === temp.charAt(p)) {
                    checker = false;
                }
            }
        }
        if(checker) possibilities.push(temp);
    }
    
    for(var m = 0; m < possibilities.length; m++) {
        var newb = this.rankPercentage(possibilities[m]);
        if(result === 0 || newb < result) {
            result = newb;
            this.name = possibilities[m];
        }
    }
    return result;
};

//-----------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------

function Population(Probabilities, Cross, stringlength, teamamount, popTotal) {
    var genes = [];
    var CR = Cross;
    var rules = Probabilities;
    
    for(var i = 0; i < popTotal; i++) {
        genes.push(new Gene(stringlength, teamamount));
    }
}

Population.prototype.rankPercentage = function(teams) {
    var result = 1;
    for (var i = 0; i < teams.length - 2; i++) {
        result = result * math.log(this.rules[i][i + 1]);
    }
    return result;
}

Population.prototype.sort = function() {
    for(var i = 0; i < this.genes.length; i++) {
        for(var j = i; j < this.genes.length; j++) {
            if(this.genes[i].fitness() > this.genes[j].fitness()) {
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
    for(var i = 0; i < this.genes.length; i++) {
        fitness.push(this.genes[i].fitness);
        counter += this.genes[i].fitness;
    }
    for(var i = 0; i < this.genes.length; i++) {
        if(i === 0) {
            fitness[i] = fitness[i] / counter;
        } else {
            fitness[i] = (fitness[i] / counter) + fitness[i - 1];
        }
    }
    
    //match for crossover
    var crossOverMatch = [];
    var whoIsLucky = 0;
    for(var i = 0; i < this.genes.length; i++) {
        whoIsLucky = math.random();
        for(var j = 0; j < fitness.length; j++) {
            if(whoIsLucky < fitness[j] && (j === 0 || (whoIsLucky > fitness[j - 1]))) {
                crossOverMatch.push(j);
            }
        }
    }
    
    // perform crossover
    for(var i = 0; i < fitness.length; i++) {
        if(math.random() < this.CR) {
            var newbees = this.genes[i].cross(this.genes[crossOverMatch[i]]);
            this.genes[i].gstring = newbees[0].gstring;
            this.genes[crossOverMatch[i]].gstring = newbees[1].gstring;
        }
    }
    
    // mutate
    for(var i = 0; i < this.genes.length; i++) {
        this.genes[i].mutate();
    }
};

Population.prototype.run = function() {
    console.log("Let's play a game of football...");
    for(var runAmount = 0; runAmount < 1000; runAmount++) {
        this.sort();
        console.log("Season #" + runAmount);
        console.log("Current Prediction: " + this.genes[0].name);
        this.runAround();
    }
};
 
 
/*------------------------------------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------*/

var rules = [];
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
});

///parse text
for(var i = 0; i < dataToParse.length; i++) {
    if(dataToParse[i] === "P")
}

var crossoverchance = 0.5;
//Probabilities, Cross, stringlength, teamamount, popTotal
var letsPlayAGame = Population(rules, crossoverchance, 10, 4, 20);
Population.run();

///store data

/*
Task 2. (Implementation) (20 pts)
Implement your genetic algorithm given the following ranking probability matrix (rankingmatrix.txt). Provide the optimal solution 
you obtain. (Hint: Multiplication of probabilities many times may lead to an extremely small value. Apply logarithm to the probability 
may solve this problem).
*/
//Genetic algorithm
///Encoding principles  (gene, chromosome)
///Initialization procedure (creation)
///Selection of parents  (reproduction)
///Genetic operators (mutation, crossover)
///Evaluation function (fitness to environment)
///Termination condition

//output
