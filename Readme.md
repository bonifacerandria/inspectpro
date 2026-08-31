# **APPLICATION D'INSPECTION DES ÉQUIPEMENTS DE LEVAGE** 

_Note d'architecture fonctionnelle et technique_ 

Moteur d'inspection configurable — base d'équipements, points de contrôle dynamiques, anomalies, mesures et génération automatique de rapport 

25 août 2026 

## **1. Architecture générale du workflow** 

Plutôt qu'un simple formulaire, l'application doit être conçue comme un moteur d'inspection configurable : une base de données des équipements, des points de contrôle adaptés à chaque famille, la gestion des photos, des anomalies et des mesures, avec génération automatique du rapport. 

### **Parcours principal** 

- Connexion 

- Client 

- Site 

- Équipement 

- Identification 

- Inspection 

- Points de contrôle 

- Anomalies 

- Photos 

- Conclusion 

- Validation 

- Rapport PDF 

### **Arborescence des familles d'équipements** 

- ●ÉQUIPEMENTS DE LEVAGE 

   - ○1. Accessoires de levage 

      - ▪Élingue textile / nylon 

      - ▪Élingue chaîne 

      - ▪Élingue câble 

      - ▪Manille 

      - ▪Crochet 

      - ▪Anneau de levage 

      - ▪Pince de levage 

      - ▪Autres accessoires 

   - ○2. Équipements mobiles 

      - ▪Grue auxiliaire 

      - ▪Grue mobile 

      - ▪Nacelle 

      - ▪Chariot élévateur 

      - ▪Autres 

   - ○3. Équipements fixes 

      - ▪Pont roulant 

      - ▪Pont élévateur 

      - ▪Palan électrique 

      - ▪Poutre de levage 

      - ▪Grue à tour 

      - ▪Autres 

**2. Écran d'accueil** 

**TABLEAU DE BORD** 🔍  Nouvelle inspection 📋  Inspections en cours ✅  Inspections terminées ✅  Rapports ✅  Clients Sites 🏗️� ⚙️�  Équipements 📊  Statistiques ⚙️�  Paramètres 

Bouton principal mis en avant : « + NOUVELLE INSPECTION ». 

## **3. Création d'une inspection — Étape 1 : Client** 

**Nouveau rapport** Client : [________________] Adresse : [________________] Contact : [________________] Référence client : [________________] Inspecteur : [________________] Date : [25/08/2026] **[ CONTINUER ]** 

_Les informations du client sont enregistrées afin de ne pas être ressaisies lors de la prochaine inspection._ 

## **4. Sélection du site** 

Un même client peut avoir plusieurs sites. 

- ●Client → Site → Équipement (hiérarchie de sélection) 

#### **_Exemple_** 

- ●Client : ABC Madagascar 

   - ○Usine Antananarivo 

   - ○Chantier Toamasina 

   - ○Atelier Andraharo 

## **5. Sélection de la famille d'équipement** 

L'application affiche des cartes par famille : 

#### **_Accessoires_** 

- Élingue textile 

- Élingue chaîne 

- Élingue câble 

- Manille 

- Crochet 

- Anneau 

- Pince 

#### **_Mobiles_** 

- Grue auxiliaire 

- Grue mobile 

- Nacelle 

- Chariot élévateur 

#### **_Fixes_** 

- Pont roulant 

- Pont élévateur 

- Palan électrique 

- Poutre de levage 

- Grue à tour 

## **6. Identification de l'équipement** 

Étape essentielle du parcours. 

**IDENTIFICATION** Type : Pont roulant Marque : [___________] Modèle : [___________] N° de série : [___________] N° équipement : [___________] Année de fabrication : [___________] CMU : [___________] tonnes Constructeur : [___________] Localisation : [___________] 

L'application propose directement : 📷 Photographier la plaque constructeur, puis un OCR pour une lecture automatique de la plaque (marque, type, CMU, n° série, année). L'inspecteur vérifie ensuite les informations reconnues. 

## **7. Inspection dynamique** 

C'est le cœur de l'application. Plutôt qu'un formulaire codé en dur pour chaque équipement, la structure doit être générique : 

- ●Type équipement 

   - ○Famille 

▪Liste des points de contrôle 

