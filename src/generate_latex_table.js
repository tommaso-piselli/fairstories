const fs = require('fs');
const { get } = require('http');

let experiments = ["cross", "fairCross", "focusCross", 
    "skewCross", "fairSkewCross", "focusSkewCross", 
    "crossWiggles", "fairCrossWiggles", "focusCrossWiggles", 
    "skewCrossWiggles", "fairSkewCrossWiggles", "focusSkewCrossWiggles"];

let topic = "jean5";

let coloring = "coloring3";

const timingdata = {
    "standard": {
        "animal_farm": {
            "coloring1": { "cross": 0.12, "skewcross": 0.26, "crosswiggles": 96, "skewcrosswiggles": 166.12 },
            "coloring2": { "cross": 0.13, "skewcross": 0.25, "crosswiggles": 71.48, "skewcrosswiggles": 149.81 },
            "coloring3": { "cross": 0.13, "skewcross": 0.24, "crosswiggles": 73.68, "skewcrosswiggles": 152.23 }
        },
        "anna3": {
            "coloring1": { "cross": 0.05, "skewcross": 0.05, "crosswiggles": 7.62, "skewcrosswiggles": 13.71 },
            "coloring2": { "cross": 0.05, "skewcross": 0.06, "crosswiggles": 10.09, "skewcrosswiggles": 11.46 },
            "coloring3": { "cross": 0.05, "skewcross": 0.06, "crosswiggles": 9.98, "skewcrosswiggles": 11.44 }
        },
        "dblp": {
            "coloring1": { "cross": 0.3, "skewcross": 0.35, "crosswiggles": 211.52, "skewcrosswiggles": 199.9 },
            "coloring2": { "cross": 0.29, "skewcross": 0.37, "crosswiggles": 210.13, "skewcrosswiggles": 199.99 },
            "coloring3": { "cross": 0.4, "skewcross": 0.45, "crosswiggles": 302.55, "skewcrosswiggles": 308.79 }
        },
        "ffvii": {
            "coloring1": { "cross": 1.23, "skewcross": 6.87, "crosswiggles": 1938.3, "skewcrosswiggles": 3363.66 },
            "coloring2": { "cross": 1.43, "skewcross": 8.82, "crosswiggles": 2461.65, "skewcrosswiggles": 3176.93 },
            "coloring3": { "cross": 1.47, "skewcross": 9.59, "crosswiggles": 3081.58, "skewcrosswiggles": 3324.34 }
        },
        "jean1": {
            "coloring1": { "cross": 0.41, "skewcross": 0.76, "crosswiggles": 185.12, "skewcrosswiggles": 399.27 },
            "coloring2": { "cross": 0.42, "skewcross": 0.89, "crosswiggles": 198.5, "skewcrosswiggles": 427.13 },
            "coloring3": { "cross": 0.42, "skewcross": 1.68, "crosswiggles": 237.82, "skewcrosswiggles": 496.11 }
        },
        "jean2": {
            "coloring1": { "cross": 0.1, "skewcross": 0.09, "crosswiggles": 6.66, "skewcrosswiggles": 19.13 },
            "coloring2": { "cross": 0.08, "skewcross": 0.09, "crosswiggles": 3.92, "skewcrosswiggles": 11.38 },
            "coloring3": { "cross": 0.08, "skewcross": 0.08, "crosswiggles": 3.97, "skewcrosswiggles": 11.03 }
        },
        "jean5": {
            "coloring1": { "cross": 0.76, "skewcross": 2.09, "crosswiggles": 869.75, "skewcrosswiggles": 1275.17 },
            "coloring2": { "cross": 0.64, "skewcross": 1.65, "crosswiggles": 884.4, "skewcrosswiggles": 971.62 },
            "coloring3": { "cross": 0.66, "skewcross": 1.69, "crosswiggles": 667.75, "skewcrosswiggles": 1096.5 }
        },
        "JurassicPark": {
            "coloring1": { "cross": 0.42, "skewcross": 0.75, "crosswiggles": 23.12, "skewcrosswiggles": 30.42 },
            "coloring2": { "cross": 0.35, "skewcross": 0.7, "crosswiggles": 23.29, "skewcrosswiggles": 30.69 },
            "coloring3": { "cross": 0.41, "skewcross": 0.74, "crosswiggles": 23.23, "skewcrosswiggles": 30.59 }
        },
        "lotr": {
            "coloring1": { "cross": 3.22, "skewcross": 139, "crosswiggles": 4972.26, "skewcrosswiggles": 2465.42 },
            "coloring2": { "cross": 2.49, "skewcross": 107.64, "crosswiggles": 4344.81, "skewcrosswiggles": 2168.52 },
            "coloring3": { "cross": 2.99, "skewcross": 135, "crosswiggles": 5512.81, "skewcrosswiggles": 3309.03 }
        },
        "star_wars_cut": {
            "coloring1": { "cross": 0.71, "skewcross": 51.22, "crosswiggles": 165.29, "skewcrosswiggles": 228.54 },
            "coloring2": { "cross": 0.68, "skewcross": 69.34, "crosswiggles": 174.95, "skewcrosswiggles": 234.46 },
            "coloring3": { "cross": 0.73, "skewcross": 53.63, "crosswiggles": 164.48, "skewcrosswiggles": 236.29 }
        }
    },
    "focus": {
        "animal_farm": {
            "coloring1": { "cross": 0.89, "skewcross": 0.41, "crosswiggles": 12.95, "skewcrosswiggles": 23.13 },
            "coloring2": { "cross": 0.12, "skewcross": 0.48, "crosswiggles": 3.75, "skewcrosswiggles": 3.07 },
            "coloring3": { "cross": 0.22, "skewcross": 0.47, "crosswiggles": 5.24, "skewcrosswiggles": 7.95 }
        },
        "anna3": {
            "coloring1": { "cross": 0.05, "skewcross": 0.05, "crosswiggles": 10.9, "skewcrosswiggles": 15.84 },
            "coloring2": { "cross": 0.05, "skewcross": 0.05, "crosswiggles": 2.45, "skewcrosswiggles": 3.02 },
            "coloring3": { "cross": 0.05, "skewcross": 0.07, "crosswiggles": 10.13, "skewcrosswiggles": 13.91 }
        },
        "dblp": {
            "coloring1": { "cross": 1.84, "skewcross": 2.91, "crosswiggles": 90.6, "skewcrosswiggles": 113.32 },
            "coloring2": { "cross": 1.13, "skewcross": 1.24, "crosswiggles": 11.62, "skewcrosswiggles": 18.68 },
            "coloring3": { "cross": 1.71, "skewcross": 1.61, "crosswiggles": 42.44, "skewcrosswiggles": 18.2 }
        },
        "ffvii": {
            "coloring1": { "cross": 0.97, "skewcross": 2.37, "crosswiggles": 375.8, "skewcrosswiggles": 975.36 },
            "coloring2": { "cross": 1.59, "skewcross": 1.75, "crosswiggles": 99.58, "skewcrosswiggles": 164.48 },
            "coloring3": { "cross": 1.15, "skewcross": 1.65, "crosswiggles": 32.6, "skewcrosswiggles": 45.85 }
        },
        "jean1": {
            "coloring1": { "cross": 0.3, "skewcross": 0.6, "crosswiggles": 29.35, "skewcrosswiggles": 26.36 },
            "coloring2": { "cross": 0.33, "skewcross": 0.58, "crosswiggles": 16.57, "skewcrosswiggles": 34.95 },
            "coloring3": { "cross": 0.4, "skewcross": 0.82, "crosswiggles": 15.66, "skewcrosswiggles": 20.7 }
        },
        "jean2": {
            "coloring1": { "cross": 0.08, "skewcross": 0.09, "crosswiggles": 6.12, "skewcrosswiggles": 18.1 },
            "coloring2": { "cross": 0.17, "skewcross": 0.16, "crosswiggles": 1.93, "skewcrosswiggles": 2.01 },
            "coloring3": { "cross": 0.16, "skewcross": 0.14, "crosswiggles": 0.98, "skewcrosswiggles": 1.91 }
        },
        "jean5": {
            "coloring1": { "cross": 0.65, "skewcross": 4.62, "crosswiggles": 303.55, "skewcrosswiggles": 222.14 },
            "coloring2": { "cross": 0.4, "skewcross": 1.24, "crosswiggles": 59.2, "skewcrosswiggles": 145.52 },
            "coloring3": { "cross": 0.83, "skewcross": 1.44, "crosswiggles": 80.16, "skewcrosswiggles": 128.86 }
        },
        "JurassicPark": {
            "coloring1": { "cross": 0.3, "skewcross": 0.44, "crosswiggles": 16.67, "skewcrosswiggles": 16.96 },
            "coloring2": { "cross": 0.3, "skewcross": 0.35, "crosswiggles": 10.1, "skewcrosswiggles": 13.75 },
            "coloring3": { "cross": 0.53, "skewcross": 1.54, "crosswiggles": 12.24, "skewcrosswiggles": 11.14 }
        },
        "lotr": {
            "coloring1": { "cross": 2.91, "skewcross": 8.94, "crosswiggles": 468.41, "skewcrosswiggles": 933.81 },
            "coloring2": { "cross": 2.73, "skewcross": 14.21, "crosswiggles": 132.85, "skewcrosswiggles": 424.87 },
            "coloring3": { "cross": 2.72, "skewcross": 5.38, "crosswiggles": 136.79, "skewcrosswiggles": 104.44 }
        },
        "star_wars_cut": {
            "coloring1": { "cross": 0.42, "skewcross": 1.67, "crosswiggles": 21.96, "skewcrosswiggles": 147.17 },
            "coloring2": { "cross": 8.46, "skewcross": 20.68, "crosswiggles": 42.23, "skewcrosswiggles": 84.83 },
            "coloring3": { "cross": 8.94, "skewcross": 37.11, "crosswiggles": 20.33, "skewcrosswiggles": 54 }
        }
    },
    "fairness": {
        "animal_farm": {
            "coloring1": { "cross": "oom", "skewcross": 0.46, "crosswiggles": 80, "skewcrosswiggles": "oot" },
            "coloring2": { "cross": 1.12, "skewcross": 2.09, "crosswiggles": "oot", "skewcrosswiggles": 129.44 },
            "coloring3": { "cross": "oot", "skewcross": 0.54, "crosswiggles": "oot", "skewcrosswiggles": "oot" }
        },
        "anna3": {
            "coloring1": { "cross": 0.04, "skewcross": 0.05, "crosswiggles": 31.51, "skewcrosswiggles": 18.22 },
            "coloring2": { "cross": 0.04, "skewcross": 0.05, "crosswiggles": "oot", "skewcrosswiggles": "oom" },
            "coloring3": { "cross": 0.05, "skewcross": 0, "crosswiggles": "oot", "skewcrosswiggles": "oom" }
        },
        "dblp": {
            "coloring1": { "cross": 4.68, "skewcross": 10.42, "crosswiggles": 164.78, "skewcrosswiggles": 1237.26 },
            "coloring2": { "cross": "oom", "skewcross": 0.37, "crosswiggles": "oot", "skewcrosswiggles": "oom" },
            "coloring3": { "cross": 21.75, "skewcross": 11.9, "crosswiggles": "oot", "skewcrosswiggles": "oom" }
        },
        "ffvii": {
            "coloring1": { "cross": "oot", "skewcross": 147.88, "crosswiggles": 2654.64, "skewcrosswiggles": "oot" },
            "coloring2": { "cross": 12.36, "skewcross": 24.48, "crosswiggles": "oot", "skewcrosswiggles": "oot" },
            "coloring3": { "cross": "oot", "skewcross": 25.28, "crosswiggles": "oot", "skewcrosswiggles": "oot" }
        },
        "jean1": {
            "coloring1": { "cross": 0.33, "skewcross": 2.17, "crosswiggles": "oot", "skewcrosswiggles": "oom" },
            "coloring2": { "cross": "oot", "skewcross": 4.2, "crosswiggles": "oot", "skewcrosswiggles": "oot" },
            "coloring3": { "cross": "oom", "skewcross": 0.8, "crosswiggles": "oot", "skewcrosswiggles": "oot" }
        },
        "jean2": {
            "coloring1": { "cross": 0.14, "skewcross": 0.12, "crosswiggles": 129.22, "skewcrosswiggles": 13.04 },
            "coloring2": { "cross": 0.34, "skewcross": 0.06, "crosswiggles": 401.36, "skewcrosswiggles": 9.1 },
            "coloring3": { "cross": 0.11, "skewcross": 0.07, "crosswiggles": 21.46, "skewcrosswiggles": 8.33 }
        },
        "jean5": {
            "coloring1": { "cross": "oot", "skewcross": 7.77, "crosswiggles": "oot", "skewcrosswiggles": "oom" },
            "coloring2": { "cross": 37.98, "skewcross": 2.13, "crosswiggles": 298.23, "skewcrosswiggles": 2818.73 },
            "coloring3": { "cross": 858.03, "skewcross": 6.46, "crosswiggles": 655.06, "skewcrosswiggles": "oot" }
        },
        "JurassicPark": {
            "coloring1": { "cross": 5.51, "skewcross": 0.82, "crosswiggles": 138.45, "skewcrosswiggles": "oot" },
            "coloring2": { "cross": "oom", "skewcross": 5.91, "crosswiggles": "oot", "skewcrosswiggles": "oot" },
            "coloring3": { "cross": "oot", "skewcross": 1.09, "crosswiggles": "oot", "skewcrosswiggles": 6161.69}
        },
        "lotr": {
            "coloring1": { "cross": "oom", "skewcross": 43.69, "crosswiggles": "oot", "skewcrosswiggles": "oot" },
            "coloring2": { "cross": "oom", "skewcross": 21.37, "crosswiggles": 6149.23, "skewcrosswiggles": 10080.31 },
            "coloring3": { "cross": "oot", "skewcross": 70.44, "crosswiggles": "oot", "skewcrosswiggles": "oot" }
        },
        "star_wars_cut": {
            "coloring1": { "cross": 4.38, "skewcross": 3.57, "crosswiggles": 233.39, "skewcrosswiggles": "oot" },
            "coloring2": { "cross": 11.49, "skewcross": 13.04, "crosswiggles": "oot", "skewcrosswiggles": "oot" },
            "coloring3": { "cross": 19.58, "skewcross": 40.34, "crosswiggles": "oot", "skewcrosswiggles": "oot" }
        }
    }
}

