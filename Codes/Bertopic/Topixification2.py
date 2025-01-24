import pandas as pd
from bertopic import BERTopic
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

file_path = 'Donnees/fichier_traduit.xlsx'
df = pd.read_excel(file_path)

# Combiner les colonnes nécessaires pour former le texte complet
colonnes_a_combiner = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']
df['combined_text'] = df[colonnes_a_combiner].fillna('').agg(' '.join, axis=1)

texts = df['combined_text'].tolist()

# Définir une liste personnalisée de stop words
custom_stop_words = list(ENGLISH_STOP_WORDS.union({'le', 'la', 'de', 'des', 'et', 'en', 'un', 'une', 'du', 'au', 'aux'}))

# Configurer TfidfVectorizer avec les stop words personnalisés
vectorizer = TfidfVectorizer(stop_words=custom_stop_words, max_df=0.8)
tfidf_matrix = vectorizer.fit_transform(texts)

# Créer des embeddings avec SentenceTransformer
pretrained_model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = pretrained_model.encode(texts)

# Appliquer BERTopic pour l'extraction de topics
topic_model = BERTopic(top_n_words=50, verbose=True)
topics, probs = topic_model.fit_transform(texts, embeddings)

# Afficher les topics estimés
print("Noms estimés pour chaque topic :")
for topic_num in range(len(set(topics))):
    topic_keywords = topic_model.get_topic(topic_num)
    if len(topic_keywords) > 0:
        topic_name = ' '.join([word for word, _ in topic_keywords[:3]])
        print(f"Topic {topic_num}: {topic_name}")

# Visualiser les topics
topic_model.visualize_topics()
