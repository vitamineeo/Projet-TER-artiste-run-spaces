import docx  # python-docx est importé en tant que 'docx'
import pandas as pd

def extraire_donnees_depuis_docx(chemin_docx):
    document = docx.Document(chemin_docx)
    
    donnees = []
    nom_actuel = None
    question_actuelle = None
    questions_reponses = {}
    
    for paragraphe in document.paragraphs:
        texte = paragraphe.text.strip()
        
        if paragraphe.style.name.startswith('Heading'):  # Suppose que le nom est un titre
            if nom_actuel and questions_reponses:
                donnees.append({'nom': nom_actuel, 'questions_reponses': questions_reponses})
            nom_actuel = texte
            questions_reponses = {}
            question_actuelle = None
        
        elif texte.startswith("Q"):  
            question_actuelle = texte
            questions_reponses[question_actuelle] = ''
        
        elif question_actuelle:  # Suppose que tout texte après une question est une réponse
            questions_reponses[question_actuelle] += ' ' + texte
    
    if nom_actuel and questions_reponses:
        donnees.append({'nom': nom_actuel, 'questions_reponses': questions_reponses})
    
    return donnees

# Utilisation
chemin_docx = 'réponses-ARS-Carré-dart-sans mise en fome.docx'
donnees_extraites = extraire_donnees_depuis_docx(chemin_docx)

# Charger le fichier Excel avec pandas
df = pd.read_excel('spacestri.xlsx')

# Ajouter les colonnes pour les questions et réponses dans le DataFrame
df['question1'] = ''
df['réponse1'] = ''
df['question2'] = ''
df['réponse2'] = ''

# Parcourir les données extraites du DOCX
for entree in donnees_extraites:
    nom = entree['nom']
    questions = list(entree['questions_reponses'].keys())
    reponses = list(entree['questions_reponses'].values())
    
    # Si le nom est dans le DataFrame, on remplit les colonnes correspondantes
    if nom in df['nom'].values:
        df.loc[df['nom'] == nom, 'question1'] = questions[0] if len(questions) > 0 else ''
        df.loc[df['nom'] == nom, 'réponse1'] = reponses[0] if len(reponses) > 0 else ''
        df.loc[df['nom'] == nom, 'question2'] = questions[1] if len(questions) > 1 else ''
        df.loc[df['nom'] == nom, 'réponse2'] = reponses[1] if len(reponses) > 1 else ''
    
    # Si le nom n'est pas dans le DataFrame, on ajoute une nouvelle ligne
    else:
        nouvelle_ligne = pd.DataFrame({
            'nom': [nom],
            'question1': [questions[0] if len(questions) > 0 else ''],
            'réponse1': [reponses[0] if len(reponses) > 0 else ''],
            'question2': [questions[1] if len(questions) > 1 else ''],
            'réponse2': [reponses[1] if len(reponses) > 1 else '']
        })
        df = pd.concat([df, nouvelle_ligne], ignore_index=True)

# Sauvegarder le DataFrame mis à jour dans un fichier Excel ou CSV
df.to_excel('fichier_mis_a_jour.xlsx', index=False)
print("Mise à jour du fichier Excel terminée et sauvegardée dans 'fichier_mis_a_jour.xlsx'")
