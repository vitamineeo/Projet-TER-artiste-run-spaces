import docx
import csv
import difflib

QUESTION_1 = "Pouvez-vous nous apporter un témoignage sur la façon dont votre structure répond, à travers ses modalités de fonctionnement, au contexte actuel et/ou celui de son émergence ?"
QUESTION_2 = "Pensez-vous que votre espace ou l’espace auquel vous avez participé puisse être considéré comme une œuvre ? Et si oui dans quel sens ?"

def extract_data_from_docx(doc_path):
    doc = docx.Document(doc_path)
    
    data = []
    current_ars = None
    reponse_1 = []
    reponse_2 = []
    state = 'search_ars'
    
    start_paragraph = 1
    paragraphs_to_read = doc.paragraphs[start_paragraph:]

    for para in paragraphs_to_read:
        text = para.text.strip()

        if not text:
            continue
        
        if state == 'search_ars' and any(run.bold for run in para.runs):
            if current_ars:
                data.append({
                    'ARS': current_ars,
                    'Question 1': QUESTION_1,
                    'Réponse 1': ' '.join(reponse_1).strip(),
                    'Question 2': QUESTION_2,
                    'Réponse 2': ' '.join(reponse_2).strip()
                })
            current_ars = text
            reponse_1 = []
            reponse_2 = []
            state = 'search_question_1'

        elif state == 'search_question_1':
            if difflib.get_close_matches(text, [QUESTION_1], cutoff=0.9):
                state = 'collect_response_1'
            else:
                continue

        elif state == 'collect_response_1':
            if difflib.get_close_matches(text, [QUESTION_2], cutoff=0.9):
                state = 'collect_response_2'
            else:
                reponse_1.append(text)

        elif state == 'collect_response_2':
            if "www" in text or any(run.bold for run in para.runs):
                state = 'search_ars'
            else:
                reponse_2.append(text)

    if current_ars:
        data.append({
            'ARS': current_ars,
            'Question 1': QUESTION_1,
            'Réponse 1': ' '.join(reponse_1).strip(),
            'Question 2': QUESTION_2,
            'Réponse 2': ' '.join(reponse_2).strip()
        })
    
    return data

def write_to_csv(data, csv_path):
    with open(csv_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['ARS', 'Question 1', 'Réponse 1', 'Question 2', 'Réponse 2'])
        
        for entry in data:
            writer.writerow([entry['ARS'], entry['Question 1'], entry['Réponse 1'], entry['Question 2'], entry['Réponse 2']])

doc_path = 'Donnees/questions_reponses.docx'
csv_path = 'Donnees/csv_QR_ars.csv'

resultats = extract_data_from_docx(doc_path)

write_to_csv(resultats, csv_path)

print(f"Les données ont été extraites et enregistrées dans {csv_path}")
