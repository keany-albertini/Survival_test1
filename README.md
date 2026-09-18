# Survie 2D — nouveau départ

Ce dépôt contient désormais une base neuve pour un petit jeu de survie 2D en monde ouvert.

## Déjà jouable

- monde continu généré par chunks autour du joueur ;
- caméra qui suit le personnage ;
- profondeur 2D : les objets, animaux et le personnage se masquent selon leur position au sol ;
- faim, soif, vie et endurance ;
- ressources : branches, fibres, pierre, minerai et baies ;
- mares pour boire ;
- inventaire ;
- fabrication d'une hache, d'une pioche, d'une lance et de bandages ;
- lapins et petits cerfs à chasser ;
- viande et peaux en butin ;
- cycle jour / nuit ;
- sauvegarde locale automatique ;
- commandes clavier et tactiles.

## Commandes

- ZQSD / WASD / flèches : déplacement
- Shift : courir
- E : récolter ou boire
- Espace / clic gauche : chasser
- I : inventaire
- C : craft
- Échap : fermer les panneaux

## Progression de départ

1. Ramasser branches, fibres et pierre.
2. Fabriquer les premiers outils.
3. Utiliser la pioche pour obtenir du minerai.
4. Fabriquer une lance et chasser les animaux.
5. Gérer faim et soif avec les baies, la viande et les mares.

## Fichiers

- index.html : page de jeu et HUD
- styles.css : interface responsive et contrôles tactiles
- js/data.js : données et état du jeu
- js/world.js : génération du monde et des chunks
- js/render.js : rendu Canvas 2D avec profondeur
- js/harvest.js : récolte, inventaire et craft
- js/fauna.js : animaux et chasse
- js/survival.js : faim, soif, endurance et cycle du temps
- js/save.js : sauvegarde locale
- js/ui.js : HUD, inventaire et menu de craft
- js/main.js : boucle principale et commandes

L'ancien jeu n'est plus dans l'arbre courant de la branche main après le commit de remise à zéro. Son historique Git reste néanmoins récupérable dans les commits précédents.
