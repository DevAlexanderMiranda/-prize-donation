// Importar funções do Firebase
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    orderBy,
    limit,
    Timestamp,
    where,
    addDoc,
    updateDoc
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
const topPremiosTableBody = document.getElementById('top-premios-table').querySelector('tbody');

// Função para verificar permissões do usuário
async function checkUserPermissions() {
    const user = auth.currentUser;
    if (!user) {
        console.error("Usuário não está autenticado");
        window.location.href = "../index.html";
        return null;
    }
    
    console.log("Verificando permissões para:", user.email);

    try {
        // Buscar o documento do usuário pelo UID
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.error("Usuário não encontrado pelo UID no Firestore:", user.email);
            console.log("Tentando encontrar pelo email em vez do UID");
            
            // Tentar buscar por email em vez de UID
            const qByEmail = query(usersCollection, where("email", "==", user.email));
            const emailQuerySnapshot = await getDocs(qByEmail);
            
            if (!emailQuerySnapshot.empty) {
                console.log("Usuário encontrado pelo email! Atualizando UID no documento...");
                const docId = emailQuerySnapshot.docs[0].id;
                const userData = emailQuerySnapshot.docs[0].data();
                
                // Atualizar o UID no documento
                await updateDoc(doc(db, "users", docId), {
                    uid: user.uid
                });
                
                console.log("UID atualizado com sucesso!");
                return userData.role;
            }
            
            // Se o email termina com @admin.com, vamos criar um usuário admin automaticamente
            if (user.email.endsWith('@admin.com')) {
                console.log("Criando usuário admin automaticamente");
                try {
                    const newUserData = {
                        uid: user.uid,
                        email: user.email,
                        nome: user.displayName || user.email.split('@')[0],
                        role: 'admin',
                        status: 'active',
                        dataCadastro: new Date()
                    };
                    
                    await addDoc(collection(db, "users"), newUserData);
                    console.log("Usuário admin criado com sucesso");
                    return 'admin';
                } catch (createError) {
                    console.error("Erro ao criar usuário admin:", createError);
                }
            }
            
            // Se não conseguiu criar, redireciona para o login
            console.error("Não foi possível encontrar ou criar usuário");
            window.location.href = "../index.html";
            return null;
        }
        
        // Pegar o primeiro documento (deve ser único)
        const userData = querySnapshot.docs[0].data();
        console.log("Papel do usuário:", userData.role);
        return userData.role;
    } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        return null;
    }
}

// Função para atualizar visibilidade do menu conforme o papel do usuário
function updateMenuVisibility(role) {
    console.log("Atualizando visibilidade do menu para o papel:", role);
    
    const navItems = document.querySelectorAll('.dropdown-item.nav-item');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');
    
    console.log("Elementos encontrados:", {
        "navItems": navItems.length,
        "dropdownToggle": dropdownToggle ? true : false,
        "dropdownMenu": dropdownMenu ? true : false,
        "logoutBtn": logoutBtn ? true : false
    });
    
    // Esconder todos os itens de navegação
    navItems.forEach(item => {
        item.style.display = 'none';
    });
    
    // Mostrar apenas os itens permitidos baseado no papel
    if (role === 'admin') {
        console.log("Configurando menu para administrador");
        // Admin tem acesso a tudo
        navItems.forEach(item => {
            item.style.display = 'flex';
        });
    } else if (role === 'editor') {
        console.log("Configurando menu para editor");
        // Editor tem acesso a tudo exceto gerenciar usuários
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page !== 'gerenciar-usuarios.html') {
                item.style.display = 'flex';
            }
        });
    } else if (role === 'reader') {
        console.log("Configurando menu para leitor");
        // Leitor só tem acesso ao dashboard
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === 'dashboard.html') {
                item.style.display = 'flex';
            }
        });
    }
    
    // Garantir que o botão de logout esteja sempre visível
    if (logoutBtn) {
        logoutBtn.style.display = 'flex';
        console.log("Botão de logout configurado para visível");
    } else {
        console.error("Botão de logout não encontrado!");
    }
    
    // Garantir que o dropdown toggle esteja sempre visível
    if (dropdownToggle) {
        dropdownToggle.style.display = 'flex';
        console.log("Dropdown toggle configurado para visível");
    } else {
        console.error("Dropdown toggle não encontrado!");
    }
    
    // Garantir que o menu dropdown esteja funcional
    if (dropdownMenu) {
        console.log("Menu dropdown encontrado e configurado");
    } else {
        console.error("Menu dropdown não encontrado!");
    }
}

