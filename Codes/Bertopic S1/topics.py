import pandas as pd
from bertopic import BERTopic
from sklearn.feature_extraction.text import CountVectorizer
import spacy
from collections import Counter

nlp = spacy.load("en_core_web_sm")

file_path = 'Donnees/fichier_traduit.xlsx'
df = pd.read_excel(file_path)

colonnes_a_combiner = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']
colonnes_existantes = [col for col in colonnes_a_combiner if col in df.columns]
df['combined_text'] = df[colonnes_existantes].fillna('').agg(' '.join, axis=1)
texts = df['combined_text'].tolist()


def semantic_tokenizer(text):
    doc = nlp(text)
    tokens = []
    
    print("\n=== Début de la tokenization interactive ===")
    
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) > 1:  # On ne garde que les groupes de mots
            user_input = input(f"Conserver l'expression '{chunk.text}' ? (o/n) : ").strip().lower()
            if user_input == 'o':
                tokens.append(chunk.text)
    
    for token in doc:
        if token.is_punct or token.is_stop:
            continue
        
        left_context = ' '.join([t.text for t in doc[max(0, token.i-3):token.i]])
        right_context = ' '.join([t.text for t in doc[token.i+1:token.i+4]])
        phrase = f"{left_context} **{token.text}** {right_context}"
        
        user_input = input(f"Conserver le token '{token.text}' ? (o/n) : ").strip().lower()
        if user_input == 'o':
            tokens.append(token.lemma_)

    for token in doc:
        if token.is_punct and token.text in ["!", "?", "..."]:
            tokens.append(token.text)
    
    print("=== Fin de la tokenization interactive ===\n")
    return tokens


vectorizer_model = CountVectorizer(
    tokenizer=semantic_tokenizer,
    ngram_range=(1, 3)
)

seed_topic_list = [
    ["art", "exposition", "musée"],
    ["performance", "spectacle", "scène"],
    ["atelier", "création", "workshop"],
]

topic_model = BERTopic(
    vectorizer_model=vectorizer_model,
    seed_topic_list=seed_topic_list,
    nr_topics="auto",
    calculate_probabilities=True
)

topics, probs = topic_model.fit_transform(texts)

topics_info = topic_model.get_topic_info()
print("Aperçu des topics générés :")
print(topics_info.head(10))

topic_id = 0
print(f"\nTopic {topic_id} :")
print(topic_model.get_topic(topic_id)[:10])

try:
    topic_model.save("modele_bertopic_artspaces")
    print("Modèle sauvegardé avec succès.")
except Exception as e:
    print(f"Erreur lors de la sauvegarde : {e}")
