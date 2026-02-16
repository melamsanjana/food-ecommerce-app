const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBBc50zMco9OzGarh9Xh4-4xls7jcU56_g",
  authDomain: "food-ecommerce-app-28a02.firebaseapp.com",
  projectId: "food-ecommerce-app-28a02",
  storageBucket: "food-ecommerce-app-28a02.firebasestorage.app",
  messagingSenderId: "1040524721094",
  appId: "1:1040524721094:web:8cf4b4e40d639c4fa8d0c7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = db;