// Função para carregar dados do dashboard
async function carregarDadosDashboard() {
    try {
        // Buscar todas as doações
        const doacoesQuery = query(collection(db, "doacoes"));
        const doacoesSnapshot = await getDocs(doacoesQuery);
        
        if (doacoesSnapshot.empty) {
            console.log("Não há doações registradas.");
            return;
        }
        
        // Dados para análise
        const doacoes = [];
        let totalPremios = 0;
        
        // Dados para categorias
        const categorias = {
            diamante: 0,
            ouro: 0,
            prata: 0,
            brinde: 0
        };
        
        // Dados para prêmios
        const premios = {};
        
        // Dados para secretarias
        const secretarias = {};
        
        // Dados para evolução temporal
        const evolucaoPorMes = {};
        
        doacoesSnapshot.forEach(doc => {
            const doacao = doc.data();
            doacoes.push(doacao);
            
            // Quantidade total de prêmios
            const quantidade = doacao.quantidade || 1;
            totalPremios += quantidade;
            
            // Contagem por categoria
            if (doacao.categoria && categorias.hasOwnProperty(doacao.categoria)) {
                categorias[doacao.categoria] += quantidade;
            }
            
            // Contagem por prêmio
            const premioKey = doacao.premioNome || 'Não especificado';
            if (!premios[premioKey]) {
                premios[premioKey] = {
                    nome: premioKey,
                    quantidade: 0,
                    categoria: doacao.categoria || 'Não especificada'
                };
            }
            premios[premioKey].quantidade += quantidade;
            
            // Contagem por secretaria
            const secretariaKey = doacao.secretariaNome || 'Não especificada';
            if (!secretarias[secretariaKey]) {
                secretarias[secretariaKey] = {
                    nome: secretariaKey,
                    doacoes: 0,
                    totalPremios: 0
                };
            }
            secretarias[secretariaKey].doacoes += 1;
            secretarias[secretariaKey].totalPremios += quantidade;
            
            // Evolução temporal
            if (doacao.data) {
                let data;
                if (doacao.data instanceof Timestamp) {
                    data = doacao.data.toDate();
                } else if (doacao.data.toDate) {
                    data = doacao.data.toDate();
                } else {
                    data = new Date(doacao.data);
                }
                
                const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
                if (!evolucaoPorMes[mesAno]) {
                    evolucaoPorMes[mesAno] = 0;
                }
                evolucaoPorMes[mesAno] += quantidade;
            }
        });
        
        // Preencher a tabela de top prêmios
        preencherTabelaTopPremios(premios);
        
        // Preencher a tabela de lista de prêmios
        preencherTabelaListaPremios(premios, totalPremios);
        
        // Preencher a tabela de lista de secretarias/empresas
        preencherTabelaListaSecretarias(secretarias, totalPremios);
        
    } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
    }
}

// Função para preencher a tabela de top prêmios
function preencherTabelaTopPremios(premios) {
    // Converter o objeto em array para ordenação
    const premiosArray = Object.values(premios);
    
    // Ordenar por quantidade (maior para menor)
    premiosArray.sort((a, b) => b.quantidade - a.quantidade);
    
    // Limpar a tabela
    topPremiosTableBody.innerHTML = '';
    
    // Adicionar até 5 itens
    const topPremios = premiosArray.slice(0, 5);
    
    topPremios.forEach(premio => {
        const row = document.createElement('tr');
        
        // Capitalizar categoria
        const categoria = premio.categoria.charAt(0).toUpperCase() + premio.categoria.slice(1);
        
        row.innerHTML = `
            <td>${premio.nome}</td>
            <td>${premio.quantidade}</td>
            <td><span class="category-badge category-${premio.categoria}">${categoria}</span></td>
        `;
        
        topPremiosTableBody.appendChild(row);
    });
    
    // Se não houver dados, mostrar mensagem
    if (topPremios.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center;">Nenhum prêmio cadastrado</td>';
        topPremiosTableBody.appendChild(row);
    }
}