// open file in results/topic/coloring/log/experiment for all experiments
let results = {};
for (let experiment of experiments) {
    let path = `./results/${topic}/${coloring}/log/${topic}_${experiment}_out.txt`;
    let data = fs.readFileSync(path, 'utf8');
    results[experiment] = data;
}

// create the latex table
let table = "\\begin{tabular}{c r !{\\color{gray!40}\\vrule} l l l !{\\color{gray!40}\\vrule} l l l !{\\color{gray!40}\\vrule} l l l !{\\color{gray!40}\\vrule} l l l l }\n";

table += `& & \\multicolumn{3}{c}{\\shortstack{\\textit{\\textcolor{gray}{optimize for:}} \\\\[-0.7ex] \\setulcolor{crossingColor}\\ul{cross} \\\\[-0.7ex] \\textcolor{white}{a}}} 
    & \\multicolumn{3}{c}{\\shortstack{\\textit{\\textcolor{gray}{optimize for:}} \\\\[-0.7ex] \\setulcolor{crossingColor}\\ul{cross} + \\setulcolor{skewnessColor}\\ul{skew} \\\\[-0.7ex] \\textcolor{white}{a}}} 
    & \\multicolumn{3}{c}{\\shortstack{\\textit{\\textcolor{gray}{optimize for:}} \\\\[-0.7ex] \\setulcolor{crossingColor}\\ul{cross} + \\setulcolor{wigglesColor}\\ul{wiggles} \\\\[-0.7ex] \\textcolor{white}{a}}} 
    & \\multicolumn{3}{c}{\\shortstack{\\textit{\\textcolor{gray}{optimize for:}} \\\\[-0.7ex] \\setulcolor{crossingColor}\\ul{cross} + \\setulcolor{skewnessColor}\\ul{skew} \\\\[-0.7ex] + \\setulcolor{wigglesColor}\\ul{wiggles}}}  \\\\ \n`

