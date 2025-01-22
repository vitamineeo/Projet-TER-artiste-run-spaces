import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import seaborn as sns

def prepare_data(excel_file: str) -> pd.DataFrame:
    try:
        df = pd.read_excel(excel_file)
        print("Données chargées avec succès.")
        
        # Création de la colonne 'combined'
        df['combined'] = df[['presentation', 'historique', 'activites', 'réponse1', 'réponse2']].fillna('').agg(' '.join, axis=1)
        print("Colonne 'combined' créée avec succès.")
        
        return df
    except Exception as e:
        print(f"Erreur lors du chargement du fichier Excel : {e}")
        raise

def lda_pipeline(texts: list[str], n_topics: int = 5) -> tuple[dict, np.ndarray]:
    vectorizer = CountVectorizer(stop_words='english', max_features=1000)
    doc_term_matrix = vectorizer.fit_transform(texts)

    lda_model = LatentDirichletAllocation(n_components=n_topics, random_state=42)
    lda_output = lda_model.fit_transform(doc_term_matrix)

    feature_names = vectorizer.get_feature_names_out()
    topics = {}
    for topic_idx, topic in enumerate(lda_model.components_):
        top_indices = topic.argsort()[-10:][::-1]
        topics[topic_idx] = [(feature_names[i], round(topic[i], 4)) for i in top_indices]

    return topics, lda_output

def generate_wordcloud(words_with_weights: list[tuple[str, float]], output_file: str, title: str):
    word_freq = {word: weight for word, weight in words_with_weights}
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate_from_frequencies(word_freq)
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation='bilinear')
    plt.axis('off')
    plt.title(title)
    plt.savefig(output_file)
    plt.close()

def display_topic_distribution(lda_output: np.ndarray, output_file: str):
    topic_proportions = lda_output.mean(axis=0)
    plt.figure(figsize=(10, 5))
    plt.bar(range(len(topic_proportions)), topic_proportions)
    plt.xlabel("Topics")
    plt.ylabel("Average Proportion")
    plt.title("Average Topic Distribution")
    plt.savefig(output_file)
    plt.close()

def save_topic_distributions(lda_output: np.ndarray, output_file: str):
    df_topics = pd.DataFrame(lda_output, columns=[f"Topic_{i}" for i in range(lda_output.shape[1])])
    df_topics.to_excel(output_file, index=False)
    print(f"Distributions des topics sauvegardées dans {output_file}.")

def visualize_lda_matrix(lda_output: np.ndarray, output_file: str):
    plt.figure(figsize=(12, 8))
    sns.heatmap(lda_output, cmap="YlGnBu", cbar_kws={'label': 'Topic Contribution'})
    plt.title("Matrix of Topic Contributions by Document")
    plt.xlabel("Topics")
    plt.ylabel("Documents")
    plt.savefig(output_file)
    plt.close()

def main(excel_file: str, columns_to_analyze: list[str], topic_counts: list[int]):
    df = prepare_data(excel_file)
    # Ajout de la colonne 'combined' dans la liste des colonnes à analyser
    if 'combined' not in columns_to_analyze:
        columns_to_analyze.append('combined')

    results = {}
    main_output_dir = "results_lda"
    os.makedirs(main_output_dir, exist_ok=True)

    for column in columns_to_analyze:
        if column not in df.columns:
            print(f"Colonne ignorée : {column} non trouvée dans le fichier.")
            continue

        try:
            texts = df[column].dropna().astype(str).tolist()
            if not texts:
                print(f"Colonne {column} vide ou invalide.")
                continue

            output_dir = os.path.join(main_output_dir, column)
            os.makedirs(output_dir, exist_ok=True)

            for n_topics in topic_counts:
                print(f"Analyse LDA sur '{column}' avec {n_topics} topics.")
                topics, lda_output = lda_pipeline(texts, n_topics)
                files = []

                for topic_num, words_with_weights in topics.items():
                    output_file = os.path.join(output_dir, f"topic_{topic_num}_n{n_topics}.png")
                    generate_wordcloud(words_with_weights, output_file, f"Topic {topic_num} - {column} (n={n_topics})")
                    files.append(output_file)

                dist_output_file = os.path.join(output_dir, f"distribution_n{n_topics}.png")
                display_topic_distribution(lda_output, dist_output_file)

                excel_output_file = os.path.join(output_dir, f"topic_distributions_n{n_topics}.xlsx")
                save_topic_distributions(lda_output, excel_output_file)

                heatmap_output_file = os.path.join(output_dir, f"lda_matrix_n{n_topics}.png")
                visualize_lda_matrix(lda_output, heatmap_output_file)

                results[f"{column}_n{n_topics}"] = {
                    'topics': topics,
                    'files': files,
                    'distribution_plot': dist_output_file,
                    'distribution_excel': excel_output_file,
                    'heatmap': heatmap_output_file
                }
        except Exception as e:
            print(f"Erreur lors de l'analyse de la colonne {column} : {e}")

    return results


if __name__ == "__main__":
    excel_file_path = "fichier_traduit.xlsx"
    colonnes_a_analyser = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']  # Liste des colonnes à analyser
    topic_counts = [5, 10, 15]  # Tester plusieurs nombres de topics
    main(excel_file_path, colonnes_a_analyser, topic_counts)