- Réponse 

Chaque réponse peut déclencher une anomalie (avec photo à l'appui). 

## **8. Exemple : élingue textile** 

### **Identification** 

- Type d'élingue 

- CMU 

- Longueur 

- Fabricant 

- N° identification 

- Date de fabrication 

- Marquage 

### **Contrôle visuel** 

|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Marquage lisible|C / O / NC / DM / DI|
|État général|C / O / NC / DM / DI|
|Coupures|C / O / NC / DM / DI|
|Déchirures|C / O / NC / DM / DI|
|Abrasion|C / O / NC / DM / DI|
|Brûlures|C / O / NC / DM / DI|
|Déformaton|C / O / NC / DM / DI|
|Coutures|C / O / NC / DM / DI|
|Boucles|C / O / NC / DM / DI|
|Protecton des angles|C / O / NC / DM / DI|



### **Pour chaque non-conformité** 

Anomalie : [________________________] Gravité :  ○ Observation  ○ Anomalie  ○ Défaut majeur  ○ Danger immédiat Photo : [📷 Ajouter photo] 

## **9. Exemple : manille** 

La liste de contrôle change automatiquement selon le type d'équipement sélectionné : 

|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Marquage CMU|C / O / NC / DM / DI|
|Identfcaton|C / O / NC / DM / DI|
|Corps de manille|C / O / NC / DM / DI|



|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Axe|C / O / NC / DM / DI|
|Filetage|C / O / NC / DM / DI|
|Goupille|C / O / NC / DM / DI|
|Déformaton|C / O / NC / DM / DI|
|Fissure|C / O / NC / DM / DI|
|Usure|C / O / NC / DM / DI|
|Corrosion|C / O / NC / DM / DI|
|État des accessoires|C / O / NC / DM / DI|
|Compatbilité avec l'utlisaton|C / O / NC / DM / DI|



## **10. Exemple : grue auxiliaire** 

Pour les équipements mobiles, le formulaire devient plus étoffé. 

### **Identification** 

- Marque 

- Modèle 

- N° série 

- CMU 

- Portée 

- Année 

- Immatriculation 

### **Structure** 

|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Châssis|C / O / NC / DM / DI|
|Flèche|C / O / NC / DM / DI|
|Vérins|C / O / NC / DM / DI|
|Stabilisateur|C / O / NC / DM / DI|
|Soudures|C / O / NC / DM / DI|
|Déformaton|C / O / NC / DM / DI|
|Corrosion|C / O / NC / DM / DI|



### **Système hydraulique** 

|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Flexibles|C / O / NC / DM / DI|



|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Raccords|C / O / NC / DM / DI|
|Vérins|C / O / NC / DM / DI|
|Fuites|C / O / NC / DM / DI|
|Pression|C / O / NC / DM / DI|
|État général|C / O / NC / DM / DI|



### **Système de levage** 

|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Crochet|C / O / NC / DM / DI|
|Linguet|C / O / NC / DM / DI|
|Câble|C / O / NC / DM / DI|
|Poulies|C / O / NC / DM / DI|
|Treuil|C / O / NC / DM / DI|
|Tambour|C / O / NC / DM / DI|



### **Commandes** 

|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Arrêt d'urgence|C / O / NC / DM / DI|
|Limiteur|C / O / NC / DM / DI|
|Indicateur de charge|C / O / NC / DM / DI|
|Avertsseur sonore|C / O / NC / DM / DI|



### **Stabilisateurs** 

|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Vérins|C / O / NC / DM / DI|
|Patns|C / O / NC / DM / DI|
|Blocage|C / O / NC / DM / DI|
|Déformaton|C / O / NC / DM / DI|
|Fuites|C / O / NC / DM / DI|



### **Documents** 

- Notice 

- Certificat 

- Registre 

- Dernier contrôle 

- Plaque constructeur 

## **11. Exemple : pont roulant** 

- ●PONT ROULANT 

   - ○Identification 

   - ○Plaque constructeur 

   - ○Structure 

▪Poutre ▪Sommiers ▪Soudures ▪Corrosion 

○Translation ▪Roues ▪Rails ▪Motoréducteurs ▪Freins 

- ○Levage 

▪Palan ▪Câble ▪Crochet ▪Poulies ▪Tambour 

- ○Électricité 

▪Coffret 

▪Câbles 

▪Mise à la terre ▪Commandes 

- ○Sécurité 

▪Arrêt d'urgence 

- ▪Limiteur de charge 

- ▪Fin de course 

▪Avertisseur 

   - ▪Dispositifs de sécurité 

- ○Essais 

▪Essai à vide 

- ▪Essai fonctionnel 

- ▪Essai en charge 

## **12. Système de notation** 

Ne pas limiter les réponses à Conforme / Non conforme. Utiliser une échelle à cinq niveaux, plus une valeur « non applicable » : 

- 🟢  C  — Conforme 

- 🟠  O  — Observation 

- ✅  NC — Non conforme 

- ⚫  DM — Défaut majeur 

- ⛔  DI — Danger immédiat 

- ◻️�  NA — Non applicable 

Cela permet de générer automatiquement une synthèse, par exemple : 

**Nombre de points contrôlés : 48** Conformes :        39 Observations :      4 Non-conformes :     3 Défauts majeurs :   2 Danger immédiat :   0 

## **13. Gestion des anomalies** 

Fonction centrale de l'application. Lorsqu'un point est déclaré non conforme : 

##### **ANOMALIE N°03** 

Point : Câble de levage Constat : Usure importante avec plusieurs fils cassés. Gravité : [ Défaut majeur ] Photo : 📷 IMG_003 Action recommandée : Remplacement du câble avant remise en service. Responsable : [___________] Délai : [___________] 

_L'application attribue automatiquement une numérotation : A-001, A-002, A-003…_ 

## **14. Photos intelligentes** 

Pour chaque anomalie : plusieurs photos numérotées (Photo 1, Photo 2, Photo 3…). 

Photos obligatoires selon le type d'équipement — exemple pont roulant : 

- Photo générale 

- Plaque constructeur 

- Crochet 

- Câble 

- Palan 

- Structure 

- Anomalies 

_L'application peut bloquer la finalisation tant qu'une photo obligatoire manque : « ⚠️� Plaque constructeur non photographiée. »_ 

## **15. Mesures** 

Certains contrôles nécessitent une valeur numérique. 

Diamètre câble nominal : 12 mm Diamètre mesuré : [ 10,8 ] mm Réduction : [ 10 % ] 

Jeu mesuré : [ 2,5 ] mm Valeur admissible : [ ... ] Résultat : 🟢 Conforme 

La base de données doit donc prévoir, pour chaque point de contrôle, un type de réponse : 

- ●Point de contrôle 

   - ○Type de réponse 

      - ▪Oui / Non 

      - ▪Conforme / Non conforme 

      - ▪Texte 

      - ▪Nombre 

      - ▪Photo 

      - ▪Choix multiple 

      - ▪Mesure 

## **16. Essais fonctionnels** 

Pour les équipements mobiles et fixes, une section dédiée : 

|**Point de contrôle**|**Réponse atendue**|
|---|---|
|Essai à vide|C / O / NC / DM / DI|
|Essai montée/descente|C / O / NC / DM / DI|
|Essai translaton|C / O / NC / DM / DI|
|Essai arrêt d'urgence|C / O / NC / DM / DI|
|Essai limiteur de charge|C / O / NC / DM / DI|
|Essai fn de course|C / O / NC / DM / DI|



Avec possibilité de saisir les valeurs : charge d'essai (kg) et résultat. 

## **17. Documents contrôlés** 

Section commune à tous les équipements : 

- Notice constructeur 

- Déclaration CE 

- Certificat de conformité 

- Registre de sécurité 

- Rapport précédent 

- Certificat/rapport de vérification 

- Carnet de maintenance 

- Document d'identification 

Pour chaque document : 📷 photo / scan, ou ✅ pièce jointe PDF. 

## **18. Conclusion automatique** 

**SYNTHÈSE** Points contrôlés : 48 🟢 Conforme          39 🟠 Observations       4 ✅ Non-conformes      3 ⚫ Défauts majeurs    2 ⛔ Danger immédiat    0 

L'application propose ensuite automatiquement un avis, par exemple : 

#### • AVIS : ÉQUIPEMENT MAINTENU EN SERVICE SOUS RÉSERVE DE LA LEVÉE DES OBSERVATIONS 

#### • AVIS : ÉQUIPEMENT NON AUTORISÉ À ÊTRE UTILISÉ EN L'ÉTAT 

_L'inspecteur garde toujours la possibilité de modifier ou valider la conclusion proposée._ 

## **19. Signature** 

##### **INSPECTEUR** 

Nom : ________________ Signature : ✍️� 

##### **CLIENT / RESPONSABLE** 

Nom : ________________ Signature : ✍️� 

☑ J'ai vérifié les informations du rapport. **[ VALIDER L'INSPECTION ]** 

