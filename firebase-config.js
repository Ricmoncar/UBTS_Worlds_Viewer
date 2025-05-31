// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMhtwbGJkXVL9jSe6Kqn-MZq6ZmLgjokw",
  authDomain: "worlds-f50f5.firebaseapp.com",
  projectId: "worlds-f50f5",
  storageBucket: "worlds-f50f5.firebasestorage.app",
  messagingSenderId: "891059586534",
  appId: "1:891059586534:web:7aa31dd49ed9b07bb9c227",
  measurementId: "G-WCMEHJH4RS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Export the app for other modules
export default app;