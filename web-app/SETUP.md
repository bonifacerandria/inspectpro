# Phase 2 — Étape 1 : Setup projet React (fait)

## Structure créée

```
web-app/
├── src/
│   ├── api/client.js            # instance axios + interceptors (token, 401)
│   ├── context/authStore.js     # store zustand (squelette, complété étape 2)
│   ├── router/RouteProtegee.jsx # garde de routes (redirige vers /login)
│   ├── components/layout/LayoutPrincipal.jsx  # sidebar + zone de contenu
│   ├── pages/                   # une page par écran du CDC (placeholders)
│   ├── styles/global.css
│   ├── App.jsx                  # toutes les routes
│   └── main.jsx
├── docker/nginx.conf
├── Dockerfile                   # multi-stage : build Vite -> nginx
├── vite.config.js
├── package.json
└── .env.example
```

## Choix techniques

- **Vite** plutôt que Create React App (obsolète) : build et dev server rapides.
- **react-router-dom v6** avec routes imbriquées : `RouteProtegee` en garde,
  `LayoutPrincipal` fournit la sidebar à toutes les pages protégées.
- **zustand** plutôt que Redux : état d'auth très simple (token + user), pas
  besoin de la lourdeur de Redux. `persist` sauvegarde le token en
  localStorage pour rester connecté entre les sessions.
- **axios** avec interceptors : le token est injecté automatiquement sur
  chaque appel API, et une 401 déclenche une déconnexion automatique — le
  reste de l'app n'a jamais à s'en soucier.

## Pour démarrer en local

```bash
cd web-app
cp .env.example .env
npm install
npm run dev
```

## Prochaine étape (Phase 2.2)

Authentification complète : écran de login réel, action `login()` dans
`authStore.js` qui appelle `POST /api/login`, gestion des erreurs, et
`estConnecte()` qui reflète le vrai état.
