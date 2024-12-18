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
subject = 'jean1'
filepath = f"./data/sl/{subject}.sl"
interactions, t_activechars, t_interactions, num_chars = read_sl_file(filepath)


# Example of how to check the parsed data
# print(f"Number of characters: {num_chars}")
# print("\nFirst few active characters by timestep:")
# for t in range(min(5, len(t_activechars))):
#     print(f"Timestep {t}: {t_activechars[t]}")

# print("\nFirst few interactions:")
# for t in range(min(5, len(t_interactions))):
#     print(f"Timestep {t}: {t_interactions[t]}")


def write_ilp_model(filepath, t_activechars, t_interactions, num_chars):
    # Keep track of all binary variables
    ordering_vars = set()  # x variables
    crossing_vars = set()  # y variables

    # Start writing the LP file
    with open(filepath, 'w') as file:
        # Write objective function
        file.write("Minimize\n")
        objective = ""

        # For each pair of consecutive timesteps
        for t in range(len(t_activechars) - 1):

            # Find characters present in both layers t and t+1
            chars_t = set(t_activechars[t])
            chars_t1 = set(t_activechars[t+1])
            common_chars = sorted(list(chars_t & chars_t1))

            # For each pair of common characters
            for i in range(len(common_chars)):
                for j in range(i + 1, len(common_chars)):
                    char1 = common_chars[i]
                    char2 = common_chars[j]
                    # Add crossing variable to objective
                    var_name = f"y_{t}_{char1}_{char2}"

                    # if t == 0:
                    #     print(var_name)

                    objective += f"{var_name} + "
                    crossing_vars.add(var_name)

                    # Add ordering variables for these characters
                    ordering_vars.add(f"x_{t}_{char1}_{char2}")
                    ordering_vars.add(f"x_{t+1}_{char1}_{char2}")

        # Write objective (remove last ' + ')
        file.write(objective[:-3] if objective else "0")

        # Start constraints section
        file.write("\nSubject To\n")

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

                    # y_{t,i,j} ≥ x_{t,i,j} - x_{t+1,i,j}
                    file.write(f"{y_var} - {x_t} + {x_t1} >= 0\n")
                    # y_{t,i,j} ≥ x_{t+1,i,j} - x_{t,i,j}
                    file.write(f"{y_var} + {x_t} - {x_t1} >= 0\n")

        # file.write("\n# Ordering constraints\n")
        for t in range(len(t_activechars)):
            active_chars = t_activechars[t]
            for i in range(len(active_chars)):
                for j in range(i + 1, len(active_chars)):
                    char1 = active_chars[i]
                    char2 = active_chars[j]
                    x_ij = f"x_{t}_{char1}_{char2}"
                    x_ji = f"x_{t}_{char2}_{char1}"

                    # Either char1 is above char2 or char2 is above char1
                    file.write(f"{x_ij} + {x_ji} = 1\n")

                    # Add both variables to ordering_vars set
                    ordering_vars.add(x_ij)
                    ordering_vars.add(x_ji)

        # Add transitivity constraints
        # file.write("\n# Transitivity constraints\n")
        for t in range(len(t_activechars)):
            active_chars = t_activechars[t]
            # print(active_chars)
            # For each triple of characters (i,j,k)
            for i in range(len(active_chars)):
                for j in range(i + 1, len(active_chars)):
                    for k in range(j + 1, len(active_chars)):
                        char1 = active_chars[i]
                        char2 = active_chars[j]
                        char3 = active_chars[k]

                        x_ij = f"x_{t}_{char1}_{char2}"
                        x_jk = f"x_{t}_{char2}_{char3}"
                        x_ik = f"x_{t}_{char1}_{char3}"

                        # If i above j and j above k, then i must be above k
                        file.write(f"{x_ij} + {x_jk} - {x_ik} <= 1\n")
                        file.write(f"{x_ij} + {x_jk} - {x_ik} >= 0\n")

                        # Add variables to ordering_vars set
                        ordering_vars.add(x_ij)
                        ordering_vars.add(x_jk)
                        ordering_vars.add(x_ik)

        # Add tree constraints
        # file.write("\n# Tree constraints\n")
        for t in range(len(t_activechars)):
            # For each interaction at this timestep
            for interaction in t_interactions[t]:
                int_chars = interaction['characters']
                # Find characters not in this interaction
                outside_chars = [
                    c for c in t_activechars[t] if c not in int_chars]

                # For each pair of characters in the interaction
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

        # Write binary variable declarations
        file.write("Binaries\n")
        for var in ordering_vars:
            file.write(f"{var} ")
        for var in crossing_vars:
            file.write(f"{var} ")


# Usage:
write_ilp_model(f"{subject}.lp", t_activechars, t_interactions, num_chars)
