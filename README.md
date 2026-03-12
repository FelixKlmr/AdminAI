# AdminAI — Deployment op Vercel

## Stap 1: GitHub repo aanmaken
1. Ga naar github.com en maak een nieuwe repository aan (bijv. `adminai`)
2. Upload alle bestanden uit deze map naar die repository

## Stap 2: Deployen op Vercel
1. Ga naar vercel.com en log in (gratis account)
2. Klik "Add New Project"
3. Importeer je GitHub repository
4. Klik "Deploy" — Vercel herkent Next.js automatisch

## Stap 3: Environment variables instellen in Vercel
Ga naar je project > Settings > Environment Variables en voeg toe:

| Naam | Waarde |
|------|--------|
| EXACT_CLIENT_ID | a94a8eb1-6e79-4547-8943-f91e3aa4cdae |
| EXACT_CLIENT_SECRET | MuYP1woHHzhu |
| EXACT_REDIRECT_URI | https://JOUW-VERCEL-URL.vercel.app/api/callback |
| EXACT_DIVISION | 3993521 |
| ANTHROPIC_API_KEY | (je Anthropic API key) |

**Let op:** Vul bij EXACT_REDIRECT_URI je echte Vercel URL in na deployment.

## Stap 4: Redirect URI updaten in Exact Online
1. Ga naar apps.exactonline.nl
2. Open de AdminAI app
3. Verander de Redirect URI naar: `https://JOUW-VERCEL-URL.vercel.app/api/callback`
4. Sla op

## Stap 5: Klaar!
Ga naar je Vercel URL en log in met Exact Online.

## Anthropic API Key ophalen
Ga naar console.anthropic.com > API Keys > Create Key
