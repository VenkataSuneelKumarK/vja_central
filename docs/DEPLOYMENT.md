# Deployment Guide

## Local development (no cloud account needed)

```bash
# Backend — needs a local MongoDB (brew services or docker-compose)
cd backend
cp .env.example .env
npm install
npm run seed      # creates the super admin + default categories
npm run dev        # http://localhost:4000

# Admin portal
cd admin
cp .env.example .env
npm install
npm run dev         # http://localhost:5173

# Mobile app
cd mobileappWorkspace
cp .env.example .env   # set API_BASE_URL to your machine's LAN IP for a real device
npm install
npm start
```

`backend/docker-compose.yml` runs the whole backend (API + MongoDB + MinIO
as a local S3-compatible store) with a single `docker compose up`, so a
contributor never needs AWS credentials just to develop locally.

## Staging / Production (AWS)

1. **Database**: provision a MongoDB Atlas cluster (M10+ for production,
   daily backups, IP allow-list or VPC peering to the ECS subnet).
2. **Object storage**: create an S3 bucket (versioning on), and a
   CloudFront distribution in front of it with a cache policy that respects
   the `Cache-Control` headers the media upload endpoint already sets.
3. **Secrets**: put `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
   `DATABASE_URL`, AWS keys, and Firebase credentials into AWS Secrets
   Manager; inject them into the ECS task definition as secrets, never as
   plain task-definition environment variables.
4. **Backend**: build and push the Docker image (`backend/Dockerfile`) to
   ECR, deploy as an ECS Fargate service behind an Application Load
   Balancer with an ACM TLS certificate. Set `PORT=4000` and point the ALB
   health check at `GET /health`.
5. **Admin portal**: `npm run build` produces a static `admin/dist` —
   upload to an S3 bucket and serve via CloudFront (or any static host).
   Point `VITE_API_BASE_URL` at the production API's `/api` path at build
   time.
6. **Firebase**: create a Firebase project, enable Cloud Messaging, generate
   a service-account key for `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`
   / `FIREBASE_PROJECT_ID`, and add the mobile apps' bundle ID / package
   name to the Firebase project so `google-services.json` /
   `GoogleService-Info.plist` can be generated for the EAS build.
7. **Mobile apps**: build with EAS (`eas build --platform ios|android
   --profile production`), with `API_BASE_URL` and `APP_ENV=production` set
   in the EAS build profile's `env` — never hard-coded in the repo.
8. **Monitoring**: ship ECS/CloudWatch logs (the backend already logs
   structured JSON via winston in production), add a CloudWatch alarm on
   5xx rate and the ALB health check, and wire a crash-reporting SDK
   (e.g. Sentry) into both the admin portal and the mobile app before a
   real store release.
9. **Scheduled jobs**: the publish/expiry scheduler
   (`backend/src/common/scheduler.ts`) runs inside the API process via
   `node-cron` — no separate infrastructure needed, but note it must run on
   exactly one instance (or be made idempotent / moved to an EventBridge
   Scheduler + Lambda) once the API is scaled beyond one task, since Mongo
   `updateMany` is naturally idempotent here but running it N times per
   minute across N tasks is wasted work, not a correctness bug.

## Environment variables

See `backend/.env.example`, `admin/.env.example`, and
`mobileappWorkspace/.env.example` for the full list. Never commit a
populated `.env` file — all three are already covered by the root
`.gitignore`.
