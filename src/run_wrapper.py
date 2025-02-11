import os
import subprocess

# Define the subject and experiment variables
subject = "JurassicPark"  # Change this to your desired subject
experiment = "fair_cross"  # Change this to your desired experiment


def run_python_script(script_name, subject, experiment):
    subprocess.run(["python3", script_name, subject, experiment])


def run_shell_script(script_name, subject, experiment):
    subprocess.run(["bash", script_name, subject, experiment])


# Execute main.py
print(f'Experiment: {subject} - {experiment}\n===================\n\n')
print("> Running main.py...")
run_python_script("src/main.py", subject, experiment)

# Execute run_gurobi.sh
print("> Running run_gurobi.sh...")
run_shell_script("src/run_gurobi.sh", subject, experiment)

# Execute mapping.py
print("> Running mapping.py...")
run_python_script("src/mapping.py", subject, experiment)

# Execute log_stats.py
print("> Running log_stats.py...")
run_python_script("src/log_stats.py", subject, experiment)

print("> All scripts executed successfully.")
