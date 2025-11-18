# Student Mentor AI - Complete Deployment Guide

This guide will walk you through deploying your Student Mentor AI application:
- **Backend**: DigitalOcean App Platform (Python/FastAPI)
- **Frontend**: Vercel (React/Vite)

---

## Prerequisites

Before you begin, ensure you have:

✅ **GitHub Repository**: Your code is pushed to GitHub  
✅ **Firebase Project**: Set up with Authentication and Firestore  
✅ **Google Cloud Service Account JSON**: Downloaded from Google Cloud Console  
✅ **Google API Key**: For Gemini AI (Google AI Studio)  
✅ **DigitalOcean Account**: With GitHub Student Pack credits activated  
✅ **Vercel Account**: Free account (can sign in with GitHub)

---

## Part 1: Deploy Backend to DigitalOcean App Platform

### Step 1.1: Create a New App

1. **Log in to DigitalOcean**: Go to https://cloud.digitalocean.com/
2. **Navigate to Apps**: Click on "Apps" in the left sidebar or use the "Create" dropdown menu
3. **Create App**: Click the "Create App" button
4. **Connect GitHub**:
   - Select "GitHub" as your source
   - Click "Authorize DigitalOcean" (if first time)
   - Select your repository: `harshareddy-bathala/studentMentor`
   - Click "Next"

### Step 1.2: Configure App Settings

1. **Source Directory**:
   - DigitalOcean will auto-detect your app
   - Edit the detected component
   - Set **Source Directory** to: `student-mentor-backend`
   - Set **Type** to: `Web Service`

2. **Build and Run Commands**:
   - **Build Command**: (Leave empty - requirements.txt will be auto-detected)
   - **Run Command**: `uvicorn main:app --host 0.0.0.0 --port 8080`

3. **HTTP Port**: Set to `8080`

4. **Instance Type**: Select the smallest instance (Basic - $5/month or use your credits)

### Step 1.3: Add Environment Variables

Click on "Environment Variables" and add the following:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `GOOGLE_API_KEY` | `your-gemini-api-key` | Get from Google AI Studio (https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Model name (or `gemini-1.5-pro` if preferred) |
| `FIRESTORE_PROJECT_ID` | `your-gcp-project-id` | From Firebase Console → Project Settings |
| `FIRESTORE_SERVICE_URL` | `http://localhost:8001` | Keep default (used for proxy if needed) |

### Step 1.4: Add Service Account JSON Secret

Your Google Cloud service account JSON needs to be added as an encrypted secret:

1. **Add Secret**:
   - Click "Add Secret"
   - Name: `GOOGLE_APPLICATION_CREDENTIALS`
   - Type: Select "File"
   - Content: Paste your **entire service account JSON file contents**

2. **Mount Path**: `/app/service-account.json`

3. **Update Environment Variable**:
   - Add another environment variable:
   - Name: `GOOGLE_APPLICATION_CREDENTIALS`
   - Value: `/app/service-account.json`

### Step 1.5: Configure App Name & Region

1. **App Name**: Give it a name like `student-mentor-backend`
2. **Region**: Choose closest to your users (e.g., `NYC` or `SFO`)

### Step 1.6: Review and Deploy

1. Click **"Next"** to review all settings
2. Click **"Create Resources"** to start deployment
3. **Wait for deployment** (usually 5-10 minutes)
4. Watch the build logs for any errors

### Step 1.7: Get Your Backend URL

Once deployed successfully:

1. Go to your App's **"Settings"** tab
2. Find the **App URL** under "Domains" section
3. Copy the URL - it will look like:
   ```
   https://student-mentor-backend-xxxxx.ondigitalocean.app
   ```

4. **Test the backend**:
   - Visit: `https://your-backend-url.ondigitalocean.app/docs`
   - You should see the FastAPI Swagger documentation

⚠️ **IMPORTANT**: Copy this URL - you'll need it for the frontend deployment!

---

## Part 2: Deploy Frontend to Vercel

### Step 2.1: Create a New Vercel Project

1. **Log in to Vercel**: Go to https://vercel.com/
2. **Import Project**:
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Select your GitHub repository: `harshareddy-bathala/studentMentor`
   - Click "Import"

### Step 2.2: Configure Build Settings

Vercel will auto-detect your React/Vite project:

1. **Framework Preset**: Should auto-detect as "Vite"
2. **Root Directory**: Leave as `./` (root of repository)
3. **Build Command**: `npm run build` (auto-filled)
4. **Output Directory**: `dist` (auto-filled)

### Step 2.3: Add Environment Variables

Click on "Environment Variables" and add ALL of the following:

#### Firebase Configuration Variables

| Variable Name | Value | Where to Find |
|--------------|-------|---------------|
| `VITE_FIREBASE_API_KEY` | `your-firebase-api-key` | Firebase Console → Project Settings → Web Apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | Same as above |
| `VITE_FIREBASE_APP_ID` | `1:123456:web:abc123` | Same as above |

#### Backend URL Variable

| Variable Name | Value |
|--------------|-------|
| `VITE_MENTOR_BACKEND_URL` | `https://your-backend-url.ondigitalocean.app` |

**⚠️ IMPORTANT**: Use the DigitalOcean backend URL you copied from Step 1.7!

### Step 2.4: Configure Deployment Settings

1. **Environment**: Select "Production" for all variables
2. **Git Branch**: Ensure it's deploying from `main` branch

### Step 2.5: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 2-5 minutes)
3. Watch build logs for any errors

### Step 2.6: Get Your Frontend URL

Once deployed:

1. Vercel will show your deployed site URL:
   ```
   https://your-app-name.vercel.app
   ```

2. **Test your application**:
   - Click the URL to visit your live site
   - Try logging in
   - Check browser console for any errors

---

## Part 3: Post-Deployment Configuration

### 3.1: Update Firebase Authentication

Add your Vercel domain to Firebase authorized domains:

1. Go to **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**
2. Click **"Add domain"**
3. Add: `your-app-name.vercel.app`
4. Save

### 3.2: Update CORS Settings (Backend)

Your backend already has CORS configured to allow all origins (`allow_origins=["*"]`). For production, you might want to restrict this:

1. Go to **DigitalOcean** → Your App → **Settings** → **Environment Variables**
2. Add a new variable:
   - `CORS_ORIGINS`: `https://your-app-name.vercel.app`

3. Update `main.py` in future commits to use:
   ```python
   allow_origins=os.getenv("CORS_ORIGINS", "*").split(",")
   ```

### 3.3: Enable Firestore Rules

Ensure your Firestore security rules are properly configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /studentProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Add other collection rules as needed
  }
}
```

---

## Part 4: Testing Your Deployment

### Backend Health Check

1. Visit: `https://your-backend-url.ondigitalocean.app/docs`
2. Should see FastAPI Swagger UI
3. Try the `/health` endpoint (requires authentication)

