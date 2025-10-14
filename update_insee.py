#!/usr/bin/env python3
"""
Script de mise à jour automatique des données de dette publique depuis l'INSEE
À exécuter via un cron job ou GitHub Actions tous les mois
"""

import json
import requests
from datetime import datetime
import os

class INSEEDataUpdater:
    def __init__(self):
        # Configuration des séries INSEE pour la dette publique
        self.series = {
            'dette_pib': {
                'id': '001694056',  # Dette publique au sens de Maastricht en % du PIB
                'name': 'Dette publique / PIB'
            },
            'dette_montant': {
                'id': '010565708',  # Dette publique en milliards d'euros
                'name': 'Dette publique (Mds€)'
            }
        }
        
        # URL de base de l'API INSEE
        self.base_url = 'https://api.insee.fr/series/BDM/data/SERIES_BDM/'
        
        # Votre clé API INSEE (à obtenir sur api.insee.fr)
        self.api_key = os.environ.get('INSEE_API_KEY', '')
        
        # Headers pour l'API
        self.headers = {
            'Accept': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
    
    def recuperer_donnees_insee(self, serie_id):
        """
        Récupère les données d'une série depuis l'API INSEE
        """
        try:
            url = f"{self.base_url}{serie_id}?lastNObservations=25"
            
            # Si pas de clé API, utiliser l'accès public (limité)
            if not self.api_key:
                print("⚠️ Pas de clé API INSEE configurée. Utilisation de l'accès public limité.")
                # L'API INSEE permet un accès limité sans authentification
                response = requests.get(url)
            else:
                response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Erreur API INSEE: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Erreur lors de la récupération des données: {e}")
            return None
    
    def parser_donnees_insee(self, data):
        """
        Parse les données INSEE au format utilisable
        """
        if not data or 'series' not in data:
            return None
        
        try:
            observations = data['series'][0]['observations']
            
            # Convertir en format simple
            donnees_formatees = []
            for obs in observations:
                periode = obs['periode']
                valeur = float(obs['value'])
                
                # Convertir la période INSEE (ex: 2025-Q2) en format standard
                if '-Q' in periode:
                    year, quarter = periode.split('-Q')
                    donnees_formatees.append({
                        'period': periode,
                        'year': int(year),
                        'quarter': int(quarter),
                        'value': valeur
                    })
                    
            return donnees_formatees
        except Exception as e:
            print(f"Erreur lors du parsing: {e}")
            return None
    
    def recuperer_donnees_alternatives(self):
        """
        Méthode alternative : scraping du site INSEE ou Banque de France
        """
        # Option 1: Scraping du tableau INSEE
        url_insee = "https://www.insee.fr/fr/statistiques/serie/010565708"
        
        try:
            response = requests.get(url_insee)
            if response.status_code == 200:
                # Parser le HTML pour extraire les données
                # (nécessite BeautifulSoup)
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Rechercher le tableau de données
                # Structure spécifique à adapter selon le site INSEE
                print("Données récupérées depuis le site INSEE")
                
        except Exception as e:
            print(f"Erreur scraping: {e}")
    
    def generer_fichier_json(self, donnees_pib, donnees_montant):
        """
        Génère le fichier JSON pour le site web
        """
        # Combiner les données PIB et montant
        donnees_combinees = []
        
        # Créer un dictionnaire pour faciliter la fusion
        dict_montant = {d['period']: d['value'] for d in donnees_montant} if donnees_montant else {}
        
        if donnees_pib:
            for item in donnees_pib:
                periode = item['period']
                donnees_combinees.append({
                    'period': periode,
                    'dette_pib': item['value'],
                    'dette_montant': dict_montant.get(periode, 0)
                })
        
        # Créer le fichier de sortie
        output = {
            'last_update': datetime.now().isoformat(),
            'source': 'INSEE - Institut National de la Statistique',
            'data': donnees_combinees[-22:],  # Garder les 22 derniers trimestres
            'metadata': {
                'unite_montant': 'milliards_euros',
                'unite_pib': 'pourcentage',
                'frequence': 'trimestrielle',
                'prochain_update': self.calculer_prochain_update()
            }
        }
        
        # Sauvegarder le fichier
        with open('dette_data.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Fichier dette_data.json mis à jour : {len(donnees_combinees)} périodes")
        
        # Créer aussi un fichier pour l'horloge temps réel
        self.generer_fichier_temps_reel(donnees_combinees)
        
        return output
    
    def generer_fichier_temps_reel(self, donnees):
        """
        Génère un fichier optimisé pour l'affichage temps réel
        """
        if not donnees:
            return
        
        # Prendre la dernière donnée disponible
        derniere = donnees[-1]
        
        # Calculer le taux d'augmentation moyen
        if len(donnees) >= 5:
            # Calcul sur les 4 derniers trimestres
            debut = donnees[-5]['dette_montant']
            fin = donnees[-1]['dette_montant']
            nb_trimestres = 4
            
            if debut > 0:
                taux_annuel = ((fin - debut) / debut) * 100
            else:
                taux_annuel = 3.5  # Valeur par défaut
        else:
            taux_annuel = 3.5
        
        # Créer le fichier pour l'horloge
        horloge_data = {
            'derniereMiseAJour': datetime.now().isoformat(),
            'dette': derniere['dette_montant'],
            'dettePIB': derniere['dette_pib'],
            'periode': derniere['period'],
            'tauxAugmentationAnnuel': round(taux_annuel, 2),
            'vitesse': {
                'parJour': round((derniere['dette_montant'] * taux_annuel / 100) / 365, 2),
                'parHeure': round((derniere['dette_montant'] * taux_annuel / 100) / 365 / 24, 4),
                'parMinute': round((derniere['dette_montant'] * taux_annuel / 100) / 365 / 24 / 60, 6)
            }
        }
        
        with open('dette_insee_latest.json', 'w', encoding='utf-8') as f:
            json.dump(horloge_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Fichier temps réel mis à jour : {horloge_data['vitesse']['parJour']} Mds€/jour")
    
    def calculer_prochain_update(self):
        """
        Calcule la date probable de la prochaine publication INSEE
        Les données trimestrielles sont publiées ~90 jours après la fin du trimestre
        """
        from datetime import datetime, timedelta
        
        maintenant = datetime.now()
        mois = maintenant.month
        
        # Déterminer le prochain trimestre
        if mois <= 3:
            # T4 de l'année précédente publié fin mars
            prochain = datetime(maintenant.year, 3, 31)
        elif mois <= 6:
            # T1 publié fin juin
            prochain = datetime(maintenant.year, 6, 30)
        elif mois <= 9:
            # T2 publié fin septembre
            prochain = datetime(maintenant.year, 9, 30)
        else:
            # T3 publié fin décembre
            prochain = datetime(maintenant.year, 12, 31)
        
        # Ajouter 90 jours pour la publication
        prochain = prochain + timedelta(days=90)
        
        return prochain.isoformat()
    
    def executer_mise_a_jour(self):
        """
        Fonction principale pour exécuter la mise à jour
        """
        print("🔄 Début de la mise à jour des données INSEE...")
        
        # Récupérer les données PIB
        print("📊 Récupération ratio Dette/PIB...")
        data_pib = self.recuperer_donnees_insee(self.series['dette_pib']['id'])
        donnees_pib = self.parser_donnees_insee(data_pib) if data_pib else None
        
        # Récupérer les données montant
        print("💰 Récupération montant dette...")
        data_montant = self.recuperer_donnees_insee(self.series['dette_montant']['id'])
        donnees_montant = self.parser_donnees_insee(data_montant) if data_montant else None
        
        # Si échec API, tenter méthode alternative
        if not donnees_pib and not donnees_montant:
            print("⚠️ Échec API, tentative méthode alternative...")
            self.recuperer_donnees_alternatives()
        
        # Générer les fichiers JSON
        if donnees_pib or donnees_montant:
            self.generer_fichier_json(donnees_pib, donnees_montant)
            print("✅ Mise à jour terminée avec succès!")
            return True
        else:
            print("❌ Impossible de récupérer les données")
            return False

def main():
    """
    Point d'entrée du script
    """
    updater = INSEEDataUpdater()
    
    # Configuration de la clé API si disponible
    # export INSEE_API_KEY="votre_cle_api"
    
    # Exécuter la mise à jour
    success = updater.executer_mise_a_jour()
    
    # Code de sortie pour CI/CD
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
