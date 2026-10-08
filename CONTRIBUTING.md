# Contributing to TrapTrace Explorer (`soroban-error-explorer`)

Thank you for helping build the web diagnostic workbench for Stellar Soroban!

---

## 🛠 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/TrapTrace/soroban-error-explorer.git
cd soroban-error-explorer

# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 🎨 Design System & Code Standards

- **Brand Palette:** Use curated brand tokens from `index.css`:
  - Ink (`#1B1F23` / `#0C0F14`)
  - Trap-amber (`#E2984B`)
  - Trace-teal (`#2FA98C`)
  - Slate (`#6B7280`)
  - Paper (`#F7F5F0`)
- **Typography:** IBM Plex Mono + IBM Plex Sans.
- **Accessibility:** Ensure buttons have accessible labels, contrast complies with WCAG AA, and interactive modals trap focus properly.
- **Theme Support:** All new components must support both Dark and Light themes via CSS variables.

Before review run npm test and npm run build. PRs include Closes #<issue_id>, actual validation and screenshots for UI changes. Unknown network observations must stay unknown; never return sample results as live observations.
