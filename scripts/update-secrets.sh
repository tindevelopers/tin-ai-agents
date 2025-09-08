#!/bin/bash

# Script to update GitHub repository secrets with actual values
# Run this script after getting your actual credentials

echo "🔧 GitHub Secrets Update Script"
echo "================================"
echo ""
echo "This script will help you update the placeholder GitHub secrets with your actual values."
echo "Make sure you have the GitHub CLI installed and authenticated."
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed. Please install it first:"
    echo "   brew install gh"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""

# Function to update a secret
update_secret() {
    local secret_name=$1
    local description=$2
    local placeholder_hint=$3
    
    echo "📝 Updating $secret_name"
    echo "   Description: $description"
    if [ ! -z "$placeholder_hint" ]; then
        echo "   Hint: $placeholder_hint"
    fi
    echo -n "   Enter new value (or press Enter to skip): "
    read -s secret_value
    echo ""
    
    if [ ! -z "$secret_value" ]; then
        if gh secret set "$secret_name" --body "$secret_value"; then
            echo "   ✅ Updated $secret_name"
        else
            echo "   ❌ Failed to update $secret_name"
        fi
    else
        echo "   ⏭️  Skipped $secret_name"
    fi
    echo ""
}

echo "🔑 Ready to update secrets. Press Enter to continue or Ctrl+C to cancel."
read

# Show current status
echo "📋 Current Status Check:"
echo "✅ CMS_ENCRYPTION_KEY - Already configured with secure value"
echo "✅ NEXTAUTH_SECRET - Updated with secure generated value"
echo "✅ NEXTAUTH_URL - Updated to staging domain"
echo ""
echo "⚠️ Still need actual values for:"
echo "   - VERCEL_TOKEN (Vercel API token)"
echo "   - VERCEL_ORG_ID (Vercel organization ID)"  
echo "   - VERCEL_PROJECT_ID (Vercel project ID)"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - DIRECT_URL (Direct PostgreSQL connection string)"
echo ""

# Update Vercel secrets
echo "=== Vercel Configuration ==="
echo "🔗 Setup Steps:"
echo "1. Go to https://vercel.com/account/tokens"
echo "2. Create new token with 'Full Access' scope"
echo "3. Go to https://vercel.com/dashboard"
echo "4. Import your GitHub repository"
echo "5. Get Org ID and Project ID from settings"
echo ""

update_secret "VERCEL_TOKEN" "Vercel API token for deployments" "Create at: https://vercel.com/account/tokens"
update_secret "VERCEL_ORG_ID" "Your Vercel organization/team ID" "Find in: Team Settings → General → Team ID"
update_secret "VERCEL_PROJECT_ID" "Your Vercel project ID" "Find in: Project Settings → General → Project ID"

# Update database secrets
echo "=== Database Configuration ==="
echo "Get these from your PostgreSQL provider (Supabase, etc.)"
echo ""

update_secret "DATABASE_URL" "PostgreSQL connection string" "postgres://user:pass@host:port/db"
update_secret "DIRECT_URL" "Direct PostgreSQL connection string" "Usually same as DATABASE_URL but direct"

# Update auth secrets
echo "=== Authentication Configuration ==="
echo ""

update_secret "NEXTAUTH_SECRET" "NextAuth.js secret key" "Generate with: openssl rand -base64 32"
update_secret "NEXTAUTH_URL" "Your application URL" "https://your-domain.vercel.app"

echo "🎉 Secret update process completed!"
echo ""
echo "📋 Summary of secrets:"
gh secret list
echo ""
echo "🚀 Next steps:"
echo "1. Verify all secrets are updated (no PLACEHOLDER values)"
echo "2. Push code to trigger deployment: git push origin develop"
echo "3. Monitor deployment in GitHub Actions tab"
echo "4. Check deployment in Vercel dashboard"
echo ""
echo "💡 The CMS_ENCRYPTION_KEY is already set with a secure value."
echo "   You can regenerate it if needed with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
