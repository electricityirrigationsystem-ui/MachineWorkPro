const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.createBusinessEmployee = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in as the business owner first.');
  }
  const businessId = String(data.businessId || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const name = String(data.name || '').trim();
  const role = data.role === 'admin' ? 'admin' : 'employee';
  if (!businessId || !email || !name || password.length < 8) {
    throw new functions.https.HttpsError('invalid-argument', 'Business, email, name, and a password of at least 8 characters are required.');
  }

  const callerProfileSnap = await db.collection('users').doc(context.auth.uid).get();
  if (!callerProfileSnap.exists) {
    throw new functions.https.HttpsError('permission-denied', 'No business profile was found for this account.');
  }
  const callerProfile = callerProfileSnap.data();
  if (callerProfile.businessId !== businessId || callerProfile.role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Only the owner of this business can create employee accounts.');
  }
  const businessRef = db.collection('businesses').doc(businessId);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists || businessSnap.data().ownerUid !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Business ownership could not be verified.');
  }

  let createdUser;
  try {
    createdUser = await admin.auth().createUser({ email, password, displayName: name, emailVerified: false, disabled: false });
    const member = {
      uid: createdUser.uid, email, name, role, active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: context.auth.uid
    };
    const batch = db.batch();
    batch.set(businessRef.collection('members').doc(createdUser.uid), member);
    batch.set(db.collection('users').doc(createdUser.uid), {
      businessId, businessName: businessSnap.data().name || '', name, email, role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await batch.commit();
    return { uid: createdUser.uid, email, role };
  } catch (error) {
    if (createdUser && createdUser.uid) {
      try { await admin.auth().deleteUser(createdUser.uid); } catch (_) {}
    }
    if (error instanceof functions.https.HttpsError) throw error;
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'An account with that email already exists.');
    }
    console.error('createBusinessEmployee failed', error);
    throw new functions.https.HttpsError('internal', 'Could not create the employee account. Check the Cloud Function logs.');
  }
});
