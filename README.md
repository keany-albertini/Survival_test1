# Everwild web 0.5 · Nature et personnages

Jouer : https://keany-albertini.github.io/Survival_test1/?v=ew5

- Menu : rejoindre le monde, choisir un personnage existant ou en créer un autre. L’ancien personnage est récupéré automatiquement. Chaque ID conserve une sauvegarde distincte ; changer de personnage sauvegarde le précédent puis relance proprement le moteur.
- Huit races avec silhouettes et attributs visuels propres : carrure, oreilles, cornes, tusques, barbe, détails végétaux, étoffes. Six coiffures, six teintes de peau par race, couleur libre des cheveux et des yeux, quatre barbes, cicatrice/taches de rousseur et trois statures. Aperçu 3D éclairé ; portrait de secours si WebGL est indisponible.
- Sols photographiques PBR par biome : feuilles et mousse, gravier/sable, roche et neige ; transitions interpolées, normales et rugosité. Écorces et rochers photographiques. Textures 1k hébergées dans le dépôt, licence CC0 Poly Haven (voir `assets/everwild/pbr/sources.json`).
- Arbres à feuillage ajouré, racines et branches irrégulières ; palmiers avec palmes ; champignons avec pied, chapeau et lamelles ; sous-bois renouvelé autour du joueur selon le biome. Maison médiévale de pierre, charpente, ardoises et fenêtres chaudes au camp.
- Loups aux proportions affinées et pattes animées ; fourrure texturée et surfaces adoucies pour la faune ; membranes texturées sur les dragons. Caméra perspective rapprochée, gestion des feuillages devant la caméra, nuits lisibles et brume selon le biome.

Validation : `node tests/characters.mjs`, `node tests/geography.mjs`, `node tests/navigation.mjs`. Vérification navigateur à 390×844 avec WebGL logiciel : création personnalisée, aperçu 3D, lancement, création d’un deuxième personnage, retour au premier et deux sauvegardes distinctes. Le rendu est un progrès vers la référence, pas une reproduction du rendu Unreal ; performances réelles à confirmer sur téléphone. Solo local uniquement. Aucun serveur ou compte synchronisé.

# Carte V7 · adaptation web 0.4

Contours issus du masque `Everwild_V7_controle_masque_terre.png` validé le 22 septembre. Le continent et les cinq îles remplacent les disques du prototype. Les six grandes composantes sont conservées, les fragments de lettres du poster exclus. Rotation horaire : nord à droite. Vantuman diagonal, couronne glaciaire, jungle, plaines, désert et volcan repositionnés. Destinations et ateliers suivent cette géographie. L’atlas et le menu Monde affichent cette même carte, avec repères numérotés ; canyons, champignons géants et trois affluents sont ajoutés.

Tests : `node tests/geography.mjs` et `node tests/navigation.mjs`.

La silhouette provient de la référence ; les hauteurs sont une reconstitution procédurale, pas la heightmap Unreal. Échelle compacte de 496 unités pour téléphone, pas encore les 10 × 10 km du projet PC.

Jouer : https://keany-albertini.github.io/Survival_test1/?v=ew4

# Correctif web 0.3 · Spawn et profondeur visuelle

- Le rocher premium n’est plus placé sur le spawn. Le chargement des décors, la reprise des sauvegardes et le respawn recherchent un espace libre sans toucher à l’inventaire ni à la progression.
- Si un obstacle apparaît sur le personnage, les mouvements qui l’en font sortir restent autorisés. Paramètres → Dégager mon personnage ajoute une aide manuelle.
- Ombres conservées en mode téléphone (carte 768 px), lumière moins surexposée, sol plus nuancé et texturé, caméra plus proche et moins verticale, ateliers avec charpente/toitures détaillées, mini-carte plus fine et informations lisibles sur fond sombre.
- Vérification de la régression : `node tests/navigation.mjs`.

Jouer : https://keany-albertini.github.io/Survival_test1/?v=ew3

## Everwild — web 0.2 · Terres & créatures

