# First read the groups file to create a mapping of characters to their groups

# Read the solution file
subject = 'JurassicPark'
experiment = 'crosscountXW_2'
fp = f'./results/{subject}_{experiment}_replaced.sol'

groups = {}
with open(f'./data/groups/{subject}_groups.txt', 'r') as file:
    for line in file:
        if line.strip():
            parts = line.strip().split(':')
            char = parts[1].strip()
            group = parts[2].strip()
            groups[char] = group

# print(groups)
reds = []
blues = []
for _ in groups.items():
    if _[1] == 'red':
        reds.append(_[0])
    else:
        blues.append(_[0])


# Initialize counters
blue_skew = 0
red_skew = 0

blue_blue_crossings = 0
red_red_crossings = 0
blue_red_crossings = 0

wiggles = {}
blue_wiggles = 0
red_wiggles = 0


with open(fp, 'r') as file:
    content = file.readlines()

for line in content:
    if line.startswith('w'):
        new_line_w = line.strip().split(' ')
        char = new_line_w[0].split('_')[2]
        group = groups.get(char)

        wiggles_number = float(new_line_w[1])
        wiggles_number = float(f"{wiggles_number:.1f}")

        if group == 'blue':
            blue_wiggles += wiggles_number
        else:
            red_wiggles += wiggles_number

        if wiggles_number != 0:
            wiggles.update({new_line_w[0]: wiggles_number})

    if line.startswith('S'):
        new_line_S = line.strip().split(' ')
        char = new_line_S[0].split('_')[1]
        group = groups.get(char)

        skew_number = int(new_line_S[1])

        if group == 'blue':
            blue_skew += skew_number
        else:
            red_skew += skew_number

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


print(f"Summary for {subject}_{experiment}:")
print("=====================================")
print(f"Total characters: {len(groups)}")
print(f"Blue characters: {len(blues)}")
print(f"Red characters: {len(reds)}")

# Crossings
print(f'---\n> Crossings')
print(f"Blue-Blue crossings: {blue_blue_crossings}")
print(f"Red-Red crossings: {red_red_crossings}")
print(f"Blue-Red crossings: {blue_red_crossings}")
print(
    f"Total crossings: {blue_blue_crossings + red_red_crossings + blue_red_crossings}")

# FairCrossings
print(f'---\n> FairCrossings')
print(
    f'BlueFair: {((blue_blue_crossings*2 + blue_red_crossings) / len(blues)):.02}')
print(
    f'RedFair: {((red_red_crossings*2 + blue_red_crossings) / len(reds)):.02}')
print(f'Unfairness {abs(((blue_blue_crossings*2 + blue_red_crossings) / len(blues)) - ((red_red_crossings*2 + blue_red_crossings) / len(reds))):.02}')

# Skewness
print(f'---\n> Skewness')
print(f"BlueSkew: {blue_skew}")
print(f"RedSkew: {red_skew}")
print(f"Total skewness: {blue_skew + red_skew}")

# FairSkewness
print(f'---\n> FairSkewness')
print(
    f"Unfairness {abs((blue_skew / len(blues)) - (red_skew / len(reds))):.02}")


# Wiggles
print(f'---\n> Wiggles')
# print wiggles without going in a new line
# format: w_1: 2 | w_2: 3 | w_3: 4
# for k, v in wiggles.items():
#     print(f'{k}: {v}', end=' | ')

print(f"Total wiggles: {sum([int(v) for v in wiggles.values()])}")

# 6. FairWiggles
print(f'---\n> FairWiggles')
print(f'BlueWiggles: {blue_wiggles}')
print(f'RedWiggles: {red_wiggles}')
print(
    f'Unfairness {abs((blue_wiggles / len(blues)) - (red_wiggles / len(reds))):.02}')
