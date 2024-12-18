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
subject = 'JurassicPark'
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

# print(character_in_groups)

reds = []
blues = []
for character in character_in_groups:
    if character['group'] == 'red':
        reds.append(character['id'])
    else:
        blues.append(character['id'])


def write_ilp_model(filepath, t_activechars, t_interactions, num_chars, lambda1=0.0, lambda2=1.0):
    # Keep track of all binary variables
    ordering_vars = set()  # x variables
    crossing_vars = set()  # y variables

    num_reds = len(reds)
    num_blues = len(blues)

    with open(filepath, 'w') as file:

        file.write("Minimize\n")

        obj_terms = []

        if lambda1 != 0:
            obj_terms.append(f"{lambda1} z")

        for t in range(len(t_activechars) - 1):

            chars_t = set(t_activechars[t])
            chars_t1 = set(t_activechars[t+1])
            common_chars = sorted(list(chars_t & chars_t1))

            for i in range(len(common_chars)):
                for j in range(i + 1, len(common_chars)):

                    char1 = common_chars[i]
                    char2 = common_chars[j]

                    var_name = f"y_{t}_{char1}_{char2}"

                    if lambda2 != 0:
                        obj_terms.append(f"{lambda2} {var_name}")
                    crossing_vars.add(var_name)

                    ordering_vars.add(f"x_{t}_{char1}_{char2}")
                    ordering_vars.add(f"x_{t+1}_{char1}_{char2}")

        objective = " + ".join(obj_terms) if obj_terms else "0"
        file.write(objective)

        # Start constraints section
        file.write("\nSubject To\n")

        red_crossings = []
        blue_crossings = []

        # Write crossing detection constraints
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

                    # Counting colored crossings
                    if str(char1) in reds:
                        red_crossings.append(y_var)
                    if str(char2) in reds:
                        red_crossings.append(y_var)
                    if str(char1) in blues:
                        blue_crossings.append(y_var)
                    if str(char2) in blues:
                        blue_crossings.append(y_var)

                    file.write(f"{y_var} - {x_t} + {x_t1} >= 0\n")
                    file.write(f"{y_var} + {x_t} - {x_t1} >= 0\n")

        #
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

        # TRANSITIVITY
        for t in range(len(t_activechars)):
            active_chars = t_activechars[t]
            for i in range(len(active_chars)):
                for j in range(i + 1, len(active_chars)):
                    for k in range(j + 1, len(active_chars)):
                        char1 = active_chars[i]
                        char2 = active_chars[j]
                        char3 = active_chars[k]

                        x_ij = f"x_{t}_{char1}_{char2}"
                        x_jk = f"x_{t}_{char2}_{char3}"
                        x_ik = f"x_{t}_{char1}_{char3}"

                        file.write(f"{x_ij} + {x_jk} - {x_ik} <= 1\n")
                        file.write(f"{x_ij} + {x_jk} - {x_ik} >= 0\n")

                        ordering_vars.add(x_ij)
                        ordering_vars.add(x_jk)
                        ordering_vars.add(x_ik)

        # TREE
        for t in range(len(t_activechars)):

            for interaction in t_interactions[t]:
                int_chars = interaction['characters']

                outside_chars = [
                    c for c in t_activechars[t] if c not in int_chars]

                for i in range(len(int_chars)):
                    for j in range(i + 1, len(int_chars)):
                        char1 = int_chars[i]
                        char2 = int_chars[j]

                        # For each character outside the interaction
                        for out_char in outside_chars:
                            # Ensure out_char is either above or below both char1 and char2
                            # but not between them
                            x_1out = f"x_{t}_{char1}_{out_char}"
                            x_2out = f"x_{t}_{char2}_{out_char}"

                            file.write(f"{x_1out} - {x_2out} = 0\n")

                            # Add variables to ordering_vars set
                            ordering_vars.add(x_1out)
                            ordering_vars.add(x_2out)

        if lambda1 != 0:
            # Add fairness constraints
            constraint1_terms = []
            # Handle first term separately to avoid leading sign
            if blue_crossings:
                first_var = blue_crossings[0]
                constraint1_terms.append(f"{num_reds} {first_var}")
                for blue_var in blue_crossings[1:]:
                    constraint1_terms.append(f"+ {num_reds} {blue_var}")
            for red_var in red_crossings:
                constraint1_terms.append(f"- {num_blues} {red_var}")
            constraint1_terms.append(f"- {num_reds * num_blues} z")
            constraint1 = " ".join(constraint1_terms) + " <= 0\n"
            file.write(constraint1)

            # Second constraint
            constraint2_terms = []
            # Handle first term separately
            if blue_crossings:
                first_var = blue_crossings[0]
                constraint2_terms.append(f"- {num_reds} {first_var}")
                for blue_var in blue_crossings[1:]:
                    constraint2_terms.append(f"- {num_reds} {blue_var}")
            for red_var in red_crossings:
                constraint2_terms.append(f"+ {num_blues} {red_var}")
            constraint2_terms.append(f"- {num_reds * num_blues} z")
            constraint2 = " ".join(constraint2_terms) + " <= 0\n"
            file.write(constraint2)

        # Write binary variable declarations
        file.write("Binaries\n")
        for var in ordering_vars:
            file.write(f"{var} ")
        for var in crossing_vars:
            file.write(f"{var} ")


# Usage:
write_ilp_model(f"{subject}_fair.lp", t_activechars,
                t_interactions, num_chars, lambda1=1, lambda2=1000)
