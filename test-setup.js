// Test script to verify the setup
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function testConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore connection
    const restaurantsSnap = await getDocs(collection(db, 'restaurants'));
    console.log('✅ Firestore connection successful');
    console.log('Restaurants found:', restaurantsSnap.docs.length);
    
    const airlinesSnap = await getDocs(collection(db, 'airlines'));
    console.log('Airlines found:', airlinesSnap.docs.length);
    
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log('Users found:', usersSnap.docs.length);
    
    console.log('✅ All tests passed! Your setup is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Please check your Firebase configuration and security rules.');
  }
}

// Run the test
testConnection();
