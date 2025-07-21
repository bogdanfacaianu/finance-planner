# Deployment Guide

## 🚀 GitHub Pages Deployment

This application is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Prerequisites

1. **GitHub Secrets Setup**
   - Go to Repository Settings → Secrets and Variables → Actions
   - Add the following secrets:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key

2. **GitHub Pages Configuration**
   - Go to Repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages`
   - Folder: `/ (root)`

### Deployment Process

The application deploys automatically when you push to the `main` branch:

1. **Automatic Trigger**: Push to `main` branch
2. **Build Process**: GitHub Actions installs dependencies and builds the app
3. **Environment Variables**: Secrets are injected during build time
4. **Deployment**: Built files are deployed to `gh-pages` branch
5. **Live Site**: Available at `https://[username].github.io/financial-planner/`

### Manual Deployment

You can also deploy manually from your local machine:

```bash
# Ensure environment variables are set in .env
npm run deploy
```

### Troubleshooting

- **Build Fails**: Check that GitHub Secrets are properly set
- **404 Error**: Ensure GitHub Pages is configured to serve from `gh-pages` branch
- **Auth Issues**: Verify Supabase configuration allows your domain

### Security Notes

- Environment variables are built into the bundle at build time
- The anon key is designed to be client-side safe
- All sensitive operations are protected by Supabase RLS policies
- No actual secrets are exposed in the deployed application

### Production Considerations

- Set up custom domain if desired
- Configure Supabase production settings
- Monitor usage and authentication patterns
- Set up error tracking and analytics