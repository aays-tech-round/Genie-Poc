# Genie UI

Next.js (App Router, JavaScript) front end for the Databricks Genie chatbot. It talks to the
FastAPI backend in `../app` and signs users in with Microsoft Entra ID (MSAL).

## Getting started

```bash
cp .env.example .env.local   # fill in the SSO values; the API URL defaults to localhost:8000
npm install
npm run dev
```

Open http://localhost:3000. The backend must be running for questions to get answers.

## Project structure

```
src/
├── app/
│   ├── (auth)/login/          Sign-in route (own root layout, Bootstrap + Tailwind)
│   └── (main)/                Signed-in app: layout, global theme tokens, and the chat page
├── auth/                      MSAL config, AuthProvider, ProtectedRoute, login page
├── components/
│   ├── chat/                  Chat area: header, welcome screen, message list, bubble, composer
│   ├── results/               Query result views: table, bar/line charts, stat tiles + data helpers
│   ├── sidebar/               Sidebar, chat list item, search dialog, account menu
│   └── ui/                    Shared building blocks: icons, Markdown renderer, theme toggle
├── constants/                 Backend URL and polling settings, theme key, starter questions
├── hooks/                     useChats (history + ask/poll flow), useDismiss (close on outside click)
└── lib/                       genieApi (backend calls), chatStorage (localStorage), small utils
```

Conventions:

- Components are plain `.js` files with JSX, each styled by a CSS Module next to it.
  Colours, shadows and radii come from the tokens in `app/(main)/globals.css`, which also
  define the dark theme (`[data-theme='dark']`).
- Pages compose components; state and side effects live in hooks; network and storage
  code lives in `lib/`. Import across folders with the `@/` alias.
- Chat history is stored per user in the browser's localStorage.
- To change the starter questions on the welcome screen, edit `constants/suggestions.js`.
