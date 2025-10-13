# 📊 Dette Publique France - Visualisation en Temps Réel

Site web interactif affichant l'évolution de la dette publique française basé sur les données officielles de l'**INSEE**.

## 🌐 Démo en Ligne

👉 [Voir le site en direct](https://votre-username.github.io/dette-publique-france/)

## ✨ Fonctionnalités

- 📈 **Graphiques interactifs** montrant l'évolution de la dette
- 💰 **Statistiques en temps réel** : dette en % du PIB, montant total, dette par habitant, intérêts, solde primaire
- 🥧 **Camembert détenteurs** : Qui détient la dette publique ?
- 📊 **Graphique du solde primaire** : Évolution sur 5 ans
- 📖 **Section livre** avec préface complète
- 💡 **Tooltips explicatifs** sur le solde primaire
- 📱 **Design responsive** compatible mobile/tablette/desktop
- 🔄 **Mise à jour automatique** des données via l'API INSEE
- 🎨 **Interface moderne** et minimaliste

## 🖼️ Configuration de l'image de couverture

Pour afficher la couverture du livre "Dette Souveraine - Qui paie vraiment" :

1. **Nommez votre image** : `image_couverture.jpg` (ou `.png`)
2. **Placez-la à la racine** du projet (même dossier que `index.html`)
3. **Dimensions recommandées** : 220x320 pixels minimum

Si l'image n'est pas trouvée, un placeholder stylisé s'affichera automatiquement.

## 🚀 Installation et Utilisation

### Option 1 : Hébergement sur GitHub Pages (Recommandé)

1. **Forker ce repository** ou cloner le code
   ```bash
   git clone https://github.com/votre-username/dette-publique-france.git
   cd dette-publique-france
   ```

2. **Activer GitHub Pages**
   - Allez dans Settings > Pages
   - Source : Deploy from a branch
   - Branch : `main` ou `master`
   - Folder : `/ (root)`
   - Cliquez sur Save

3. **Votre site sera accessible à :**
   ```
   https://votre-username.github.io/dette-publique-france/
   ```

### Option 2 : Utilisation en Local

1. **Cloner le repository**
   ```bash
   git clone https://github.com/votre-username/dette-publique-france.git
   cd dette-publique-france
   ```

2. **Installer Python et les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

3. **Récupérer les dernières données**
   ```bash
   python fetch_data.py
   ```

4. **Lancer un serveur local**
   ```bash
   python -m http.server 8000
   ```

5. **Ouvrir dans le navigateur**
   ```
   http://localhost:8000
   ```

## 📁 Structure du Projet

```
dette-publique-france/
├── index.html              # Page principale du site
├── fetch_data.py          # Script Python pour récupérer les données INSEE
├── data/
│   └── dette_data.json    # Données de la dette (généré automatiquement)
├── requirements.txt       # Dépendances Python
└── README.md             # Documentation
```

## 🔧 Mise à Jour des Données

### Manuelle

Pour mettre à jour les données manuellement :

```bash
python fetch_data.py
git add data/dette_data.json
git commit -m "Mise à jour des données de dette publique"
git push
```

### Automatique avec GitHub Actions (Optionnel)

Vous pouvez configurer une GitHub Action pour mettre à jour automatiquement les données chaque semaine/mois.

Créez `.github/workflows/update-data.yml` :

```yaml
name: Update Data

on:
  schedule:
    - cron: '0 0 * * 1'  # Chaque lundi à minuit
  workflow_dispatch:      # Permet le déclenchement manuel

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Fetch new data
        run: python fetch_data.py
      
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/dette_data.json
          git diff --quiet && git diff --staged --quiet || git commit -m "📊 Mise à jour automatique des données"
          git push
```

## 📊 Sources des Données

- **Source officielle** : [INSEE (Institut National de la Statistique)](https://www.insee.fr)
- **API utilisée** : API SDMX de l'INSEE
- **Séries temporelles** :
  - Dette en % du PIB : Série trimestrielle depuis 1995
  - Dette en milliards d'euros : Série trimestrielle depuis 1995

## 🎨 Personnalisation

### Modifier les Couleurs

Dans `index.html`, modifiez les couleurs dans la section `<style>` :

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Ajouter des Graphiques

Le site utilise [Chart.js](https://www.chartjs.org/). Vous pouvez facilement ajouter de nouveaux graphiques en suivant leur documentation.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Vous êtes libre de l'utiliser, le modifier et le distribuer.

## 🔗 Liens Utiles

- [Documentation API INSEE](https://api.insee.fr/catalogue/)
- [Données dette publique INSEE](https://www.insee.fr/fr/statistiques/2830301)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [GitHub Pages Documentation](https://docs.github.com/pages)

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

**Note** : Ce projet est à but informatif et pédagogique. Les données proviennent de sources officielles (INSEE) et sont mises à jour régulièrement.
