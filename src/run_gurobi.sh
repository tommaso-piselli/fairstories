#!/bin/bash
# Get subject and experiment from command-line arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: ./run_gurobi.sh <subject> <experiment>"
    exit 1
fi

subject=$1
experiment=$2
time=3600

# Create a directory for intermediate solutions if it doesn't exist
mkdir -p ./results/${subject}/intermediate_sols/${experiment}

# Run the gurobi_cl command with SolFiles parameter
gurobi_cl Timelimit=${time} \
    ResultFile=./results/${subject}_${experiment}.sol \
    LogFile=./results/${subject}_${experiment}_.log \
    SolFiles=./results/${subject}/intermediate_sols/${experiment}/${subject}_${experiment}_intermediate \
    ./results/${subject}_${experiment}.lp