// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import firebase from "firebase";
import "firebase/auth";
import "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBC-4nkzk0HtQx8Wt1GzF-zJe0GfbQx4Yk",
  authDomain: "mpesacommerce.firebaseapp.com",
  projectId: "mpesacommerce",
  storageBucket: "mpesacommerce.appspot.com",
  messagingSenderId: "166575848713",
  appId: "1:166575848713:web:c9144e19fef91d516f27d8",
  measurementId: "G-GLP0PTRTS5"
};

// Initialize Firebase
let app;

if (firebase.apps.length === 0){
    app = firebase.initializeApp(firebaseConfig);
} else {
    app =firebase.app();
}

//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = firebase.firestore();
const auth = firebase.auth()

export default db;
export {auth};