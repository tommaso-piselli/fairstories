# First read the groups file to create a mapping of characters to their groups
groups = {}
with open('./data/groups/JurassicPark_groups.txt', 'r') as file:
    for line in file:
        if line.strip():
            parts = line.strip().split(':')
            char = parts[1].strip()
            group = parts[2].strip()
            groups[char] = group

print(groups)
reds = []
blues = []
for _ in groups.items():
    if _[1] == 'red':
        reds.append(_[0])
    else:
        blues.append(_[0])


# Initialize counters for different types of crossings
blue_blue_crossings = 0
red_red_crossings = 0
blue_red_crossings = 0

# Read the solution file
subject = 'JurassicPark'
fp = f'./results/{subject}_all_replaced.sol'

with open(fp, 'r') as file:
    content = file.readlines()

for line in content:
    if line.startswith('#') or line.startswith('x') or line.startswith('w') or line.startswith('S'):
        continue

    new_line = line.strip().split(' ')
    if new_line[1] == '1':
        # Extract the characters from the crossing
        crossing_info = new_line[0].split('_')
        char1 = crossing_info[2]
        char2 = crossing_info[3]

        # Get groups for both characters
        group1 = groups.get(char1)
        group2 = groups.get(char2)

        # Count the crossing based on groups
        if group1 == 'blue' and group2 == 'blue':
            blue_blue_crossings += 1
            # print(f"Blue-Blue crossing: {char1}-{char2}")
        elif group1 == 'red' and group2 == 'red':
            red_red_crossings += 1
            # print(f"Red-Red crossing: {char1}-{char2}")
        elif (group1 == 'blue' and group2 == 'red') or (group1 == 'red' and group2 == 'blue'):
            blue_red_crossings += 1
            # print(f"Blue-Red crossing: {char1}-{char2}")

print("\nSummary:")
print(f"Blue-Blue crossings: {blue_blue_crossings}")
print(f"Red-Red crossings: {red_red_crossings}")
print(f"Blue-Red crossings: {blue_red_crossings}")
print(
    f"Total crossings: {blue_blue_crossings + red_red_crossings + blue_red_crossings}")

print(f'\n-----')
print(f'BlueFair: {((blue_blue_crossings + blue_red_crossings) / len(blues)):.02}')
print(f'RedFair: {((red_red_crossings + blue_red_crossings) / len(reds)):.02}')
