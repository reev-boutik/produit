# ProductScan - Vercel Deployment Guide

## 🚀 Deploy to Vercel

Follow these steps to deploy your ProductScan application to Vercel:

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket
3. **Database**: Have your database ready (Neon, Supabase, PlanetScale, etc.)

### Step 1: Prepare Your Repository

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Add French localization and prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. **Import** your Git repository
4. Select your **ProductScan** repository

### Step 3: Configure Project Settings

Vercel should automatically detect it's a Node.js project. If not, configure:

- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist/client`
- **Install Command**: `npm install`

### Step 4: Set Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

#### Required Variables:
```
NODE_ENV=production
SESSION_SECRET=your-random-secret-key-here
```

#### Database Variables (choose your database):

**For Neon PostgreSQL:**
```
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

**For Xata:**
```
XATA_API_KEY=your_xata_api_key
XATA_DATABASE_URL=your_xata_database_url
```

**For Supabase:**
```
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## 📋 Post-Deployment Checklist

### Test Your Application
- [ ] Navigation works (Scanner, Products, Analytics)
- [ ] Language switching (French/English) works
- [ ] Currency conversion works
- [ ] Database connections work
- [ ] Product search and filtering work
- [ ] Barcode scanning functionality

### Performance Optimization
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up custom domain (optional)
- [ ] Configure caching headers

## 🛠️ Configuration Files

Your project includes these Vercel-specific files:

- **`vercel.json`**: Vercel deployment configuration
- **`.env.example`**: Environment variables template
- **`package.json`**: Updated with `vercel-build` script

## 🔧 Common Issues & Solutions

### Build Failures

**Issue**: TypeScript compilation errors
**Solution**: Run `npm run check` locally to fix TypeScript issues

**Issue**: Missing dependencies
**Solution**: Ensure all dependencies are in `package.json`, not just `devDependencies`

### Runtime Issues

**Issue**: Database connection errors
**Solution**: Verify environment variables are set correctly in Vercel dashboard

**Issue**: API routes not working
**Solution**: Ensure all API calls use relative URLs (`/api/...`) not absolute URLs

### Environment Variables

**Issue**: Environment variables not loading
**Solution**: 
1. Check variable names match exactly
2. Redeploy after adding/changing variables
3. Variables are case-sensitive

## 📱 Domain Configuration (Optional)

1. Go to **Settings > Domains**
2. Add your custom domain
3. Configure DNS records as shown
4. Wait for SSL certificate provisioning

## 🔄 Continuous Deployment

Once connected, Vercel automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Provides deployment logs and analytics

## 📊 Monitoring

Monitor your application:
- **Vercel Dashboard**: View deployments and logs
- **Functions**: Monitor serverless function performance
- **Analytics**: Track page views and performance (if enabled)

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review function logs for API errors
3. Verify environment variables
4. Test locally with production build: `npm run build && npm start`
