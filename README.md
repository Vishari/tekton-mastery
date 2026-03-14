# Tekton Account Mastery — Setup Guide

## What you have
A fully offline-capable Progressive Web App (PWA) that runs in any browser and can be installed on your phone's home screen like a real app.

---

## Running it locally (for testing on desktop)

You need a simple local web server — the quickest option if you have Python:

```bash
cd tekton-mastery
python3 -m http.server 8080
```

Then open: **http://localhost:8080** in Chrome or Safari.

---

## Installing on your phone (the real app experience)

### Option A — Host free on GitHub Pages (recommended)

1. Create a free account at **github.com**
2. Create a new **public** repository called `tekton-mastery`
3. Upload all the files in this folder to that repo
4. Go to **Settings → Pages → Source: main branch / root**
5. Your app will be live at: `https://YOUR-USERNAME.github.io/tekton-mastery`

**On iPhone (Safari):**
- Open the URL → tap the Share button → "Add to Home Screen"

**On Android (Chrome):**
- Open the URL → tap the 3-dot menu → "Add to Home Screen" or "Install App"

### Option B — Host free on Netlify (drag and drop, no coding)

1. Go to **netlify.com** → sign up free
2. Drag the entire `tekton-mastery` folder onto the Netlify dashboard
3. You'll get a URL like `https://random-name.netlify.app`
4. Install to your home screen as above

---

## File structure

```
tekton-mastery/
├── index.html      ← App shell & markup
├── style.css       ← All styles
├── app.js          ← All logic & data
├── sw.js           ← Service worker (offline support)
├── manifest.json   ← PWA metadata
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Data storage
All data saves automatically to your phone's **local storage** — no server, no account, no cloud. If you clear your browser data, your accounts will be lost. To back up, you can screenshot the app or (future feature) export to JSON.

---

## Mastery Levels (defaults — all configurable in Settings ⚙)

| Level | Name        | Default Milestones |
|-------|-------------|-------------------|
| 1     | Prospecting | Key decision-maker identified, Initial contact made, Company profile researched |
| 2     | Engaged     | Demo completed, Samples left, Pain points identified |
| 3     | Evaluating  | Quote sent, Objections addressed, Follow-up completed |
| 4     | Committed   | Trial agreed, Verbal commitment, Contract in progress |
| 5     | Secured     | First order placed, Account onboarded, Reorder plan agreed |
