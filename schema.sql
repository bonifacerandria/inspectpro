-- =====================================================================
-- APPLICATION D'INSPECTION DES ÉQUIPEMENTS DE LEVAGE
-- Schéma PostgreSQL — Phase 1.1 (base)
-- Principe directeur : moteur d'inspection CONFIGURABLE
--   -> aucun formulaire codé en dur par type d'équipement
--   -> tout est piloté par familles_equipement / types_equipement / points_controle
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- pour gen_random_uuid() si besoin plus tard

-- ---------------------------------------------------------------------
-- 1. UTILISATEURS (inspecteurs / administrateurs)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'inspecteur'
                        CHECK (role IN ('admin', 'inspecteur')),
    telephone       VARCHAR(30),
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. CLIENTS / SITES
-- ---------------------------------------------------------------------
CREATE TABLE clients (
    id                  BIGSERIAL PRIMARY KEY,
    nom                 VARCHAR(200) NOT NULL,
    adresse             VARCHAR(255),
    contact             VARCHAR(150),
    telephone           VARCHAR(30),
    email               VARCHAR(150),
    reference_client    VARCHAR(100),
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE sites (
    id          BIGSERIAL PRIMARY KEY,
    client_id   BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    nom         VARCHAR(200) NOT NULL,       -- ex: "Usine Antananarivo"
    adresse     VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. FAMILLES / TYPES D'ÉQUIPEMENT  (le coeur de la configurabilité)
-- ---------------------------------------------------------------------
CREATE TABLE familles_equipement (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(30) NOT NULL UNIQUE,   -- ACCESSOIRES / MOBILES / FIXES
    libelle     VARCHAR(100) NOT NULL,
    ordre       INT NOT NULL DEFAULT 0
);

CREATE TABLE types_equipement (
    id                  BIGSERIAL PRIMARY KEY,
    famille_id          BIGINT NOT NULL REFERENCES familles_equipement(id),
    code                VARCHAR(50) NOT NULL UNIQUE,  -- ELINGUE_TEXTILE, PONT_ROULANT...
    libelle             VARCHAR(150) NOT NULL,
    icone               VARCHAR(100),
    actif               BOOLEAN NOT NULL DEFAULT TRUE,
    -- champs d'identification spécifiques (JSON pour rester flexible
    -- sans multiplier les colonnes ; ex: {"portee":true,"immatriculation":true})
    champs_identification JSONB NOT NULL DEFAULT '{}',
    ordre               INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- Sections d'un formulaire d'inspection (ex: "Structure", "Système hydraulique",
-- "Système de levage", "Commandes"...) -> permet de regrouper les points de contrôle
CREATE TABLE sections_controle (
    id                  BIGSERIAL PRIMARY KEY,
    type_equipement_id  BIGINT NOT NULL REFERENCES types_equipement(id) ON DELETE CASCADE,
    code                VARCHAR(50) NOT NULL,      -- STRUCTURE, HYDRAULIQUE, LEVAGE...
    libelle             VARCHAR(150) NOT NULL,
    ordre               INT NOT NULL DEFAULT 0,
    UNIQUE (type_equipement_id, code)
);

-- Points de contrôle : LA table pivot qui rend l'app configurable.
-- Ajouter/retirer un contrôle = une ligne en base, jamais un déploiement.
CREATE TABLE points_controle (
    id                  BIGSERIAL PRIMARY KEY,
    type_equipement_id  BIGINT NOT NULL REFERENCES types_equipement(id) ON DELETE CASCADE,
    section_id          BIGINT REFERENCES sections_controle(id) ON DELETE SET NULL,
    code                VARCHAR(20) NOT NULL,       -- PC001, PC101...
    libelle              VARCHAR(200) NOT NULL,      -- "Câble de levage"
    type_reponse        VARCHAR(30) NOT NULL
                            CHECK (type_reponse IN (
                                'oui_non', 'conforme_echelle', 'texte',
                                'nombre', 'photo', 'choix_multiple', 'mesure'
                            )),
    -- pour type_reponse = choix_multiple : liste des options en JSON
    options              JSONB,
    -- pour type_reponse = mesure : unité, valeur nominale, tolérance
    unite_mesure         VARCHAR(20),
    valeur_nominale      NUMERIC(10,2),
    tolerance_pourcent   NUMERIC(5,2),
    obligatoire          BOOLEAN NOT NULL DEFAULT TRUE,
    ordre                INT NOT NULL DEFAULT 0,
    actif                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (type_equipement_id, code)
);

-- Photos obligatoires par type d'équipement (ex: pont roulant -> "Plaque
-- constructeur", "Crochet", "Câble"...) — indépendant des points de contrôle
CREATE TABLE photos_obligatoires (
    id                  BIGSERIAL PRIMARY KEY,
    type_equipement_id  BIGINT NOT NULL REFERENCES types_equipement(id) ON DELETE CASCADE,
    libelle             VARCHAR(150) NOT NULL,   -- "Plaque constructeur"
    ordre               INT NOT NULL DEFAULT 0
);

-- Documents attendus par type d'équipement (Notice, Déclaration CE, etc.)
CREATE TABLE documents_requis (
    id                  BIGSERIAL PRIMARY KEY,
    type_equipement_id  BIGINT NOT NULL REFERENCES types_equipement(id) ON DELETE CASCADE,
    libelle             VARCHAR(150) NOT NULL,
    obligatoire         BOOLEAN NOT NULL DEFAULT FALSE,
    ordre               INT NOT NULL DEFAULT 0
);

-- Essais fonctionnels attendus par type d'équipement
CREATE TABLE essais_requis (
    id                  BIGSERIAL PRIMARY KEY,
    type_equipement_id  BIGINT NOT NULL REFERENCES types_equipement(id) ON DELETE CASCADE,
    libelle             VARCHAR(150) NOT NULL,
    necessite_charge    BOOLEAN NOT NULL DEFAULT FALSE, -- saisie charge d'essai (kg) ?
    ordre               INT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- 4. ÉQUIPEMENTS (instances réelles chez un client)
-- ---------------------------------------------------------------------
CREATE TABLE equipements (
    id                  BIGSERIAL PRIMARY KEY,
    site_id             BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    type_equipement_id  BIGINT NOT NULL REFERENCES types_equipement(id),
    marque              VARCHAR(100),
    modele              VARCHAR(100),
    numero_serie        VARCHAR(100),
    numero_equipement   VARCHAR(100),   -- identifiant interne client
    annee_fabrication   INT,
    cmu_tonnes          NUMERIC(10,2),  -- charge maximale d'utilisation
    constructeur        VARCHAR(150),
    localisation        VARCHAR(200),
    -- champs additionnels variables selon le type (portée, immatriculation...)
    champs_supplementaires JSONB NOT NULL DEFAULT '{}',
    photo_plaque_url     VARCHAR(255),  -- photo OCR de la plaque constructeur
    created_at           TIMESTAMP NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 5. INSPECTIONS
-- ---------------------------------------------------------------------
CREATE TABLE inspections (
    id                  BIGSERIAL PRIMARY KEY,
    equipement_id       BIGINT NOT NULL REFERENCES equipements(id),
    inspecteur_id       BIGINT NOT NULL REFERENCES users(id),
    date_inspection     DATE NOT NULL DEFAULT CURRENT_DATE,
    statut              VARCHAR(20) NOT NULL DEFAULT 'en_cours'
                            CHECK (statut IN ('en_cours', 'terminee', 'validee', 'archivee')),
    -- synthèse (dénormalisée pour affichage rapide, recalculée à la validation)
    nb_points_controles  INT DEFAULT 0,
    nb_conformes         INT DEFAULT 0,
    nb_observations      INT DEFAULT 0,
    nb_non_conformes     INT DEFAULT 0,
    nb_defauts_majeurs   INT DEFAULT 0,
    nb_dangers_immediats INT DEFAULT 0,
    avis_propose         VARCHAR(50),   -- calculé automatiquement
    conclusion           TEXT,          -- éventuellement modifiée par l'inspecteur
    date_validation       TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 6. RÉPONSES AUX POINTS DE CONTRÔLE
-- ---------------------------------------------------------------------
CREATE TABLE reponses_controle (
    id                  BIGSERIAL PRIMARY KEY,
    inspection_id       BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    point_controle_id   BIGINT NOT NULL REFERENCES points_controle(id),
    -- échelle à 5 niveaux + NA, cf. section 12 du CDC
    statut               VARCHAR(5)
                            CHECK (statut IN ('C', 'O', 'NC', 'DM', 'DI', 'NA')),
    valeur_texte         TEXT,          -- si type_reponse = texte
    valeur_nombre        NUMERIC(12,3), -- si type_reponse = nombre
    valeur_choix         VARCHAR(150),  -- si type_reponse = choix_multiple
    commentaire          TEXT,
    created_at           TIMESTAMP NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (inspection_id, point_controle_id)
);

-- ---------------------------------------------------------------------
-- 7. ANOMALIES (déclenchées par une réponse non conforme)
-- ---------------------------------------------------------------------
CREATE TABLE anomalies (
    id                  BIGSERIAL PRIMARY KEY,
    inspection_id       BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    reponse_controle_id BIGINT REFERENCES reponses_controle(id) ON DELETE SET NULL,
    numero              VARCHAR(20) NOT NULL,   -- A-001, A-002... (généré par trigger/appli)
    constat              TEXT NOT NULL,
    gravite               VARCHAR(20) NOT NULL
                            CHECK (gravite IN ('observation', 'anomalie', 'defaut_majeur', 'danger_immediat')),
    action_recommandee    TEXT,
    responsable            VARCHAR(150),
    delai                  DATE,
    statut                 VARCHAR(20) NOT NULL DEFAULT 'ouverte'
                            CHECK (statut IN ('ouverte', 'levee')),
    created_at              TIMESTAMP NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (inspection_id, numero)
);

-- ---------------------------------------------------------------------
-- 8. PHOTOS (polymorphe : anomalie, équipement, document ou inspection)
-- ---------------------------------------------------------------------
CREATE TABLE photos (
    id                  BIGSERIAL PRIMARY KEY,
    inspection_id       BIGINT REFERENCES inspections(id) ON DELETE CASCADE,
    -- relation polymorphe simple (photographiable_type / photographiable_id)
    photographiable_type VARCHAR(30) NOT NULL
                            CHECK (photographiable_type IN (
                                'anomalie', 'equipement', 'document', 'photo_obligatoire', 'signature'
                            )),
    photographiable_id   BIGINT NOT NULL,
    libelle               VARCHAR(150),   -- ex: "Plaque constructeur", "Photo générale"
    numero                VARCHAR(20),    -- "Photo 12"
    chemin_fichier         VARCHAR(255) NOT NULL,
    prise_le                TIMESTAMP NOT NULL DEFAULT now(),
    created_at              TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 9. MESURES (valeurs numériques rattachées à un point de contrôle)
-- ---------------------------------------------------------------------
CREATE TABLE mesures (
    id                  BIGSERIAL PRIMARY KEY,
    reponse_controle_id BIGINT NOT NULL REFERENCES reponses_controle(id) ON DELETE CASCADE,
    valeur_nominale      NUMERIC(10,3),
    valeur_mesuree       NUMERIC(10,3) NOT NULL,
    unite                VARCHAR(20),
    ecart_pourcent        NUMERIC(6,2),   -- calculé (ex: réduction de diamètre 10%)
    resultat              VARCHAR(5)
                            CHECK (resultat IN ('C', 'O', 'NC', 'DM', 'DI')),
    created_at             TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 10. ESSAIS FONCTIONNELS
-- ---------------------------------------------------------------------
CREATE TABLE essais (
    id                  BIGSERIAL PRIMARY KEY,
    inspection_id       BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    essai_requis_id      BIGINT REFERENCES essais_requis(id),
    libelle               VARCHAR(150) NOT NULL,
    charge_essai_kg        NUMERIC(10,2),
    resultat               VARCHAR(5)
                            CHECK (resultat IN ('C', 'O', 'NC', 'DM', 'DI', 'NA')),
    commentaire             TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 11. DOCUMENTS EXAMINÉS
-- ---------------------------------------------------------------------
CREATE TABLE documents (
    id                  BIGSERIAL PRIMARY KEY,
    inspection_id       BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    document_requis_id   BIGINT REFERENCES documents_requis(id),
    libelle               VARCHAR(150) NOT NULL,
    present               BOOLEAN NOT NULL DEFAULT FALSE,
    chemin_fichier         VARCHAR(255),   -- scan/PDF joint
    commentaire             TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 12. SIGNATURES
-- ---------------------------------------------------------------------
CREATE TABLE signatures (
    id                  BIGSERIAL PRIMARY KEY,
    inspection_id       BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    type_signataire      VARCHAR(20) NOT NULL
                            CHECK (type_signataire IN ('inspecteur', 'client')),
    nom                    VARCHAR(150) NOT NULL,
    chemin_fichier          VARCHAR(255) NOT NULL,  -- image de la signature
    signe_le                TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 13. RAPPORTS GÉNÉRÉS (PDF)
-- ---------------------------------------------------------------------
CREATE TABLE rapports (
    id                  BIGSERIAL PRIMARY KEY,
    inspection_id       BIGINT NOT NULL UNIQUE REFERENCES inspections(id) ON DELETE CASCADE,
    numero_rapport       VARCHAR(50) NOT NULL UNIQUE,
    chemin_fichier_pdf     VARCHAR(255) NOT NULL,
    genere_le               TIMESTAMP NOT NULL DEFAULT now(),
    envoye_le               TIMESTAMP
);

-- ---------------------------------------------------------------------
-- INDEX utiles
-- ---------------------------------------------------------------------
CREATE INDEX idx_sites_client ON sites(client_id);
CREATE INDEX idx_equipements_site ON equipements(site_id);
CREATE INDEX idx_equipements_type ON equipements(type_equipement_id);
CREATE INDEX idx_types_equipement_famille ON types_equipement(famille_id);
CREATE INDEX idx_points_controle_type ON points_controle(type_equipement_id);
CREATE INDEX idx_inspections_equipement ON inspections(equipement_id);
CREATE INDEX idx_inspections_inspecteur ON inspections(inspecteur_id);
CREATE INDEX idx_reponses_inspection ON reponses_controle(inspection_id);
CREATE INDEX idx_anomalies_inspection ON anomalies(inspection_id);
CREATE INDEX idx_photos_polymorphe ON photos(photographiable_type, photographiable_id);

-- =====================================================================
-- EXEMPLE DE SEED (MVP — extrait, à compléter en Phase 1.3)
-- =====================================================================
-- INSERT INTO familles_equipement (code, libelle, ordre) VALUES
-- ('ACCESSOIRES', 'Accessoires de levage', 1),
-- ('MOBILES', 'Équipements mobiles', 2),
-- ('FIXES', 'Équipements fixes', 3);
--
-- INSERT INTO types_equipement (famille_id, code, libelle, ordre) VALUES
-- (1, 'ELINGUE_TEXTILE', 'Élingue textile / nylon', 1),
-- (1, 'MANILLE', 'Manille', 4),
-- (3, 'PONT_ROULANT', 'Pont roulant', 1);
--
-- INSERT INTO points_controle (type_equipement_id, code, libelle, type_reponse, ordre) VALUES
-- (1, 'PC101', 'Marquage lisible', 'conforme_echelle', 1),
-- (1, 'PC102', 'Coupures', 'conforme_echelle', 3),
-- (1, 'PC103', 'Abrasion', 'conforme_echelle', 5);
