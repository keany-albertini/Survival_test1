# V21 — Direction artistique + plan technique + priorités

## 1. Cible artistique officielle

La référence est l'image "Style 1 — naturel et immersif" validée dans le projet.

Objectif visuel :
- 3D isométrique / vue du dessus avec profondeur réelle.
- Médiéval-fantasy réaliste stylisé haut de gamme.
- Nature très dense, organique et lisible.
- Matériaux peints, jamais plastique ni low-poly brut.
- Roches massives et irrégulières avec mousse, fissures, veines de minerais intégrées.
- Arbres avec vraies silhouettes, branches, troncs travaillés et feuillages en volumes.
- Herbe, fougères et buissons animés par le vent.
- Eau profonde et turquoise, cascades, écume et zones humides.
- Lumière chaude de journée, ombres douces et atmosphère cinématographique.
- Automne spectaculaire, hiver réellement enneigé.
- Ruines, camps, palissades, tours et châteaux intégrés naturellement au monde.

## 2. Piliers de gameplay

1. Survie : faim, soif, endurance, santé, météo et saisons.
2. Récolte : bois, pierre, minerai, plantes, chasse et pêche.
3. Craft : outils, armes, armures, consommables et ateliers.
4. Construction : camp -> palissade -> pierre -> château fort complet.
5. Exploration : ruines, grottes, camps abandonnés, coffres et secrets.
6. Combat : squelettes, créatures fantasy, boss et loot.
7. Farming : semis, croissance, récolte et amélioration des cultures.
8. Domptage : animaux sauvages, nourriture préférée, montures et transport.
9. Monde vivant : faune, vent, feu, végétation, jour/nuit et saisons.

## 3. Architecture technique V21

### Rendu
- Three.js / WebGL.
- Caméra isométrique orthographique.
- Ombres PCF douces.
- ACES tone mapping.
- Brouillard saisonnier.
- Instancing pour herbe et végétation répétée.
- LOD progressif pour les futurs assets complexes.
- Matériaux PBR stylisés : albedo peint, roughness, normal et variations vertex color.

### Monde
- Terrain 3D sculpté par zones.
- Biomes composés par couches : terrain, végétation basse, arbres, roches, points d'intérêt.
- Système de chunks prévu pour étendre la carte sans charger tout le monde d'un coup.
- Navigation avec collisions naturelles et glissement le long des obstacles.

### Personnage
- Mouvement avec accélération/freinage progressifs.
- Rotation amortie.
- Animation locomotion dépendante de la vitesse.
- Caméra avec look-ahead et suivi amorti.
- Entrées clavier + tactile unifiées.

### Mobile
- Pas de gros joystick fixe.
- Toucher directement le monde pour faire apparaître un joystick flottant discret.
- Origine du joystick = endroit où le doigt est posé.
- Relâcher = joystick disparaît.
- Intensité du déplacement analogique selon la distance du doigt.
- Course automatique lorsque le stick est poussé presque au maximum.
- Les boutons Action/Construction restent séparés et compacts.

## 4. Priorités de production

### P0 — Sensation de jeu
- Navigation fluide.
- Animation marche/course.
- Caméra.
- Tactile flottant.
- Collisions propres.

### P1 — Nature premium
- 6 à 10 arbres réellement différents.
- 8 à 12 buissons/plantes.
- Roches variées.
- Minéraux mieux intégrés.
- Sol détaillé.
- Végétation animée.

### P2 — Eau et lumière
- Rivière avec mouvement UV / normal map.
- Cascade avec écume et particules.
- Zones mouillées.
- Ciel/lumière jour-nuit.
- Brouillard atmosphérique.

### P3 — Construction château
- Fondations.
- Murs pierre/bois.
- Tours.
- Portes.
- Créneaux.
- Escaliers.
- Toits.
- Palissades.
- Snap et prévisualisation.

### P4 — Monde vivant
- Cerfs, loups fantasy, chevaux, bêtes de bât.
- Squelettes et camps hostiles.
- Domptage.
- Montures.
- Loot et coffres.
- Respawns de ressources/faune.

### P5 — Farming et économie
- Parcelles.
- Semences.
- Irrigation simple.
- Croissance par étapes.
- Récoltes.
- Cuisine.
- Stockage.

### P6 — Polish haut de gamme
- VFX.
- Sons.
- Particules.
- Post-process.
- Réglages graphiques mobile/PC.
- Optimisation.

## 5. Règle de validation visuelle

Aucun nouvel asset n'est considéré "terminé" s'il ressemble à un placeholder.
Chaque asset doit respecter :
- silhouette organique ;
- matière lisible ;
- contraste contrôlé ;
- palette cohérente ;
- intégration dans les 4 saisons ;
- rendu correct en vue isométrique ;
- animation légère si végétal ou élément vivant.

La référence Style 1 reste le benchmark visuel principal.
