import pandas as pd
import sqlite3

def charger_fichier_excel(chemin_fichier):
    
    return pd.read_excel(chemin_fichier)

def selectionner_colonnes(df):
    """Sélectionner les colonnes nécessaires dans le DataFrame"""
    df_selection1 = df[['id', 'nom', 'historique', 'activites', 'presentation', 
                        'date_ouverture', 'date_fermeture', 'website', 'pays', 
                        'ville', 'latitude', 'longitude']]
    df_selection2 = df[['id', 'responsables']]
    df_selection3 = df[['id', 'question1', 'réponse1', 'question2', 'réponse2']]
    return df_selection1, df_selection2, df_selection3

def verifier_valeurs_manquantes(df, colonne):
    """Vérifier les valeurs manquantes dans une colonne spécifique"""
    missing_values_count = df[colonne].isnull().sum()
    print(f"Nombre de valeurs manquantes dans '{colonne}' : {missing_values_count}")

def verifier_valeurs_dupliquees(df, colonne):
    """Vérifier les doublons dans une colonne spécifique"""
    duplicates = df[colonne][df[colonne].duplicated(keep=False)]
    if not duplicates.empty:
        print(f"Les identifiants suivants sont en double dans '{colonne}':")
        print(duplicates)
    else:
        print(f"Tous les identifiants dans '{colonne}' sont uniques.")

def creer_tables_sqlite(conn):
    """Créer les tables nécessaires dans la base de données SQLite"""
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Question_Reponse (
        id_QR INTEGER PRIMARY KEY,
        question1 TEXT,
        reponse1 TEXT,
        question2 TEXT,
        reponse2 TEXT
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Responsable (
        id_R INTEGER PRIMARY KEY,
        responsables TEXT,
        id_QReponse INTEGER,
        FOREIGN KEY (id_QReponse) REFERENCES Question_Reponse (id_QR)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Espace (
        id_E INTEGER PRIMARY KEY,
        nom TEXT,
        historique TEXT,
        activites TEXT,
        presentation TEXT,
        date_ouverture DATE,
        date_fermeture DATE,
        website TEXT,
        pays TEXT,
        ville TEXT,
        latitude TEXT,
        longitude TEXT
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tenir (
        id_tenir INTEGER PRIMARY KEY,
        id_espace INTEGER,
        id_responsable INTEGER,
        FOREIGN KEY (id_espace) REFERENCES Espace(id_E),
        FOREIGN KEY (id_responsable) REFERENCES Responsable(id_R)
    );
    ''')

def vider_tables(conn):
    """Supprimer toutes les données existantes dans les tables"""
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tenir')
    cursor.execute('DELETE FROM Responsable')
    cursor.execute('DELETE FROM Question_Reponse')
    cursor.execute('DELETE FROM Espace')
    conn.commit()
    
    
def inserer_donnees_table(df, table, conn):
    """Insérer les données dans la table SQLite correspondante"""
    cursor = conn.cursor()
    if table == 'Espace':
        for i, row in df.iterrows():
            cursor.execute('''
            INSERT INTO Espace (id_E, nom, historique, activites, presentation, 
                                date_ouverture, date_fermeture, website, pays, 
                                ville, latitude, longitude) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (row['id'], row['nom'], row['historique'], row['activites'], row['presentation'], 
                  row['date_ouverture'], row['date_fermeture'], row['website'], row['pays'], 
                  row['ville'], row['latitude'], row['longitude']))
    elif table == 'Question_Reponse':
        for i, row in df.iterrows():
            cursor.execute('''
            INSERT INTO Question_Reponse (id_QR, question1, reponse1, question2, reponse2)
            VALUES (?, ?, ?, ?, ?)
            ''', (row['id'], row['question1'], row['réponse1'], row['question2'], row['réponse2']))
    elif table == 'Responsable':
        for i, row in df.iterrows():
            cursor.execute('''
            INSERT INTO Responsable (id_R, responsables, id_QReponse)
            VALUES (?, ?, ?)
            ''', (row['id'], row['responsables'], row['id']))

    # Effectuer un commit tous les 100 enregistrements
    if i % 100 == 0:
        conn.commit()
    conn.commit()

def inserer_liaison_tenir(df, conn):
    """Insérer les relations entre les espaces et les responsables dans la table 'tenir'"""
    cursor = conn.cursor()
    id_tenir = 1
    for i, row in df.iterrows():
        cursor.execute('''
        INSERT INTO tenir (id_tenir, id_espace, id_responsable)
        VALUES (?, ?, ?)
        ''', (id_tenir, row['id'], row['id']))  # Utiliser l'id_tenir incrémenté
        id_tenir += 1
        if i % 100 == 0:  # Effectuer un commit tous les 100 enregistrements
            conn.commit()
    conn.commit()

def main():
    """Fonction principale pour exécuter le processus"""
    # Charger le fichier Excel
    chemin_fichier = '../Code_extract_text/fichier_mis_a_jour.xlsx'
    df = charger_fichier_excel(chemin_fichier)

    # Sélectionner les colonnes nécessaires
    df_selection1, df_selection2, df_selection3 = selectionner_colonnes(df)

    # Vérifier les valeurs manquantes et les doublons
    verifier_valeurs_manquantes(df_selection1, 'id')
    verifier_valeurs_dupliquees(df_selection1, 'id')

    # Connexion à la base de données SQLite
    with sqlite3.connect('spacestri.db', timeout=10) as conn:
        # Vider les tables existantes avant d'insérer les nouvelles données
        vider_tables(conn)
        
        # Créer les tables
        creer_tables_sqlite(conn)

        # Insérer les données dans les tables
        inserer_donnees_table(df_selection1, 'Espace', conn)
        inserer_donnees_table(df_selection3, 'Question_Reponse', conn)
        inserer_donnees_table(df_selection2, 'Responsable', conn)

        # Insérer les liaisons dans la table 'tenir'
        inserer_liaison_tenir(df_selection1, conn)

if __name__ == '__main__':
    main()
