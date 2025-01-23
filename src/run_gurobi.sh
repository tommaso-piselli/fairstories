#!/bin/bash

# Define variables
subject="anna6-7"  
experiment="cross"
time=1200           

# Run the gurobi_cl command
gurobi_cl Timelimit=${time} ResultFile=./results/${subject}_${experiment}.sol LogFile=./results/${subject}_${experiment}_.log ./results/${subject}_${experiment}.lp
