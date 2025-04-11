import pandas as pd
from transformers import MarianMTModel, MarianTokenizer
from langdetect import detect
import re
import unicodedata

# Chargement du modèle de traduction
model_name = 'Helsinki-NLP/opus-mt-mul-en'
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

# Fonction de nettoyage pour la détection de langue
def clean_text(text):
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)  # remplace caractères non-ASCII par un espace
    return text.strip()

# Fonction de traduction conditionnelle
def translate_to_english(text, tokenizer, model):
    if not text or not isinstance(text, str):
        return text
    try:
        cleaned = clean_text(text)
        if len(cleaned) < 2:
            return text
        if detect(cleaned) == 'en':
            return text
    except:
        pass
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True)
        outputs = model.generate(**inputs)
        return tokenizer.decode(outputs[0], skip_special_tokens=True)
    except:
        return text

# Fonction pour encoder les caractères illégaux pour Excel
def safe_excel_text(text):
    if not isinstance(text, str):
        return text
    return ''.join(
        f"<0x{ord(c):02x}>" if unicodedata.category(c)[0] == 'C' and c not in '\n\t' else c
        for c in text
    )

# Chargement des données
file_path = 'Donnees/spacesnew.csv'
df = pd.read_csv(file_path)

# Colonnes à traduire
colonnes_a_traduire = ['presentation', 'historique', 'activites']

# Application de la traduction
for col in colonnes_a_traduire:
    df[col] = df[col].apply(lambda x: translate_to_english(str(x), tokenizer, model) if pd.notnull(x) and x.strip() else x)

# Nettoyage des caractères non supportés par Excel
df = df.applymap(safe_excel_text)

# Export vers Excel
output_path = 'Donnees/new_fichier_traduit.xlsx'
df.to_excel(output_path, index=False)

print(f"✅ Traduction terminée et sauvegardée dans '{output_path}'.")
