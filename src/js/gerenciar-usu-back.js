// Importar funções do Firebase
import { getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword, updatePassword, updateEmail } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy,
    where
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyClEmEGIZPH3MNMHzCi7F0E0AdwdLfukfY",
    authDomain: "prize-donate.firebaseapp.com",
    projectId: "prize-donate",
    storageBucket: "prize-donate.firebasestorage.app",
    messagingSenderId: "708034852355",
    appId: "1:708034852355:web:8f9e0c30aceb181e2dc036",
    measurementId: "G-V9ZWN6Q3FQ",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos DOM
const usersTableBody = document.getElementById('users-table-body');
const addUserBtn = document.getElementById('add-user-btn');
const userModal = document.getElementById('user-modal');
const closeModal = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const userForm = document.getElementById('user-form');
const modalTitle = document.getElementById('modal-title');

// Variável para armazenar o ID do usuário sendo editado
let editingUserId = null;

// Carregar usuários
async function loadUsers() {
    try {
        const usersQuery = query(collection(db, "users"), orderBy("nome"));
        const querySnapshot = await getDocs(usersQuery);
        
        usersTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum usuário cadastrado</td></tr>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const row = document.createElement('tr');
            
            // Traduzir permissão
            let roleText = '';
            let roleClass = '';
            switch(user.role) {
                case 'admin':
                    roleText = 'Administrador';
                    roleClass = 'role-admin';
                    break;
                case 'editor':
                    roleText = 'Editor';
                    roleClass = 'role-editor';
                    break;
                case 'reader':
                    roleText = 'Leitor';
                    roleClass = 'role-reader';
                    break;
            }
            
            // Traduzir status
            let statusText = user.status === 'active' ? 'Ativo' : 'Inativo';
            let statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
            
            row.innerHTML = `
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${roleClass}">${roleText}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${doc.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${doc.id}" data-nome="${user.nome}" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            usersTableBody.appendChild(row);
        });
        
        // Adicionar event listeners para os botões
        addEditUserListeners();
        addDeleteUserListeners();
        
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Erro ao carregar usuários</td></tr>';
    }
}

// Adicionar event listeners para editar usuário
function addEditUserListeners() {
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const userId = this.getAttribute('data-id');
            editingUserId = userId;
            
            try {
                const userDoc = await getDoc(doc(db, "users", userId));
                
                if (userDoc.exists()) {
                    const user = userDoc.data();
                    
                    // Preencher o formulário
                    document.getElementById('form-user-name').value = user.nome;
                    document.getElementById('form-user-email').value = user.email;
                    document.getElementById('form-user-password').value = ''; // Limpar senha
                    document.getElementById('form-user-role').value = user.role;
                    document.getElementById('form-user-status').value = user.status;
                    
                    // Atualizar título do modal
                    modalTitle.textContent = 'Editar Usuário';
                    
                    // Mostrar modal
                    userModal.style.display = 'flex';
                }
            } catch (error) {
                console.error("Erro ao carregar dados do usuário:", error);
                alert('Erro ao carregar dados do usuário.');
            }
        });
    });
}

// Adicionar event listeners para excluir usuário
function addDeleteUserListeners() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const userId = this.getAttribute('data-id');
            const userName = this.getAttribute('data-nome');
            
            if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
                try {
                    await deleteDoc(doc(db, "users", userId));
                    alert('Usuário excluído com sucesso!');
                    loadUsers();
                } catch (error) {
                    console.error("Erro ao excluir usuário:", error);
                    alert('Erro ao excluir usuário.');
                }
            }
        });
    });
}

// Event listeners para o modal
addUserBtn.addEventListener('click', () => {
    editingUserId = null;
    userForm.reset();
    modalTitle.textContent = 'Adicionar Usuário';
    userModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    userModal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
    userModal.style.display = 'none';
});

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === userModal) {
        userModal.style.display = 'none';
    }
});

// Função para mostrar toast notification
function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    const color = type === 'success' ? '#4CAF50' : '#f44336';
    
    toast.innerHTML = `
        <i class="fas fa-${icon} toast-icon" style="color: ${color}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

// Event listener para o formulário
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('form-user-name').value;
    const email = document.getElementById('form-user-email').value;
    const password = document.getElementById('form-user-password').value;
    const role = document.getElementById('form-user-role').value;
    const status = document.getElementById('form-user-status').value;
    
    try {
        if (editingUserId) {
            // Atualizar usuário existente
            const userRef = doc(db, "users", editingUserId);
            const updateData = {
                nome,
                email,
                role,
                status
            };
            
            // Se uma nova senha foi fornecida, atualizar
            if (password) {
                // Aqui você precisaria implementar a lógica para atualizar a senha
                // usando o Firebase Auth
            }
            
            await updateDoc(userRef, updateData);
            showToast('Sucesso!', 'Usuário atualizado com sucesso!');
        } else {
            // Criar novo usuário
            if (!password) {
                showToast('Erro', 'Por favor, forneça uma senha para o novo usuário.', 'error');
                return;
            }

            try {
                // Criar usuário diretamente com o email desejado
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('Usuário criado com sucesso:', userCredential.user.uid);
                
                // Adicionar dados do usuário no Firestore
                const userData = {
                    uid: userCredential.user.uid,
                    nome,
                    email,
                    role,
                    status,
                    dataCadastro: new Date()
                };
                
                const docRef = await addDoc(collection(db, "users"), userData);
                console.log('Documento criado no Firestore com ID:', docRef.id);
                
                const roleText = role === 'admin' ? 'Administrador' : role === 'editor' ? 'Editor' : 'Leitor';
                const statusText = status === 'active' ? 'Ativo' : 'Inativo';
                
                showToast(
                    'Usuário Cadastrado!',
                    `Nome: ${nome}\nEmail: ${email}\nPermissão: ${roleText}\nStatus: ${statusText}`
                );
            } catch (authError) {
                console.error('Erro ao criar usuário:', authError);
                
                if (authError.code === 'auth/email-already-in-use') {
                    // Tentar reautenticar o usuário existente
                    try {
                        // Verificar se o usuário existe no Firestore
                        const usersQuery = query(collection(db, "users"), where("email", "==", email));
                        const querySnapshot = await getDocs(usersQuery);
                        
                        if (querySnapshot.empty) {
                            showToast('Erro', 'Este email já está em uso no sistema de autenticação, mas não está registrado no banco de dados. Por favor, contate o administrador para resolver este problema.', 'error');
                        } else {
                            showToast('Erro', 'Este email já está cadastrado no sistema. Por favor, use outro email.', 'error');
                        }
                    } catch (error) {
                        console.error('Erro ao verificar usuário:', error);
                        showToast('Erro', 'Este email já está em uso. Por favor, use outro email.', 'error');
                    }
                } else if (authError.code === 'auth/invalid-email') {
                    showToast('Erro', 'O email fornecido é inválido.', 'error');
                } else if (authError.code === 'auth/weak-password') {
                    showToast('Erro', 'A senha é muito fraca. Use uma senha mais forte.', 'error');
                } else if (authError.code === 'auth/operation-not-allowed') {
                    showToast('Erro', 'A criação de usuários com email/senha não está habilitada. Por favor, contate o administrador.', 'error');
                } else {
                    showToast('Erro', 'Erro ao criar usuário: ' + authError.message, 'error');
                }
                return;
            }
        }
        
        // Fechar modal e recarregar lista
        userModal.style.display = 'none';
        loadUsers();
        
    } catch (error) {
        console.error("Erro inesperado:", error);
        showToast('Erro', 'Ocorreu um erro inesperado. Por favor, tente novamente.', 'error');
    }
});

