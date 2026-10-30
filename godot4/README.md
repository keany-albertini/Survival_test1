# Everwild — Les Derniers Bastions (Godot 4)
 
Prototype de survie 2D latérale médiéval-fantastique (Module 1).

## Démarrage
1. Récupérer le dossier `godot4/` comme dossier de projet.
2. Pour installer les visuels découpés, télécharger l’archive complète du Module 1 fournie dans la conversation, puis copier les dossiers `assets/sprites/` et `assets/tilesets/` dans `godot4/assets/`.
3. Ouvrir `godot4/project.godot` dans **Godot 4.3 ou version 4.x compatible**.
4. Lancer la scène avec F5.

Le projet dispose d'un rendu provisoire de secours lorsque les PNG sont absents ; **les PNG ne sont pas encore présents sur GitHub**.

## Dossiers
- `scenes/Main.tscn` : scène principale.
- `scripts/Main.gd` : liaison terrain / joueur / interface, commandes et inventaire.
- `scripts/Player.gd` : gravité, collisions, sauts, course et animations.
- `scripts/Survival.gd` : faim, énergie, santé et endurance.
- `scripts/Terrain.gd` : carte 180 × 28, blocs modifiables et collisions.
- `assets/sprites/` : images découpées de la planche fournie (depuis ZIP).
- `assets/tilesets/` : textures de sol / roches / bois (depuis ZIP).

## Commandes
Flèches ou Q/D pour se déplacer, Maj pour courir, espace pour sauter, E miner, F poser, R manger. Contrôles tactiles expérimentaux : glisser à gauche pour se déplacer, vers le haut pour sauter, vers le bas pour s'accroupir.

## Limites connues
Prototype de base, non validé dans l'éditeur Godot. La planche artistique n'est pas un atlas uniforme : les frames nécessitent encore un nettoyage et un recalage. Le jeu HTML5 du dépôt est indépendant et n'est pas remplacé. Les fichiers binaires graphiques sont encore dans l'archive ZIP, pas dans la branche GitHub.
