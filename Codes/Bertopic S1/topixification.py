import pandas as pd
from bertopic import BERTopic
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

custom_stop_words = ['artist', 'art', 'space', 'contemporary', 'exhibition', 'place', 'work', 'project']
for word in custom_stop_words:
    nlp.vocab[word].is_stop = True

def preprocess_text(text):
    if not text:
        return ''
    doc = nlp(text.lower())
    tokens = [token.lemma_ for token in doc if token.is_alpha and not token.is_stop]
    return ' '.join(tokens)

df = pd.read_excel('Donnees/fichier_traduit.xlsx')
colonnes_a_combiner = ['presentation', 'historique', 'activites', 'réponse1', 'réponse2']

df['combined_text'] = df[colonnes_a_combiner].fillna('').apply(lambda row: ' '.join(row).strip(), axis=1)

df = df[df['combined_text'] != '']

df['cleaned_text'] = df['combined_text'].apply(preprocess_text)

all_stop_words = set(spacy.lang.en.stop_words.STOP_WORDS).union(custom_stop_words)

def remove_stop_words(text):
    return ' '.join([word for word in text.split() if word not in all_stop_words])

df['cleaned_text'] = df['cleaned_text'].apply(remove_stop_words)

topic_model = BERTopic()
topics, probs = topic_model.fit_transform(df['cleaned_text'].tolist())

df['topic'] = topics
df['topic_probability'] = probs

df.to_excel('Donnees/topics_results.xlsx', index=False)
topic_model.save("Donnees/bertopic_model")

topic_info = topic_model.get_topic_info()
topic_info.to_excel('Donnees/topic_info.xlsx', index=False)
