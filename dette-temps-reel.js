// dette-temps-reel.js
// Système de mise à jour en temps réel de la dette publique française

class DetteTempReel {
    constructor() {
        // Ancre de repli : derniere publication INSEE connue AU MOMENT DU BUILD.
        // Ecrasee au chargement par Data/dette_data.json (regenere par le
        // pipeline du site auteur, scripts/update_dette_insee.py --legacy).
        // L'affichage anime est une EXTRAPOLATION depuis cette ancre, pas une
        // donnee temps reel : l'INSEE publie trimestriellement (~90 j de latence).
        this.donneesBase = {
            montant: 3536.1,  // Milliards d'euros (T1 2026, INSEE 010777616)
            date: '2026-03-31',  // Fin du dernier trimestre publie
            // Variation observee sur les 4 derniers trimestres INSEE
            // (T1 2025 -> T1 2026 : 3 345,4 -> 3 536,1 Md EUR, +5,7 %)
            tauxAnnuel: 5.7,
            population: 68500000  // Estimation INSEE ~68,5 M (bilan demographique)
        };

        // Calcul de la vitesse d'augmentation
        this.vitesseParSeconde = this.calculerVitesseParSeconde();
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
    
    // Recale l'ancre depuis Data/dette_data.json (format du projet :
    // { last_update, data: [{ period: "2026-Q1", dette_montant: 3536.1 }, …] },
    // régénéré par le pipeline du site auteur — le compteur n'a plus de
    // pipeline propre). Échec = on garde l'ancre du build, déjà datée.
    async chargerDonneesJSON(url) {
        try {
            const response = await fetch(url, { cache: 'no-cache' });
            const data = await response.json();
            const serie = Array.isArray(data.data) ? data.data : [];
            const dernier = serie[serie.length - 1];
            if (dernier && dernier.period && dernier.dette_montant) {
                const [annee, trimestre] = dernier.period.split('-Q');
                const finTrimestre = new Date(Number(annee), Number(trimestre) * 3, 0);
                this.donneesBase.montant = dernier.dette_montant;
                this.donneesBase.date = finTrimestre.toISOString().slice(0, 10);
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
    
    // Recalage de l'ancre depuis le JSON du dépôt (⚠ GitHub Pages est
    // sensible à la casse : le dossier est Data/, pas data/)
    dette.chargerDonneesJSON('Data/dette_data.json')
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
