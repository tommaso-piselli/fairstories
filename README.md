# F2Stories
This repository contains tools for creating and analyzing storyline visualizations with a focus on optimizing for different metrics like crossings, skewness, and wiggles.

## Overview

The Storyline Visualization Tool allows you to:

- Generate visualizations from master files
- Optimize storylines with different optimization strategies
- Analyze results across different metrics like crossings, skewness, and wiggles
- Compare different optimization strategies with a visual interface

## Setup and Requirements

### Dependencies

- Python 3.8.16
- D3.js
- Gurobi 11.0.1
- Node.js

### Directory Structure

```
.
├── data/
│   ├── groups/      # Group definitions for characters
│   ├── map/         # Character mapping files
│   ├── sl/          # Storyline files
│   └── txt/         # Master text files
├── results/         # Results of optimization runs
├── js/              # JavaScript visualization code
│   ├── render.js    # Main rendering logic
│   └── util.js      # Utility functions
└── src/             # Python source files
    ├── characterMap.py        # Character mapping generation
    ├── generate_latex_table.js # LaTeX table generation
    ├── log_stats.py           # Statistics calculation
    ├── log_stats_print.py     # Statistics printing
    ├── main.py                # ILP model generation
    ├── mapping.py             # Solution mapping
    ├── master2sl.py           # Master to storyline conversion
    └── run_wrapper.py         # Main execution script
```

## How to Use

### Basic Usage

The simplest way to run the pipeline is using the wrapper script:

```bash
python3 src/run_wrapper.py
```

By default, this will run the "cross" experiment on the "JurassicPark" dataset. You can modify the subject and experiment variables in the `run_wrapper.py` file to run different combinations.

### Running Steps Individually

The pipeline consists of four main steps:

1. **Generate the ILP model**:

   ```bash
   python3 src/main.py <subject> <experiment>
   ```

2. **Solve the model with Gurobi**:

   ```bash
   bash src/run_gurobi.sh <subject> <experiment>
   ```

3. **Map the solution back to characters**:

   ```bash
   python3 src/mapping.py <subject> <experiment>
   ```

4. **Generate statistics**:
   ```bash
   python3 src/log_stats.py <subject> <experiment>
   ```

### Available Experiments

The following optimization strategies are available:

- `cross`: Optimize for crossing minimization
- `skewCross`: Optimize for crossings and skewness
- `crossWiggles`: Optimize for crossings and wiggles
- `skewCrossWiggles`: Optimize for crossings, skewness, and wiggles
- `fairCross`: Optimize for fair crossing distribution
- `fairSkewCross`: Optimize for fair distribution of crossings and skewness
- `fairCrossWiggles`: Optimize for fair distribution of crossings and wiggles
- `fairSkewCrossWiggles`: Optimize for fair distribution of crossings, skewness, and wiggles
- `focusCross`: Focus optimization on specific groups for crossings
- `focusSkewCross`: Focus optimization on specific groups for crossings and skewness
- `focusCrossWiggles`: Focus optimization on specific groups for crossings and wiggles
- `focusSkewCrossWiggles`: Focus optimization on specific groups for crossings, skewness, and wiggles

### Visualization

To view the visualizations, open one of the HTML files in a web browser:

- `index.html`: Basic visualization
- `showcase.html`: Interactive showcase with parameter selection
- `morph.html`: Visualization with morphing between different optimizations
- `stats.html`: Statistical visualization

## Data Format

### Master Files

Master files (`.master`) define the storyline data. They consist of:

- A list of characters with their abbreviations (one per line)
- A blank line
- A series of timesteps, each with the format: `[frame_number] : [character_groups] : [active_characters]`

For each timestep line:

1. **Frame number**: The timestamp or frame number (e.g., "208", "320")
2. **Character groups**: Characters grouped by interactions, with:
   - Groups separated by semicolons (`;`)
   - Characters within a group separated by commas (`,`)
3. **Active characters**: A complete list of all characters active in this timestep

Example from Jurassic Park:

```
RM Robert Muldoon
WP Worker in Raptor Pen
DG Donald Gennaro
...

208  : RM,WP : RM,WP
320  : DG,JR,WM;RM : DG,JR,WM
551  : DS,DR,V1,VB;RM;DG : DS,DR,V1,VB
```

In this example:

- At frame 208: RM and WP are interacting as one group
- At frame 320: DG, JR, and WM form one interaction group, while RM is a separate group because is not partecipating in the interaction. WP is not there anymore, it means that it exits from the storyline.
- At frame 551: DS, DR, V1, and VB form one group, while RM and DG are each in their own separate groups

The visualization algorithm ensures that characters in the same interaction group are positioned adjacent to each other in the visual layout.

### Group Files

Group files define character affiliations for fairness computations. Each line follows the format:

```
<id>:<character>:<group>
```

Where group is typically "red" or "blue".

## Citation

Citation information will be provided after the double-blind review process.

## License

This project is licensed under the MIT License.

Note: This is an anonymized version of the code for double-blind review purposes. Author information and complete license details will be provided upon publication.
