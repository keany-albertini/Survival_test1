# Everwild — version web 0.1

Adaptation web du projet Everwild dans le dépôt `Survival_test1`. Le jeu 3D utilise Three.js et se lance sur GitHub Pages, sur téléphone et ordinateur.

## Jouer

https://keany-albertini.github.io/Survival_test1/?v=ew1

Le menu propose de créer un personnage, reprendre l’aventure, consulter l’univers et modifier les paramètres. Le personnage est sauvegardé sur cet appareil et son peuple est définitif.

## Première zone jouable

Les Marches verdoyantes reprennent le camp, la rivière, les ruines, la faune, les arbres et les ressources de la base 3D existante. Le monde complet d’Unreal n’a pas été importé : cette version est une adaptation progressive.

### Fonctionnalités présentes

- Huit peuples : Humains, Elfes, Orcs, Nains, Draconiens, Peuple de la Neige, Peuple des Arbres, Peuple du Désert. Aucun Lycan. Les Draconiens correspondent au Peuple du Feu.
- Variations visuelles du personnage et choix de silhouette. Toutes les races ont les mêmes statistiques initiales.
- Personnage articulé et animations de marche, course, récolte, extraction, combat, construction, repas et boisson.
- Inventaire limité par le poids, barre de six emplacements et fabrication des outils.
- Apprentissage par la pratique : abattage, minage, ramassage, artisanat. Les niveaux d’abattage, minage et ramassage augmentent les rendements.
- Progression générale, points distribuables et recherche associant points et ressources.
- Recherche des outils, structures, agriculture et alchimie ; élixir permettant de redistribuer les points.
- Santé, endurance, poids, dégâts, faim et soif influencent la simulation. Résistance et Oxygène sont préparés ; le climat dangereux et la plongée restent à développer.
- Un cœur de base par personnage dans cette zone, avec un rayon de construction de 18 mètres pour le prototype. Palissades, murs et tours de pierre selon la recherche.
- Mort avec perte de l’inventaire et des outils, sac récupérable pendant une heure, progression conservée. Récupération partielle possible si l’inventaire est plein.
- Ramassage de branches et petites pierres à mains nues pour reconstruire ses outils après une mort.
- Cuisine, cultures, cheval apprivoisable, monture, ruines et combat contre le squelette.
- Cycle jour/nuit, saisons visuelles, prairies animées, lucioles, feu, eau en mouvement et végétation améliorée.
- Sauvegardes locales distinctes d’un ancien personnage Survival ; aucune ancienne sauvegarde n’est effacée.

## Commandes

- Téléphone : joystick flottant à gauche ; pousser davantage pour courir ; Action pour agir ; marteau pour construire ; ⇄ pour changer de pièce ; ✧ pour progression, recherche et artisanat.
- Ordinateur : ZQSD / WASD / flèches ; Maj pour courir ; E pour agir ; B pour construire ; R pour changer de pièce ; I pour le sac ; P pour la progression ; Échap pour le menu.
- Touches 1 à 6 : hache, pioche, épée, construction, baies, viande cuite. Les outils doivent être possédés pour être équipés.

## Périmètre

Cette version est solo, avec sauvegarde sur le navigateur utilisé. Aucun serveur multijoueur, compte ni synchronisation entre appareils n’est encore disponible.

La carte V7 finale reste la référence à adapter : 10 × 10 km, environ 70 % terre et 30 % eau, un continent et cinq îles ; Vantuman au centre, glaciaire au nord, forêt tropicale à l’ouest, forêt tempérée, grandes plaines, montagnes, désert et océan. La géographie exacte n’est pas remplacée par une nouvelle carte inventée.

Restent notamment à développer : monde complet, serveurs PvE/PvP persistants, corps hors ligne, lits, clans, raids, transferts, huit branches de recherche complètes, créatures fantasy et reproduction. Les variantes raciales actuelles sont une première représentation visuelle, pas les modèles définitifs d’Unreal.

## Structure active

- `index.html`, `everwild.css` : menu, création, panneaux et interface.
- `js/everwild/app.js` : profil, réglages et interface de progression.
- `js/everwild/rules.js` : races, attributs, apprentissage, recherche et recettes.
- `js/everwild/appearance.js` : variantes visuelles des races.
- `js/v20/main.js` : simulation 3D, actions, construction, sauvegarde, mort et sacs.
- `js/v20/world.js`, `js/v20/models.js` : monde et modèles.
- `js/v26/` et `assets/v26/` : modèles GLTF, matériaux et végétation.
- `js/v27/ambience.js`, `js/v28/animation.js` : ambiance et animations.

Les anciens modules 2D sont conservés mais ne sont pas chargés par le point d’entrée Everwild.

## Validation

Les tests locaux utilisent le vrai moteur Three.js pour construire les modèles et simuler les actions, avec un renderer substitué pour fonctionner sans GPU. Ils contrôlent les impacts uniques, recettes, progression, sauvegardes, sacs de mort et restrictions de construction.

Le menu peut être testé dans un navigateur sans WebGL. La vérification visuelle finale du monde 3D nécessite WebGL.
