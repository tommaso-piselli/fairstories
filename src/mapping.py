import re
import os

root = './data'
fp_map = root + f'/map/'
fp_sl = root + f'/sl/'
fp_txt = root + f'/txt/'

subject = 'JurassicPark'
experiment = 'crosscount_2'

# Load the characters from the .map file
characters = []
with open(fp_map + f'{subject}_map.txt', 'r') as file:
    for line in file:
        parts = line.strip().split(':')
        char_id = int(parts[0].strip())
        char_name = parts[1].strip()
        characters.append({'id': char_id, 'char': char_name})


def id_to_char_mapping(characters):
    return {char['id']: char['char'] for char in characters}


id_to_char = id_to_char_mapping(characters)
print(id_to_char)


fair_open = f'./results/{subject}_{experiment}.sol'
with open(fair_open, 'r') as sol_f:
    sol_file = sol_f.readlines()


test_variables = []
for idx, line in enumerate(sol_file):

    if line.startswith('#') or line.startswith('z'):
        continue

    line = line.strip().split(' ')
    test_variables.append(line[0])

# test_variables = ['y_1_2_3', 'x_10_5_8']

replacements = {}
for old_var in test_variables:
    var = old_var.split('_')

    if var[0] == 'x' or var[0] == 'y':
        new_var = var[:2]

        id_char1 = var[2]
        id_char2 = var[3]

        name_char1 = id_to_char.get(int(id_char1))
        name_char2 = id_to_char.get(int(id_char2))

        new_var.append(name_char1)
        new_var.append(name_char2)

        new_var_str = '_'.join(new_var)
        replacements[old_var] = new_var_str

    if var[0] == 'w':
        new_var = var[:2]

        id_char = var[2]

        name_char = id_to_char.get(int(id_char))

        new_var.append(name_char)

        new_var_str = '_'.join(new_var)
        replacements[old_var] = new_var_str

    elif var[0] == 'S':
        new_var = var[:1]
        id_char = var[1]
        name_char = id_to_char.get(int(id_char))
        new_var.append(name_char)
        new_var_str = '_'.join(new_var)

        replacements[old_var] = new_var_str

    # print(new_var_str)

# print(replacements)


with open(f'./results/{subject}_{experiment}.sol', 'r') as sol_f:
    content = sol_f.read()

new_content = content
# for old_var, new_var in replacements.items():
#    new_content = re.sub(rf'\b{old_var}\b', new_var, new_content)


# Create a single regex pattern to match any of the old_var values
pattern = re.compile(r'\b(' + '|'.join(re.escape(old_var)
                     for old_var in replacements.keys()) + r')\b')

# Function to look up the replacement value


def replace_match(match):
    return replacements[match.group(0)]


# Perform the substitution in one pass
new_content = pattern.sub(replace_match, new_content)

# output_file = f'./results/{subject}_replaced.sol'
fair_output_file = f'./results/{subject}_{experiment}_replaced.sol'
with open(fair_output_file, 'w') as file:
    file.write(new_content)
