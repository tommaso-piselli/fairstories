import sys

# Set your paths here
subject = 'dblp'
input_master = f"./data/txt/{subject}.master"
output_sl = f"./data/sl/{subject}.sl"


def process_master_file(input_path, output_sl_path, output_transsl_path):
    # Read input file
    with open(input_path, 'r') as file:
        lines = file.read().splitlines()

    characters = {}
    num_characters = 0

    # First pass: Create map (short, character) and retrieve active times
    reading_preamble = True
    for i, line in enumerate(lines):
        if line.startswith('*'):  # comment
            continue
        if reading_preamble:
            if not line:
                reading_preamble = False
                continue
            short = line.split()[0]
            characters[short] = {
                'index': None,
                'masterIndex': num_characters + 1,
                'short': short,
                'birthIndex': None,
                'deathIndex': None
            }
            num_characters += 1
        else:
            if not line:
                continue
            clusters = line.split(':')[1].strip()

            for cluster in clusters.split(';'):
                for short in cluster.split(','):
                    short = short.strip()
                    if short not in characters:
                        print(f"Error: Unknown character: {short}")
                        sys.exit(1)
                    if characters[short]['birthIndex'] is None:
                        characters[short]['birthIndex'] = i
                    characters[short]['deathIndex'] = i

    output = ""
    output_trans_char_mapping = ""
    output_trans_line_mapping = ""

    num_clusters = 0
    num_layers = 0

    # Second pass
    current_character_index = 0
    reading_preamble = True
    clusters_start_index_master = 0

    for i, line in enumerate(lines):
        if line.startswith('*'):
            continue
        if reading_preamble:
            if not line:
                reading_preamble = False
                clusters_start_index_master = i + 1
                continue
        else:
            if not line:
                continue
            master_layer_number = i - clusters_start_index_master + 1
            master_clusters = line.split(':')[1].strip().split(';')

            # Skip if less than 2 characters
            if not master_clusters or len(master_clusters) == 0 or \
               (len(master_clusters) == 1 and len(master_clusters[0].split(',')) <= 1):
                print(
                    f" - Less than 2 characters in layer {i}, skipping -> transsl")
                output_trans_line_mapping += f"{master_layer_number} : -1\n"
                continue

            # Set 'exists in layer' to false for all characters
            for char in characters.values():
                char['existsInLayer'] = False

            cluster_string = ""
            clusters = []

            for cluster in master_clusters:
                current_cluster = []
                for short in cluster.split(','):
                    short = short.strip()
                    char = characters[short]
                    if char['existsInLayer']:
                        print(char)
                        print("Error: Double character in layer")
                        sys.exit(1)
                    if not char.get('index'):
                        current_character_index += 1
                        output_trans_char_mapping += f"{current_character_index} : {char['masterIndex']}\n"
                        char['index'] = current_character_index
                    current_cluster.append(char['index'])
                    char['existsInLayer'] = True

                if not current_cluster:
                    print("Error: Cluster is empty")
                    sys.exit(1)
                cluster_string += f"{len(current_cluster)} {' '.join(map(str, current_cluster))}  "
                clusters.append(current_cluster)

            if not clusters:
                print("Error: Layer is empty")
                sys.exit(1)

            # Write the layer (no duplicate checking)
            output += f"{len(clusters):2d} {cluster_string}\n"
            output_trans_line_mapping += f"{master_layer_number} : {num_layers + 1}\n"
            num_layers += 1
            num_clusters += len(clusters)

    # Add header to output
    output = f"{current_character_index} {num_layers} {num_clusters}\n" + output

    # Write output files
    with open(output_sl_path, 'w') as f:
        f.write(output)
    # with open(output_transsl_path, 'w') as f:
    #     f.write(output_trans_char_mapping + "\n" + output_trans_line_mapping)


# Main execution
if __name__ == "__main__":
    # Add extensions if missing
    if not input_master.endswith('.master'):
        input_master += '.master'
    if not output_sl.endswith('.sl'):
        output_sl += '.sl'

    # Create transsl path from output_sl path
    output_transsl = output_sl[:-3] + '.transsl'

    # Process the file
    process_master_file(input_master, output_sl, output_transsl)
    print(
        f"Processing complete: {input_master} -> {output_sl}, {output_transsl}")
