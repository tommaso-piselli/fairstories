#!/bin/bash

# Get subject and experiment from command-line arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: ./run_gurobi.sh <subject> <experiment>"
    exit 1
fi

subject=$1
experiment=$2
time=3600

# Run the gurobi_cl command
gurobi_cl Timelimit=${time} ResultFile=./results/${subject}_${experiment}.sol LogFile=./results/${subject}_${experiment}_.log ./results/${subject}_${experiment}.lp