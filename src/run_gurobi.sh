#!/bin/bash

# Define variables
filename="JurassicPark_crosswiggles"  
time=3800           

# Run the gurobi_cl command
gurobi_cl Timelimit=${time} ResultFile=./results/${filename}.sol LogFile=./results/${filename}.log ./results/${filename}.lp
