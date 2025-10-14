// dette-temps-reel.js
// Système de mise à jour en temps réel de la dette publique française

class DetteTempReel {
    constructor() {
        // Données de base (dernière mise à jour INSEE)
        this.donneesBase = {
            montant: 3416.3,  // Milliards d'euros (T2 2025)
            date: '2025-06-30',  // Date de référence
            tauxAnnuel: 3.5,  // Taux d'augmentation annuel moyen (%)
            population: 67000000  // Population française
        };
        
        // Calcul de la vitesse d'augmentation
        this.vitesseParSeconde = this.calculerVitesseParSeconde();
        
        // Configuration de l'API INSEE (pour mise à jour automatique future)
        this.configAPI = {
            url: 'https://api.insee.fr/series/BDM/data/SERIES_BDM/001694056',
            // Note: nécessite une clé API INSEE
            headers: {
                'Accept': 'application/json',
                'X-INSEE-Api-Key': 'VOTRE_CLE_API_INSEE' // À obtenir sur api.insee.fr
            }
        };
    }
    
    calculerVitesseParSeconde() {
        // Calcul basé sur le taux d'augmentation annuel
        const augmentationAnnuelle = this.donneesBase.montant * (this.donneesBase.tauxAnnuel / 100);
        const augmentationParJour = augmentationAnnuelle / 365;
        const augmentationParHeure = augmentationParJour / 24;
        const augmentationParMinute = augmentationParHeure / 60;
        const augmentationParSeconde = augmentationParMinute / 60;
        
        return {
            parSeconde: augmentationParSeconde * 1000000000, // Converti en euros
            parMinute: augmentationParMinute * 1000000000,
            parHeure: augmentationParHeure * 1000000000,
            parJour: augmentationParJour * 1000000000
        };
    }
    
    calculerDetteActuelle() {
        const maintenant = new Date();
        const dateBase = new Date(this.donneesBase.date);
        const differenceMs = maintenant - dateBase;
        const differenceSecondes = differenceMs / 1000;
        
        // Dette actuelle = dette de base + (secondes écoulées × augmentation par seconde)
        const detteActuelle = (this.donneesBase.montant * 1000000000) + 
                            (differenceSecondes * this.vitesseParSeconde.parSeconde);
        
        return {
            total: detteActuelle,
            milliards: detteActuelle / 1000000000,
            parHabitant: detteActuelle / this.donneesBase.population,
            augmentationJour: this.vitesseParSeconde.parJour,
            augmentationHeure: this.vitesseParSeconde.parHeure,
            augmentationMinute: this.vitesseParSeconde.parMinute,
            augmentationSeconde: this.vitesseParSeconde.parSeconde
        };
    }
    
    // Mise à jour depuis l'API INSEE (nécessite une clé API)
    async mettreAJourDepuisINSEE() {
        try {
            const response = await fetch(this.configAPI.url, {
                headers: this.configAPI.headers
            });
            
            if (!response.ok) {
                throw new Error('Erreur API INSEE');
            }
            
            const data = await response.json();
            // Traitement des données INSEE
            // Structure spécifique à adapter selon la réponse de l'API
            
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération des données INSEE:', error);
            return null;
        }
    }
    
    // Alternative : chargement depuis un fichier JSON hébergé
    async chargerDonneesJSON(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.derniereMiseAJour && data.dette) {
                this.donneesBase.montant = data.dette;
                this.donneesBase.date = data.derniereMiseAJour;
                this.vitesseParSeconde = this.calculerVitesseParSeconde();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            return false;
        }
    }
    
    // Formatage des nombres pour l'affichage
    formaterNombre(nombre, decimales = 2) {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        }).format(nombre);
    }
    
    // Démarrer l'horloge en temps réel
    demarrerHorloge(idElement) {
        const element = document.getElementById(idElement);
        if (!element) return;
        
        // Mise à jour toutes les 100ms pour un effet fluide
        setInterval(() => {
            const dette = this.calculerDetteActuelle();
            element.textContent = this.formaterNombre(dette.milliards, 1);
        }, 100);
    }
    
    // Démarrer le compteur par habitant
    demarrerCompteurParHabitant(idElement) {
        const element = document.getElementById(idElement);
        if (!element) return;
        
        setInterval(() => {
            const dette = this.calculerDetteActuelle();
            element.textContent = this.formaterNombre(dette.parHabitant, 0) + '€';
        }, 1000);
    }
}

// Exemple d'utilisation avec extrapolation
function initialiserDetteTempsReel() {
    const dette = new DetteTempReel();
    
    // Démarrer les compteurs
    dette.demarrerHorloge('current-montant');
    dette.demarrerCompteurParHabitant('per-capita');
    
    // Afficher les taux d'augmentation
    const stats = dette.calculerDetteActuelle();
    
    // Mise à jour des éléments de statistiques
    if (document.getElementById('augmentation-seconde')) {
        document.getElementById('augmentation-seconde').textContent = 
            dette.formaterNombre(stats.augmentationSeconde, 0) + '€/s';
    }
    
    if (document.getElementById('augmentation-jour')) {
        document.getElementById('augmentation-jour').textContent = 
            dette.formaterNombre(stats.augmentationJour / 1000000, 2) + ' M€/jour';
    }
    
    // Tentative de mise à jour depuis un fichier JSON externe
    // (hébergé sur votre serveur et mis à jour régulièrement)
    dette.chargerDonneesJSON('/data/dette_insee_latest.json')
        .then(success => {
            if (success) {
                console.log('Données mises à jour depuis le serveur');
            }
        });
    
    return dette;
}

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DetteTempReel;
}
