#!/bin/bash

# Define variables
filename="anna6-7_skewcross"  
time=3800           

# Run the gurobi_cl command
gurobi_cl Timelimit=${time} ResultFile=./results/${filename}.sol LogFile=./results/${filename}.log ./results/${filename}.lp
