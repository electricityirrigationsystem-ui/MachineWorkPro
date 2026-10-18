MACHINEWORK PRO — BUSINESS OWNER + EMPLOYEE ACCOUNTS

CONTENTS
- index.html: application (copy to your GitHub Pages folder and rename to index.html)
- machinework-sw.js: offline shell service worker
- firestore.rules: Firestore security rules
- functions/: secure Firebase Cloud Function for owner-created employee accounts

IMPORTANT SETUP
1. In Firebase Console, create a project and register a Web App.
2. Enable Authentication > Sign-in method > Email/Password.
3. Create Firestore Database.
4. In Firebase Console > Firestore > Rules, publish firestore.rules.
5. Install Firebase CLI on your computer and log in:
   npm install -g firebase-tools
   firebase login
6. From the folder containing this package, initialize/select your Firebase project and deploy the function:
   firebase use YOUR_PROJECT_ID
   firebase deploy --only functions:createBusinessEmployee
   Cloud Functions may require the Blaze billing plan. Review Firebase pricing before enabling billing.
7. Upload index.html and machinework-sw.js into the same directory on GitHub Pages. Open the site over HTTPS.
8. Open index.html in a code editor and replace the example values in the FIREBASE_CONFIG constant with the Firebase Web App values (apiKey, authDomain, projectId, appId). The app no longer asks for these values in its Settings UI.
9. Open the app and enter business name, owner name, owner email and password, then choose Create business account.
10. The owner can create employee accounts in the app. Give each temporary password to its employee privately.

TROUBLESHOOTING
- If a prior attempt created the owner in Authentication but failed to create the Firestore profile, keep that owner signed in and retry Create business account with the same email. The updated page attempts to resume the setup.
- If you see permission-denied, confirm that the included firestore.rules are published to the same Firebase project.
- If you see auth/operation-not-allowed, enable Email/Password under Authentication > Sign-in method.
- The source HTML must contain real web config values; PASTE_ placeholders will not connect. Firebase web config is client-side configuration, not an Admin SDK private key.

DATA MODEL
- businesses/{businessId}: business record
- businesses/{businessId}/members/{uid}: role and membership
- businesses/{businessId}/{customers|machines|services|jobs|quotes|activity}/{id}: shared business records
- businesses/{businessId}/settings/app: shared settings
- users/{uid}: profile pointing to the business

SECURITY NOTES
- Do not put a service-account key or Firebase Admin credentials in the HTML.
- Employee account creation is done server-side by the callable Cloud Function.
- Owner account creation happens in the browser and writes the business, owner membership, and user profile as one Firestore batch. The supplied rules use getAfter to validate that relationship.
- Test first with a new Firebase project and non-production data. Existing data stored under users/{uid}/... is not automatically migrated to the business data paths.
- Offline data is device-local until sync succeeds. Avoid using the same local browser profile to switch between unrelated businesses because this app's local cache is currently a single local dataset.
