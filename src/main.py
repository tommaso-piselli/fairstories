import sys

REGULAR_CONFIGS = {
    'fairskew': (1000, 0, 0, 0, 0, 0),
    'skew': (0, 1, 0, 0, 0, 0),
    'cross': (0, 0, 0, 1, 0, 0),
    'faircross': (0, 0, 1000, 1, 0, 0),
    'wiggles': (0, 0, 0, 0, 0, 1),
    'fairwiggles': (0, 0, 0, 0, 1000, 0),
    'crosswiggles': (0, 0, 0, 1, 0, 1),
    'skewcrosswiggles': (0, 1, 0, 1, 0, 1),
    'fairskewcrosswiggles': (1, 0, 1, 0, 1, 0),
    'skewcross': (0, 1, 0, 1, 0, 0),
}

FOCUS_CONFIGS = {
    'focus_cross': (0, 0, 0, 1, 0, 0, None, True, 10),
    'focus_skewcross': (0, 1, 0, 1, 0, 0, None, True, 10),
    'focus_crosswiggles': (0, 0, 0, 1, 0, 1, None, True, 10),
    'focus_skewcrosswiggles': (0, 1, 0, 1, 0, 1, None, True, 10),
}


def get_experiment_config(experiment):
    """
    Get experiment configuration parameters based on the experiment name.
    Returns tuple of (lambda1, lambda2, lambda3, lambda4, lambda5, lambda6, crossCount, focusMode, alpha)
    """

    if experiment.startswith('crosscount_'):
        crosscount = int(experiment.split('_')[1])
        return (0, 0, 1, 0, 0, 0, crossCount, False, 0)

    if experiment in FOCUS_CONFIGS:
        return FOCUS_CONFIGS[experiment]

    if experiment in REGULAR_CONFIGS:
        # Add focusMode=False and alpha=0 for regular configs
        return REGULAR_CONFIGS[experiment] + (None, False, 0.0)

    return (0, 0, 0, 0, 0, 0, False, 0.0)


def read_sl_file(filepath):
    """
    Parse a .sl file into the required data structures
    Returns:
        - interactions: list of all interactions
        - t_activechars: list of active characters at each timestep
        - t_interactions: list of interactions at each timestep
        - num_chars: total number of unique characters
    """
    interactions = []
    t_activechars = []
    t_interactions = []

    with open(filepath, 'r') as file:
        # Read header line: num_chars timesteps num_interactions
        first_line = file.readline().strip().split()
        num_chars = int(first_line[0])
        timesteps = int(first_line[1])

        # Read each timestep
        timestep = 0
        for line in file:
            parts = line.strip().split()
            if not parts:
                continue

            num_interactions = int(parts[0])
            current_pos = 1

            # Initialize lists for this timestep
            current_interactions = []
            active_chars = set()

            # Parse each interaction in this timestep
            for _ in range(num_interactions):
                interaction_size = int(parts[current_pos])
                current_pos += 1

                # Get characters in this interaction
                chars = [int(parts[current_pos + i]) -
                         1 for i in range(interaction_size)]
                current_pos += interaction_size

                # Add to interactions
                interaction = {
                    'start': timestep,
                    'end': timestep,
                    'characters': chars
                }
                current_interactions.append(interaction)
                interactions.append(interaction)

                # Add to active characters
                active_chars.update(chars)

            t_interactions.append(current_interactions)
            t_activechars.append(sorted(list(active_chars)))
            timestep += 1

    return interactions, t_activechars, t_interactions, num_chars


