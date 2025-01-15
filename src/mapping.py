import re
import os

root = './data'
fp_map = root + f'/map/'
fp_sl = root + f'/sl/'
fp_txt = root + f'/txt/'

subject = 'JurassicPark'


with open(fp_txt+subject+'.master', 'r') as master_f:
    master_file = master_f.readlines()

# print(master_file)

for line in master_file:
    line = line.strip()

    if line.startswith('*'):
        continue

    if not line or line[0].isdigit() or line[0] == ' ':
        continue

    # print(line.strip().split('\n'))
    char_code, char_name = line.strip().split(' ', 1)
    # print(char_name)

characters = []
idx = 0
for id, line in enumerate(master_file):

    if line.startswith('*'):
        continue

    if not line or line[0].isdigit() or line[0] == ' ' or line[0] == '\n':
        continue

    char_code, char_name = line.strip().split(' ', 1)

    character = {
        "id": idx,
        "char": char_code,
        "name": char_name
    }
    idx += 1
    characters.append(character)


# print(characters[0])


def id_to_char_mapping(characters):
    return {char['id']: char['char'] for char in characters}


# print(id_to_char_mapping(characters))
id_to_char = id_to_char_mapping(characters)
print(id_to_char)
# print(id_to_char)

standard_open = f'./results/{subject}.sol'
fair_open = f'./results/{subject}_crosswiggles.sol'
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


with open(f'./results/{subject}_crosswiggles.sol', 'r') as sol_f:
    content = sol_f.read()

new_content = content
for old_var, new_var in replacements.items():
    new_content = re.sub(rf'\b{old_var}\b', new_var, new_content)


# output_file = f'./results/{subject}_replaced.sol'
fair_output_file = f'./results/{subject}_crosswiggles_replaced.sol'
with open(fair_output_file, 'w') as file:
    file.write(new_content)
