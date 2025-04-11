import pandas as pd
from transformers import MarianMTModel, MarianTokenizer
from langdetect import detect
import re
import unicodedata

model_name = 'Helsinki-NLP/opus-mt-mul-en'
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

def clean_text(text):
    # Supprime les caractères non imprimables et normalise
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)  # remplace caractères non-ASCII par un espace
    return text.strip()

def translate_to_english(text, tokenizer, model):
    if not text or not isinstance(text, str):
        return text
    try:
        cleaned = clean_text(text)
        if len(cleaned) < 2:
            return text  # on considère que ce n'est pas traduisible

        if detect(cleaned) == 'en':
            return text
    except:
        pass  # on ignore les erreurs de détection, on traduit dans le doute

    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True)
        outputs = model.generate(**inputs)
        return tokenizer.decode(outputs[0], skip_special_tokens=True)
    except:
        return text  # en cas d'erreur de traduction, on retourne le texte original

file_path = 'Donnees/spacesnew.csv'
df = pd.read_csv(file_path)
colonnes_a_traduire = ['presentation', 'historique', 'activites']

for col in colonnes_a_traduire:
    df[col] = df[col].apply(lambda x: translate_to_english(str(x), tokenizer, model) if pd.notnull(x) and x.strip() else x)

output_path = 'Donnees/new_fichier_traduit.xlsx'
df.to_excel(output_path, index=False)
print(f"Traduction terminée et sauvegardée dans '{output_path}'.")
