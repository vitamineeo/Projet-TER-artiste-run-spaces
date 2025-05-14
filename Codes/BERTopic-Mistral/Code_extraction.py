import docx
import pandas as pd
import os

def extraire_donnees_depuis_docx(chemin_docx):
    """Extrait les données d'un fichier DOCX en structurant les noms, questions et réponses."""
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

def charger_excel_avec_colonnes_vide(chemin_fichier):
    """Charge un fichier Excel ou CSV et initialise les colonnes pour les questions et réponses."""
    extension = os.path.splitext(chemin_fichier)[1].lower()
    
    if extension == '.xlsx' or extension == '.xls':
        df = pd.read_excel(chemin_fichier)
    elif extension == '.csv':
        df = pd.read_csv(chemin_fichier)
    else:
        raise ValueError("Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv.")
    
    for col in ['question1', 'réponse1', 'question2', 'réponse2']:
        if col not in df.columns:
            df[col] = ''
    return df

def mettre_a_jour_dataframe(df, donnees_extraites):
    """Met à jour le DataFrame avec les données extraites du fichier DOCX."""
    dernier_id = df['id'].max() if 'id' in df.columns else 0
    
    for entree in donnees_extraites:
        nom = entree['nom']
        questions = list(entree['questions_reponses'].keys())
        reponses = list(entree['questions_reponses'].values())
        
        if nom in df['nom'].values:
            # Mise à jour des colonnes pour un nom existant
            df.loc[df['nom'] == nom, 'question1'] = questions[0] if len(questions) > 0 else ''
            df.loc[df['nom'] == nom, 'réponse1'] = reponses[0] if len(reponses) > 0 else ''
            df.loc[df['nom'] == nom, 'question2'] = questions[1] if len(questions) > 1 else ''
            df.loc[df['nom'] == nom, 'réponse2'] = reponses[1] if len(reponses) > 1 else ''
        else:
            # Ajout d'une nouvelle ligne si le nom n'existe pas
            dernier_id += 1
            nouvelle_ligne = pd.DataFrame({
                'id': [dernier_id],
                'nom': [nom],
                'question1': [questions[0] if len(questions) > 0 else ''],
                'réponse1': [reponses[0] if len(reponses) > 0 else ''],
                'question2': [questions[1] if len(questions) > 1 else ''],
                'réponse2': [reponses[1] if len(reponses) > 1 else '']
            })
            df = pd.concat([df, nouvelle_ligne], ignore_index=True)
    return df

def sauvegarder_dataframe(df, chemin_sortie, chemin_entree):
    """Sauvegarde le DataFrame dans le même format que le fichier d'entrée."""
    extension = os.path.splitext(chemin_entree)[1].lower()
    
    if extension == '.xlsx' or extension == '.xls':
        df.to_excel(chemin_sortie, index=False)
    elif extension == '.csv':
        df.to_csv(chemin_sortie, index=False)
    else:
        raise ValueError("Format de fichier non supporté pour la sauvegarde.")
    
    print(f"Mise à jour du fichier terminée et sauvegardée dans '{chemin_sortie}'")

def main():
    # Chemins des fichiers
    chemin_docx = 'reponses_ARS.docx'
    chemin_entree = 'new_fichier_traduit.xlsx'  # Peut être .xlsx, .xls ou .csv
    chemin_sortie = 'new_spaces_a_jour' + os.path.splitext(chemin_entree)[1]  # Garde la même extension
    
    # Étapes du traitement
    donnees_extraites = extraire_donnees_depuis_docx(chemin_docx)
    df = charger_excel_avec_colonnes_vide(chemin_entree)
    df = mettre_a_jour_dataframe(df, donnees_extraites)
    sauvegarder_dataframe(df, chemin_sortie, chemin_entree)

if __name__ == "__main__":
    main()