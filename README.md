# TimerHub — One App. Every Moment.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://en.wikipedia.org/wiki/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://en.wikipedia.org/wiki/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-Synthesized-00c853?style=flat)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=flat)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**TimerHub** is a clean, modern, and accessible suite of online timekeeping tools. Built with pure Vanilla HTML5, CSS3, and JavaScript, it offers millisecond precision, synthesized Web Audio chimes, sequenced multi-stage routines, customizable templates, and responsive design—all with zero external runtime dependencies and zero build steps.

---

## Table of Contents

- [Features](#features)
- [Included Tools (13 Dedicated Tools)](#included-tools-13-dedicated-tools)
- [Smart Routines & Templates](#smart-routines--templates)
- [Technology & Architecture](#technology--architecture)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [AdSense & Monetization Setup](#adsense--monetization-setup)
- [Design System & Styling](#design-system--styling)
- [Browser Compatibility](#browser-compatibility)
- [License](#license)

---

## Features

- ⏱️ **13 Dedicated Time Tools:** Everything from Pomodoro and interval timers to chess clocks and metronomes.
- 🔄 **Sequenced Smart Routines:** Multi-stage automated routines (e.g., Study Sprint, Tabata, Morning Prep) that progress automatically between intervals.
- ⚡ **Instant Templates:** One-click presets for common time-boxing tasks (25-min focus, HIIT 30/30, 10-min meditation, etc.).
- 🔊 **Synthesized Web Audio API Engine:** No bulky MP3 or WAV files. All beeps, chimes, metronome ticks, and meditation singing bowls are synthesized live in-browser with zero latency.
- 📱 **Mobile & Desktop Responsive:** Fluid typography, accessible drawer menus, touch-friendly buttons, and fullscreen focus mode.
- 🔒 **Privacy-First & Offline-Capable:** Runs entirely in the browser. User settings and custom routines are stored in `localStorage`. No mandatory sign-up, tracking database, or external cookies.
- 🎨 **Editorial Aesthetic:** Designed with a warm neutral palette (`#FAF9F6`), serif display headings (`Libre Baskerville`), and clean sans-serif controls (`Montserrat`).
- 💰 **Google AdSense Ready:** Pre-configured semantic `.ad-slot` placeholders placed strategically without causing Cumulative Layout Shift (CLS), accompanied by standard compliance pages (Privacy, Terms, About, Contact).

---

## Included Tools (13 Dedicated Tools)

| Tool | Path | Description |
|---|---|---|
| **Timer** | [`tools/timer.html`](tools/timer.html) | Simple and versatile countdown timer with quick presets, progress ring, and audio chimes. |
| **Stopwatch** | [`tools/stopwatch.html`](tools/stopwatch.html) | Millisecond-accurate elapsed time counter with lap recording and lap history. |
| **Countdown Timer** | [`tools/countdown.html`](tools/countdown.html) | Targeted countdown with alerts, preset times, and visual ring indicator. |
| **Online Alarm** | [`tools/alarm.html`](tools/alarm.html) | Wake-up and reminder alarm clock with audio alerts, custom labels, and snooze mode. |
| **Interval Timer** | [`tools/interval.html`](tools/interval.html) | Work/rest rounds built for HIIT, Tabata, circuit training, and combat sports. |
| **Pomodoro Timer** | [`tools/pomodoro.html`](tools/pomodoro.html) | Structured 25/5/15 deep work and break cycles to maintain productivity without burnout. |
| **Meeting Timer** | [`tools/meeting-timer.html`](tools/meeting-timer.html) | Agenda and speaker countdown timer with visual status indicators for staying on schedule. |
| **Chess Clock** | [`tools/chess-clock.html`](tools/chess-clock.html) | Two-player chess clock with customizable time controls, Fischer/Bronstein increments, and flag detection. |
| **Meditation Timer** | [`tools/meditation-timer.html`](tools/meditation-timer.html) | Mindful meditation timer featuring tranquil start and end singing-bowl tones. |
| **Metronome** | [`tools/metronome.html`](tools/metronome.html) | Adjustable BPM tempo click track with customizable time signatures (2/4, 3/4, 4/4, 6/8) for musicians. |
| **Tally Counter** | [`tools/tally-counter.html`](tools/tally-counter.html) | Large, high-contrast tap counter for tracking reps, laps, attendees, or inventory. |
| **Lap Timer** | [`tools/lap-timer.html`](tools/lap-timer.html) | Performance stopwatch engineered for recording, analyzing, and comparing lap splits. |
| **Digital Clock** | [`tools/digital-clock.html`](tools/digital-clock.html) | Fullscreen minimal desk clock with date, seconds toggle, and 12/24-hour display format. |

---

## Smart Routines & Templates

### Smart Routines ([`routines/index.html`](routines/index.html))
Routines allow users to chain multiple timed stages together. When one stage finishes, an audio cue sounds, and the next phase begins automatically:
- **Study Sprint:** 25m Focus &rarr; 5m Break &rarr; 25m Focus &rarr; 15m Long Break.
- **HIIT Workout:** Warmup &rarr; High-intensity intervals &rarr; Rest periods &rarr; Cooldown.
- **Morning Routine:** Meditation &rarr; Journaling &rarr; Planning &rarr; Stretch.

### Templates ([`templates/index.html`](templates/index.html))
One-tap jumpstart cards that automatically pre-fill and launch specific timers across fitness, work, cooking, and study domains.

### Educational Blog & Guides ([`blog/index.html`](blog/index.html))
Includes SEO-optimized, in-depth articles on time management methodologies:
- Pomodoro Technique Guide ([`blog/pomodoro-technique-guide.html`](blog/pomodoro-technique-guide.html))
- Interval Training Timing Guide ([`blog/interval-training-timing-guide.html`](blog/interval-training-timing-guide.html))
- The Science of Focus & Timers ([`blog/focus-timer-science.html`](blog/focus-timer-science.html))

---

## Technology & Architecture

TimerHub is intentionally engineered to be lightweight, modular, and dependency-free:

- **Markup:** Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- **Styling:** Modular CSS architecture organized into discrete files:
  - `css/variables.css` — Design tokens (color palette, spacing scale, font stacks, typography clamp scales).
  - `css/base.css` — Global reset, box-sizing, focus outlines, button primitives, base tags.
  - `css/components.css` — Cards, headers, footers, ad slots, drawers, buttons, forms, tooltips, chips.
  - `css/timer.css` — Common timer layouts, SVG progress rings, digital clock numerals, controls.
  - `css/home.css` & `css/routines.css` — Page-specific layouts.
- **Logic & Audio Engine:**
  - `js/lib/audio.js` — Native Web Audio API synthesizer generating calibrated sine/triangle waves for chimes, wooden metronome clicks, and bells. Automatically respects browser autoplay policies by unlocking on user interaction.
  - `js/lib/timeutils.js` — High-accuracy time calculations, formatting (`HH:MM:SS`, `MM:SS`, milliseconds), and time parsing.
  - `js/tools/*.js` — Encapsulated JavaScript modules for each respective tool.
  - `js/main.js` — Shared site behaviors (responsive navigation drawer, FAQ accordions, toast notifications, fullscreen toggle).

---

## Directory Structure

```text
timerclockaddsense/
├── index.html                   # Homepage / Hero & Featured Tools
├── about.html                   # About TimerHub & Mission
├── contact.html                 # Contact & Feedback form
├── privacy.html                 # Privacy Policy (AdSense & GDPR compliant)
├── terms.html                   # Terms of Service
├── .gitignore                   # Git exclusion rules
├── README.md                    # Project documentation
│
├── assets/
│   └── icons/                   # SVG icons and favicon
│
├── blog/
│   ├── index.html               # Blog listing
│   ├── focus-timer-science.html
│   ├── interval-training-timing-guide.html
│   └── pomodoro-technique-guide.html
│
├── css/
│   ├── base.css                 # Base resets and element defaults
│   ├── components.css           # Reusable UI component styles
│   ├── home.css                 # Homepage-specific styles
│   ├── routines.css             # Multi-stage routine layouts
│   ├── timer.css                # Timer display, rings & controls
│   └── variables.css            # CSS custom properties & design tokens
│
├── js/
│   ├── main.js                  # Shared site script (navigation, toasts, FAQ)
│   ├── lib/
│   │   ├── audio.js             # Web Audio API sound synthesizer
│   │   └── timeutils.js         # Formatting and timestamp math
│   └── tools/                   # Tool-specific JavaScript modules
│       ├── alarm.js
│       ├── chess-clock.js
│       ├── countdown.js
│       ├── digital-clock.js
│       ├── interval.js
│       ├── lap-timer.js
│       ├── meditation-timer.js
│       ├── meeting-timer.js
│       ├── metronome.js
│       ├── pomodoro.js
│       ├── routines.js
│       ├── stopwatch.js
│       ├── tally-counter.js
│       ├── templates.js
│       ├── timer.js
│       └── tools-index.js
│
├── routines/
│   └── index.html               # Sequenced multi-stage routine builder
│
├── templates/
│   └── index.html               # Quick one-click timer templates
│
└── tools/                       # 13 Dedicated standalone tool pages
    ├── index.html               # Searchable directory of all tools
    ├── alarm.html
    ├── chess-clock.html
    ├── countdown.html
    ├── digital-clock.html
    ├── interval.html
    ├── lap-timer.html
    ├── meditation-timer.html
    ├── meeting-timer.html
    ├── metronome.html
    ├── pomodoro.html
    ├── stopwatch.html
    ├── tally-counter.html
    └── timer.html
```

---

## Getting Started

Because TimerHub has **no build steps and no external dependencies**, you can run it immediately using any local web server.

### Option 1: Python HTTP Server (Built-in)
```bash
# Python 3
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

### Option 2: Node.js `serve` or `http-server`
```bash
npx serve .
```

### Option 3: VS Code Live Server
1. Install the **Live Server** extension in VS Code.
2. Right-click [`index.html`](index.html) and select **Open with Live Server**.

---

## Deployment

TimerHub is a pure static website and can be deployed for free to any static hosting provider:

### GitHub Pages
1. Push your repository to GitHub.
2. Go to **Settings** &rarr; **Pages**.
3. Under **Build and deployment**, select `Deploy from a branch` and choose `main` / `/(root)`.
4. Click **Save**.

### Cloudflare Pages / Netlify / Vercel
- **Build command:** *(Leave empty)*
- **Output directory:** `.` (root)

---

## AdSense & Monetization Setup

The codebase includes predefined `.ad-slot` HTML blocks across the homepage, tool pages, and directory index.

### Integrating Google AdSense:
1. Obtain your Google AdSense Publisher ID (e.g. `ca-pub-XXXXXXXXXXXXXXXX`).
2. Add your AdSense verification `<script>` tag inside the `<head>` of each HTML file:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
        crossorigin="anonymous"></script>
   ```
3. Replace the placeholder content inside `.ad-slot` divs with your AdSense responsive ad units:
   ```html
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
   <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
   </script>
   ```
4. **Compliance Ready:** `privacy.html` and `terms.html` contain standard clauses for third-party cookies, advertising disclosures, and user rights required by Google AdSense policies.

---

## Design System & Styling

TimerHub uses CSS custom properties defined in [`css/variables.css`](css/variables.css):

- **Primary Accent:** `#B4633A` (Warm terracotta/amber)
- **Backgrounds:** `#FAF9F6` (Warm off-white) and `#F4F2EE` (Muted contrast)
- **Surfaces:** `#FFFFFF`
- **Typography:**
  - Display Font: `'Libre Baskerville', Georgia, serif`
  - Body / UI Font: `'Montserrat', -apple-system, sans-serif`
- **Timer States:**
  - Running: `var(--color-running)`
  - Paused: `var(--color-paused)`
  - Complete: `var(--color-complete)`

---

## Browser Compatibility

- **Google Chrome** 70+
- **Mozilla Firefox** 65+
- **Apple Safari** 12+ (including iOS Mobile Safari)
- **Microsoft Edge** 79+
- **Android Browsers** (Chrome, Firefox, Samsung Internet)

*Requires support for CSS Grid, CSS Variables, and the Web Audio API.*

---

## License

This project is licensed under the [MIT License](LICENSE) — feel free to customize and use it for your own web projects.
