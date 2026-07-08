# PCI Mock Interview -- Prep & Instant Feedback (No API needed)

Student le UEL/PCI-style credibility interview questions video ma record garera
practice garna paune tool. Answer diyepachi, **feedback instantly, fully in the
browser** generate huncha -- no AI API key, no server cost, no environment
variables to configure.

- **20 questions** across all 6 credibility-check categories (Motivation,
  Course & University, Academic Background, Finance & Sponsorship, Post-Study
  Plan, General)
- **Case-file themed UI** -- folder tabs per category, and a stamped verdict
  (Ready / Needs Practice / Not Ready) on the results page
- Results page shows **what you actually said** for each answer (collapsible
  transcript) alongside the score
- **Download the feedback report as a PDF** -- one click, generated fully
  client-side with `jspdf`, no server round-trip

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript, plain CSS
- **Video preview:** Browser's `getUserMedia` -- camera stays local, nothing
  is uploaded or recorded to a file in this version
- **Transcription:** Browser's native **Web Speech API** (`SpeechRecognition`) --
  100% free, no API key, works best in **Chrome or Edge**
- **Feedback:** Rule-based scoring, computed entirely client-side in
  `lib/feedback.ts` -- no server call, no API key, no cost. See "How scoring
  works" below.
- **No database** -- one session's answers live in `sessionStorage` between the
  interview page and results page (cleared when the browser tab closes).

## Why no AI API

Timro request thiyo AI API bina nai chalne version -- so feedback pipeline lai
transcript-based heuristics (keyword matching, filler-word ratio, specificity
checks, generic-phrase detection) le replace gareko cha. Yesले judgment ta AI
jasto nuanced dinna, tara free ho, instant ho, ani kunai backend/API key
jhamela nai chaidaina.

## Setup

```bash
npm install
npm run dev
```

Browser ma `http://localhost:3000` khol्नुस्. Camera/mic permission allow garnus.
Bas -- kunai `.env` file, API key, ya server setup chaidaina.

## Project structure

```
app/
  page.tsx                 → landing page
  interview/page.tsx       → question-by-question recording flow (folder-tab nav)
  results/page.tsx         → feedback report + transcript + PDF export (no network)
components/
  Recorder.tsx             → camera preview + record button + live transcript
lib/
  questions.ts             → PCI/UEL question bank (20 questions)
  feedback.ts              → rule-based scoring engine (no API)
  pdf.ts                   → client-side PDF export (jspdf, no server)
styles/
  globals.css              → case-file/dossier visual identity
```

## How scoring works (`lib/feedback.ts`)

For each answer, the transcript is checked for:

- **Length/depth** -- too short (<15 words) is penalized, a developed answer
  (45+ words) is rewarded
- **Category-specific specificity** -- e.g. Finance questions are checked for
  real numbers/currency; Course questions for module/campus/faculty mentions
- **Generic/rehearsed phrases** -- stock phrases like "better life" or "bright
  future" are flagged as low-credibility filler
- **Filler words** -- "um", "like", "actually" etc. counted as a ratio of
  total words
- **Pace** -- a very low words-per-minute with a long duration is flagged as
  possibly hesitant delivery

Scores combine into a 0-10 per-question score and an overall readiness rating
(Not Ready / Needs Practice / Ready). Edit the keyword lists and phrase lists
at the top of `lib/feedback.ts` to tune it for your own question bank.

## Editing the question bank

`lib/questions.ts` ma edit garnus. Naya category thapda `lib/feedback.ts` ko
`CATEGORY_KEYWORDS` ma matching keyword list pani thapnus, natra tyo category
ko specificity check skip huncha.

## Deploying to GitHub Pages

This repo is pre-configured for GitHub Pages (fully static export -- no
server needed, everything runs client-side in the browser anyway):

1. Push this repo to GitHub (any repo name is fine).
2. In the repo, go to **Settings → Pages** → under "Build and deployment",
   set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).
   `.github/workflows/deploy.yml` builds the app and deploys it -- no
   manual `basePath` editing needed, it's computed automatically from your
   repo name.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

Note: camera/mic access and the Web Speech API both require **HTTPS**,
which GitHub Pages provides automatically -- and works best in **Chrome or
Edge**.

## Deploying for free (alternative: Vercel)

Vercel/Netlify jasto kunai static/Next.js host ma deploy garna milxa --
**environment variable ya API key configure garnu pardaina**, kina ki sabai
feedback logic client-side ho.

## Known limitations (test build)

- Web Speech API Safari/Firefox ma raamro sanga support hudaina -- Chrome/Edge
  use garnus testing ko lagi.
- Feedback rule-based ho -- AI jasto "yo genuine sounds vayo ki nai" bhanne
  nuanced judgment dina sakdaina, keyword/pattern match matra ho.
- No login/auth, no per-student history saved yet.

## Suggested next steps

1. Firebase Auth add garera student login
2. Firestore ma each session's transcript + score save garne (history/progress tracking)
3. Admin view -- counselor le sabai student ko result herna paune dashboard
4. Later, if budget allows: swap `lib/feedback.ts` call in `results/page.tsx`
   for a real AI API call to get more nuanced, human-like feedback
