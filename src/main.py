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


# Usage example:
subject = 'anna6-7'
filepath = f"./data/sl/{subject}.sl"
groups_file = f'./data/groups/{subject}_groups.txt'
interactions, t_activechars, t_interactions, num_chars = read_sl_file(filepath)

with open(groups_file, 'r') as file:
    content = file.readlines()

character_in_groups = []
# print(content)
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


def write_ilp_model(filepath, t_activechars, t_interactions, num_chars, lambda1=1.0, lambda2=1.0, lambda3=1.0, lambda4=1.0, lambda5=1.0):
    '''
    lambda1: fairSkewness
    lambda2: Skewness
    lambda3: fairCrossings
    lambda4: Crossings
    lambda5: Wiggles
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
        if lambda1 != 0:
            obj_terms.append(f"{lambda1} FairSkew")

        # Skewness terms
        if lambda2 != 0:
            for i in range(num_chars):
                obj_terms.append(f"{lambda2} S_{i}")

        # FairnessCrossings
        if lambda3 != 0:
            obj_terms.append(f"{lambda3} FairCross")

        # Process each timestep for crossings and wiggles
        for t in range(len(t_activechars) - 1):
            chars_t = set(t_activechars[t])
            chars_t1 = set(t_activechars[t+1])
            common_chars = sorted(list(chars_t & chars_t1))

            if t == 26:
                print(chars_t)
                print(chars_t1)
                print(common_chars)

            # Crossing terms
            for i in range(len(common_chars)):
                for j in range(i + 1, len(common_chars)):
                    char1 = common_chars[i]
                    char2 = common_chars[j]

                    if char1 < 0 or char2 < 0 or char1 >= num_chars or char2 >= num_chars:
                        continue

                    var_name = f"y_{t}_{char1}_{char2}"

                    if lambda4 != 0:
                        obj_terms.append(f"{lambda4} {var_name}")
                    crossing_vars.add(var_name)
                    ordering_vars.add(f"x_{t}_{char1}_{char2}")
                    ordering_vars.add(f"x_{t+1}_{char1}_{char2}")

            # Wiggle terms - for three consecutive timesteps
            if t < len(t_activechars) - 2:
                chars_t2 = set(t_activechars[t+2])
                common_three = sorted(list(chars_t & chars_t1 & chars_t2))

                for char in common_three:
                    # Create wiggle variable for this character at this timestep
                    wiggle_var = f"w_{t}_{char}"
                    wiggle_vars.add(wiggle_var)
                    if lambda5 != 0:
                        obj_terms.append(f"{lambda5} {wiggle_var}")

        objective = " + ".join(obj_terms) if obj_terms else "0"
        file.write(objective + "\n")

        file.write("\nSubject To\n")

        # Track crossing variables for fairness constraints
        red_crossings = []
        blue_crossings = []

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
                # Fair skewness first constraint
                constraint1_terms = [f"{num_blues * num_reds} FairSkew"]
                for char_id in blues:
                    char_idx = int(char_id) - 1
                    if 0 <= char_idx < num_chars:
                        constraint1_terms.append(f"- {num_reds} S_{char_idx}")
                for char_id in reds:
                    char_idx = int(char_id) - 1
                    if 0 <= char_idx < num_chars:
                        constraint1_terms.append(f"+ {num_blues} S_{char_idx}")
                file.write(f"{' '.join(constraint1_terms)} >= 0\n")

                # Fair skewness second constraint
                constraint2_terms = [f"{num_blues * num_reds} FairSkew"]
                for char_id in reds:
                    char_idx = int(char_id) - 1
                    if 0 <= char_idx < num_chars:
                        constraint2_terms.append(f"- {num_blues} S_{char_idx}")
                for char_id in blues:
                    char_idx = int(char_id) - 1
                    if 0 <= char_idx < num_chars:
                        constraint2_terms.append(f"+ {num_reds} S_{char_idx}")
                file.write(f"{' '.join(constraint2_terms)} >= 0\n")

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

        # --- 4. WIGGLE DETECTION CONSTRAINTS (lambda5) ---
        for t in range(len(t_activechars) - 2):
            chars_t = set(t_activechars[t])
            chars_t1 = set(t_activechars[t+1])
            chars_t2 = set(t_activechars[t+2])
            common_three = sorted(list(chars_t & chars_t1 & chars_t2))

            for char in common_three:
                wiggle_var = f"w_{t}_{char}"
                for other_char in common_three:
                    if other_char != char:
                        x_t = f"x_{t}_{char}_{other_char}"
                        x_t1 = f"x_{t+1}_{char}_{other_char}"
                        x_t2 = f"x_{t+2}_{char}_{other_char}"

                        file.write(f"{wiggle_var} - {x_t} + {x_t1} >= 0\n")
                        file.write(f"{wiggle_var} + {x_t} - {x_t1} >= 0\n")
                        file.write(f"{wiggle_var} - {x_t1} + {x_t2} >= 0\n")
                        file.write(f"{wiggle_var} + {x_t1} - {x_t2} >= 0\n")

        # --- 5. AUXILIARY CONSTRAINTS ---
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

        # Write binary variable declarations
        file.write("\nBinaries\n")
        for var in skewness_vars:
            file.write(f"{var}\n")
        for var in ordering_vars:
            file.write(f"{var}\n")
        for var in crossing_vars:
            file.write(f"{var}\n")
        for var in wiggle_vars:
            file.write(f"{var}\n")


# Usage
# output_file = f'./results/{subject}_cross.lp'
output_file = f'test.lp'
write_ilp_model(output_file, t_activechars, t_interactions,
                num_chars, lambda1=0, lambda2=0, lambda3=0, lambda4=1, lambda5=0)