### Frontend Testing Checklist

- [ ] Homepage loads correctly
- [ ] Student login works
- [ ] Teacher login works
- [ ] Chat interface connects to backend
- [ ] Check-ins can be submitted
- [ ] No console errors related to environment variables

### Common Issues & Solutions

#### Issue: Backend responds with CORS errors
**Solution**: Check that `allow_origins=["*"]` is set in `main.py`, or update to include your Vercel domain

#### Issue: Firebase authentication fails
**Solution**: 
- Verify all `VITE_FIREBASE_*` variables are correct in Vercel
- Ensure Vercel domain is in Firebase authorized domains

#### Issue: Chat doesn't work
**Solution**: 
- Check `VITE_MENTOR_BACKEND_URL` is correct
- Verify backend is running (check DigitalOcean app logs)
- Ensure `GOOGLE_API_KEY` is valid in DigitalOcean

#### Issue: "Authentication required" errors
**Solution**: 
- Verify Firebase service account JSON is correctly uploaded to DigitalOcean
- Check `GOOGLE_APPLICATION_CREDENTIALS` environment variable path is `/app/service-account.json`

---

## Part 5: Monitoring & Maintenance

### DigitalOcean Monitoring

- **View Logs**: App → "Runtime Logs" tab
- **Check Metrics**: App → "Insights" tab
- **View Deployments**: App → "Deployments" tab

### Vercel Monitoring

- **View Deployments**: Project → "Deployments" tab
- **Check Logs**: Click on any deployment → "Functions" tab
- **Analytics**: Project → "Analytics" tab (if enabled)

### Updating Your App

#### Backend Updates
1. Push changes to GitHub `main` branch
2. DigitalOcean will **auto-deploy** on push
3. Monitor deployment in DigitalOcean dashboard

#### Frontend Updates
1. Push changes to GitHub `main` branch
2. Vercel will **auto-deploy** on push
3. Monitor deployment in Vercel dashboard

---

## Environment Variables Reference

### Backend (DigitalOcean)

```env
# Required
GOOGLE_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
FIRESTORE_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json

# Optional
FIRESTORE_SERVICE_URL=http://localhost:8001
ADK_TEMPERATURE=0.0
```

### Frontend (Vercel)

```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456:web:abc123

# Backend URL (Required)
VITE_MENTOR_BACKEND_URL=https://your-backend-url.ondigitalocean.app
```

---

## Additional Resources

- **DigitalOcean App Platform Docs**: https://docs.digitalocean.com/products/app-platform/
- **Vercel Documentation**: https://vercel.com/docs
- **Firebase Console**: https://console.firebase.google.com/
- **Google AI Studio**: https://aistudio.google.com/

---

## Support Checklist

If you encounter issues:

1. ✅ Check all environment variables are set correctly
2. ✅ Verify service account JSON has proper permissions
3. ✅ Ensure Firebase authorized domains include Vercel URL
4. ✅ Check backend logs in DigitalOcean
5. ✅ Check frontend build logs in Vercel
6. ✅ Test backend `/docs` endpoint directly
7. ✅ Check browser console for frontend errors

---

## Success! 🎉

Your Student Mentor AI application should now be live:

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://your-backend-url.ondigitalocean.app`

Share your app and monitor usage through DigitalOcean and Vercel dashboards!
