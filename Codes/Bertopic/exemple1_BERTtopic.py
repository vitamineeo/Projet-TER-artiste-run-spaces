import pandas as pd
from transformers import MarianMTModel, MarianTokenizer
from bertopic import BERTopic
from langdetect import detect, LangDetectException
from sklearn.decomposition import PCA
import umap
import hdbscan
from sklearn.feature_extraction.text import TfidfVectorizer

# Charger les données depuis un fichier Excel
file_path = '/Users/jerome/Documents/Master1/Semestre1/TER-Gestion de Projet/Codes_Moi/code_extract_text_from_pdf/fichier_mis_a_jour.xlsx'
df = pd.read_excel(file_path)

columns_to_analyze = ['question1', 'question2', 'réponse1', 'réponse2']  # Remplace par les noms de tes colonnes

# Convertir les colonnes en chaînes de caractères
for column in columns_to_analyze:
    df[column] = df[column].astype(str)

# Modèles de traduction pour plusieurs langues
model_name_mapping = {
    'fr': 'Helsinki-NLP/opus-mt-fr-en',
    'es': 'Helsinki-NLP/opus-mt-es-en',
    'en': None  # Pas de traduction nécessaire pour l'anglais
}

# Fonction pour charger le bon modèle selon la langue détectée
def load_model(language_code):
    model_name = model_name_mapping.get(language_code)
    if model_name is None:
        return None, None  # Pas de modèle nécessaire pour l'anglais
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    model = MarianMTModel.from_pretrained(model_name)
    return tokenizer, model

# Fonction de traduction vers l'anglais
def translate_to_english(texts):
    translated = []
    for text in texts:
        if not text.strip():
            # Si le texte est vide ou ne contient que des espaces, on ignore
            translated.append(text)
            continue
        try:
            lang = detect(text)
            tokenizer, model = load_model(lang)
            if tokenizer and model:
                inputs = tokenizer(text, return_tensors="pt", truncation=True)
                outputs = model.generate(**inputs)
                translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            else:
                translated_text = text  # Pas de traduction nécessaire
            translated.append(translated_text)
        except LangDetectException:
            print(f"Langue non détectée pour le texte: '{text}'")
            translated.append(text)
    return translated

# Processus d'analyse pour chaque colonne individuellement
for column in columns_to_analyze:
    texts = df[column].tolist()
    texts_english = translate_to_english(texts)

    # Vectorisation TF-IDF des textes
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(texts_english)

    # Réduction de dimensionnalité avec PCA d'abord
    pca = PCA(n_components=2)
    pca_embedding = pca.fit_transform(tfidf_matrix.toarray())

    # Puis, réduction de dimensionnalité avec UMAP
    umap_model = umap.UMAP(n_neighbors=2, n_components=2, min_dist=0.1, metric='cosine')
    umap_embedding = umap_model.fit_transform(pca_embedding)

    # Clustering avec HDBSCAN
    cluster_model = hdbscan.HDBSCAN(min_cluster_size=2, metric='euclidean', cluster_selection_method='eom')
    cluster_labels = cluster_model.fit_predict(umap_embedding)

    # Utilisation de BERTopic pour l'analyse thématique
    topic_model = BERTopic(embedding_model=umap_model, hdbscan_model=cluster_model)
    topics, probs = topic_model.fit_transform(texts_english)

    # Affichage des résultats
    print(f"Résultats pour la colonne {column}:")
    print(topic_model.get_topic_info())

    # Sauvegarde des données dans un fichier Excel
    output_path = f'{column}_bertopic_results.xlsx'
    topic_model.save(output_path)
    print(f"Résultats sauvegardés dans le fichier {output_path}")