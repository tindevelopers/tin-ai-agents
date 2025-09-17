# GitHub Secrets Setup Guide

## ✅ **Secrets Already Configured**

All required GitHub secrets have been set using GitHub CLI. The CMS_ENCRYPTION_KEY is already configured with a secure value. Other secrets currently have placeholder values that need to be updated with your actual credentials.

## 🔑 **How to Get Actual Credential Values**

### 1. Vercel Credentials

#### **VERCEL_TOKEN**
1. Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it "GitHub Actions Deployment"
4. Select scope: Full Access (or specific projects)
5. Copy the generated token

#### **VERCEL_ORG_ID & VERCEL_PROJECT_ID**
**Method 1 - Using Vercel CLI:**
```bash
cd tin-ai-agents
npx vercel link
# Follow prompts, then check:
cat .vercel/project.json
```

**Method 2 - From Vercel Dashboard:**
- **Org ID**: Go to Team Settings → General → Team ID
- **Project ID**: Project Settings → General → Project ID

### 2. Database Configuration

#### **DATABASE_URL & DIRECT_URL**
If using **Supabase** (recommended):
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → Database
4. Copy the connection string from "Connection string"
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Use the same URL for both DATABASE_URL and DIRECT_URL

**Format**: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 3. Authentication Configuration

#### **NEXTAUTH_SECRET**
Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### **NEXTAUTH_URL**
Your deployed application URL:
- **Production**: `https://your-project-name.vercel.app`
- **Staging**: `https://staging-cms-blog-writer.vercel.app`

## 🚀 **Updating Secrets**

### Method 1: Using the Update Script
```bash
./scripts/update-secrets.sh
```

### Method 2: Manual GitHub CLI Commands
```bash
# Update individual secrets
gh secret set VERCEL_TOKEN --body "your_actual_vercel_token"
gh secret set VERCEL_ORG_ID --body "your_org_id"
gh secret set VERCEL_PROJECT_ID --body "your_project_id"
gh secret set DATABASE_URL --body "your_database_url"
gh secret set DIRECT_URL --body "your_direct_url"
gh secret set NEXTAUTH_SECRET --body "your_nextauth_secret"
gh secret set NEXTAUTH_URL --body "https://your-domain.vercel.app"
```

### Method 3: GitHub Web Interface
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click on each secret to update its value

## 📋 **Current Secrets Status**

```bash
# Check current secrets
gh secret list
```

**Current secrets:**
- ✅ `CMS_ENCRYPTION_KEY` - **Configured** (secure value set)
- ⚠️ `VERCEL_TOKEN` - **Needs Update** (placeholder)
- ⚠️ `VERCEL_ORG_ID` - **Needs Update** (placeholder)
- ⚠️ `VERCEL_PROJECT_ID` - **Needs Update** (placeholder)
- ⚠️ `DATABASE_URL` - **Needs Update** (placeholder)
- ⚠️ `DIRECT_URL` - **Needs Update** (placeholder)
- ⚠️ `NEXTAUTH_SECRET` - **Needs Update** (placeholder)
- ⚠️ `NEXTAUTH_URL` - **Needs Update** (placeholder)

## 🔍 **Verification**

After updating secrets, verify the deployment:

1. **Push code to trigger deployment:**
   ```bash
   git push origin develop
   ```

2. **Monitor GitHub Actions:**
   - Go to your repository → Actions tab
   - Watch the "Deploy to Vercel" workflow

3. **Check Vercel deployment:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Monitor the deployment progress

## 🚨 **Troubleshooting**

### Common Issues:

**Build Fails:**
- Verify DATABASE_URL is correct
- Check that all secrets are updated (no PLACEHOLDER values)

**Vercel Authentication Failed:**
- Verify VERCEL_TOKEN has correct permissions
- Check VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct

**Database Connection Error:**
- Verify DATABASE_URL format
- Check database is accessible
- Ensure DIRECT_URL is set

## 📞 **Support**

If you encounter issues:
1. Check GitHub Actions logs for detailed error messages
2. Verify all secret values are correct
3. Test database connectivity locally
4. Ensure Vercel project is properly configured

The deployment will automatically work once all placeholder secrets are updated with actual values!
