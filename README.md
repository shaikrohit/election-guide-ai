# ElectionGuide AI

**Your personal election assistant — navigate every step of the voting process with confidence.**

---

## Overview

ElectionGuide AI is a smart, interactive web application that simplifies the election process for everyone. Whether you're voting for the first time, a returning voter, or a candidate filing for office — the app provides clear, step-by-step guidance tailored to your needs.

Elections can be confusing. Registration deadlines, ID requirements, polling station locations, campaigning rules — there's a lot to keep track of. ElectionGuide AI brings it all together in one place, with an AI-powered assistant ready to answer your questions anytime.

---

## Key Features

- **Personalized Step-by-Step Guidance** — Tailored walkthroughs based on who you are
- **AI-Powered Assistant** — Ask questions about elections and get clear, context-aware answers
- **Polling Station Finder** — Detect your location and find the nearest polling station on an interactive map
- **Calendar Reminders** — Add important election deadlines to your Google Calendar with one click
- **Progress Tracking** — Mark steps as complete and track your election readiness
- **Works Offline** — Provides helpful fallback responses even without an internet connection

---

## How It Works

1. **Choose Your Profile** — Select the persona that best describes you
2. **Follow the Steps** — The app walks you through each stage of the election process
3. **Take Action** — Verify your registration, locate your polling station, and set reminders
4. **Ask the AI** — Use the floating assistant at the bottom to ask any election-related question

---

## Personas Supported

| Persona | What You Get |
|---------|-------------|
| **First-Time Voter** | Guided onboarding from registration to casting your first vote |
| **Regular Voter** | Quick verification of your electoral roll status and polling station |
| **Candidate** | Structured walkthrough of nomination, scrutiny, campaigning, and counting |

---

## Usage

1. Open the application in any modern web browser
2. Choose the persona that matches your situation
3. Follow the interactive steps — each one has clear actions and official resource links
4. Use the AI assistant at the bottom of the screen to ask questions anytime

---

## Setup Instructions

```bash
# Clone the repository
git clone https://github.com/shaikrohit/election-guide-ai.git

# Open the project
cd election-guide-ai

# Launch in your browser
# Option 1: Open index.html directly
# Option 2: Use VS Code Live Server (recommended)
```

No build tools or dependencies required. Just open and go.

### Running Tests

Open `tests/index.html` in your browser. All 134 tests run instantly with a live pass/fail report.

---

## Configuration

The application uses two Google API services for full functionality:

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Gemini AI** | Powers the AI assistant | Requires a Generative Language API key |
| **Google Maps** | Powers the polling station finder | Requires a Maps Embed API key |

Add your keys in `config/config.js`:

```js
const GEMINI_API_KEY = "YOUR_GEMINI_KEY";
const MAPS_API_KEY   = "YOUR_MAPS_KEY";
```

> The app works without API keys — it provides mock AI responses and a direct Google Maps search link as fallback.

---

## Project Structure

```
election-guide-ai/
├── index.html              # Application entry point
├── style.css               # Design system and responsive layout
├── app.js                  # Application bootstrapper
├── config/                 # API key management
├── logic/                  # State management and flow definitions
├── services/               # Google Gemini, Maps, and Calendar integrations
├── ui/                     # Interface components (stepper, chat, navigation)
├── utils/                  # Shared utilities (formatting, accessibility)
└── tests/                  # Automated test suite (134 tests)
```

---

## Notes

- Works best with an active internet connection for AI and Maps features
- Allowing location access improves the polling station finder accuracy
- All external links open official government websites in a new tab
- The AI assistant adapts its responses based on your selected persona

---

*Made with care to make elections accessible to everyone.*
