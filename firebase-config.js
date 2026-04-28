import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyCnq1oLIRTIkpdgnXOe0CbDdGzhhamwIC0",
  authDomain: "time-table-generator-da2c8.firebaseapp.com",
  projectId: "time-table-generator-da2c8",
  storageBucket: "time-table-generator-da2c8.firebasestorage.app",
  messagingSenderId: "790969517720",
  appId: "1:790969517720:web:527ae8b33140df66e832ed"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { db };