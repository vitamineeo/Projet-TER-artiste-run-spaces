import pandas as pd
from transformers import MarianMTModel, MarianTokenizer
from bertopic import BERTopic
from langdetect import detect

model_name = 'Helsinki-NLP/opus-mt-mul-en'
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

def translate_to_english(text, tokenizer, model):
    if not text:
        return text
    try:
        if detect(text) == 'en':
            return text
    except:
        return text
    
    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    outputs = model.generate(**inputs)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

file_path = 'Donnees/fichier_mis_a_jour.xlsx'
df = pd.read_excel(file_path)
colonnes_a_traduire = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']

for col in colonnes_a_traduire:
    df[col] = df[col].apply(lambda x: translate_to_english(str(x), tokenizer, model) if pd.notnull(x) and x.strip() else x)

output_path = 'Donnees/fichier_traduit.xlsx'
df.to_excel(output_path, index=False)
print(f"Traduction terminée et sauvegardée dans '{output_path}'.")