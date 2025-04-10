import pandas as pd
import numpy as np
import os
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer
from transformers import BertTokenizer, BertModel
import torch
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.manifold import TSNE
import plotly.express as px
import plotly.graph_objects as go

def excel_to_markdown(excel_path, output_path=None):
    """
    Première étape : Convertir Excel en Markdown
    """
    print("\n=== Étape 1: Conversion Excel → Markdown ===")
    
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Fichier Excel non trouvé: {excel_path}")
    
    if output_path is None:
        output_path = os.path.splitext(excel_path)[0] + "_output.md"
    
    # Lecture du fichier Excel
    print(f"Lecture du fichier: {excel_path}")
    df = pd.read_excel(excel_path)
    
    # Conversion en Markdown
    print("Conversion en format Markdown...")
    markdown_table = df.to_markdown(index=False)
    
    # Sauvegarde du fichier Markdown
    print(f"Sauvegarde du fichier Markdown: {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_table)
    
    return output_path, df.columns.tolist()

def load_markdown_for_analysis(markdown_path):
    """
    Charger le fichier Markdown pour l'analyse
    """
    print("\n=== Étape 2: Chargement du Markdown ===")
    df = pd.read_table(markdown_path, sep='|', skiprows=1)
    df.columns = df.columns.str.strip()
    return df

def preprocess_texts(df, language='french'):
    """
    Prétraitement des textes pour LDA et BERT
    """
    print("\n=== Étape 3: Prétraitement des textes ===")
    
    # Télécharger les ressources NLTK
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')
    
    # Initialisation des outils
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words(language))
    
    def clean_text_for_lda(text):
        if pd.isna(text):
            return ""
        text = str(text).lower()
        text = re.sub(r'[^\w\s]', '', text)
        tokens = word_tokenize(text)
        return ' '.join([lemmatizer.lemmatize(token) for token in tokens if token not in stop_words])
    
    def clean_text_for_bert(text):
        if pd.isna(text):
            return ""
        text = str(text)
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s.,!?]', '', text)
        return text.strip()
    
    # Prétraitement des colonnes textuelles
    text_columns = df.select_dtypes(include=['object']).columns
    
    for column in text_columns:
        print(f"Prétraitement de la colonne: {column}")
        df[f'{column}_lda'] = df[column].apply(clean_text_for_lda)
        df[f'{column}_bert'] = df[column].apply(clean_text_for_bert)
    
    return df, text_columns

def perform_lda_analysis(texts, n_topics=5):
    """
    Analyse LDA
    """
    print("\nRéalisation de l'analyse LDA...")
    
    if not texts or all(pd.isna(text) or text == '' for text in texts):
        return None, None, None, None
    
    vectorizer = CountVectorizer(max_df=0.95, min_df=2, stop_words='french')
    doc_term_matrix = vectorizer.fit_transform(texts)
    
    lda_model = LatentDirichletAllocation(
        n_components=n_topics,
        random_state=42,
        learning_method='online'
    )
    lda_output = lda_model.fit_transform(doc_term_matrix)
    
    feature_names = vectorizer.get_feature_names_out()
    topics = {}
    for topic_idx, topic in enumerate(lda_model.components_):
        top_words = [feature_names[i] for i in topic.argsort()[:-10:-1]]
        topics[f"Topic {topic_idx+1}"] = top_words
    
    return topics, lda_output, lda_model, vectorizer

def perform_bert_analysis(texts):
    """
    Analyse BERT
    """
    print("\nRéalisation de l'analyse BERT...")
    
    if not texts or all(pd.isna(text) or text == '' for text in texts):
        return None
    
    tokenizer = BertTokenizer.from_pretrained('bert-base-multilingual-cased')
    model = BertModel.from_pretrained('bert-base-multilingual-cased')
    
    model.eval()
    embeddings = []
    
    with torch.no_grad():
        for text in texts:
            if pd.isna(text) or text == '':
                embeddings.append(np.zeros(768))
                continue
            inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            outputs = model(**inputs)
            embedding = outputs.last_hidden_state[:, 0, :].numpy()
            embeddings.append(embedding[0])
    
    return np.array(embeddings)

def analyze_column(df, column, n_topics=5):
    """
    Analyser une colonne du DataFrame en utilisant LDA ou BERT
    """
    texts_lda = df[f'{column}_lda'].dropna().tolist()  # Texte préparé pour LDA
    texts_bert = df[f'{column}_bert'].dropna().tolist()  # Texte préparé pour BERT
    
    # Appliquer LDA si nécessaire
    lda_results = None
    if len(texts_lda) > 0:
        lda_results, _, _, _ = perform_lda_analysis(texts_lda, n_topics)
    
    # Appliquer BERT si nécessaire
    bert_results = None
    if len(texts_bert) > 0:
        bert_results = perform_bert_analysis(texts_bert)
    
    return {'lda': lda_results, 'bert': bert_results}


def main_pipeline(excel_file, columns_to_analyze=None, n_topics=5, language='french'):
    """
    Pipeline principal d'analyse
    """
    # 1. Conversion Excel → Markdown
    markdown_path, available_columns = excel_to_markdown(excel_file)
    
    # 2. Chargement du Markdown
    df = load_markdown_for_analysis(markdown_path)
    
    # 3. Prétraitement
    df_processed, text_columns = preprocess_texts(df, language)
    
    # Si aucune colonne spécifiée, analyser toutes les colonnes textuelles
    if columns_to_analyze is None:
        columns_to_analyze = text_columns
    
    # 4. Analyse de chaque colonne
    results = {}
    for column in columns_to_analyze:
        print(f"\nAnalyse de la colonne: {column}")
        results[column] = analyze_column(df_processed, column, n_topics)
    
    return results, markdown_path

if __name__ == "__main__":
    # Configuration
    excel_file = "fichier_trad.xlsx"
    columns_to_analyze = ['réponse1', 'réponse2', 'presentation', 'activites', 'historique']
    
    try:
        # Lancer le pipeline complet
        results, markdown_path = main_pipeline(
            excel_file=excel_file,
            columns_to_analyze=columns_to_analyze,
            n_topics=5,
            language='french'
        )
        
        print(f"\nAnalyse terminée !")
        print(f"Fichier Markdown généré : {markdown_path}")
        print("\nRésultats de l'analyse stockés dans les dossiers 'analysis_results_*'")
        
    except Exception as e:
        print(f"\nErreur lors de l'analyse : {str(e)}")