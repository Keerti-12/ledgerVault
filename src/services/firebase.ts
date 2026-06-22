import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAqGABQkHqC2ZxBkUJs6q3RSlif9vpp3QI",
  authDomain: "ledgervault-f4a85.firebaseapp.com",
  projectId: "ledgervault-f4a85",
  storageBucket: "ledgervault-f4a85.firebasestorage.app",
  messagingSenderId: "463932327759",
  appId: "1:463932327759:web:5acee0ded56c38c5e1273a",
  measurementId: "G-EFJBB0MXVS"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { db };