// Função para preencher a tabela de lista de prêmios
function preencherTabelaListaPremios(premios, totalPremios) {
    // Converter o objeto em array para ordenação
    const premiosArray = Object.values(premios);
    
    // Ordenar por quantidade (maior para menor)
    premiosArray.sort((a, b) => b.quantidade - a.quantidade);
    
    // Referência à tabela
    const listaPremiosTableBody = document.getElementById('lista-premios-table').querySelector('tbody');
    
    // Limpar a tabela
    listaPremiosTableBody.innerHTML = '';
    
    // Adicionar todos os prêmios
    premiosArray.forEach(premio => {
        const row = document.createElement('tr');
        
        // Calcular o percentual
        const percentual = totalPremios > 0 ? ((premio.quantidade / totalPremios) * 100).toFixed(1) : 0;
        
        // Capitalizar categoria
        const categoria = premio.categoria.charAt(0).toUpperCase() + premio.categoria.slice(1);
        
        row.innerHTML = `
            <td>${premio.nome}</td>
            <td><span class="category-badge category-${premio.categoria}">${categoria}</span></td>
            <td>${premio.quantidade}</td>
            <td>${percentual}%</td>
        `;
        
        listaPremiosTableBody.appendChild(row);
    });
    
    // Se não houver dados, mostrar mensagem
    if (premiosArray.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">Nenhum prêmio cadastrado</td>';
        listaPremiosTableBody.appendChild(row);
    }
}

// Função para preencher a tabela de lista de secretarias/empresas
function preencherTabelaListaSecretarias(secretarias, totalPremios) {
    // Converter o objeto em array para ordenação
    const secretariasArray = Object.values(secretarias);
    
    // Ordenar por total de prêmios (maior para menor)
    secretariasArray.sort((a, b) => b.totalPremios - a.totalPremios);
    
    // Referência à tabela
    const listaSecretariasTableBody = document.getElementById('lista-secretarias-table').querySelector('tbody');
    
    // Limpar a tabela
    listaSecretariasTableBody.innerHTML = '';
    
    // Adicionar todas as secretarias/empresas
    secretariasArray.forEach(secretaria => {
        const row = document.createElement('tr');
        
        // Calcular o percentual
        const percentual = totalPremios > 0 ? ((secretaria.totalPremios / totalPremios) * 100).toFixed(1) : 0;
        
        row.innerHTML = `
            <td>${secretaria.nome}</td>
            <td>${secretaria.doacoes}</td>
            <td>${secretaria.totalPremios}</td>
            <td>${percentual}%</td>
        `;
        
        listaSecretariasTableBody.appendChild(row);
    });
    
    // Se não houver dados, mostrar mensagem
    if (secretariasArray.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">Nenhuma secretaria/empresa cadastrada</td>';
        listaSecretariasTableBody.appendChild(row);
    }
}

