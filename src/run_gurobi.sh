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
mkdir -p ./results/${subject}/sol/${experiment}
mkdir -p ./results/${subject}/sol/${experiment}/intermediate_sols
mkdir -p ./results/${subject}/log


# Run the gurobi_cl command with SolFiles parameter
gurobi_cl Timelimit=${time} \
    ResultFile=./results/${subject}/sol/${experiment}/${subject}_${experiment}.sol \
    LogFile=./results/${subject}/log/${subject}_${experiment}_.log \
    SolFiles=./results/${subject}/sol/${experiment}/intermediate_sols/${subject}_${experiment}_intermediate \
    ./results/${subject}/${subject}_${experiment}.lp