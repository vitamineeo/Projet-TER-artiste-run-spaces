import warnings
from transformers import logging
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import os
import PyPDF2
import gensim  # Ajout de l'import de gensim
from gensim import corpora  # Ajout de l'import de corpora
from LDABERT import preprocess_text, appliquer_lda  # Import des fonctions nécessaires depuis LDABERT

logging.set_verbosity_error()  # Ignore les avertissements du modèle transformers
warnings.filterwarnings("ignore")

# Fonction pour lire le contenu d'un PDF
def lire_pdf(chemin_pdf):
    texte = ""
    with open(chemin_pdf, "rb") as fichier_pdf:
        lecteur = PyPDF2.PdfReader(fichier_pdf)
        for page in lecteur.pages:
            texte += page.extract_text() + "\n"
    return texte

# Fonction pour générer un nuage de mots
def generer_nuage_de_mots(lda_model, num_topics=2, dossier_sortie="nuages_de_mots"):
    if not os.path.exists(dossier_sortie):
        os.makedirs(dossier_sortie)

    for topic_id in range(num_topics):
        words = dict(lda_model.show_topic(topic_id, topn=20))  # Utilisation de show_topic sur le modèle LDA
        wordcloud = WordCloud(
            width=800, height=400,
            background_color='white'
        ).generate_from_frequencies(words)
        
        chemin_fichier = os.path.join(dossier_sortie, f"topic_{topic_id}.png")
        plt.figure(figsize=(10, 5))
        plt.imshow(wordcloud, interpolation="bilinear")
        plt.axis("off")
        plt.title(f"Topic {topic_id}", fontsize=16)
        plt.savefig(chemin_fichier)
        plt.close()
        print(f"Nuage de mots sauvegardé : {chemin_fichier}")

if __name__ == '__main__':
    chemin_pdf = "resultats.pdf"
    texte_extrait = lire_pdf(chemin_pdf)
    print(f"Texte extrait du PDF :\n{texte_extrait[:500]}")
    
    lignes = texte_extrait.split("\n")
    
    # Appliquer LDA et vérifier les résultats
    processed_texts = [preprocess_text(text) for text in lignes]
    dictionary = corpora.Dictionary(processed_texts)
    corpus = [dictionary.doc2bow(text) for text in processed_texts]
    
    # Entraîner un modèle LDA sur le corpus
    lda_model = gensim.models.LdaMulticore(corpus, num_topics=2, id2word=dictionary, passes=10, workers=4)
    
    # Générer des nuages de mots
    generer_nuage_de_mots(lda_model)