// Verificar se o usuário está autenticado
onAuthStateChanged(auth, async (user) => {
    console.log("Estado da autenticação alterado:", user ? `Usuário ${user.email} autenticado` : "Usuário não autenticado");
    
    if (user) {
        try {
            // Verificar permissões antes de qualquer coisa
            const userRole = await checkUserPermissions();
            console.log("Papel do usuário verificado:", userRole);
            
            if (!userRole) {
                console.error("Não foi possível determinar o papel do usuário");
                window.location.href = "../index.html";
                return;
            }
            
            // Atualizar o menu conforme o papel do usuário
            updateMenuVisibility(userRole);
            
            // Buscar dados do usuário no Firestore
            const usersCollection = collection(db, "users");
            const q = query(usersCollection, where("uid", "==", user.uid));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                console.error("Usuário não encontrado após verificação de permissões, isso é inesperado");
                window.location.href = "../index.html";
                return;
            }
            
            const userData = querySnapshot.docs[0].data();
            console.log("Dados do usuário carregados:", userData);
            
            // Atualizar nome do usuário na interface
            const userName = userData.nome || user.email;
            document.getElementById('user-name').textContent = userName;
            
            // Atualizar avatar se aplicável
            const avatarElement = document.querySelector('.avatar');
            if (userName.length > 0) {
                const userInitial = userName.charAt(0).toUpperCase();
                avatarElement.textContent = userInitial;
                
                // Atualizar no sessionStorage
                sessionStorage.setItem('userName', userName);
                sessionStorage.setItem('userInitial', userInitial);
            }
            
            // Carregar dados do dashboard
            carregarDadosDashboard();
            
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            // Não alterar a interface se já tiver dados no sessionStorage
            
            // Se for um erro grave, redirecionar para a página de login
            if (error.code === 'permission-denied' || error.code === 'not-found') {
                alert("Erro ao carregar dados do usuário. Redirecionando para login.");
                window.location.href = "../index.html";
            }
        }
    } else {
        console.log("Usuário não autenticado, redirecionando para login");
        // Limpar o sessionStorage ao fazer logout
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userInitial');
        
        // Usuário não está logado, redirecionar para a página de login
        window.location.href = "../index.html";
    }
});

// Função de logout
document.getElementById('logout-btn').addEventListener('click', () => {
    // Limpar o sessionStorage ao fazer logout
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userInitial');
    
    signOut(auth).then(() => {
        window.location.href = "../index.html";
    }).catch((error) => {
        alert("Erro ao fazer logout: " + error.message);
    });
});

// Navegação entre seções do dashboard
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remover classe active de todas as tabs e seções
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        
        // Adicionar classe active na tab clicada
        tab.classList.add('active');
        
        // Mostrar a seção correspondente
        const sectionId = 'section-' + tab.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
    });
});

// Adicionar event listeners para navegação com verificação de permissões
document.querySelectorAll('.dropdown-item[data-page]').forEach(item => {
    item.addEventListener('click', async function(e) {
        e.preventDefault();
        const pageName = this.getAttribute('data-page');
        
        if (window.location.pathname.endsWith(pageName)) {
            document.querySelector('.dropdown-menu').classList.remove('show');
            return;
        }

        // Verificar permissões antes de navegar
        const userRole = await checkUserPermissions();
        
        if (!userRole) {
            window.location.href = "../index.html";
            return;
        }

        // Verificar permissões para a página específica
        if (userRole === 'reader' && pageName !== 'dashboard.html') {
            alert('Você não tem permissão para acessar esta página.');
            return;
        }

        if (userRole === 'editor' && pageName === 'gerenciar-usuarios.html') {
            alert('Você não tem permissão para acessar esta página.');
            return;
        }

        // Mostrar overlay de carregamento e navegar
        showLoadingOverlay();
        window.location.href = pageName;
    });
});

// Função para mostrar overlay de carregamento com efeito de fade
function showLoadingOverlay() {
    // Criar o overlay com fundo transparente inicialmente
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
    
    // Adicionar efeito de fade para todo o corpo da página
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.3s ease-out';
    
    // Criar o spinner
    const spinner = document.createElement('div');
    spinner.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #6c63ff; opacity: 0; transition: opacity 0.3s ease-in;"></i>';
    overlay.appendChild(spinner);
    
    // Adicionar ao corpo
    document.body.appendChild(overlay);
    
    // Salvar informações do usuário para recuperar rapidamente na próxima página
    const userName = document.getElementById('user-name').textContent;
    const userInitial = document.querySelector('.avatar').textContent;
    
    sessionStorage.setItem('userName', userName);
    sessionStorage.setItem('userInitial', userInitial);
    
    // Aplicar animação com delay para criar efeito suave
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

// Executar assim que o DOM estiver pronto para exibir os dados do usuário de imediato
applyUserSessionData();

// Adicionar efeito de fade-in ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    // Definir opacidade inicial para 0 e depois animar para 1
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (dropdownToggle && dropdownMenu) {
        // Toggle dropdown when clicked
        dropdownToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            if (dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        // Prevent dropdown from closing when clicking inside it
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});