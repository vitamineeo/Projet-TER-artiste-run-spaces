import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from bertopic import BERTopic
from wordcloud import WordCloud
import matplotlib.pyplot as plt

# =============================
# Étape 1 : Préparation des données
# =============================
def prepare_data(excel_file: str) -> pd.DataFrame:
    """
    Charge un fichier Excel et prépare les données pour l'analyse.
    Args:
        excel_file (str): Chemin vers le fichier Excel à charger.
    Returns:
        pd.DataFrame: Un DataFrame nettoyé avec des colonnes textuelles.
    """
    try:
        df = pd.read_excel(excel_file)
        print("Données chargées avec succès.")
        return df
    except Exception as e:
        print(f"Erreur lors du chargement du fichier Excel : {e}")
        raise

# =============================
# Étape 2 : Pipeline LDA
# =============================
def lda_pipeline(texts: list[str], n_topics: int = 5) -> tuple[dict, np.ndarray]:
    """
    Applique LDA sur une liste de textes et retourne les topics générés.
    Args:
        texts (list[str]): Liste de textes à analyser.
        n_topics (int): Nombre de topics à générer.
    Returns:
        dict: Topics générés avec leurs mots-clés.
        np.ndarray: Matrice des probabilités des topics.
    """
    vectorizer = CountVectorizer(stop_words='english', max_features=1000)
    doc_term_matrix = vectorizer.fit_transform(texts)

    lda_model = LatentDirichletAllocation(n_components=n_topics, random_state=42)
    lda_output = lda_model.fit_transform(doc_term_matrix)

    topics = {
        i: [vectorizer.get_feature_names_out()[idx] for idx in topic.argsort()[-10:]]
        for i, topic in enumerate(lda_model.components_)
    }

    return topics, lda_output

# =============================
# Étape 3 : Pipeline BERTopic
# =============================
def bert_pipeline(texts: list[str]) -> tuple[BERTopic, dict]:
    """
    Applique BERTopic sur une liste de textes et retourne les topics générés.
    Args:
        texts (list[str]): Liste de textes à analyser.
    Returns:
        BERTopic: Modèle BERTopic entraîné.
        dict: Topics générés avec leurs mots-clés.
    """
    bert_model = BERTopic()
    topics, _ = bert_model.fit_transform(texts)

    topic_words = {
        topic: bert_model.get_topic(topic)
        for topic in bert_model.get_topics().keys()
        if topic != -1
    }

    return bert_model, topic_words

# =============================
# Étape 4 : Visualisation
# =============================
def generate_wordcloud(words: list[str], output_file: str, title: str):
    """
    Génère un WordCloud à partir d'une liste de mots.
    Args:
        words (list[str]): Liste de mots pour le WordCloud.
        output_file (str): Chemin pour enregistrer le WordCloud.
        title (str): Titre du WordCloud.
    """
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(' '.join(words))
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation='bilinear')
    plt.axis('off')
    plt.title(title)
    plt.savefig(output_file)
    plt.close()

# =============================
# Étape 5 : Gestion des résultats
# =============================
def compile_results(lda_topics: dict, bert_topics: dict, lda_files: list[str], bert_files: list[str]) -> dict:
    """
    Compile les résultats des analyses LDA et BERTopic.
    Args:
        lda_topics (dict): Topics générés par LDA.
        bert_topics (dict): Topics générés par BERTopic.
        lda_files (list[str]): Fichiers générés par LDA.
        bert_files (list[str]): Fichiers générés par BERTopic.
    Returns:
        dict: Résultats compilés.
    """
    return {
        'lda_topics': lda_topics,
        'bert_topics': bert_topics,
        'lda_files': lda_files,
        'bert_files': bert_files
    }

def display_results_summary(results: dict):
    """
    Affiche un résumé des résultats d'analyse.
    Args:
        results (dict): Résultats compilés.
    """
    for column, data in results.items():
        print(f"\nColonne : {column}")
        print("--- LDA Topics ---")
        for topic, words in data['lda_topics'].items():
            print(f"Topic {topic}: {', '.join(words)}")

        print("--- BERTopic Topics ---")
        for topic, words in data['bert_topics'].items():
            print(f"Topic {topic}: {', '.join([word[0] for word in words])}")

# =============================
# Étape 6 : Fonction principale
# =============================
def main(excel_file: str, columns_to_analyze: list[str], n_topics: int = 5):
    """
    Fonction principale pour exécuter les analyses LDA et BERTopic sur des colonnes spécifiques.
    Args:
        excel_file (str): Chemin du fichier Excel à analyser.
        columns_to_analyze (list[str]): Liste des colonnes à analyser.
        n_topics (int): Nombre de topics pour LDA.
    """
    df = prepare_data(excel_file)
    results = {}

    for column in columns_to_analyze:
        if column not in df:
            print(f"Colonne ignorée : {column} non trouvée dans le fichier.")
            continue

        texts = df[column].dropna().astype(str).tolist()
        if not texts:
            print(f"Colonne {column} vide ou invalide.")
            continue

        # Créer un dossier de sortie
        output_dir = os.path.join("results", column)
        os.makedirs(output_dir, exist_ok=True)

        # Analyse LDA
        lda_topics, lda_output = lda_pipeline(texts, n_topics)
        lda_files = []
        for topic, words in lda_topics.items():
            output_file = os.path.join(output_dir, f"lda_topic_{topic}.png")
            generate_wordcloud(words, output_file, f"LDA Topic {topic}")
            lda_files.append(output_file)

        # Analyse BERTopic
        bert_model, bert_topics = bert_pipeline(texts)
        bert_files = []
        for topic, words in bert_topics.items():
            output_file = os.path.join(output_dir, f"bert_topic_{topic}.png")
            generate_wordcloud([word[0] for word in words], output_file, f"BERTopic Topic {topic}")
            bert_files.append(output_file)

        # Compiler les résultats
        results[column] = compile_results(lda_topics, bert_topics, lda_files, bert_files)

    display_results_summary(results)

# =============================
# Lancer le script
# =============================
if __name__ == "__main__":
    excel_file_path = "fichier_trad.xlsx"
    colonnes_a_analyser = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']  # Remplacez par vos colonnes
    main(excel_file_path, colonnes_a_analyser, n_topics=5)
