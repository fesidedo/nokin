import json

def find_all_tokens(file_path:str) -> set[str]:
    with open(file_path, "r") as file:
        json_data = json.load(file)
        tokens = set()
        for lens in json_data["lenses"]:
            tokens.update(lens["variant_tokens"])
    return tokens

if __name__ == "__main__":
    tokens = find_all_tokens("data/processed/lenses.v1.json")
    print(tokens)