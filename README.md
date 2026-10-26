# EVERWILD — Prototype 3D 0.1

Nouvelle base **Godot 4.3+** pour un jeu de survie médiéval-fantastique réaliste stylisé. Ancien site Three.js supprimé de la branche principale ; récupérable dans l'historique Git.

## Démarrage
1. Installer Godot 4.3 ou plus récent.
2. Importer ce dossier via `project.godot`.
3. Appuyer sur F6/F5 pour lancer la scène principale.

## Ce qui existe
- Déplacement FPS, sprint, saut, collisions, caméra souris.
- Terrain de test, éclairage de jour, arbres et rochers procéduraux **temporaires**.
- Récolte de bois/pierre par visée (E).
- Faim, soif et santé.
- Pose d'une fondation en bois (B, coût de 5 bois).
- Interface de test.

## Direction artistique et limites
**Objectif** : matériaux PBR, végétation réaliste, humanoïdes animés et environnements naturels de qualité professionnelle. Les primitives géométriques actuellement présentes sont des *placeholders*, pas des assets réalistes finaux. Les remplacements GLB/glTF devront être optimisés et correctement licenciés. Pas de multijoueur, de sauvegarde ou d'export Android implémenté à ce stade. Code non testé dans l'éditeur Godot au moment de ce commit.

## Suite prioritaire
1. Importer de vrais modèles 3D sous licences compatibles, avec fichier d'attribution et textures PBR.
2. Terrain à relief, eau, biomes et végétation instanciée.
3. Personnage riggé, animations et commandes tactiles Android.
4. Inventaire, artisanat, construction modulaire et sauvegarde.
5. Tests de performance et intégration continue.

Le développement suit une approche de studio : vertical slice jouable, qualité mesurable, builds reproductibles, puis extension progressive.