table += "& & \\rotatebox{90}{Standard} & \\rotatebox{90}{Fair} & \\rotatebox{90}{Focus} & \\rotatebox{90}{Standard} & \\rotatebox{90}{Fair} & \\rotatebox{90}{Focus} & \\rotatebox{90}{Standard} & \\rotatebox{90}{Fair} & \\rotatebox{90}{Focus} & \\rotatebox{90}{Standard} & \\rotatebox{90}{Fair} & \\rotatebox{90}{Focus} \\\\\n";

let gettiming = (experiment) => {
    let exptext = experiment.toLowerCase()
    let classtext = "standard";
    if (exptext.includes("fair")) classtext = "fairness";
    if (exptext.includes("focus")) classtext = "focus";
    exptext = exptext.replace("fair", "").replace("focus", "");
    let time = timingdata[classtext][topic][coloring][exptext];
    return time;
}

table += `& Time (s): & `
for (let experiment of experiments) {
    let time = gettiming(experiment);
    if (time === "oom" || time === "oot") {
        table += `\\textcolor{lightgray}{${time}} & `;
    } else {
        if (time > 100) {
            table += `${Math.round(time)} & `;
        } else {
            table += `${time.toFixed(1)} & `;
        }
    }
}
table += `\\\\ \n`;

table += "\\arrayrulecolor{gray!40}\\hline \n";

