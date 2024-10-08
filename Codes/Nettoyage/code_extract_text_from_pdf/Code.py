#%%
# extract text from pdf "réponses-ARS-Carré-d’art.pdf"

import PyPDF2
import re

def extract_text_from_pdf(pdf_path):
    pdf_file = open(pdf_path, 'rb')
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ''
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text += page.extract_text() + "\n"  # Ajout de saut de ligne après chaque page
    pdf_file.close()
    return text


def clean_text(text):
    # Correction des coupures de mots avec ou sans tiret
    text = re.sub(r'(\w+)\s?-\s?\n(\w+)', r'\1\2', text)  # Supprime les coupures de mots avec tiret
    text = re.sub(r'(\w+)\s?\n(\w+)', r'\1 \2', text)     # Répare les coupures de mots sans tiret
    
    # Conserve les paragraphes en doublant les sauts de ligne et supprime les simples retours inutiles
    text = re.sub(r'\n{2,}', '\n\n', text)  # Conserve les doubles sauts de ligne pour les paragraphes
    text = re.sub(r'\n+', ' ', text)        # Remplace les simples retours à la ligne par des espaces
    text = re.sub(r'\s+', ' ', text)        # Remplace les espaces multiples par un seul espace
    return text.strip()  # Supprime les espaces en début et en fin de texte

# Écriture du texte nettoyé dans un fichier .txt
def save_text_to_txt(text, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Texte sauvegardé dans le fichier {output_path}")

pdf_path = "reponses-ARS.pdf"
output_txt_path = "extracted_text.txt"

text = extract_text_from_pdf(pdf_path)  
cleaned_text = clean_text(text)  
print(cleaned_text)
save_text_to_txt(cleaned_text, output_txt_path)  