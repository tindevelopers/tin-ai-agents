# Deployment Guide - CMS Integration System

This guide explains how to deploy the AI Blog Writer with CMS Integration to Vercel using GitHub Actions.

## Prerequisites

1. **GitHub Repository**: Code pushed to GitHub
2. **Vercel Account**: Connected to your GitHub account
3. **Database**: PostgreSQL database (Supabase recommended)

## Setup Instructions

### 1. Vercel Project Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `tindevelopers/tin-ai-agents`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `tin-ai-agents`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2. Environment Variables in Vercel

Add these environment variables in your Vercel project settings:

#### Required Variables:
```bash
DATABASE_URL=your_postgresql_connection_string
DIRECT_URL=your_direct_postgresql_connection_string
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-domain.vercel.app
CMS_ENCRYPTION_KEY=b0dc38066e1c48dd42ac6a4c9ef2b97c74655b4aa420f22933f113fe351b2b8f
```

#### Optional CMS Variables:
```bash
WEBFLOW_WEBHOOK_SECRET=your_webflow_webhook_secret
WORDPRESS_WEBHOOK_SECRET=your_wordpress_webhook_secret
WEBFLOW_RATE_LIMIT_DELAY=1000
PUBLISHING_QUEUE_BATCH_SIZE=10
SYNC_POLLING_INTERVAL=300000
```

### 3. GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

#### Vercel Integration:
```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Application Secrets:
```bash
DATABASE_URL=your_postgresql_connection_string
DIRECT_URL=your_direct_postgresql_connection_string
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-domain.vercel.app
CMS_ENCRYPTION_KEY=b0dc38066e1c48dd42ac6a4c9ef2b97c74655b4aa420f22933f113fe351b2b8f
```

### 4. Getting Vercel Credentials

#### Vercel Token:
1. Go to [Vercel Tokens](https://vercel.com/account/tokens)
2. Create a new token with appropriate scope
3. Copy the token value

#### Vercel Org ID & Project ID:
1. Run in your local project: `npx vercel link`
2. Follow the prompts to link your project
3. Check `.vercel/project.json` for the IDs

Or find them in Vercel Dashboard:
- **Org ID**: Settings > General > Organization ID
- **Project ID**: Project Settings > General > Project ID

## Deployment Workflows

### Automatic Deployments

The GitHub Actions workflow (`deploy-vercel.yml`) handles:

1. **Pull Requests**: Creates preview deployments
2. **Develop Branch**: Deploys to staging environment
3. **Main Branch**: Deploys to production

### Manual Deployment

You can also deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Deployment Environments

### Production (main branch)
- **URL**: `https://your-project.vercel.app`
- **Trigger**: Push to `main` branch
- **Environment**: Production Vercel environment

### Staging (develop branch)
- **URL**: `https://staging-cms-blog-writer.vercel.app`
- **Trigger**: Push to `develop` branch
- **Environment**: Preview Vercel environment with staging alias

### Preview (Pull Requests)
- **URL**: Unique preview URL for each PR
- **Trigger**: Opening/updating pull requests
- **Environment**: Preview Vercel environment

## Post-Deployment Setup

After successful deployment:

### 1. Database Migration
The Prisma schema is automatically applied during build, but verify:
```bash
npx prisma db push
```

### 2. Configure CMS Platforms

#### Webflow Setup:
1. Get API token from Webflow Account Settings
2. Find your Site ID and Collection ID
3. Add CMS configuration in the dashboard

#### Webhook Configuration:
Set webhook URLs in your CMS platforms:
- **Webflow**: `https://your-domain.vercel.app/api/sync/webhook/webflow`
- **WordPress**: `https://your-domain.vercel.app/api/sync/webhook/wordpress`

### 3. Test the System
1. Access the CMS Management dashboard
2. Add a CMS configuration
3. Test publishing a blog post
4. Verify sync functionality

## Monitoring & Troubleshooting

### Deployment Logs
- Check GitHub Actions logs for build/deployment issues
- Monitor Vercel Function logs for runtime errors

### Application Monitoring
- Use the Publishing Queue to monitor job status
- Check Sync Dashboard for integration health
- Review Publishing History for audit trails

### Common Issues

#### Build Failures:
- Verify all environment variables are set
- Check database connectivity
- Ensure Prisma schema is valid

#### CMS Integration Issues:
- Verify API credentials are correct
- Check webhook configurations
- Monitor rate limits and quotas

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Verify environment variable configuration
4. Test database connectivity

The CMS Integration system includes comprehensive error handling and logging to help diagnose issues quickly.
