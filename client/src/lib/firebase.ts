import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCU-VyuuD71KP-dhQOBjzit5WIQOVPBl_8",
  authDomain: "whysoilmatters-1c40b.firebaseapp.com",
  projectId: "whysoilmatters-1c40b",
  storageBucket: "whysoilmatters-1c40b.appspot.com",
  messagingSenderId: "22444263895",
  appId: "1:22444263895:web:8f2f763809bcdb0bb26392",
  measurementId: "G-X8KF3FJZ61"
};

// Log the config for debugging
console.log('Firebase Storage Bucket:', firebaseConfig.storageBucket);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
