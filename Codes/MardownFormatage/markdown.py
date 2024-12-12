import pandas as pd

# Charger le fichier Excel
file_path = "fichier_traduit.xlsx"
df = pd.read_excel(file_path)

# Convertir le DataFrame en Markdown
markdown_table = df.to_markdown(index=False)

# Enregistrer la sortie dans un fichier Markdown
output_path = "fichier_trad_output.md"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(markdown_table)

print(f"Tableau enregistré dans le fichier : {output_path}")
