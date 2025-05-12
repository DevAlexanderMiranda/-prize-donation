import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updatePassword,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos do DOM
const usersTableBody = document.getElementById("usersTableBody");
const addUserBtn = document.getElementById("addUserBtn");
const userModal = document.getElementById("userModal");
const userForm = document.getElementById("userForm");
const modalTitle = document.getElementById("modalTitle");
const closeBtn = document.querySelector(".close");

let editingUserId = null;

// Função para carregar usuários
async function loadUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    usersTableBody.innerHTML = "";

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${user.nome}</td>
        <td>${user.email}</td>
        <td>${translateRole(user.role)}</td>
        <td>${translateStatus(user.status)}</td>
        <td>
          <button class="btn-edit" data-id="${doc.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-delete" data-id="${doc.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;

      usersTableBody.appendChild(row);
    });

    // Adicionar event listeners para os botões
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => editUser(btn.dataset.id));
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => deleteUser(btn.dataset.id));
    });
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    alert("Erro ao carregar usuários. Por favor, tente novamente.");
  }
}

// Função para traduzir roles
function translateRole(role) {
  const roles = {
    admin: "Administrador",
    editor: "Editor",
    reader: "Leitor",
  };
  return roles[role] || role;
}

// Função para traduzir status
function translateStatus(status) {
  const statuses = {
    active: "Ativo",
    inactive: "Inativo",
  };
  return statuses[status] || status;
}

// Função para abrir o modal
function openModal(user = null) {
  editingUserId = user ? user.id : null;
  modalTitle.textContent = user ? "Editar Usuário" : "Novo Usuário";

  if (user) {
    document.getElementById("userName").value = user.nome;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userRole").value = user.role;
    document.getElementById("userStatus").value = user.status;
    document.getElementById("userPassword").value = "";
  } else {
    userForm.reset();
  }

  userModal.style.display = "block";
}

// Função para fechar o modal
function closeModal() {
  userModal.style.display = "none";
  userForm.reset();
  editingUserId = null;
}

// Função para salvar usuário
async function saveUser(event) {
  event.preventDefault();

  const userData = {
    nome: document.getElementById("userName").value,
    email: document.getElementById("userEmail").value,
    role: document.getElementById("userRole").value,
    status: document.getElementById("userStatus").value,
    dataCadastro: new Date(),
  };

  try {
    if (editingUserId) {
      // Atualizar usuário existente
      await updateDoc(doc(db, "users", editingUserId), userData);

      // Se uma nova senha foi fornecida, atualizar
      const newPassword = document.getElementById("userPassword").value;
      if (newPassword) {
        // Aqui você precisaria implementar a lógica para atualizar a senha
        // usando o Firebase Auth
      }
    } else {
      // Criar novo usuário
      const password = document.getElementById("userPassword").value;
      if (!password) {
        throw new Error("Senha é obrigatória para novos usuários");
      }

      // Criar usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        password
      );

      // Adicionar dados do usuário no Firestore
      await addDoc(collection(db, "users"), {
        ...userData,
        uid: userCredential.user.uid,
      });
    }

    closeModal();
    loadUsers();
    alert(
      editingUserId
        ? "Usuário atualizado com sucesso!"
        : "Usuário criado com sucesso!"
    );
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    alert("Erro ao salvar usuário: " + error.message);
  }
}

// Função para editar usuário
async function editUser(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      openModal({ id: userId, ...userDoc.data() });
    }
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
    alert("Erro ao carregar dados do usuário");
  }
}

// Função para deletar usuário
async function deleteUser(userId) {
  if (confirm("Tem certeza que deseja excluir este usuário?")) {
    try {
      await deleteDoc(doc(db, "users", userId));
      loadUsers();
      alert("Usuário excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário");
    }
  }
}

// Event Listeners
addUserBtn.addEventListener("click", () => openModal());
closeBtn.addEventListener("click", closeModal);
userForm.addEventListener("submit", saveUser);

// Fechar modal ao clicar fora dele
window.addEventListener("click", (event) => {
  if (event.target === userModal) {
    closeModal();
  }
});

// Carregar usuários ao iniciar
loadUsers();
