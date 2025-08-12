# eMotional Commerce Platform

A modern mood‑based product discovery experience. Frontend (Vite/React) is deployed as an Azure Static Web App; backend (FastAPI) is deployed to Azure App Service (Python).

---

## Quick Links
- Frontend (SWA): `https://<your-swa>.azurestaticapps.net`
- Backend (App Service): `https://<your-app-service>.azurewebsites.net`
- API docs: `https://<your-app-service>.azurewebsites.net/docs`

---

## Project Structure
```
trynow-moodmall-platform/
  api.py                         # FastAPI app (app = FastAPI())
  requirements.txt               # Backend dependencies
  public/                        # Optional static assets
  vite-moodmall/                 # Frontend (Vite/React/TypeScript)
    src/
    index.html
    staticwebapp.config.json     # SWA routing/fallback (added in repo)
    .env.production              # VITE_API_BASE_URL for prod (you create)
  .github/workflows/
    azure-static-web-apps-*.yml  # Frontend deploy workflow
    deploy-backend-appservice.yml# Backend deploy workflow
```

---

## Prerequisites
- Node.js 20+ for frontend build (local and CI)
- Python 3.9+ for backend (App Service runtime)
- Azure subscriptions for:
  - Azure Static Web Apps (frontend)
  - Azure App Service (Linux, Python) (backend)
- GitHub repository (for CI/CD)

---

## 1) Backend (FastAPI) – Local Run
```bash
# from repo root
pip install -r requirements.txt
uvicorn api:app --reload  # http://localhost:8000
```

### Required environment variables
- `OPENAI_API_KEY`: backend image generation. Configure in Azure App Service (do not commit locally).

### CORS
`api.py` already allows the SWA origin. If your SWA URL changes, update `allow_origins` to include it and redeploy.

---

## 2) Frontend (Vite/React) – Local Run
```bash
cd vite-moodmall
npm ci
npm run dev  # http://localhost:5173
```

### Frontend → Backend API base URL
Create `vite-moodmall/.env.production` (not committed by us so you manage credentials/URLs):
```
VITE_API_BASE_URL=https://<your-app-service>.azurewebsites.net
```
The code calls:
```
fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/generate-virtual-room-image`, ...)
```

### SPA routing
`vite-moodmall/staticwebapp.config.json` ensures client‑side routing fallback to `/index.html` and excludes assets.

---

## 3) Deploy Frontend to Azure Static Web Apps (GitHub Actions)
We build from `vite-moodmall` and deploy `dist` via the workflow in `.github/workflows/azure-static-web-apps-*.yml`.

### Configure SWA deployment token
- Azure Portal → your Static Web App → Settings → Deployment token → copy.
- GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret
  - Name: the name referenced in your SWA workflow (e.g., `AZURE_STATIC_WEB_APPS_API_TOKEN_<...>`)
  - Value: paste the token

### Workflow essentials (already committed)
- Uses Node 20.x
- Working directory = `vite-moodmall`
- `npm ci && npm run build`
- `app_location: vite-moodmall`, `output_location: dist`

### Build with correct backend URL
Option A (recommended): commit `vite-moodmall/.env.production` with `VITE_API_BASE_URL` set to your App Service URL.

Option B (CI inject): in the SWA workflow build step add:
```yaml
env:
  VITE_API_BASE_URL: https://<your-app-service>.azurewebsites.net
```

Push to the configured branch to deploy. Verify the site loads at your SWA URL.

---

## 4) Deploy Backend to Azure App Service (GitHub Actions)
Workflow: `.github/workflows/deploy-backend-appservice.yml` (already committed).

### App Service configuration (Portal → App Service → Configuration)
- Application settings:
  - `WEBSITES_PORT = 8000`
  - `SCM_DO_BUILD_DURING_DEPLOYMENT = 1`
  - `OPENAI_API_KEY = <your key>`
- General settings → Startup Command:
```
gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000 api:app
```
Save and accept the restart prompt.

### Publish profile secret
- Azure Portal → App Service → Overview → Get publish profile → Download
- GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret
  - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
  - Value: paste the FULL XML content

### Workflow key fields
```yaml
- uses: azure/webapps-deploy@v2
  with:
    app-name: <YOUR_APP_SERVICE_NAME>
    publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
    package: backend-package.zip
```
Push to `master` (or your configured branch) to deploy.

### Verify
- Browse: `https://<your-app-service>.azurewebsites.net/docs`
- Log stream: Portal → App Service → Monitoring → Log stream
- Kudu logs: Advanced Tools → Go → `/home/LogFiles`

---

## 5) End‑to‑End Wiring (Cross‑subscription)
Subscriptions don’t matter for public services:
- Frontend (SWA) calls backend via public URL set in `VITE_API_BASE_URL`.
- Backend CORS includes your SWA origin.

---

## 6) Troubleshooting
- Frontend still calls localhost:
  - Ensure `.env.production` exists or CI env var set.
  - Rebuild and redeploy SWA; hard refresh (Ctrl+F5).
- 500/400 from backend:
  - Check Log stream. For OpenAI: `billing_hard_limit_reached` = top‑up or change key.
- "Publish profile invalid":
  - Re‑download, paste full XML, ensure `app-name` matches exactly.
- CORS error:
  - Add SWA URL to `allow_origins` in `api.py` and redeploy.

---

## 7) Local Development Recap
```bash
# backend
pip install -r requirements.txt
uvicorn api:app --reload  # http://localhost:8000

# frontend
cd vite-moodmall
npm ci
npm run dev  # http://localhost:5173
```

---

## 8) Security & Compliance Notes
- Do not commit secrets; use App Service App Settings and GitHub Secrets.
- HTTPS only in production; security headers and basic rate limiting included.
- UI follows accessibility best practices.

---

## 9) License
MIT