def write_ilp_model(filepath, t_activechars, t_interactions, num_chars, lambda1=1.0, lambda2=1.0, lambda3=1.0, lambda4=1.0, lambda5=1.0, lambda6=1.0, crossCount=None, focusMode=False, alpha=2.0):
    '''
    lambda1: fairSkewness
    lambda2: Skewness
    lambda3: fairCrossings
    lambda4: Crossings
    lambda5: fairWiggle
    lambda6: Wiggles
    focusMode: if True, excludes fairness terms and applies weighted focus
    alpha: weight multiplier for focus mode
    '''

    # Keep track of all variables
    ordering_vars = set()
    crossing_vars = set()
    wiggle_vars = set()
    skewness_vars = set()

    if lambda1 != 0 or lambda2 != 0:
        for i in range(num_chars):
            skewness_vars.add(f"S_{i}")

    num_reds = len(reds)
    num_blues = len(blues)

    with open(filepath, 'w') as file:
        file.write("Minimize\n")

        # Build objective function terms
        obj_terms = []

        # FairnessSkewness
        if lambda1 != 0 and not focusMode:
            obj_terms.append(f"{lambda1} FairSkew")

        # Skewness terms
        if lambda2 != 0:
            for i in range(num_chars):
                if focusMode:
                    if str(i) in reds:
                        skew_weight = lambda2 * alpha
                    else:
                        skew_weight = lambda2
                else:
                    skew_weight = lambda2
                obj_terms.append(f"{skew_weight} S_{i}")

        # FairnessCrossings
        if lambda3 != 0 and not focusMode:
            obj_terms.append(f"{lambda3} FairCross")

        # Process each timestep for crossings and wiggles
        for t in range(len(t_activechars) - 1):
            chars_t = set(t_activechars[t])
            chars_t1 = set(t_activechars[t+1])
            common_chars = sorted(list(chars_t & chars_t1))

            for i in range(len(common_chars)):
                for j in range(i + 1, len(common_chars)):
                    char1 = common_chars[i]
                    char2 = common_chars[j]

                    if char1 < 0 or char2 < 0 or char1 >= num_chars or char2 >= num_chars:
                        continue

                    var_name = f"y_{t}_{char1}_{char2}"

                    # Crossing terms with focus mode weights
                    if lambda4 != 0:
                        if focusMode:
                            red_count = sum(
                                1 for c in [str(char1), str(char2)] if c in reds)
                            if red_count == 0:
                                cross_weight = lambda4
                            elif red_count == 1:
                                cross_weight = lambda4 * alpha
                            else:
                                cross_weight = lambda4 * (alpha ** 2)
                        else:
                            cross_weight = lambda4
                        obj_terms.append(f"{cross_weight} {var_name}")

                    crossing_vars.add(var_name)
                    ordering_vars.add(f"x_{t}_{char1}_{char2}")
                    ordering_vars.add(f"x_{t+1}_{char1}_{char2}")

            # Wiggle terms
            if lambda6 != 0:
                for char_i in common_chars:
                    wiggle_var = f"w_{t}_{char_i}"
                    if focusMode:
                        # Apply different weights based on group
                        if str(char_i) in reds:
                            wiggle_weight = lambda6 * alpha
                        else:
                            wiggle_weight = lambda6
                    else:
                        wiggle_weight = lambda6
                    obj_terms.append(f"{wiggle_weight} {wiggle_var}")
                    wiggle_vars.add(wiggle_var)

        # FairWiggle terms
        if lambda5 != 0 and not focusMode:
            obj_terms.append(f"{lambda5} FairWiggle")

        objective = " + ".join(obj_terms) if obj_terms else "0"
        file.write(objective + "\n")

        file.write("\nSubject To\n")

        # Track crossing variables for fairness constraints
        red_crossings = []
        blue_crossings = []

        # Track wiggle variables for fairness constraints
        red_wiggles = []
        blue_wiggles = []

        # --- 1. SKEWNESS AND FAIR SKEWNESS CONSTRAINTS (lambda1, lambda2) ---
        if lambda1 != 0 or lambda2 != 0:
            # Individual skewness constraints
            for t in range(len(t_activechars) - 1):
                chars_t = set(t_activechars[t])
                chars_t1 = set(t_activechars[t+1])
                common_chars = sorted(list(chars_t & chars_t1))

                for i in range(len(common_chars)):
                    for j in range(i + 1, len(common_chars)):
                        char1 = common_chars[i]
                        char2 = common_chars[j]
                        if char1 < 0 or char2 < 0 or char1 >= num_chars or char2 >= num_chars:
                            continue
                        y_var = f"y_{t}_{char1}_{char2}"
                        file.write(f"S_{char1} + S_{char2} - {y_var} >= 0\n")

            if lambda1 != 0:
                # Fair skewness constraints
                constraint1_terms = []
                for char_id in blues:
                    char_idx = int(char_id)
                    if 0 <= char_idx < num_chars:
                        constraint1_terms.append(f"+ {num_reds} S_{char_idx}")
                for char_id in reds:
                    char_idx = int(char_id)
                    if 0 <= char_idx < num_chars:
                        constraint1_terms.append(f"- {num_blues} S_{char_idx}")
                constraint1_terms.append(f"- {num_reds * num_blues} FairSkew")
                file.write(f"{' '.join(constraint1_terms)} <= 0\n")

                # Second constraint
                constraint2_terms = []
                for char_id in blues:
                    char_idx = int(char_id)
                    if 0 <= char_idx < num_chars:
                        constraint2_terms.append(f"- {num_reds} S_{char_idx}")
                for char_id in reds:
                    char_idx = int(char_id)
                    if 0 <= char_idx < num_chars:
                        constraint2_terms.append(f"+ {num_blues} S_{char_idx}")
                constraint2_terms.append(f"- {num_reds * num_blues} FairSkew")
                file.write(f"{' '.join(constraint2_terms)} <= 0\n")

        # --- 2. FAIR CROSSING CONSTRAINTS (lambda3) ---
        # First collect all crossings
        for t in range(len(t_activechars) - 1):
            chars_t = set(t_activechars[t])
            chars_t1 = set(t_activechars[t+1])
            common_chars = sorted(list(chars_t & chars_t1))

            for i in range(len(common_chars)):
                for j in range(i + 1, len(common_chars)):
                    char1 = common_chars[i]
                    char2 = common_chars[j]
                    if lambda3 != 0:
                        y_var = f"y_{t}_{char1}_{char2}"
                        if str(char1) in reds:
                            red_crossings.append(y_var)
                        if str(char2) in reds:
                            red_crossings.append(y_var)
                        if str(char1) in blues:
                            blue_crossings.append(y_var)
                        if str(char2) in blues:
                            blue_crossings.append(y_var)

        if lambda3 != 0:
            # Fair crossing first constraint
            constraint1_terms = []
            if blue_crossings:
                first_var = blue_crossings[0]
                constraint1_terms.append(f"{num_reds} {first_var}")
                for blue_var in blue_crossings[1:]:
                    constraint1_terms.append(f"+ {num_reds} {blue_var}")
            for red_var in red_crossings:
                constraint1_terms.append(f"- {num_blues} {red_var}")
            constraint1_terms.append(f"- {num_reds * num_blues} FairCross")
            file.write(f"{' '.join(constraint1_terms)} <= 0\n")

            # Fair crossing second constraint
            constraint2_terms = []
            if blue_crossings:
                first_var = blue_crossings[0]
                constraint2_terms.append(f"- {num_reds} {first_var}")
                for blue_var in blue_crossings[1:]:
                    constraint2_terms.append(f"- {num_reds} {blue_var}")
            for red_var in red_crossings:
                constraint2_terms.append(f"+ {num_blues} {red_var}")
            constraint2_terms.append(f"- {num_reds * num_blues} FairCross")
            file.write(f"{' '.join(constraint2_terms)} <= 0\n")

        # --- 3. CROSSING DETECTION CONSTRAINTS (lambda4) ---
        for t in range(len(t_activechars) - 1):
            chars_t = set(t_activechars[t])
            chars_t1 = set(t_activechars[t+1])
            common_chars = sorted(list(chars_t & chars_t1))

            for i in range(len(common_chars)):
                for j in range(i + 1, len(common_chars)):
                    char1 = common_chars[i]
                    char2 = common_chars[j]
                    y_var = f"y_{t}_{char1}_{char2}"
                    x_t = f"x_{t}_{char1}_{char2}"
                    x_t1 = f"x_{t+1}_{char1}_{char2}"

                    file.write(f"{y_var} - {x_t} + {x_t1} >= 0\n")
                    file.write(f"{y_var} + {x_t} - {x_t1} >= 0\n")

        # --- 4. WIGGLE DETECTION CONSTRAINTS (lambda6) ---
        if lambda5 != 0 or lambda6 != 0:
            for t in range(len(t_activechars) - 1):
                chars_t = set(t_activechars[t])
                chars_t1 = set(t_activechars[t+1])
                common_chars = sorted(list(chars_t & chars_t1))

                # Only process characters that appear in both timestamps
                for char_i in common_chars:
                    wiggle_var = f"w_{t}_{char_i}"

                    # Track wiggles for fairness constraints
                    if str(char_i) in reds:
                        red_wiggles.append(wiggle_var)
                    elif str(char_i) in blues:
                        blue_wiggles.append(wiggle_var)

                    # First constraint: w_{t,i} - Σ(x_{t,i,j} - x_{t+1,i,j}) ≥ 0
                    constraint1_terms = [wiggle_var]
                    for char_j in common_chars:  # j must also be in both timestamps
                        if char_i != char_j:
                            constraint1_terms.append(
                                f"- x_{t}_{char_i}_{char_j}")
                            constraint1_terms.append(
                                f"+ x_{t+1}_{char_i}_{char_j}")
                    file.write(f"{' '.join(constraint1_terms)} >= 0\n")

                    # Second constraint: w_{t,i} - Σ(x_{t+1,i,j} - x_{t,i,j}) ≥ 0
                    constraint2_terms = [wiggle_var]
                    for char_j in common_chars:  # j must also be in both timestamps
                        if char_i != char_j:
                            constraint2_terms.append(
                                f"- x_{t+1}_{char_i}_{char_j}")
                            constraint2_terms.append(
                                f"+ x_{t}_{char_i}_{char_j}")
                    file.write(f"{' '.join(constraint2_terms)} >= 0\n")

        # --- 5. FAIR WIGGLES CONSTRAINTS (lambda5) ---
            if lambda5 != 0:
                # First constraint: Similar structure to FairCross
                constraint1_terms = []
                if blue_wiggles:
                    for blue_var in blue_wiggles:
                        constraint1_terms.append(f"+ {num_reds} {blue_var}")
                if red_wiggles:
                    for red_var in red_wiggles:
                        constraint1_terms.append(f"- {num_blues} {red_var}")
                constraint1_terms.append(
                    f"- {num_reds * num_blues} FairWiggle")
                file.write(f"{' '.join(constraint1_terms)} <= 0\n")

                # Second constraint
                constraint2_terms = []
                if blue_wiggles:
                    for blue_var in blue_wiggles:
                        constraint2_terms.append(f"- {num_reds} {blue_var}")
                if red_wiggles:
                    for red_var in red_wiggles:
                        constraint2_terms.append(f"+ {num_blues} {red_var}")
                constraint2_terms.append(
                    f"- {num_reds * num_blues} FairWiggle")
                file.write(f"{' '.join(constraint2_terms)} <= 0\n")

        # --- 6. AUXILIARY CONSTRAINTS ---
        # Ordering constraints
        for t in range(len(t_activechars)):
            active_chars = t_activechars[t]
            for i in range(len(active_chars)):
                for j in range(i + 1, len(active_chars)):
                    char1 = active_chars[i]
                    char2 = active_chars[j]
                    x_ij = f"x_{t}_{char1}_{char2}"
                    x_ji = f"x_{t}_{char2}_{char1}"
                    file.write(f"{x_ij} + {x_ji} = 1\n")
                    ordering_vars.add(x_ij)
                    ordering_vars.add(x_ji)

        # Transitivity constraints
        for t in range(len(t_activechars)):
            active_chars = t_activechars[t]
            for i in range(len(active_chars)):
                for j in range(i + 1, len(active_chars)):
                    for k in range(j + 1, len(active_chars)):
                        char1, char2, char3 = active_chars[i], active_chars[j], active_chars[k]
                        x_ij = f"x_{t}_{char1}_{char2}"
                        x_jk = f"x_{t}_{char2}_{char3}"
                        x_ik = f"x_{t}_{char1}_{char3}"
                        file.write(f"{x_ij} + {x_jk} - {x_ik} <= 1\n")
                        file.write(f"{x_ij} + {x_jk} - {x_ik} >= 0\n")

        # Tree constraints
        for t in range(len(t_activechars)):
            for interaction in t_interactions[t]:
                int_chars = interaction['characters']
                outside_chars = [
                    c for c in t_activechars[t] if c not in int_chars]
                for i in range(len(int_chars)):
                    for j in range(i + 1, len(int_chars)):
                        char1, char2 = int_chars[i], int_chars[j]
                        for out_char in outside_chars:
                            x_1out = f"x_{t}_{char1}_{out_char}"
                            x_2out = f"x_{t}_{char2}_{out_char}"
                            file.write(f"{x_1out} - {x_2out} = 0\n")
                            ordering_vars.add(x_1out)
                            ordering_vars.add(x_2out)

        # crossing count constraint
        if crossCount is not None:
            # Sum of all crossing variables should equal crossCount
            crossing_sum_terms = []
            for t in range(len(t_activechars) - 1):
                chars_t = set(t_activechars[t])
                chars_t1 = set(t_activechars[t+1])
                common_chars = sorted(list(chars_t & chars_t1))

                for i in range(len(common_chars)):
                    for j in range(i + 1, len(common_chars)):
                        char1 = common_chars[i]
                        char2 = common_chars[j]
                        y_var = f"y_{t}_{char1}_{char2}"
                        crossing_sum_terms.append(y_var)

            # Build the sum of all y variables
            sum_string = " + ".join(crossing_sum_terms)
            #  file.write(f"{sum_string} <= {crossCount}\n")
            file.write(f"{sum_string} <= {crossCount}\n")

        # Write binary variable declarations
        file.write("\nBinaries\n")
        for var in skewness_vars:
            file.write(f"{var}\n")
        for var in ordering_vars:
            file.write(f"{var}\n")
        for var in crossing_vars:
            file.write(f"{var}\n")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 main.py <subject> <experiment>")
        sys.exit(1)

    subject = sys.argv[1]
    experiment = sys.argv[2]

    if experiment.split('_')[0] == 'crosscount':
        crossCount = int(experiment.split('_')[1])
        print(f"Crossing count: {crossCount}")
    else:
        crossCount = None

    # Usage example:
    filepath = f"./data/sl/{subject}.sl"
    groups_file = f'./data/groups/{subject}_groups.txt'
    interactions, t_activechars, t_interactions, num_chars = read_sl_file(
        filepath)

    with open(groups_file, 'r') as file:
        content = file.readlines()

    character_in_groups = []
    for line in content:
        line = line.strip().split('\n')
        for elem in line:
            elem = elem.strip().split(':')
            id_char = elem[0].strip()
            abbr_char = elem[1].strip()
            group_char = elem[2].strip()

            character = {
                'id': id_char,
                'char': abbr_char,
                'group': group_char
            }

            character_in_groups.append(character)

    reds = []
    blues = []
    for character in character_in_groups:
        if character['group'] == 'red':
            reds.append(character['id'])
        else:
            blues.append(character['id'])

    # Write ILP model
    lambda1, lambda2, lambda3, lambda4, lambda5, lambda6, focusMode, alpha = get_experiment_config(
        experiment)

    output_file = f'./results/{subject}_{experiment}.lp'

    write_ilp_model(output_file, t_activechars, t_interactions, num_chars,
                    lambda1, lambda2, lambda3, lambda4, lambda5, lambda6, crossCount=crossCount,
                    focusMode=focusMode, alpha=alpha)
