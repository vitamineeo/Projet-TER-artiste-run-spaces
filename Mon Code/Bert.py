import pandas as pd
import numpy as np
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
import umap
import hdbscan
from sklearn.feature_extraction.text import CountVectorizer
import networkx as nx
import matplotlib.pyplot as plt
import seaborn as sns
from umap.umap_ import UMAP
from hdbscan import HDBSCAN


# 1. Chargement et préparation des données avec traitement séparé
def load_and_prepare_data(file_path):
    # Chargement du fichier XLSX
    df = pd.read_excel(file_path, engine='openpyxl')
    
    # Créer des documents séparés pour chaque espace et type d'information
    processed_texts = []
    space_names = []
    text_types = []
    
    for idx, row in df.iterrows():
        # Traiter chaque colonne séparément
        if pd.notna(row['activites']):
            processed_texts.append(str(row['activites']))
            space_names.append(str(row['nom']))
            text_types.append('activites')
            
        if pd.notna(row['presentation']):
            processed_texts.append(str(row['presentation']))
            space_names.append(str(row['nom']))
            text_types.append('presentation')
            
        if pd.notna(row['historique']):
            processed_texts.append(str(row['historique']))
            space_names.append(str(row['nom']))
            text_types.append('historique')
            
        if pd.notna(row['réponse1']):
            processed_texts.append(str(row['réponse1']))
            space_names.append(str(row['nom']))
            text_types.append('reponse1')
            
        if pd.notna(row['réponse2']):
            processed_texts.append(str(row['réponse2']))
            space_names.append(str(row['nom']))
            text_types.append('reponse2')
    
    # Créer un DataFrame structuré avec les textes traités
    processed_df = pd.DataFrame({
        'nom': space_names,
        'type_texte': text_types,
        'texte': processed_texts
    })
    
    # Afficher des informations sur les données chargées
    print(f"Nombre total de documents traités : {len(processed_df)}")
    print("\nRépartition par type de texte :")
    print(processed_df['type_texte'].value_counts())
    print("\nNombre d'espaces uniques :", len(processed_df['nom'].unique()))
    
    return processed_df

# 2. Configuration et entraînement du modèle BERTopic avec métadonnées
def train_bertopic_model(texts, metadata, min_topic_size=3):
    sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Configuration de UMAP
    umap_model = UMAP(n_neighbors=15, 
                     n_components=5,
                     min_dist=0.0,
                     metric='cosine',
                     random_state=42)
    
    # Configuration de HDBSCAN
    hdbscan_model = HDBSCAN(min_cluster_size=3,
                           min_samples=2,
                           metric='euclidean',
                           cluster_selection_method='eom',
                           prediction_data=True)
    
    # Configuration de BERTopic avec paramètres ajustés
    topic_model = BERTopic(
        embedding_model=sentence_model,
        umap_model=umap_model,
        hdbscan_model=hdbscan_model,
        min_topic_size=min_topic_size,
        n_gram_range=(1, 2),
        nr_topics="auto",
        verbose=True
    )
    
    # Entraîner le modèle en conservant les métadonnées
    topics, probs = topic_model.fit_transform(texts)
    
    return topic_model, topics, probs

# 3. Analyse des topics par type de contenu
def analyze_topics_by_content_type(processed_df, topics, topic_model):
    results = {}
    
    # Convertir la liste des topics en Series pandas
    topics_series = pd.Series(topics, index=processed_df.index)
    
    for content_type in processed_df['type_texte'].unique():
        # Filtrer les documents par type de contenu
        mask = processed_df['type_texte'] == content_type
        subset_topics = topics_series[mask]
        
        # Analyser les topics pour ce type de contenu
        type_results = {
            'dominant_topics': subset_topics.value_counts().head(),
            'topic_keywords': {
                topic: topic_model.get_topic(topic)
                for topic in set(subset_topics) if topic != -1
            }
        }
        
        results[content_type] = type_results
    
    return results

# 4. Création du graphe de relations sémantiques avec contexte
def create_semantic_graph(topic_model, processed_df, topics, threshold=0.3):
    G = nx.Graph()
    
    # Obtenir les embeddings pour tous les documents
    embeddings = topic_model._extract_embeddings(processed_df['texte'].tolist())
    
    # Calculer les similarités entre les documents
    from sklearn.metrics.pairwise import cosine_similarity
    similarities = cosine_similarity(embeddings)
    
    # Ajouter les nœuds avec métadonnées
    for i in range(len(processed_df)):
        G.add_node(i, 
                   space_name=processed_df['nom'].iloc[i],
                   content_type=processed_df['type_texte'].iloc[i],
                   topic=topics[i])
    
    # Ajouter les arêtes en tenant compte du contexte
    for i in range(len(processed_df)):
        for j in range(i+1, len(processed_df)):
            if similarities[i,j] > threshold:
                # Ne connecter que les documents du même espace ou du même type
                if (processed_df['nom'].iloc[i] == processed_df['nom'].iloc[j] or 
                    processed_df['type_texte'].iloc[i] == processed_df['type_texte'].iloc[j]):
                    G.add_edge(i, j, weight=similarities[i,j])
    
    return G

