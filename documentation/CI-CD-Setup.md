# CI/CD Setup Documentation

## Overview

This project uses GitHub Actions for automated building and deployment to GitHub Pages. The workflow is configured to trigger only on the `build` branch for controlled deployments.

## Workflow Details

### Trigger

* **Branch**: `build` only
* **Events**: Push and Pull Request to the `build` branch

### Build Process

1. **Checkout code** from the repository
2. **Setup Node.js 18** with npm caching
3. **Install dependencies** using `npm ci`
4. **Build project** using `npm run build` (TypeScript compilation + Vite build)
5. **Upload build artifacts** from the `dist` folder

### Deployment Process

1. **Deploy to GitHub Pages** using the built artifacts
2. **Available at**: `https://<username>.github.io/wosb-babylon/`

## Repository Configuration Required

### 1. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Under "Source", select "GitHub Actions"

### 2. Branch Protection (Optional but Recommended)

Consider setting up branch protection rules for the `build` branch to ensure code quality before deployment.

## Usage

### To Deploy:

1. Create and merge changes to the `build` branch
2. The workflow will automatically trigger
3. Monitor the workflow progress in the "Actions" tab
4. Once complete, the site will be available at GitHub Pages URL

### Local Development:

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build locally
```

## Files Modified/Created:

* `.github/workflows/deploy.yml` - GitHub Actions workflow
* `vite.config.js` - Updated with GitHub Pages base path configuration

## Important Notes:

* The base path in `vite.config.js` is set to `/wosb-babylon/` for GitHub Pages
* Only the `build` branch triggers deployment
* The workflow uses Node.js 18 and caches npm dependencies for faster builds
* Build artifacts are stored in the `dist` folder and deployed to GitHub Pages
