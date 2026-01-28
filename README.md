# 📊 Analyse Immobilière - Corrélation Démographie et Prix

Projet d'analyse des corrélations entre les indicateurs démographiques et les prix de l'immobilier en Normandie.

## 🔗 Liens du Projet

- **GitHub** : [Repo GitHub](https://github.com/)
- **Google Docs** : [Dev Avancé](https://docs.google.com/)

## 🏘️ Villes Analysées

| Ville | Habitants |
|-------|-----------|
| Fécamp | 17 961 |
| Yvetot | 11 677 |
| Montivilliers | 15 671 |
| Lisieux | 19 540 |
| Hérouville-Saint-Clair | 22 473 |
| Elbeuf | 15 774 |
| Barentin | 12 227 |

> Ces villes normandes ont été retenues car elles appartiennent à une même tranche démographique (11 000 - 22 000 habitants), permettant des comparaisons pertinentes.

## 📡 Sources de Données

### API INSEE – MELoDI (Données démographiques)
- Structure de la population (sexe et âge)
- Ménages et mode de cohabitation
- Natalité et dynamique familiale
- Capital humain (niveau d'études)
- Marché du travail (activité et emploi)
- Morphologie urbaine (densité)

### Données Immobilières (DVF - Data.gouv)
- **Méthode** : Intégration statique (fichiers CSV)
- Valeur foncière (prix de vente)
- Surfaces et caractéristiques bâties
- Nature de la mutation et type de bien
- Analyse temporelle

> *Note : Les données immobilières ont été intégrées de manière statique pour pallier le coût des API professionnelles.*

## 🧮 Indicateurs Calculés

| Indicateur | Formule |
|------------|---------|
| Prix au m² | `Valeur Foncière / Surface Réelle Bati` |
| Taille moyenne ménages | `Population totale / Nombre de ménages` |
| Taux d'activité | `Population active / Population 15+ ans` |
| Densité | `Population / Surface commune (km²)` |

## 🛠️ Technologies Utilisées

- **Chart.js** : Graphiques dynamiques et interactifs
- **Bootstrap** : Interface responsive et professionnelle
- **JavaScript** : Logique applicative et appels API

## 🚀 Installation

1. Cloner le repository
```bash
git clone https://github.com/votre-repo/Dev-Avancer-Scenario1.git
```

2. Ouvrir avec Live Server (VS Code)
   - Clic droit sur `index.html`
   - "Open with Live Server"

## 📁 Structure du Projet

```
Dev-Avancer-Scenario1/
├── index.html      # Page principale
├── index.js        # Logique et appels API
├── style.css       # Styles
└── README.md       # Documentation
```

## 👥 Équipe

Projet réalisé dans le cadre de la ressource R6.05 - Développement Avancé.

## 📄 Licence

Ce projet est open source.
