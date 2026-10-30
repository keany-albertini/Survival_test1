# Everwild — Module 1 (navigateur)

Prototype de survie 2D de profil, accessible dans le navigateur depuis `index.html`. Le code HTML5/JavaScript est autonome, sans installation ni moteur externe. Il utilise des classes `Terrain` et `Survivor` et un contrôleur tactile.

## Fonctionnalités
- Grille de 180 × 24 cases de 32 pixels : terre, roche et blocs de bois, avec minage et placement.
- Gravité, collisions sur les blocs, saut, animations de marche simples, accroupissement.
- Joystick gauche/droite, descendre pour s'accroupir ; boutons saut, miner, poser, manger.
- Vie, faim et endurance mises à jour à chaque image.
- Défilement latéral et décor en trois couches de parallaxe.

## Démarrer
Lancer `index.html` dans un navigateur moderne ou activer GitHub Pages sur la branche main. Sur mobile, ouvrir directement le lien GitHub Pages du dépôt et toucher « Commencer l'aventure ».

## Bibliothèques gratuites CC0 pour remplacer les graphismes provisoires
- Kenney New Platformer Pack (personnages, environnement, spritesheets) : https://kenney.nl/assets/new-platformer-pack (CC0).
- Kenney Pixel Platformer (tilesets, terrain, personnages) : https://kenney.nl/assets/pixel-platformer (CC0).
- Kenney Platformer Pack Remastered : https://kenney.nl/assets/platformer-pack-remastered (CC0).

**État réel :** les sprites externes ne sont pas encore importés dans le dépôt. Les personnages et blocs sont dessinés par Canvas et constituent des graphismes de substitution. Il reste à intégrer les spritesheets, les effets sonores et les textures réalistes ; aucune qualité réaliste définitive n'est revendiquée.

L'ancienne démo 3D HTML est conservée dans `legacy-3d/index.html` ; le projet Godot existant est conservé.
