// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyClEmEGIZPH3MNMHzCi7F0E0AdwdLfukfY",
  authDomain: "prize-donate.firebaseapp.com",
  projectId: "prize-donate",
  storageBucket: "prize-donate.firebasestorage.app",
  messagingSenderId: "708034852355",
  appId: "1:708034852355:web:8f9e0c30aceb181e2dc036",
  measurementId: "G-V9ZWN6Q3FQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Login
const loginForm = document.querySelector(".sign-in form");
loginForm.addEventListener("submit", function(event) {
  event.preventDefault();
  
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("password").value;
  
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Logged in
      const user = userCredential.user;
      
      // Verificar o papel do usuário no Firestore para determinar o redirecionamento
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      
      getDocs(q).then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          
          // Salvar o nome do usuário no sessionStorage
          const userName = userData.nome || user.email;
          sessionStorage.setItem('userName', userName);
          
          // Salvar a inicial do usuário no sessionStorage
          if (userName && userName.length > 0) {
            const userInitial = userName.charAt(0).toUpperCase();
            sessionStorage.setItem('userInitial', userInitial);
          }
          
          // Se for editor, redirecionar para cadastro de prêmio
          if (userData.role === 'editor') {
            window.location.href = "pages/cadastro-premio.html";
          } else {
            // Para admin e reader, redirecionar para dashboard
            window.location.href = "pages/dashboard.html";
          }
        } else {
          // Se não encontrar papel, redirecionar para dashboard por padrão
          sessionStorage.setItem('userName', user.email);
          window.location.href = "pages/dashboard.html";
        }
      }).catch((error) => {
        console.error("Erro ao verificar papel do usuário:", error);
        window.location.href = "pages/dashboard.html";
      });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert("Erro no login: " + errorMessage);
    });
});
