import pandas as pd
from bertopic import BERTopic
import spacy

# Charger ou télécharger le modèle spaCy
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Ajouter des mots personnalisés aux stop words
custom_stop_words = ['artist', 'art', 'space', 'contemporary', 'exhibition', 'place', 'work', 'project']
for word in custom_stop_words:
    nlp.vocab[word].is_stop = True

# Fonction de prétraitement du texte
def preprocess_text(text):
    if not text:
        return ''
    doc = nlp(text.lower())  # Passage à minuscule
    tokens = [token.lemma_ for token in doc if token.is_alpha and not token.is_stop]  # Lemmatisation et suppression des stop words
    return ' '.join(tokens)

# Charger le fichier et combiner les colonnes spécifiées
df = pd.read_excel('Donnees/fichier_traduit.xlsx')
colonnes_a_combiner = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']

# Combiner les colonnes tout en supprimant les cellules vides (NaN)
df['combined_text'] = df[colonnes_a_combiner].fillna('').apply(lambda row: ' '.join(row).strip(), axis=1)

# Supprimer les lignes où 'combined_text' est vide
df = df[df['combined_text'] != '']

# Nettoyer les textes combinés
df['cleaned_text'] = df['combined_text'].apply(preprocess_text)

# Supprimer explicitement les stop words après nettoyage
all_stop_words = set(spacy.lang.en.stop_words.STOP_WORDS).union(custom_stop_words)

def remove_stop_words(text):
    return ' '.join([word for word in text.split() if word not in all_stop_words])

df['cleaned_text'] = df['cleaned_text'].apply(remove_stop_words)

# Générer les topics avec BERTopic
topic_model = BERTopic()
topics, probs = topic_model.fit_transform(df['cleaned_text'].tolist())

# Ajouter les résultats au DataFrame
df['topic'] = topics
df['topic_probability'] = probs

# Sauvegarder les résultats
df.to_excel('Donnees/topics_results.xlsx', index=False)
topic_model.save("Donnees/bertopic_model")

# Exporter les informations sur les topics
topic_info = topic_model.get_topic_info()
topic_info.to_excel('Donnees/topic_info.xlsx', index=False)
