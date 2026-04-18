# 🚀 Fuel Finder Dhaka — Deployment Guide

এই গাইডটি আপনাকে **GitHub** থেকে **Vercel**-এ লাইভ করার সম্পূর্ণ ধাপ দেবে এবং **GitHub Actions**-এ স্বয়ংক্রিয় Daily Sync সেটআপ করবে।

---

## 📋 Steps at a Glance

1. [GitHub Repository তৈরি ও Push করুন](#step-1-github-repository)
2. [Vercel-এ Project Import করুন](#step-2-vercel-deploy)
3. [Vercel-এ Environment Variables সেট করুন](#step-3-vercel-env-vars)
4. [GitHub Actions Secrets সেট করুন](#step-4-github-secrets)
5. [(Optional) Firebase Security Rules Deploy করুন](#step-5-firebase-rules)

---

## Step 1: GitHub Repository

```bash
# প্রজেক্ট ফোল্ডারে যান
cd h:\Antigravity\FuelWeb

# Git init করুন (যদি না থাকে)
git init

# Commit করুন
git add .
git commit -m "feat: initial production-ready build"

# GitHub-এ নতুন repo তৈরি করুন তারপর:
git remote add origin https://github.com/YOUR_USERNAME/fuel-finder-dhaka.git
git branch -M main
git push -u origin main
```

> **Note:** `.gitignore` ফাইলটি ইতিমধ্যে কনফিগার করা আছে।
> Service Account JSON এবং `.env.local` ফাইল **কখনো** GitHub-এ যাবে না।

---

## Step 2: Vercel Deploy

1. [vercel.com](https://vercel.com) -এ লগইন করুন
2. **"Add New Project"** বাটনে ক্লিক করুন
3. আপনার **GitHub account** টি কানেক্ট করুন
4. `fuel-finder-dhaka` রিপোজিটরিটি import করুন
5. Framework: **Next.js** (Vercel স্বয়ংক্রিয়ভাবে ডিটেক্ট করবে)
6. **Environment Variables** অংশটি খালি রাখুন (Step 3-এ করব)
7. **"Deploy"** ক্লিক করুন — প্রথমবার fail করবে, কারণ variables এখনো দেওয়া হয়নি।

---

## Step 3: Vercel Environment Variables

Vercel Dashboard → আপনার Project → **Settings** → **Environment Variables**

নিচের প্রতিটি Variable যোগ করুন। Firebase Console → Project Settings → General → Your Apps থেকে মান পাবেন:

| Variable Name | কোথা থেকে পাবেন |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Console → Project Settings |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | নিচের Section দেখুন ↓ |

### `FIREBASE_SERVICE_ACCOUNT_BASE64` কীভাবে পাবেন

এই প্রজেক্টের জন্য **Base64 String** ইতিমধ্যে জেনারেট করা হয়েছে।
নিচের স্ট্রিংটি কপি করে Vercel-এ পেস্ট করুন:

```
ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiZnVlbC1maW5kZXItZGhha2EiLAogICJwcml2YXRlX2tleV9pZCI6ICI5ZmRhMjllYjczMzUxMzQ1NzAwZGI3MGFkOWZjMWI2Y2MyNjVlOWM1IiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQWdFQUFvSUJBUUNmUUxqOStFMG5nUVAzXG4wTzVGUHU1WTgzNXVVZFRVYXFpK2NkWEt0SGRCK0pQbTZpMFU2R0lVRjF0U2hDUWt6aXp3WSs3VXBnSXE2K2pnXG50RlJ3NUozcFVxNWVHQ3FQN09MUldsZEZQQUVld2ZseSs3VkJtRVEycEpSSUM0VS9mSGgyaHNhRFdWZldrdGFCXG5LdWNSNW51eTBXNXFka2pBMmw3RjluV2RWd3pySU0xVnB2dXl5Tnd4S0RlaFBidXI0NWlQNmpyVndabnBLSVR4XG5zNTl6QWFkMXd6NkpONDJHTHlQREhqUFpBOHRsQTF6bEdKcmRZVkRrTFVHem02dWpWQjlib3kxZlM5bGpTN1hIXG4yWHE4TFY3QXRqYzBsdmNCSkR3S09QdXUzMjBrZldFUnFuK3JIclRaSnRrMkpXeGtvdnJBeCsyelRPa2VVWlJMXG5nZFB0MXkrRkFnTUJBQUVDZ2dFQUFMZHhLOS9TMENtVXJJdXRQQjlyUWMxdHlxY1FmNmJhVWpFTjB6Y0JqZXh3XG5NWHl3UXozU09IMWQrSDZpMU1hdEtmcHBJck5mTVZqcVpqbzN0L0NMMmN3LzQwWFZkQlU1ZEg1ZUEvQXVTdU1qXG5PRzF6dlZhMVpFL0dLRjI0ZGNUa2Y2WFBtZmdsS3dsVnFjRlpPR0QwYzAvNTd2MlhDamNiL29GZjFvMHVZN01kXG4wcUJQMmxSdCtrRnN6anRjcUE1UGFON01hR2tMS3hTaWlnUG9nbFBJaVpPaW5RUlRhVXcwQkRvbFVJSVRtUXRtXG5WM1BXUUd5Ym11VlRnamhBRldCRWZ3VFVWRzNzSXRKeUY1aUc1VzJjeTBwN3dUaGtoUXpoK0p2NE5ZRmQvdEoxXG43U1RaV1g5bXA1UzBja3Uycmg4Q2xrWDZnWTZHaFhuUDlOZW9UaFBoS1FLQmdRRFJERU5kMFdPT0t1V3NiTkJEXG5NTVd0Z0dwTjA3RGo1c1hMa1R1alZHQmNvS1hkdFhlNEhDMkF5eTkveXljTFJkOFpXOGIvVjM3VkZ5TVk1RGljXG5hQ2c0SjkvcU51WHVLTXJGNWVyN2l1aGQwTGZISUFiU09QUlV0ZGExWVJTM0tDbTZNemVIVUduVC9jK3h6TGkyXG5TU2RlbS91VGYvNEEzZTNwSC9PS3RNeFArd0tCZ1FEREJWMmJNNGFhKzJXQlJ6QWZxb0c3N2NCb1k4VjBIZk5iXG5EaGREcmhsT3F1aTljSXYwQjEvOVEvNVhkeVVBakF1R1VUZlNGYUlHS3NLZlJPT3FGTnk1dHZQZEszVndxTHVQXG54akZseERkT2VpdWpFeFdzc1Z6dVZHOTBTYmtDbWg5TTdXYjNlWUFVZWtmankwbUdhRmJyZWNUc2N0akdUQTk0XG5vdXVnUStEbWZ3S0JnUUNPQitYeFpTVmQzMWxpbUIrN3R2Um4yRnJoZTlXd1VnZkxNbWF4cHM4OXY4eFI0VXh3XG40M3dyQ0dIQ1V0VzVQQVREWnU3Q1o4RDlxSldwQU01UnZoYXRhTElpb0tBQit1Y2lJLzlPWG1kWDdrb2UyV3lwXG5BaGRIUXJDWlZWZE14ZFhyODRaandrZlV4NXFJYzg1LzB4NFRrcWtQNHlOQmxZZGlIOXBKUUdPY1p3S0JnQTJQXG5lUFBLd0doVVpMbDVocm9jOUFwcVBML0ZlRHhidk1rdkVLVVBIUWxnVHZDbE84WUxJVHlPRnNoa0szbC9RMm5pXG5pZHdjenZoWXp0R2VTNnBPNnc0cXo0Z29kbkVQK29MRHlEbUlURVF6c0ljVlU2Ti9iYlBRd1RNMzBScUNOdnoxXG5ZUHlDUVVxck9nWjM0elBxVzJqaVBiUW5SRFY5b25IRCtsaFpmL0RuQW9HQkFKQmNzbTdnLzN2UlZYeGtZQk1CXG4wdUYxVHJmeTZ5OSt4MFNBSGU2dW9zVW1HVDdzdnFwWXRJTCtTQjV6MUdWQXppUGFlWnBDYkl4TDMrM2Q5bGJMXG5WY3BEdTd3bUJySGdsVEpURDNVMDNXcUZuV0hjdWt4SFpPM3o4aUdWUVNpcmVidk1RWDMzS1pjRE1tMjhjcDBDXG5ScmtYc3ZCeG5nOEhEbE82cE90aUpkRUtcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0BmdWVsLWZpbmRlci1kaGFrYS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTM0NzgzMDEzNzU2Njg5OTMyNTgiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwZnVlbC1maW5kZXItZGhha2EuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K
```

> ⚠️ **এই স্ট্রিং প্রাইভেট।** শুধু Vercel ও GitHub Secrets-এ দিন, কোথাও শেয়ার করবেন না।

---

## Step 4: GitHub Secrets (Daily Sync-এর জন্য)

GitHub → আপনার Repository → **Settings** → **Secrets and variables** → **Actions** → **"New repository secret"**

এই Secret যোগ করুন:

| Secret Name | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | উপরের Step 3-এর একই Base64 স্ট্রিং |

Daily Sync Workflow (`.github/workflows/headless-sync.yml`) ইতিমধ্যে প্রতিদিন রাত ১২টায় (Dhaka time) স্বয়ংক্রিয়ভাবে চলবে। GitHub Actions tab থেকে **"Run workflow"** চেপে তাৎক্ষণিকভাবেও চালাতে পারবেন।

---

## Step 5: (Optional) Firebase Security Rules Deploy

```bash
# Firebase CLI install করুন (যদি না থাকে)
npm install -g firebase-tools

# Login করুন
firebase login

# Rules deploy করুন
firebase deploy --only firestore:rules
```

---

## ✅ Final Checklist

- [ ] GitHub-এ Push করা হয়েছে
- [ ] Vercel-এ Project Import করা হয়েছে
- [ ] Vercel-এ সব `NEXT_PUBLIC_*` vars সেট করা হয়েছে
- [ ] Vercel-এ `FIREBASE_SERVICE_ACCOUNT_BASE64` সেট করা হয়েছে
- [ ] GitHub Secrets-এ `FIREBASE_SERVICE_ACCOUNT_BASE64` সেট করা হয়েছে
- [ ] Vercel Deployment সফল হয়েছে (লাল X নেই)
- [ ] Firebase Security Rules deploy করা হয়েছে
