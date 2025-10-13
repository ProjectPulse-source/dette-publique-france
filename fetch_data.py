#!/usr/bin/env python3
"""
Script pour récupérer les données de dette publique française depuis l'API INSEE
"""

import requests
import json
from datetime import datetime

# URL de l'API INSEE pour la dette publique
# Cette série contient les données trimestrielles de dette en % du PIB
INSEE_API_BASE = "https://api.insee.fr/series/BDM/v1/data/SERIES_BDM"

# Identifiants des séries (idbank) pour la dette publique
# Ces identifiants correspondent aux données officielles de l'INSEE
SERIES_IDS = {
    "dette_pib": "010777622",  # Dette en % du PIB (trimestriel)
    "dette_montant": "010777621",  # Dette en milliards d'euros (trimestriel)
}

def fetch_insee_data(idbank):
    """
    Récupère les données d'une série INSEE via l'API publique
    """
    url = f"{INSEE_API_BASE}/{idbank}"
    params = {
        "startPeriod": "2010",  # Données depuis 2010
        "detail": "dataonly"
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la récupération des données: {e}")
        return None

def parse_insee_response(data):
    """
    Parse la réponse JSON de l'API INSEE et extrait les observations
    """
    if not data:
        return []
    
    try:
        # Structure SDMX de l'API INSEE
        series = data.get("dataSets", [{}])[0].get("series", {})
        observations = []
        
        for serie_key, serie_data in series.items():
            obs = serie_data.get("observations", {})
            for time_key, value_list in obs.items():
                observations.append({
                    "period": time_key,
                    "value": value_list[0] if value_list else None
                })
        
        return sorted(observations, key=lambda x: x["period"])
    except Exception as e:
        print(f"Erreur lors du parsing: {e}")
        return []

def format_for_json(dette_pib_data, dette_montant_data):
    """
    Formate les données pour le fichier JSON utilisé par la page web
    """
    result = {
        "last_update": datetime.now().isoformat(),
        "data": []
    }
    
    # Créer un dictionnaire pour associer les périodes
    montants = {obs["period"]: obs["value"] for obs in dette_montant_data}
    
    for obs in dette_pib_data:
        period = obs["period"]
        result["data"].append({
            "period": period,
            "dette_pib": obs["value"],
            "dette_montant": montants.get(period)
        })
    
    return result

def main():
    """
    Fonction principale
    """
    print("🔍 Récupération des données de dette publique française...")
    
    # Récupération des données
    print("📊 Récupération dette en % PIB...")
    dette_pib_raw = fetch_insee_data(SERIES_IDS["dette_pib"])
    dette_pib_data = parse_insee_response(dette_pib_raw)
    
    print("💰 Récupération dette en milliards €...")
    dette_montant_raw = fetch_insee_data(SERIES_IDS["dette_montant"])
    dette_montant_data = parse_insee_response(dette_montant_raw)
    
    if not dette_pib_data or not dette_montant_data:
        print("❌ Erreur: Impossible de récupérer les données")
        return
    
    # Formatage et sauvegarde
    print("💾 Formatage et sauvegarde des données...")
    formatted_data = format_for_json(dette_pib_data, dette_montant_data)
    
    with open("data/dette_data.json", "w", encoding="utf-8") as f:
        json.dump(formatted_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Données sauvegardées! {len(formatted_data['data'])} périodes récupérées")
    print(f"📅 Dernière mise à jour: {formatted_data['last_update']}")
    
    # Afficher les dernières valeurs
    if formatted_data["data"]:
        last = formatted_data["data"][-1]
        print(f"\n📈 Dernières valeurs:")
        print(f"   Période: {last['period']}")
        print(f"   Dette/PIB: {last['dette_pib']}%")
        print(f"   Dette: {last['dette_montant']} Md€")

if __name__ == "__main__":
    main()
