# Smart College App

Smart College App is a standalone college platform built with Next.js.

It includes three role-based experiences:

- `Owner`: manage users, classes, payments, finance, analytics, and system settings
- `Teacher`: open live class rooms, upload materials, post assignments, grade work, and view attendance
- `Student`: log in only if paid, then access classes, assignments, recordings, schedule, and billing

## What is included

- Secure login flow for college roles
- Student payment gate before dashboard access
- Role-based server-side permissions
- Owner dashboard for users, classes, payments, income, expenses, and retention controls
- Teacher dashboard scoped to assigned classes only
- Student dashboard scoped to paid access only
- Built-in live room, course, and finance modules
- QuickBooks sandbox connect flow for finance sync
- GitHub Actions CI for lint and build checks

## Main routes

- `/`
- `/login`
- `/dashboard`
- `/dashboard/classes`
- `/dashboard/schedule`
- `/dashboard/finance`
- `/dashboard/people`
- `/dashboard/settings`
- `/payment`

## Run locally

1. Open PowerShell in this folder:

   ```powershell
   cd "C:\Users\Fogal\Documents\MixPad BeatMaker Compositions\college-campus-hub"
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Start the app:

   ```powershell
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## GitHub and live domain setup

1. Create a GitHub repository and push this folder to it.
2. Connect that GitHub repo to your hosting provider.
3. Add these environment variables in the hosting dashboard:
   - `DATABASE_URL`
   - `APP_URL`
   - `APP_SESSION_TTL_DAYS`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `QUICKBOOKS_CLIENT_ID`
   - `QUICKBOOKS_CLIENT_SECRET`
   - `QUICKBOOKS_REALM_ID`
   - `QUICKBOOKS_REFRESH_TOKEN`
   - `QUICKBOOKS_ENVIRONMENT`
   - `QUICKBOOKS_REDIRECT_URI`
4. Set `APP_URL` to your live domain, like `https://college.yourschool.edu`.
5. Point `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` at your hosted Turso database so the app state persists on the live site.
6. In Intuit QuickBooks sandbox or production settings, add the callback URL:
   - `https://your-domain.com/api/quickbooks/callback`
7. Attach your custom domain in the hosting dashboard after the first deployment.

## Demo accounts

Use the login cards on the home page:

- `Olivia Carter` for Owner
- `Taylor Brooks` for Teacher
- `Mia Lopez` for a paid Student
- `Noah Reed` for an unpaid Student

If you sign in as `Noah Reed`, the app sends you to the payment page first and only unlocks the app after the balance is cleared.

## Production notes

- Prisma client generation runs during `npm install`.
- The QuickBooks connect flow uses `APP_URL` when it is set, so it works on your live domain.
- The college state is stored in the database now, and production can use a hosted Turso database with the same schema.

## Recommended next steps

- Replace demo login with real authentication
- Move the college data from the in-memory store into a persistent production database
- Expand live-room features like breakout rooms, waiting rooms, and session recording
- Expand class tools with submissions, grading, and class materials workflows
- Add richer financial reporting and invoice workflows
