# 🔒 Guide de Protection et Transparence - Dette Publique France

## Résumé : Ce que vous obtenez

✅ **Code protégé** par AGPL-3.0 (toute copie déployée doit rester open source)  
✅ **Contenu protégé** par CC BY-NC-SA 4.0 (pas d'usage commercial sans autorisation)  
✅ **Transparence** méthodologique complète (vérifiable et crédible)  
✅ **Message fort** sur l'importance de la dette dès l'arrivée sur le site  
✅ **Contributions** possibles mais cadrées  

## 🚀 Installation en 5 minutes

### Étape 1 : Préparer la structure

```bash
# Dans votre dossier dette-publique-france
chmod +x setup-repo-structure.sh
./setup-repo-structure.sh
```

### Étape 2 : Copier les fichiers de protection

```bash
# Copier tous les fichiers de licence et documentation
cp LICENSE LICENSE-CONTENT LICENSE-DATA CITATION.cff CONTRIBUTING.md CHANGELOG.md AUTHORS.md SECURITY.md ./

# Remplacer votre index.html
cp index_corrige.html index.html

# Ajouter les nouveaux scripts
cp indicateurs-avances.js ./
cp methodologie.html ./
```

### Étape 3 : Organiser les fichiers existants

```bash
# Déplacer vos images
mv *.png site/

# Déplacer les scripts
mv dette-temps-reel.js scripts/
mv update_insee.py scripts/

# Créer un snapshot des données actuelles
cp data/dette_data.json data/raw/dette_data_2025-10-14.json
echo "SHA256: $(sha256sum data/raw/dette_data_2025-10-14.json)" > data/raw/checksums.txt
```

### Étape 4 : Commit avec le bon message

```bash
git add .
git commit -m "🔒 Ajout protection AGPL + CC BY-NC-SA + transparence méthodologique

- Code sous AGPL-3.0 (obligation de partage des modifications)
- Contenu sous CC BY-NC-SA 4.0 (usage non-commercial)
- Données sous licences d'origine (INSEE/Etalab 2.0)
- Message d'introduction sur l'importance systémique de la dette
- Page méthodologie complète
- Indicateurs r-g et échéancier
- Documentation pour contributeurs"

git push
```

### Étape 5 : Configurer GitHub

1. **Aller dans Settings > About**
   - Ajouter description : "Tableau de bord interactif de la dette publique française - Données INSEE"
   - Topics : `dette-publique`, `france`, `insee`, `open-data`, `visualization`

2. **Dans Settings > Pages**
   - Vérifier que GitHub Pages est activé

3. **Créer une Release**
   ```
   Tag : v1.0.0
   Title : Version 1.0 - Protection et Transparence
   Description : Première version publique avec protection juridique complète
   ```

## 📝 Ce qui change sur votre site

### 1. Message d'introduction (visible en rouge en haut)
```
💡 Pourquoi suivre la dette publique ?
La dette structure intégralement notre système économique...
[Lien vers le livre]
```

### 2. Footer enrichi avec licences
```
Code source sous licence AGPL-3.0
Contenus sous licence CC BY-NC-SA 4.0
Données sous licences d'origine
[Lien GitHub pour contribuer]
```

### 3. Nouveaux indicateurs
- **r-g** avec code couleur et sparkline
- **Échéancier** 2025-2029
- **Badges** source/période sur chaque carte

## 🛡️ Ce que ces protections vous garantissent

### AGPL-3.0 pour le code
✅ **Vous gardez** : la paternité, le contrôle  
✅ **Ils doivent** : publier leurs modifications s'ils déploient  
✅ **Protection contre** : les copies commerciales fermées  

### CC BY-NC-SA 4.0 pour le contenu
✅ **Vous gardez** : l'usage commercial exclusif  
✅ **Ils doivent** : vous créditer, partager sous même licence  
✅ **Protection contre** : la réutilisation commerciale non autorisée  

## 📊 Structure finale du repository

```
dette-publique-france/
├── LICENSE                 # AGPL-3.0
├── LICENSE-CONTENT         # CC BY-NC-SA 4.0  
├── LICENSE-DATA           # Tableau des sources
├── CITATION.cff           # Citation académique
├── CONTRIBUTING.md        # Guide contributeurs
├── CHANGELOG.md          # Historique versions
├── AUTHORS.md            # Liste contributeurs
├── SECURITY.md           # Politique sécurité
├── README.md             # Documentation principale
├── index.html            # Site principal
├── methodologie.html     # Page méthodologie
├── data/
│   ├── raw/             # Données originales + checksums
│   └── processed/       # Données traitées
├── scripts/
│   ├── dette-temps-reel.js
│   ├── indicateurs-avances.js
│   └── update_insee.py
├── site/
│   └── [images].png
├── docs/
│   └── [documentation]
└── .github/
    └── workflows/
        └── update-insee.yml
```

## ⚠️ Points d'attention

1. **Vérifier les liens d'images** dans index.html si vous les déplacez
2. **Mettre à jour les liens Amazon** quand vous les aurez
3. **Obtenir une clé API INSEE** pour l'automatisation complète
4. **Tester localement** avant de push :
   ```bash
   python -m http.server 8000
   # Ouvrir http://localhost:8000
   ```

## 📢 Communication suggérée

### Sur le site (déjà fait)
✅ Message rouge en haut sur l'importance de la dette  
✅ Lien vers les livres  
✅ Footer avec licences  

### Dans le README GitHub
```markdown
## 📊 Dette Publique France - Tableau de bord interactif

Visualisation en temps réel de la dette publique française basée sur les données officielles INSEE.

### 🔍 Transparence totale
- Données vérifiables (INSEE, AFT, BdF)
- Méthodologie documentée
- Code source ouvert (AGPL-3.0)
- Contenus CC BY-NC-SA 4.0

### 📚 Comprendre la dette
Accompagne le livre "Dette Souveraine - Qui paie vraiment ?"
```

### Sur les réseaux sociaux
```
🚨 3 416 milliards € de dette publique française

Nouveau tableau de bord interactif avec :
✅ Données INSEE temps réel
✅ Indicateur r-g (le moteur de la dette)
✅ Code source transparent
🔒 Protection AGPL + CC BY-NC-SA

Comprendre qui paie vraiment 👉 [lien]
#DettPublique #OpenData #INSEE
```

## ✅ Checklist finale

- [ ] Tous les fichiers de licence sont en place
- [ ] L'index.html affiche le message d'intro en rouge
- [ ] Les nouveaux indicateurs fonctionnent (r-g, échéancier)
- [ ] Le footer mentionne les licences
- [ ] La page méthodologie est accessible
- [ ] Le repository GitHub est public
- [ ] Les images des livres s'affichent
- [ ] Les liens WhatsApp fonctionnent
- [ ] Le CSV se télécharge
- [ ] GitHub Pages est activé

## 🎯 Résultat

Vous avez maintenant :
1. **Protection juridique** solide
2. **Transparence** méthodologique
3. **Message politique** clair sur la dette
4. **Crédibilité** académique (citations)
5. **Ouverture** aux contributions cadrées

Le tout en restant **vérifiable** et **pédagogique** - parfaitement aligné avec votre livre !
