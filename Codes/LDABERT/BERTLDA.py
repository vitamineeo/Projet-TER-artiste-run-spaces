import pandas as pd
import numpy as np
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer
from transformers import BertTokenizer, BertModel
import torch
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.manifold import TSNE
import plotly.express as px
import plotly.graph_objects as go
import os

def create_output_directory(column_name):
    dir_name = f"analysis_results_{column_name}"
    os.makedirs(dir_name, exist_ok=True)
    return dir_name

def prepare_data(excel_file):
    df = pd.read_excel(excel_file)
    return df

def perform_lda_analysis(texts, n_topics=5):
    if not texts or all(pd.isna(text) or text == '' for text in texts):
        return None, None, None, None
        
    vectorizer = CountVectorizer(max_df=0.95, min_df=2, stop_words='english')
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

def visualize_lda_results(topics, lda_output, texts, output_dir):
    if topics is None or lda_output is None:
        return []

    generated_files = []
    
    plt.figure(figsize=(12, 8))
    sns.heatmap(lda_output, cmap='YlOrRd', xticklabels=[f'Topic {i+1}' for i in range(lda_output.shape[1])])
    plt.title('Topic Distribution Across Documents')
    plt.xlabel('Topics')
    plt.ylabel('Documents')
    plt.tight_layout()
    heatmap_file = f'{output_dir}/lda_heatmap.png'
    plt.savefig(heatmap_file)
    plt.close()
    generated_files.append(heatmap_file)

    fig = go.Figure()
    for i in range(lda_output.shape[1]):
        fig.add_trace(go.Box(y=lda_output[:, i], name=f'Topic {i+1}'))
    fig.update_layout(title='Topic Distribution Box Plot',
                     yaxis_title='Topic Weight',
                     showlegend=True)
    dist_file = f'{output_dir}/topic_distribution.html'
    fig.write_html(dist_file)
    generated_files.append(dist_file)

    try:
        from wordcloud import WordCloud
        for topic_num, words in topics.items():
            wordcloud = WordCloud(width=800, height=400, background_color='white').generate(' '.join(words))
            plt.figure(figsize=(10, 5))
            plt.imshow(wordcloud, interpolation='bilinear')
            plt.axis('off')
            plt.title(f'Word Cloud - {topic_num}')
            cloud_file = f'{output_dir}/wordcloud_topic_{topic_num.split()[-1]}.png'
            plt.savefig(cloud_file)
            plt.close()
            generated_files.append(cloud_file)
    except ImportError:
        print("WordCloud package not installed. Skipping word cloud visualization.")

    return generated_files

def perform_bert_analysis(texts):
    if not texts or all(pd.isna(text) or text == '' for text in texts):
        return None
        
    tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
    model = BertModel.from_pretrained('bert-base-uncased')
    
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

def visualize_bert_embeddings(embeddings, texts, output_dir):
    if embeddings is None:
        return []

    generated_files = []
    
    perplexity = min(30, max(5, len(embeddings) // 3))
    tsne = TSNE(n_components=2, random_state=42, perplexity=perplexity)
    embeddings_2d = tsne.fit_transform(embeddings)
    
    fig = px.scatter(
        x=embeddings_2d[:, 0],
        y=embeddings_2d[:, 1],
        hover_data=[texts],
        title='BERT Embeddings Visualization (t-SNE)'
    )
    scatter_file = f'{output_dir}/bert_embeddings.html'
    fig.write_html(scatter_file)
    generated_files.append(scatter_file)

    similarity_matrix = np.corrcoef(embeddings)
    plt.figure(figsize=(12, 8))
    sns.heatmap(similarity_matrix, cmap='coolwarm')
    plt.title('Document Similarity Matrix (BERT)')
    matrix_file = f'{output_dir}/bert_similarity_matrix.png'
    plt.savefig(matrix_file)
    plt.close()
    generated_files.append(matrix_file)

    try:
        from wordcloud import WordCloud
        for i, text in enumerate(texts):
            if text.strip():  # Ensure text is not empty
                wordcloud = WordCloud(width=800, height=400, background_color='white').generate(text)
                plt.figure(figsize=(10, 5))
                plt.imshow(wordcloud, interpolation='bilinear')
                plt.axis('off')
                plt.title(f'Word Cloud - Document {i+1}')
                cloud_file = f'{output_dir}/wordcloud_document_{i+1}.png'
                plt.savefig(cloud_file)
                plt.close()
                generated_files.append(cloud_file)
    except ImportError:
        print("WordCloud package not installed. Skipping word cloud visualization.")

    return generated_files

def display_results_summary(results):
    print("\n=== Analysis Results Summary ===")
    
    for column, result in results.items():
        print(f"\n\nResults for column: {column}")
        
        if result['topics']:
            print("\nTop words in each topic:")
            for topic_num, words in result['topics'].items():
                print(f"\n{topic_num}:")
                print(", ".join(words[:5]) + "...")
        else:
            print("\nNo meaningful topics found (possibly due to insufficient data)")
        
        print("\nGenerated files:")
        for category, files in result['files'].items():
            if files:
                print(f"\n{category.upper()} files:")
                for file in files:
                    print(f"- {file}")

def main(excel_file, columns_to_analyze, n_topics=5):
    df = prepare_data(excel_file)
    results = {}

    for column in columns_to_analyze:
        texts = df[column].dropna().tolist()
        output_dir = create_output_directory(column)

        topics, lda_output, lda_model, vectorizer = perform_lda_analysis(texts, n_topics)
        lda_files = visualize_lda_results(topics, lda_output, texts, output_dir)

        bert_embeddings = perform_bert_analysis(texts)
        bert_files = visualize_bert_embeddings(bert_embeddings, texts, output_dir)

        results[column] = {
            'topics': topics,
            'files': {
                'lda': lda_files,
                'bert': bert_files
            }
        }
    
    return results

# Liste des colonnes à analyser
columns_to_analyze = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']

# Lancer l'analyse
results = main(
    excel_file="fichier_trad.xlsx",
    columns_to_analyze=columns_to_analyze,
    n_topics=5  # Vous pouvez ajuster le nombre de topics si nécessaire
)

# Afficher le résumé des résultats
display_results_summary(results)