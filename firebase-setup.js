// Firebase Setup Script
// Run this script to initialize your Firebase collections with sample data
// Make sure to set up Firebase Auth first and create an admin user

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setupFirebase() {
  try {
    console.log('Setting up Firebase collections...');

    // Create admin user (you'll need to replace with your actual admin credentials)
    const adminEmail = 'admin@cvms.com';
    const adminPassword = 'Admin123!';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUser = userCredential.user;
      
      // Create admin user document
      await setDoc(doc(db, 'users', adminUser.uid), {
        email: adminEmail,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      
      console.log('Admin user created:', adminUser.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists');
      } else {
        console.error('Error creating admin user:', error);
      }
    }

    // Initialize restaurants
    const restaurants = ['Subway', 'Paramount', 'Pretzels', 'LFD Bagel'];
    for (const restaurant of restaurants) {
      await addDoc(collection(db, 'restaurants'), { name: restaurant });
    }
    console.log('Restaurants initialized');

    // Initialize airlines
    const airlines = [
      { name: 'Air Canada', code: 'ACD' },
      { name: 'Air France', code: 'AFR' },
      { name: 'British Airways', code: 'BAW' }
    ];
    for (const airline of airlines) {
      await addDoc(collection(db, 'airlines'), airline);
    }
    console.log('Airlines initialized');

    // Initialize tax settings
    await addDoc(collection(db, 'tax'), {
      tpsPct: 5.0,
      tvqPct: 9.975
    });
    console.log('Tax settings initialized');

    console.log('Firebase setup completed successfully!');
    console.log('You can now login with:', adminEmail, '/', adminPassword);

  } catch (error) {
    console.error('Error setting up Firebase:', error);
  }
}

// Uncomment the line below to run the setup
// setupFirebase();

export { setupFirebase };