Adaptation jouable d’Everwild dans `Survival_test1`, en Three.js. Solo et sauvegarde locale. [Jouer](https://keany-albertini.github.io/Survival_test1/?v=ew2c).

## Cette mise à jour

- Carte compacte de 520 × 520 unités : continent et cinq îles séparées par l’océan. Quatorze destinations, neuf ambiances : forêt tempérée/plaines, steppes, désert, jungle, marais, montagne, glacier, volcanique et côtes. Il s’agit d’une carte d’exploration du prototype, pas d’un import de la géographie V7 ni de la carte Unreal de 10 km.
- Relief, couleurs de terrain par biome, palmiers, cactus, herbes de steppe, ressources, neige localisée, mer et repères médiévaux.
- Dragons articulés (quatre pattes, ailes, cou, mâchoire, queue), gardiens sylvestres et loups des anciens. Niveaux générés par région, PV/dégâts dépendants du niveau, déplacement territorial, combat et butin. Les apparitions sont déterministes dans cette carte de test.
- Six stations accessibles : forges, établis de menuiserie, tables d’alchimie. Action ouvre l’atelier. Amélioration II : niveau joueur 3, recherche Ateliers, 12 bois + 10 pierre. III : niveau 8, 6 lingots + 6 planches. Le palier II débloque l’équipement renforcé ; III double la production de composants. Les paliers sont sauvegardés.
- Raffinage du minerai en lingots, travail du bois en planches, hache/pioche/épée renforcées, potion de soin consommée à la fabrication. Les recettes de station exigent d’être à proximité du bon atelier.
- Huit branches de recherche représentées : outils, structures, agriculture, alchimie, ateliers, chasse, pêche, domptage. Chasse améliore le butin ; pêche permet d’obtenir du poisson (ressource de viande crue dans ce prototype) au rivage ; domptage permet de faire éclore un œuf obtenu sur un dragon, au camp, avec six baies. Le jeune dragon reste au camp ; vol monté, élevage et reproduction ne sont pas encore simulés.
- Carte ⌖ avec destinations, biomes et plages de niveaux. Les voyages sont instantanés pour tester les régions ; ce n’est pas le système final de portails/transferts.
- Nouveau fond illustré de menu, boutons tactiles d’au moins 44 px, formats portrait/paysage, petits écrans, zones sûres, panneaux pleine hauteur avec défilement et pied de création fixe. Mode graphique léger par défaut sur téléphone. L’illustration du menu n’est pas une capture du rendu 3D.

## Fondations conservées

Huit races validées (Humains, Elfes, Orcs, Nains, Draconiens, Neige, Arbres, Désert), bases statistiques égales, race définitive, personnage articulé et animations d’actions, apprentissage par la pratique, attributs sans cap, inventaire par poids, six raccourcis, recherche par points/ressources, respec par alchimie, cœur de base, palissades/murs/tours, mort avec sac récupérable une heure, progression conservée. Les outils renforcés tombent dans le sac avec leur palier. Anciennes sauvegardes locales Everwild conservées.

## Commandes

Téléphone : doigt à gauche pour marcher/courir, Action pour récolter/combattre/ouvrir une station, marteau pour construire, ⇄ pour changer de pièce, ✧ pour la progression, ⌖ pour la carte, ☰ pour le menu.

Ordinateur : ZQSD/WASD/flèches, Maj pour courir, E pour agir, B construire, R changer de pièce, I sac, P progression, Échap menu ; 1–6 barre rapide.

## Limites

Le rendu 3D requiert WebGL. Résistance climatique et plongée ne sont pas encore simulées. Il reste à adapter les systèmes complets d’Everwild : carte V7 exacte, serveurs PvE/PvP et persistance réseau, corps hors ligne, lits, clans, raids, stations constructibles, toutes les recettes et ressources par tier, taming complet, montures volantes, reproduction, événements/boss et transferts. Les créatures/races sont des premiers modèles procéduraux, pas les assets définitifs d’Unreal.

## Structure active

`index.html`, `everwild.css` : interface. `js/everwild/app.js` : menus/atlas. `geography.js` : régions/relief. `fantasy.js` : créatures/stations/décors. `rules.js` : progression/recherche/recettes. `js/v20/main.js` : simulation et sauvegarde. `world.js` : terrain et faune. `models.js`, `js/v28/animation.js` : personnages. `js/v26/` : décors GLTF/PBR facultatifs.

`tests/mobile-preview.html` affiche le véritable jeu dans quatre formats de téléphone pour vérifier les menus. Le fond `assets/everwild/menu-dragon.jpg` est une illustration originale générée pour ce projet.
