# %%
from bertopic import BERTopic
from bertopic.representation import OpenAI
from sklearn.datasets import fetch_20newsgroups
import openai


# %%
# Fetch dataset
docs = fetch_20newsgroups(
    subset='all', 
    remove=('headers', 'footers', 'quotes')
)['data']

# %%
# Initialize OpenAI client for Ollama
client = openai.OpenAI(
    base_url='http://localhost:11434/v1',  # wherever ollama is running
    api_key='ollama'  # required, but unused
)

# Create representation model with OpenAI
representation_model = OpenAI(client, model='llama3.3')

# %%
# Create and train model with OpenAI representation
topic_model = BERTopic(representation_model=representation_model)
topics, probs = topic_model.fit_transform(docs)
# %%
