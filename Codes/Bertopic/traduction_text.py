import pandas as pd
from transformers import MarianMTModel, MarianTokenizer
from bertopic import BERTopic

model_name = 'Helsinki-NLP/opus-mt-mul-en'
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

# Fonction de traduction
def translate_to_english(text, tokenizer, model):
    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    outputs = model.generate(**inputs)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# Charger le fichier et spécifier les colonnes à traduire
file_path = 'Donnees/fichier_mis_a_jour.xlsx'
df = pd.read_excel(file_path)
colonnes_a_traduire = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']

# Traduire les colonnes spécifiées
for col in colonnes_a_traduire:
    df[col] = df[col].apply(lambda x: translate_to_english(str(x), tokenizer, model) if pd.notnull(x) else x)

# Sauvegarder le fichier traduit
df.to_excel('fichier_traduit.xlsx', index=False)
print("Traduction terminée et sauvegardée dans 'fichier_traduit.xlsx'.")

# Utiliser BERTopic sur les textes traduits pour analyse thématique
# Combiner les textes des colonnes traduites pour l'analyse
all_texts = df[colonnes_a_traduire].fillna('').apply(lambda row: ' '.join(row), axis=1)

# Créer et entraîner le modèle BERTopic
topic_model = BERTopic()
topics, probs = topic_model.fit_transform(all_texts)

print(topic_model.get_topic_info())
