# Cloudinary Setup Guide

Your blog images are currently failing to load because Cloudinary environment variables are missing from the deployment. Here's how to get them:

## 1. Get Cloudinary Credentials

1. **Sign up/Login to Cloudinary**: https://cloudinary.com/
2. **Go to Dashboard**: After login, you'll see your dashboard
3. **Get your credentials** from the "Account Details" section:
   - **Cloud Name**: Your unique cloud name (e.g., `dxyz123abc`)
   - **API Key**: Your API key (e.g., `123456789012345`)
   - **API Secret**: Your API secret (e.g., `abcdef123456789_XYZ-ABC`)

## 2. Add Environment Variables to GitHub

Once you have your Cloudinary credentials, run these commands:

```bash
# Set Cloudinary Cloud Name
gh secret set CLOUDINARY_CLOUD_NAME --body "your_cloud_name_here"

# Set Cloudinary API Key  
gh secret set CLOUDINARY_API_KEY --body "your_api_key_here"

# Set Cloudinary API Secret
gh secret set CLOUDINARY_API_SECRET --body "your_api_secret_here"
```

## 3. Verify Setup

After adding the secrets:
1. The next deployment will include Cloudinary support
2. Images will be automatically uploaded to Cloudinary when generated
3. All image URLs will be accessible from `https://res.cloudinary.com/YOUR_CLOUD_NAME/`

## 4. Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 1,000 transformations per month

This should be sufficient for blog image generation.

## Alternative: Test Locally First

You can also add these to your local `.env.local` file to test:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Then test image generation locally before deploying.
