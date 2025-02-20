import os
import re

# Function to extract unique characters from the .master file


def extract_unique_characters(master_file_path):
    character_list = []
    with open(master_file_path, 'r') as file:
        for line in file:
            # Match lines with the ':' format and extract content between colons
            match = re.search(r":\s*([^:]+)\s*:", line)
            if match:
                # Extract characters, split by delimiters, and preserve order without duplicates
                characters = re.split(r'[,\s;]+', match.group(1).strip())
                for char in characters:
                    if char and char not in character_list:
                        character_list.append(char)
    return character_list

# Function to save the indexed character list to a file


def save_indexed_characters(character_list, output_folder, subject):
    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    output_file_path = os.path.join(
        output_folder, f"{subject}_map.txt")

    # Write the indexed characters to the file
    with open(output_file_path, 'w') as file:
        for idx, char in enumerate(character_list):
            file.write(f"{idx} : {char}\n")

    return output_file_path


def main():

    subject = "huck"
    master_file_path = f"./data/txt/{subject}.master"

    output_folder = "./data/map"
    character_list = extract_unique_characters(master_file_path)

    output_file_path = save_indexed_characters(
        character_list, output_folder, subject)

    print(f"Indexed character list saved to: {output_file_path}")


if __name__ == "__main__":
    main()