## **20. Génération automatique du rapport PDF** 

1. Informations générales 

2. Identification de l'équipement 

3. Caractéristiques techniques 

4. Documents examinés 

5. Points de contrôle 

6. Essais réalisés 

7. Anomalies constatées 

8. Photographies 

9. Synthèse 10.Conclusion 

11.Signatures 

Les photos des anomalies doivent être automatiquement liées au bon constat, par exemple : 

**A-003 — Usure du câble** Photo 12 Photo 13 

## **21. Base de données** 

### **Hiérarchie des entités** 

- ●Client 

   - ○Site ▪Équipement 

– Type – Caractéristiques – Inspection 

Points de contrôle Anomalies Photos Mesures Essais Documents Conclusion 

### **Tables principales** 

|CLIENT|SITE|EQUIPEMENT|
|---|---|---|
|TYPE_EQUIPEMENT|INSPECTION|POINT_CONTROLE|
|REPONSE_CONTROLE|ANOMALIE|PHOTO|
|MESURE|ESSAI|DOCUMENT|
|SIGNATURE|RAPPORT||



## **22. Le point essentiel : rendre l'application configurable** 

Éviter de coder en dur « si pont roulant → afficher ces 48 questions ». Créer à la place une base de données des points de contrôle. 

#### **_Exemple — TYPE = PONT_ROULANT_** 

