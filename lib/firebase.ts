"use client"

import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIOXiNyyS_5qPN2tZhccfD6cAYet-ibX4",
  authDomain: "store-management-51df4.firebaseapp.com",
  projectId: "store-management-51df4",
  storageBucket: "store-management-51df4.firebasestorage.app",
  messagingSenderId: "504719177629",
  appId: "1:504719177629:web:8d2669851ff1bd0cfc6174",
  measurementId: "G-98Y7Y1XE00",
}

// Initialize Firebase
let app
let auth
let db

try {
  // Check if Firebase is already initialized
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }

  // Initialize auth and firestore
  auth = getAuth(app)
  db = getFirestore(app)

  console.log("Firebase initialized successfully")
} catch (error) {
  console.error("Firebase initialization error:", error)
}

export { auth, db }