// Função para verificar permissões do usuário
async function checkUserPermissions() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = "../index.html";
        return false;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            window.location.href = "../index.html";
            return false;
        }

        const userData = userDoc.data();
        return userData.role === 'admin';
    } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        window.location.href = "../index.html";
        return false;
    }
}

// Função para atualizar o menu baseado no papel do usuário
async function updateMenuBasedOnRole() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const userRole = userData.role;
        const menuItems = document.querySelectorAll('.dropdown-item[data-page]');

        // Primeiro, esconder todos os itens
        menuItems.forEach(item => {
            item.style.display = 'none';
        });

        // Mostrar apenas os itens permitidos baseado no papel
        switch(userRole) {
            case 'admin':
                // Admin tem acesso a tudo
                menuItems.forEach(item => {
                    item.style.display = 'flex';
                });
                break;
            case 'editor':
                // Editor tem acesso a tudo exceto gerenciar usuários
                menuItems.forEach(item => {
                    const page = item.getAttribute('data-page');
                    if (page !== 'gerenciar-usuarios.html') {
                        item.style.display = 'flex';
                    }
                });
                break;
            case 'reader':
                // Leitor só tem acesso ao dashboard
                menuItems.forEach(item => {
                    const page = item.getAttribute('data-page');
                    if (page === 'dashboard.html') {
                        item.style.display = 'flex';
                    }
                });
                break;
        }
    } catch (error) {
        console.error("Erro ao atualizar menu:", error);
    }
}