table += "\\multirow{5}{*}{\\rotatebox[origin=c]{90}{\\setulcolor{crossingColor}\\ul{crossings}}}"

table += "& Blue-Blue \\crossingglyphtable{tableauBlue}{tableauBlue} & ";
let lowestBlueBlue = Math.min(...experiments.map(experiment => {
    return parseFloat(results[experiment].split("\n").find(l => l.includes("Blue-Blue crossings")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    let match = results[experiment].split("\n").find(l => l.includes("Blue-Blue crossings")).split(":")[1].trim();
    let time = gettiming(experiment);
    if (parseFloat(match) === lowestBlueBlue) {
        if (time == "oom" || time == "oot") {
            table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
        } else {
            table += "\\textbf{" + match + "} & ";
        }
    } else {
        if (time == "oom" || time == "oot") {
            table += "\\textcolor{lightgray}{" + match + "} & ";
        } else {
           table += match + " & ";
        }
    }
}
table += "\\\\ \n";

table += "& Red-Red \\crossingglyphtable{tableauRed}{tableauRed} & ";
let lowestRedRed = Math.min(...experiments.map(experiment => {
    return parseFloat(results[experiment].split("\n").find(l => l.includes("Red-Red crossings")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    let match = results[experiment].split("\n").find(l => l.includes("Red-Red crossings")).split(":")[1].trim();
    let time = gettiming(experiment);
    if (parseFloat(match) === lowestRedRed) {
        if (time == "oom" || time == "oot") {
            table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
        } else {
            table += "\\textbf{" + match + "} & ";
        }
    } else {
        if (time == "oom" || time == "oot") {
            table += "\\textcolor{lightgray}{" + match + "} & ";
        } else {
            table += match + " & ";
        }
    }
}
table += "\\\\ \n";

table += "& Blue-Red \\crossingglyphtable{tableauBlue}{tableauRed} & ";
let lowestBlueRed = Math.min(...experiments.map(experiment => {
    return parseFloat(results[experiment].split("\n").find(l => l.includes("Blue-Red crossings")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    let match = results[experiment].split("\n").find(l => l.includes("Blue-Red crossings")).split(":")[1].trim();
    let time = gettiming(experiment);
    if (parseFloat(match) === lowestBlueRed) {
        if (time == "oom" || time == "oot") {
            table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
        } else {
            table += "\\textbf{" + match + "} & ";
        }
    } else {
        if (time == "oom" || time == "oot") {
            table += "\\textcolor{lightgray}{" + match + "} & ";
        } else {
            table += match + " & ";
        }
    }
}
table += "\\\\ \n";

table += "& Total & ";
let lowestTotal = Math.min(...experiments.map(experiment => {
    return parseFloat(results[experiment].split("\n").find(l => l.includes("Total crossings")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    let match = results[experiment].split("\n").find(l => l.includes("Total crossings")).split(":")[1].trim();
    let time = gettiming(experiment);
    if (parseFloat(match) === lowestTotal) {
        if (time == "oom" || time == "oot") {
            table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
        } else {
            table += "\\textbf{" + match + "} & ";
        }
    } else {
        if (time == "oom" || time == "oot") {
            table += "\\textcolor{lightgray}{" + match + "} & ";
        } else {
            table += match + " & ";
        }
    }
}
table += "\\\\ \n";

// Find the lowest value for crossing unfairness
let lowestUnfairness = Math.min(...experiments.map(experiment => {
    return parseFloat(results[experiment].split("\n").find(l => l.includes("Unfairness")).split(" ")[1].trim());
}));

table += "& Unfairness & ";
for (let experiment of experiments) {
    let match = results[experiment].split("\n").find(l => l.includes("Unfairness")).split(" ")[1].trim();
    let time = gettiming(experiment);
    if (parseFloat(match) === lowestUnfairness) {
        if (time == "oom" || time == "oot") {
            table += "\\textbf{\\textcolor{lightgray}{\\gradientcell{" + match + "}}} & ";
        } else {
            table += "\\textbf{\\gradientcell{" + match + "}} & ";
        }
    } else {
        if (time == "oom" || time == "oot") {
            table += "\\textcolor{lightgray}{\\gradientcell{" + match + "}} & ";
        } else {
            table += "\\gradientcell{" + match + "} & ";
        }
    }
}
table += "\\\\ \n";

table += "\\arrayrulecolor{gray!40}\\hline \n";

table += "\\multirow{4}{*}{\\rotatebox[origin=c]{90}{\\setulcolor{skewnessColor}\\ul{skewness}}}"

table += "& Blue {\\color{tableauBlue}\\rule{1.6mm}{1.6mm}} & ";
let lowestBlueSkew = Math.min(...experiments.map(experiment => {
    if (!experiment.toLowerCase().includes("skew")) return Infinity;
    return parseFloat(results[experiment].split("\n").find(l => l.includes("BlueSkew")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    if (!experiment.toLowerCase().includes("skew")) {
        table += "- & ";
    } else {
        let match = results[experiment].split("\n").find(l => l.includes("BlueSkew")).split(":")[1].trim();
        let time = gettiming(experiment);
        if (parseFloat(match) === lowestBlueSkew) {
            if (time == "oom" || time == "oot") {
                table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
            } else {
                table += "\\textbf{" + match + "} & ";
            }
        } else {
            if (time == "oom" || time == "oot") {
                table += "\\textcolor{lightgray}{" + match + "} & ";
            } else {
                table += match + " & ";
            }
        }
    }
}
table += "\\\\ \n";

table += "& Red {\\color{tableauRed}\\rule{1.6mm}{1.6mm}} & ";
let lowestRedSkew = Math.min(...experiments.map(experiment => {
    if (!experiment.toLowerCase().includes("skew")) return Infinity;
    return parseFloat(results[experiment].split("\n").find(l => l.includes("RedSkew")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    if (!experiment.toLowerCase().includes("skew")) {
        table += "- & ";
    } else {
        let match = results[experiment].split("\n").find(l => l.includes("RedSkew")).split(":")[1].trim();
        let time = gettiming(experiment);
        if (parseFloat(match) === lowestRedSkew) {
            if (time == "oom" || time == "oot") {
                table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
            } else {
                table += "\\textbf{" + match + "} & ";
            }
        } else {
            if (time == "oom" || time == "oot") {
                table += "\\textcolor{lightgray}{" + match + "} & ";
            } else {
                table += match + " & ";
            }
        }
    }
}
table += "\\\\ \n";

table += "& Total & ";
let lowestTotalSkew = Math.min(...experiments.map(experiment => {
    if (!experiment.toLowerCase().includes("skew")) return Infinity;
    return parseFloat(results[experiment].split("\n").find(l => l.includes("Total skewness")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    if (!experiment.toLowerCase().includes("skew")) {
        table += "- & ";
    } else {
        let match = results[experiment].split("\n").find(l => l.includes("Total skewness")).split(":")[1].trim();
        let time = gettiming(experiment);
        if (parseFloat(match) === lowestTotalSkew) {
            if (time == "oom" || time == "oot") {
                table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
            } else {
                table += "\\textbf{" + match + "} & ";
            }
        } else {
            if (time == "oom" || time == "oot") {
                table += "\\textcolor{lightgray}{" + match + "} & ";
            } else {
                table += match + " & ";
            }
        }
    }
}
table += "\\\\ \n";

table += "& Unfairness & ";
let lowestSkewUnfairness = Math.min(...experiments.map(experiment => {
    if (!experiment.toLowerCase().includes("skew")) return Infinity;
    return parseFloat(results[experiment].split("\n").filter(l => l.includes("Unfairness"))[1].split(" ")[1].trim());
}));
for (let experiment of experiments) {
    if (!experiment.toLowerCase().includes("skew")) {
        table += "- & ";
    } else {
        let match = results[experiment].split("\n").filter(l => l.includes("Unfairness"))[1].split(" ")[1].trim();
        let time = gettiming(experiment);
        if (parseFloat(match) === lowestSkewUnfairness) {
            if (time == "oom" || time == "oot") {
                table += "\\textbf{\\textcolor{lightgray}{\\gradientcellskew{" + match + "}}} & ";
            } else {
                table += "\\textbf{\\gradientcellskew{" + match + "}} & ";
            }
        } else {
            if (time == "oom" || time == "oot") {
                table += "\\textcolor{lightgray}{\\gradientcellskew{" + match + "}} & ";
            } else {
                table += "\\gradientcellskew{" + match + "} & ";
            }
        }
    }
}
table += "\\\\ \n";

table += "\\arrayrulecolor{gray!40}\\hline \n";

table += "\\multirow{4}{*}{\\rotatebox[origin=c]{90}{\\setulcolor{wigglesColor}\\ul{wiggles}}}"

table += "& Blue {\\color{tableauBlue}\\rule{1.6mm}{1.6mm}} & ";
let lowestBlueWiggles = Math.min(...experiments.map(experiment => {
    if (!experiment.toLowerCase().includes("wiggles")) return Infinity;
    return parseFloat(results[experiment].split("\n").find(l => l.includes("BlueWiggles")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    if (!experiment.toLowerCase().includes("wiggles")) {
        table += "- & ";
    } else {
        let match = results[experiment].split("\n").find(l => l.includes("BlueWiggles")).split(":")[1].trim();
        let time = gettiming(experiment);
        if (parseFloat(match) === lowestBlueWiggles) {
            if (time == "oom" || time == "oot") {
                table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
            } else {
                table += "\\textbf{" + match + "} & ";
            }
        } else {
            if (time == "oom" || time == "oot") {
                table += "\\textcolor{lightgray}{" + match + "} & ";
            } else {
                table += match + " & ";
            }
        }
    }
}
table += "\\\\ \n";

table += "& Red {\\color{tableauRed}\\rule{1.6mm}{1.6mm}} & ";
let lowestRedWiggles = Math.min(...experiments.map(experiment => {
    if (!experiment.toLowerCase().includes("wiggles")) return Infinity;
    return parseFloat(results[experiment].split("\n").find(l => l.includes("RedWiggles")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    if (!experiment.toLowerCase().includes("wiggles")) {
        table += "- & ";
    } else {
        let match = results[experiment].split("\n").find(l => l.includes("RedWiggles")).split(":")[1].trim();
        let time = gettiming(experiment);
        if (parseFloat(match) === lowestRedWiggles) {
            if (time == "oom" || time == "oot") {
                table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
            } else {
                table += "\\textbf{" + match + "} & ";
            }
        } else {
            if (time == "oom" || time == "oot") {
                table += "\\textcolor{lightgray}{" + match + "} & ";
            } else {
                table += match + " & ";
            }
        }
    }
}
table += "\\\\ \n";

table += "& Total & ";
let lowestTotalWiggles = Math.min(...experiments.map(experiment => {
    if (!experiment.toLowerCase().includes("wiggles")) return Infinity;
    return parseFloat(results[experiment].split("\n").find(l => l.includes("Total wiggles")).split(":")[1].trim());
}));
for (let experiment of experiments) {
    if (!experiment.toLowerCase().includes("wiggles")) {
        table += "- & ";
    } else {
        let match = results[experiment].split("\n").find(l => l.includes("Total wiggles")).split(":")[1].trim();
        let time = gettiming(experiment);
        if (parseFloat(match) === lowestTotalWiggles) {
            if (time == "oom" || time == "oot") {
                table += "\\textbf{\\textcolor{lightgray}{" + match + "}} & ";
            } else {
                table += "\\textbf{" + match + "} & ";
            }
        } else {
            if (time == "oom" || time == "oot") {
                table += "\\textcolor{lightgray}{" + match + "} & ";
            } else {
                table += match + " & ";
            }
        }
    }
}
table += "\\\\ \n";

table += "& Unfairness & ";
let lowestWigglesUnfairness = Math.min(...experiments.map(experiment => {
    if (!experiment.toLowerCase().includes("wiggles")) return Infinity;
    return parseFloat(results[experiment].split("\n").filter(l => l.includes("Unfairness"))[2].split(" ")[1].trim());
}));
for (let experiment of experiments) {
    if (!experiment.toLowerCase().includes("wiggles")) {
        table += "- & ";
    } else {
        let match = results[experiment].split("\n").filter(l => l.includes("Unfairness"))[2].split(" ")[1].trim();
        let time = gettiming(experiment);
        if (parseFloat(match) === lowestWigglesUnfairness) {
            if (time == "oom" || time == "oot") {
                table += "\\textbf{\\textcolor{lightgray}{\\gradientcellwiggle{" + match + "}}} & ";
            } else {
                table += "\\textbf{\\gradientcellwiggle{" + match + "}} & ";
            }
        } else {
            if (time == "oom" || time == "oot") {
                table += "\\textcolor{lightgray}{\\gradientcellwiggle{" + match + "}} & ";
            } else {
                table += "\\gradientcellwiggle{" + match + "} & ";
            }
        }
    }
}
table += "\\\\ \n";

table += "\\end{tabular}\n";

console.log(table)