- PC001 → Plaque constructeur 

- PC002 → Structure 

- PC003 → Soudures 

- PC004 → Corrosion 

- PC005 → Câble 

- PC006 → Crochet 

- PC007 → Linguet 

- … 

#### **_Exemple — TYPE = ELINGUE_TEXTILE_** 

- PC101 → Marquage 

- PC102 → Coupure 

- PC103 → Abrasion 

- PC104 → Couture 

- … 

Ainsi, un point de contrôle peut être ajouté ou modifié sans refaire l'application Android. 

## **23. Deux applications en une** 

### **📱 Application Inspecteur (terrain)** 

- ●Inspection 

   - ○Contrôle 

   - ○Photos 

   - ○Mesures 

   - ○Signature 

   - ○Rapport 

### 💻 **Interface Administrateur** 

- Gestion des clients 

- Gestion des inspecteurs 

- Gestion des équipements 

- Gestion des familles 

- Gestion des points de contrôle 

- Gestion des critères 

- Gestion des modèles de rapports 

- Gestion des anomalies 

- Statistiques 

_Cela permet par exemple d'ajouter le contrôle du linguet sur les crochets sans publier une nouvelle version Android._ 

## **24. Workflow final recommandé** 

- ●Connexion 

   - ○Tableau de bord 

      - ▪+ Nouvelle inspection 

         - Client 

         - Site 

– Famille équipement 

Accessoires 

Mobiles Fixes 

- Type d'équipement 

- Identification 

- Plaque / photos 

- Points de contrôle 

Conforme 

Observation 

Non conforme → Anomalie → Photo 

- Mesures 

- Essais 

- Documents 

- Synthèse 

- Conclusion 

- Signatures 

- Rapport PDF 

Archivage / envoi 

## **25. Recommandation de démarrage — MVP** 

Commencer par un MVP limité à cinq types d'équipements : 

- Élingue textile 

- Élingue chaîne 

- Manille 

- Crochet 

- Pont roulant 

Une fois le moteur fonctionnel, ajouter progressivement : grue auxiliaire, grue mobile, nacelle, chariot élévateur, palan, grue à tour, etc. 

_Cette approche est plus robuste que de développer immédiatement vingt formulaires différents._ 