// Verificar se o usuário está autenticado
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Verificar permissões antes de qualquer coisa
            const isAdmin = await checkUserPermissions();
            if (!isAdmin) {
                showToast('Acesso Negado', 'Você não tem permissão para acessar esta página.', 'error');
                window.location.href = 'dashboard.html';
                return;
            }

            // Buscar dados do usuário no Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userName = userData.nome;
                
                if (userName && userName !== document.getElementById('user-name').textContent) {
                    document.getElementById('user-name').textContent = userName;
                    
                    const avatarElement = document.querySelector('.avatar');
                    if (userName.length > 0) {
                        const userInitial = userName.charAt(0).toUpperCase();
                        avatarElement.textContent = userInitial;
                        
                        sessionStorage.setItem('userName', userName);
                        sessionStorage.setItem('userInitial', userInitial);
                    }
                }
            } else {
                if (!sessionStorage.getItem('userName')) {
                    const userEmail = user.email;
                    document.getElementById('user-name').textContent = userEmail;
                    sessionStorage.setItem('userName', userEmail);
                }
            }
            
            // Carregar lista de usuários
            await loadUsers();
            
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
        }
    } else {
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userInitial');
        window.location.href = "../index.html";
    }
});

// Função de logout
document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userInitial');
    
    signOut(auth).then(() => {
        window.location.href = "../index.html";
    }).catch((error) => {
        alert("Erro ao fazer logout: " + error.message);
    });
});

// Dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    dropdownToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', function() {
        if (dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});

// Modificar o event listener do menu para verificar permissões
document.querySelectorAll('.dropdown-item[data-page]').forEach(item => {
    item.addEventListener('click', async function(e) {
        e.preventDefault();
        const pageName = this.getAttribute('data-page');
        
        if (window.location.pathname.endsWith(pageName)) {
            dropdownMenu.classList.remove('show');
            return;
        }

        // Verificar permissões antes de navegar
        const user = auth.currentUser;
        if (!user) {
            window.location.href = "../index.html";
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                window.location.href = "../index.html";
                return;
            }

            const userData = userDoc.data();
            const userRole = userData.role;

            // Verificar permissões para a página específica
            if (userRole === 'reader' && pageName !== 'dashboard.html') {
                showToast('Acesso Negado', 'Você não tem permissão para acessar esta página.', 'error');
                return;
            }

            if (userRole === 'editor' && pageName === 'gerenciar-usuarios.html') {
                showToast('Acesso Negado', 'Você não tem permissão para acessar esta página.', 'error');
                return;
            }

            showLoadingOverlay();
            window.location.href = pageName;
        } catch (error) {
            console.error("Erro ao verificar permissões:", error);
            showToast('Erro', 'Erro ao verificar permissões de acesso.', 'error');
        }
    });
});

// Função para mostrar overlay de carregamento
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.transition = 'background-color 0.5s ease';
    
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.3s ease-out';
    
    const spinner = document.createElement('div');
    spinner.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #6c63ff; opacity: 0; transition: opacity 0.3s ease-in;"></i>';
    overlay.appendChild(spinner);
    
    document.body.appendChild(overlay);
    
    const userName = document.getElementById('user-name').textContent;
    const userInitial = document.querySelector('.avatar').textContent;
    
    sessionStorage.setItem('userName', userName);
    sessionStorage.setItem('userInitial', userInitial);
    
    setTimeout(() => {
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.97)';
        document.body.style.opacity = '0.8';
        spinner.querySelector('i').style.opacity = '1';
    }, 50);
}

// Aplicar dados do usuário da sessão
function applyUserSessionData() {
    const userName = sessionStorage.getItem('userName');
    const userInitial = sessionStorage.getItem('userInitial');
    
    if (userName) {
        document.getElementById('user-name').textContent = userName;
    }
    
    if (userInitial) {
        document.querySelector('.avatar').textContent = userInitial;
    }
}

// Executar assim que o DOM estiver pronto
applyUserSessionData();

// Adicionar efeito de fade-in ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Atualizar menu quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    updateMenuBasedOnRole();
});