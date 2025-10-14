# 📊 Guide d'installation - Mise à jour automatique de la dette publique

## 🎯 Objectif
Créer un système similaire à horloge-de-la-dette-publique.com avec mise à jour automatique des données INSEE.

## 🔍 Comment fonctionne le site horloge-de-la-dette-publique.com ?

Ce type de site utilise généralement **deux techniques combinées** :

### 1. **Extrapolation en temps réel** (ce que vous voyez)
- Utilise la dernière donnée officielle INSEE (ex: 3416.3 Mds€ au T2 2025)
- Calcule une vitesse d'augmentation basée sur l'historique (ex: +3.5% par an)
- Affiche un compteur qui augmente chaque seconde

### 2. **Mise à jour périodique** (en arrière-plan)
- Récupère les nouvelles données INSEE tous les trimestres
- Met à jour la base de calcul pour l'extrapolation
- L'INSEE publie les données ~90 jours après la fin du trimestre

## 📦 Installation complète

### Étape 1 : Structure des fichiers

```
votre-site/
│
├── index.html                    # Votre page principale (déjà créée)
├── dette-temps-reel.js          # Script d'horloge temps réel
├── update_insee.py              # Script de mise à jour Python
│
├── data/
│   ├── dette_data.json          # Données historiques complètes
│   └── dette_insee_latest.json  # Données pour l'horloge
│
└── .github/
    └── workflows/
        └── update-insee.yml      # Automatisation GitHub Actions
```

### Étape 2 : Ajouter l'horloge temps réel à votre site

Ajoutez ces lignes dans votre `index.html` avant la fermeture de `</body>` :

```html
<!-- Script horloge temps réel -->
<script src="dette-temps-reel.js"></script>
<script>
    // Initialiser l'horloge au chargement de la page
    document.addEventListener('DOMContentLoaded', function() {
        const dette = new DetteTempReel();
        
        // Remplacer l'affichage statique par l'horloge
        dette.demarrerHorloge('current-montant');
        dette.demarrerCompteurParHabitant('per-capita');
        
        // Optionnel : afficher la vitesse d'augmentation
        const stats = dette.calculerDetteActuelle();
        console.log('Augmentation: ' + dette.formaterNombre(stats.augmentationSeconde, 0) + '€/seconde');
    });
</script>
```

### Étape 3 : Configuration de la mise à jour automatique

#### Option A : Avec GitHub Pages (RECOMMANDÉ - Gratuit)

1. **Créez un repository GitHub** pour votre site
2. **Ajoutez les fichiers** dans le repository
3. **Activez GitHub Pages** dans Settings > Pages
4. **Configurez GitHub Actions** :
   - Copiez le fichier `.github/workflows/update-insee.yml`
   - Le script s'exécutera automatiquement chaque mois

#### Option B : Serveur personnel avec cron

Si vous avez votre propre serveur :

```bash
# Installer les dépendances Python
pip install requests beautifulsoup4

# Ajouter au crontab (exécution mensuelle)
0 3 15 * * cd /path/to/site && python3 update_insee.py
```

### Étape 4 : Obtenir une clé API INSEE (optionnel mais recommandé)

1. Inscrivez-vous sur https://api.insee.fr
2. Créez une application
3. Récupérez votre clé API
4. Ajoutez-la dans GitHub :
   - Settings > Secrets > New repository secret
   - Nom : `INSEE_API_KEY`
   - Valeur : votre clé

## 🔧 Personnalisation

### Ajuster la vitesse d'augmentation

Dans `dette-temps-reel.js`, modifiez :

```javascript
this.donneesBase = {
    montant: 3416.3,        // Dernière valeur INSEE
    date: '2025-06-30',     // Date de cette valeur
    tauxAnnuel: 3.5,        // Taux d'augmentation (ajustable)
    population: 67000000
};
```

### Changer la fréquence de mise à jour

Dans `.github/workflows/update-insee.yml`, modifiez le cron :

```yaml
schedule:
  - cron: '0 3 15 * *'  # Le 15 de chaque mois
  # Alternatives :
  # - cron: '0 3 * * 1'   # Chaque lundi
  # - cron: '0 3 1,15 * *' # Le 1er et 15 de chaque mois
```

## 📈 Données utilisées

### Sources officielles
- **INSEE** : Série 010565708 (Dette en Mds€)
- **INSEE** : Série 001694056 (Dette/PIB en %)
- **Fréquence** : Trimestrielle
- **Délai** : ~90 jours après fin du trimestre

### Calcul de l'extrapolation
Le site calcule en temps réel basé sur :
- Dette actuelle = Dette_base + (Secondes_écoulées × Vitesse_par_seconde)
- Vitesse = (Dette × Taux_annuel) / (365 × 24 × 3600)

## 🚀 Démarrage rapide

```bash
# 1. Cloner votre repository
git clone https://github.com/votre-username/dette-publique-france.git

# 2. Ajouter les nouveaux fichiers
cp dette-temps-reel.js dette-publique-france/
cp update_insee.py dette-publique-france/

# 3. Commit et push
cd dette-publique-france
git add .
git commit -m "Ajout système temps réel"
git push

# 4. Activer GitHub Pages
# Allez dans Settings > Pages > Source: main branch
```

## ❓ FAQ

**Q: Les données sont-elles vraiment en temps réel ?**
R: L'affichage est extrapolé en temps réel basé sur les dernières données INSEE. Les vraies données sont mises à jour trimestriellement.

**Q: Quelle est la précision ?**
R: L'extrapolation est une estimation basée sur le taux d'augmentation historique. Les vraies valeurs peuvent varier.

**Q: Puis-je utiliser d'autres sources ?**
R: Oui, le script peut être adapté pour utiliser les données de la Banque de France, Eurostat, etc.

**Q: C'est légal d'utiliser les données INSEE ?**
R: Oui, les données INSEE sont publiques et réutilisables librement.

## 🔗 Ressources

- [API INSEE](https://api.insee.fr) - Documentation officielle
- [Données INSEE Dette](https://www.insee.fr/fr/statistiques/serie/010565708) - Série dette publique
- [GitHub Actions](https://docs.github.com/en/actions) - Documentation automatisation
- [Exemple live](https://horloge-de-la-dette-publique.com) - Site similaire

## 📝 Notes importantes

1. **Limitation sans clé API** : 30 requêtes/minute sur l'API INSEE publique
2. **Avec clé API** : 500 requêtes/minute
3. **Stockage** : Les données JSON sont légères (<100KB)
4. **Performance** : L'horloge JavaScript n'impacte pas les performances

## 🎯 Résultat final

Votre site aura :
- ✅ Un compteur temps réel de la dette (extrapolation)
- ✅ Mise à jour automatique mensuelle des données INSEE
- ✅ Historique complet des données
- ✅ Calcul automatique par habitant
- ✅ Hébergement gratuit via GitHub Pages
