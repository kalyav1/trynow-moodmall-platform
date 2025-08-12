# eMotional Commerce Platform

## Overview
A modern, accessible, and secure mood-based product recommendation engine for e-commerce, featuring internationalization, accessibility, and robust security best practices.

---

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Integration Guide](#integration-guide)
- [Compliance](#compliance)
  - [PII, PCI, GDPR](#pii-pci-gdpr)
  - [OWASP Top 10](#owasp-top-10)
  - [WCAG Accessibility](#wcag-accessibility)
- [Security Best Practices](#security-best-practices)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **Mood/Image-based Product Recommendations**: Users can select a mood or upload a photo to receive personalized product suggestions.
- **Internationalization (i18n)**: UI supports English, French, and Spanish with easy extensibility.
- **Accessibility (WCAG Compliant)**: Keyboard navigation, ARIA attributes, color contrast, and skip links.
- **Security**: Secure HTTP headers, rate limiting, and CSP implemented.
- **Component-based Integration**: Easily embeddable as a widget or React component in any e-commerce site.
- **Modern UI/UX**: Responsive, sleek, and user-friendly design.

---

## Technology Stack
- **Frontend**: React, Vite, TypeScript, react-i18next, TailwindCSS (optional), CSS-in-JS
- **Backend**: FastAPI (Python), CORS, Security Middleware
- **Other**: Docker (optional), Node.js, npm

---

## Setup & Installation

### Prerequisites
- Node.js (v16+ recommended)
- Python 3.8+
- npm

### 1. Clone the Repository
```sh
git clone <repo-url>
cd trynow-moodmall-platform
```

### 2. Install Frontend Dependencies
```sh
cd vite-moodmall
npm install
```

### 3. Install Backend Dependencies
```sh
cd ..
pip install -r requirements.txt
```

---

## Running the Application

### 1. Start the Backend (FastAPI)
```sh
python api.py
```
- The backend will run on `http://localhost:8000` by default.

### 2. Start the Frontend (Vite/React)
```sh
cd vite-moodmall
npm run dev
```
- The frontend will run on `http://localhost:5173` by default.

---

## Integration Guide

### As a Widget (Iframe)
1. Deploy the frontend app to a public URL.
2. Embed in your e-commerce site:
   ```html
   <iframe src="https://your-moodmall-app.com" width="420" height="600" style="border:none"></iframe>
   ```

### As a React Component
1. Import the `MoodPicker` component from your build or as a package.
2. Use in your React app:
   ```jsx
   import MoodPicker from 'your-moodmall-package';
   <MoodPicker onProductSelect={handleProductSelect} />
   ```

### API Integration
- The backend exposes REST endpoints for recommendations and mood analysis.
- See `API_DOCUMENTATION.md` for details (to be completed).

---

## Compliance

### PII, PCI, GDPR
- **No sensitive data is stored by default.**
- If user data is collected, ensure:
  - Explicit user consent is obtained.
  - Data is encrypted in transit (HTTPS) and at rest.
  - Data retention and deletion policies are documented.
  - Users can request data export or deletion.
  - No payment data (PCI) is handled by this codebase.

### OWASP Top 10
- Security headers (CSP, HSTS, X-Frame-Options, etc.) are set in the backend.
- Basic rate limiting is implemented.
- No direct user authentication is present; add JWT/OAuth for protected endpoints.
- All dependencies should be regularly updated and scanned for vulnerabilities.

### WCAG Accessibility
- Skip-to-content link, ARIA attributes, keyboard navigation, and color contrast are implemented.
- All images have alt text.
- Focus indicators are visible.
- UI is tested for screen reader compatibility.

---

## Security Best Practices
- Use HTTPS in production.
- Set environment variables for secrets (do not hardcode).
- Restrict CORS to trusted domains in production.
- Regularly audit dependencies (`npm audit`, `pip-audit`).
- Monitor logs for suspicious activity.
- Add authentication/authorization for sensitive endpoints if needed.

---

## Contributing
- Fork the repo and create a feature branch.
- Submit pull requests with clear descriptions.
- Follow code style and accessibility guidelines.

---

## License
[MIT](LICENSE)
