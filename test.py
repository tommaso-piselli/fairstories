import xml.etree.ElementTree as ET
import requests


def get_authors_by_affiliation(affiliation):
    # DBLP API endpoint for person search
    base_url = "https://dblp.org/search/publ/api"

    # Prepare the query parameters
    params = {
        'q': f'affiliation:"{affiliation}"',
        'format': 'xml',
        'h': 1000  # maximum number of results
    }

    try:
        # Send the request to DBLP API
        response = requests.get(base_url, params=params)
        response.raise_for_status()

        # Parse the XML response
        root = ET.fromstring(response.content)

        # Extract unique authors
        authors = set()
        for hit in root.findall('.//hit'):
            author_elements = hit.findall('.//author')
            for author in author_elements:
                authors.add(author.text)

        return list(authors)

    except requests.RequestException as e:
        print(f"Error querying DBLP: {e}")
        return []


# Example usage
affiliation = "University of Perugia"
authors = get_authors_by_affiliation(affiliation)

print(f"Authors affiliated with {affiliation}:")
for author in authors:
    print(author)
