import sys

# Get subject and experiment from command-line arguments
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 log_stats.py <subject> <experiment>")
        sys.exit(1)

    subject = sys.argv[1]
    experiment = sys.argv[2]

    # Read the solution file
    fp = f'./results/{subject}/coloring1/sol/{experiment}/{subject}_{experiment}_replaced.sol'

    groups = {}
    with open(f'./data/groups/{subject}_groups.txt', 'r') as file:
        for line in file:
            if line.strip():
                parts = line.strip().split(':')
                char = parts[1].strip()
                group = parts[2].strip()
                groups[char] = group

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

        if line.startswith('#') or line.startswith('x') or line.startswith('w') or line.startswith('S') or line.startswith('beta') or line.startswith('b') or line.startswith('delta'):
            continue

        new_line = line.strip().split(' ')
        if new_line[1] == '1':
            crossing_info = new_line[0].split('_')
            char1 = crossing_info[2]
            char2 = crossing_info[3]

            group1 = groups.get(char1)
            group2 = groups.get(char2)

            if group1 == 'blue' and group2 == 'blue':
                blue_blue_crossings += 1
            elif group1 == 'red' and group2 == 'red':
                red_red_crossings += 1
            elif (group1 == 'blue' and group2 == 'red') or (group1 == 'red' and group2 == 'blue'):
                blue_red_crossings += 1

    # Print results to terminal
    print(f"Summary for {subject}_{experiment}:")
    print("=====================================")
    print(f"Total characters: {len(groups)}")
    print(f"Blue characters: {len(blues)}")
    print(f"Red characters: {len(reds)}")

    print(f'\n---\n> Crossings')
    print(f"Blue-Blue crossings: {blue_blue_crossings}")
    print(f"Red-Red crossings: {red_red_crossings}")
    print(f"Blue-Red crossings: {blue_red_crossings}")
    print(
        f"Total crossings: {blue_blue_crossings + red_red_crossings + blue_red_crossings}")

    print(f'\n---\n> FairCrossings')
    print(
        f'BlueFair: {((blue_blue_crossings*2 + blue_red_crossings) / len(blues)):.02f}')
    print(
        f'RedFair: {((red_red_crossings*2 + blue_red_crossings) / len(reds)):.02f}')
    print(f'Unfairness {abs(((blue_blue_crossings*2 + blue_red_crossings) / len(blues)) - ((red_red_crossings*2 + blue_red_crossings) / len(reds))):.02f}')

    print(f'\n---\n> Skewness')
    print(f"BlueSkew: {blue_skew}")
    print(f"RedSkew: {red_skew}")
    print(f"Total skewness: {blue_skew + red_skew}")

    print(f'\n---\n> FairSkewness')
    print(
        f"Unfairness {abs((blue_skew / len(blues)) - (red_skew / len(reds))):.02f}")

    print(f'\n---\n> Wiggles')
    print(f"Total wiggles: {sum([int(v) for v in wiggles.values()])}")

    print(f'\n---\n> FairWiggles')
    print(f'BlueWiggles: {blue_wiggles}')
    print(f'RedWiggles: {red_wiggles}')
    print(
        f'Unfairness {abs((blue_wiggles / len(blues)) - (red_wiggles / len(reds))):.02f}')