# 5. Création des visualisations
def create_visualizations(topic_model, processed_df, graph, content_analysis):
    try:
        # 1. Visualisation des topics principaux (avec gestion d'erreur)
        try:
            fig_topics = topic_model.visualize_topics()
            plt.figure(figsize=(12, 8))
            plt.title("Topics principaux")
            plt.tight_layout()
            plt.savefig("topics_visualization.png")
            plt.close()
        except Exception as e:
            print(f"Erreur lors de la visualisation des topics principaux: {e}")
            print("Création d'une visualisation alternative...")
            # Visualisation alternative des topics
            top_words = {idx: [word for word, _ in topic_model.get_topic(idx)[:10]]
                        for idx in topic_model.get_topics()}
            plt.figure(figsize=(15, 10))
            for idx, words in top_words.items():
                if idx != -1:  # Ignorer le topic -1 (outliers)
                    plt.text(0, idx, f"Topic {idx}: {', '.join(words)}", fontsize=10)
            plt.axis('off')
            plt.title("Topics et leurs mots-clés")
            plt.tight_layout()
            plt.savefig("topics_visualization_alt.png")
            plt.close()

    except Exception as e:
        print(f"Erreur lors de la création des visualisations : {e}")
    # 2. Visualisation du graphe sémantique
    plt.figure(figsize=(15, 10))
    # Définir les couleurs par type de contenu
    content_colors = {
        'activites': 'blue',
        'presentation': 'green',
        'historique': 'red',
        'reponse1': 'purple',
        'reponse2': 'orange'
    }
    
    # Extraire les positions des nœuds
    pos = nx.spring_layout(graph)
    
    # Dessiner les nœuds avec des couleurs différentes selon le type
    for content_type, color in content_colors.items():
        nodes = [n for n, attr in graph.nodes(data=True) 
                if attr['content_type'] == content_type]
        nx.draw_networkx_nodes(graph, pos, nodelist=nodes, 
                             node_color=color, node_size=100,
                             alpha=0.7, label=content_type)
    
    # Dessiner les arêtes
    nx.draw_networkx_edges(graph, pos, alpha=0.2)
    
    plt.title("Graphe des relations sémantiques")
    plt.legend()
    plt.tight_layout()
    plt.savefig("semantic_graph.png")
    plt.close()

    # 3. Distribution des topics par type de contenu
    plt.figure(figsize=(12, 6))
    topic_distributions = []
    for content_type in processed_df['type_texte'].unique():
        mask = processed_df['type_texte'] == content_type
        topic_dist = processed_df[mask]['topic'].value_counts()
        topic_distributions.append({
            'type': content_type,
            'distribution': topic_dist
        })
    
    # Créer un graphique à barres empilées
    df_dist = pd.DataFrame([
        {'type': d['type'], 'topic': topic, 'count': count}
        for d in topic_distributions
        for topic, count in d['distribution'].items()
    ])
    
    pivot_dist = df_dist.pivot(index='topic', columns='type', values='count').fillna(0)
    pivot_dist.plot(kind='bar', stacked=True)
    plt.title("Distribution des topics par type de contenu")
    plt.xlabel("Topic ID")
    plt.ylabel("Nombre de documents")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig("topic_distribution.png")
    plt.close()

    # 4. Heatmap des similarités entre topics
    try:
        # Calculer manuellement les similarités entre topics
        topic_embeddings = topic_model.topic_embeddings_
        topic_similarities = cosine_similarity(topic_embeddings)
        
        plt.figure(figsize=(10, 8))
        sns.heatmap(topic_similarities, cmap='YlOrRd', 
                    xticklabels=True, yticklabels=True)
        plt.title("Similarités entre topics")
        plt.tight_layout()
        plt.savefig("topic_similarities.png")
        plt.close()
    except Exception as e:
        print(f"Erreur lors de la création de la heatmap: {e}")

# Pipeline principal
def run_analysis_pipeline(file_path):
    # 1. Charger et préparer les données
    processed_df = load_and_prepare_data(file_path)
    
    # 2. Entraîner le modèle
    topic_model, topics, probs = train_bertopic_model(
        processed_df['texte'].tolist(),
        metadata=processed_df[['nom', 'type_texte']]
    )
    
    # Ajouter les résultats au DataFrame avant de continuer
    processed_df['topic'] = topics
    processed_df['topic_probability'] = probs
    
    # 3. Analyser les topics par type de contenu
    content_analysis = analyze_topics_by_content_type(processed_df, topics, topic_model)
    
    # 4. Créer le graphe sémantique
    semantic_graph = create_semantic_graph(topic_model, processed_df, topics)
    
    # 5. Créer les visualisations
    create_visualizations(topic_model, processed_df, semantic_graph, content_analysis)
    
    return processed_df, topic_model, semantic_graph, content_analysis

# Utilisation du pipeline
if __name__ == "__main__":
    # Chemin vers votre fichier XLSX
    file_path = "fichier_traduit.xlsx"
    
    # Exécuter le pipeline d'analyse
    results_df, model, graph, content_analysis = run_analysis_pipeline(file_path)
    
    # Afficher les résultats
    print("\nVisualizations have been saved:")
    print("- topics_visualization.png")
    print("- semantic_graph.png")
    print("- topic_distribution.png")
    print("- topic_similarities.png")
    
    # Afficher les résultats par type de contenu
    for content_type, analysis in content_analysis.items():
        print(f"\nAnalyse pour {content_type}:")
        print("Topics dominants:")
        print(analysis['dominant_topics'])
        print("\nMots-clés des topics:")
        for topic, keywords in analysis['topic_keywords'].items():
            print(f"Topic {topic}: {keywords[:5]}")
    
    # Sauvegarder les résultats dans un Excel
    results_df.to_excel("results_with_topics.xlsx", index=False, engine='openpyxl')