// Importar funções do Firebase
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
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

// Elementos do DOM
const premioInput = document.getElementById("premio");
const premioIdInput = document.getElementById("premio_id");
const secretariaInput = document.getElementById("secretaria");
const secretariaIdInput = document.getElementById("secretaria_id");
const addPremioBtn = document.getElementById("add-premio-btn");
const addSecretariaBtn = document.getElementById("add-secretaria-btn");
const premioModal = document.getElementById("premio-modal");
const secretariaModal = document.getElementById("secretaria-modal");
const closePremioModal = document.getElementById("close-premio-modal");
const closeSecretariaModal = document.getElementById("close-secretaria-modal");
const cancelPremioBtn = document.getElementById("cancel-premio-btn");
const cancelSecretariaBtn = document.getElementById("cancel-secretaria-btn");
const confirmPremioBtn = document.getElementById("confirm-premio-btn");
const confirmSecretariaBtn = document.getElementById("confirm-secretaria-btn");
const novoPremioInput = document.getElementById("novo-premio");
const novaSecretariaInput = document.getElementById("nova-secretaria");
const premioAutocompleteList = document.getElementById(
  "premio-autocomplete-list"
);
const secretariaAutocompleteList = document.getElementById(
  "secretaria-autocomplete-list"
);

// Armazenar dados para autocomplete
let premiosData = [];
let secretariasData = [];

// Carregar opções de prêmios do Firestore
async function carregarPremios() {
  try {
    const premiosQuery = query(collection(db, "premios"), orderBy("nome"));
    const querySnapshot = await getDocs(premiosQuery);

    // Limpar dados atuais
    premiosData = [];

    // Adicionar dados do banco
    querySnapshot.forEach((doc) => {
      const premio = doc.data();
      premiosData.push({
        id: doc.id,
        nome: premio.nome,
        categoria: premio.categoria,
      });
    });
  } catch (error) {
    console.error("Erro ao carregar prêmios:", error);
  }
}

// Carregar opções de secretarias/empresas do Firestore
async function carregarSecretarias() {
  try {
    const secretariasQuery = query(
      collection(db, "secretarias"),
      orderBy("nome")
    );
    const querySnapshot = await getDocs(secretariasQuery);

    // Limpar dados atuais
    secretariasData = [];

    // Adicionar dados do banco
    querySnapshot.forEach((doc) => {
      const secretaria = doc.data();
      secretariasData.push({
        id: doc.id,
        nome: secretaria.nome,
      });
    });
  } catch (error) {
    console.error("Erro ao carregar secretarias:", error);
  }
}

// Adicionar novo prêmio
async function adicionarPremio(nome, categoria) {
  try {
    const docRef = await addDoc(collection(db, "premios"), {
      nome: nome,
      categoria: categoria,
      dataCriacao: new Date(),
    });

    // Adicionar aos dados do autocomplete
    premiosData.push({
      id: docRef.id,
      nome: nome,
      categoria: categoria,
    });

    // Preencher o input com o novo valor
    premioInput.value = nome;
    premioIdInput.value = docRef.id;

    return true;
  } catch (error) {
    console.error("Erro ao adicionar prêmio:", error);
    return false;
  }
}

// Adicionar nova secretaria/empresa
async function adicionarSecretaria(nome) {
  try {
    const docRef = await addDoc(collection(db, "secretarias"), {
      nome: nome,
      dataCriacao: new Date(),
    });

    // Adicionar aos dados do autocomplete
    secretariasData.push({
      id: docRef.id,
      nome: nome,
    });

    // Preencher o input com o novo valor
    secretariaInput.value = nome;
    secretariaIdInput.value = docRef.id;

    return true;
  } catch (error) {
    console.error("Erro ao adicionar secretaria:", error);
    return false;
  }
}

// Função para inicializar autocomplete
function initAutocomplete(input, list, hiddenInput, data, onSelect) {
  // Mostrar lista de sugestões quando o input receber foco
  input.addEventListener("focus", function () {
    showAutocompleteItems(input, list, data);
  });

  // Atualizar lista quando o usuário digitar
  input.addEventListener("input", function () {
    showAutocompleteItems(input, list, data);
  });

  // Esconder lista quando o input perder foco
  input.addEventListener("blur", function () {
    // Atraso para permitir que o clique no item seja processado
    setTimeout(function () {
      list.style.display = "none";
    }, 200);
  });

  // Navegar pela lista com teclado
  input.addEventListener("keydown", function (e) {
    if (list.style.display === "none") return;

    const items = list.getElementsByTagName("div");
    if (items.length === 0) return;

    let activeIndex = -1;

    // Encontrar o item ativo atual
    for (let i = 0; i < items.length; i++) {
      if (items[i].classList.contains("autocomplete-active")) {
        activeIndex = i;
        break;
      }
    }

    // Tecla seta para baixo
    if (e.keyCode === 40) {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      setActiveItem(items, activeIndex);
    }
    // Tecla seta para cima
    else if (e.keyCode === 38) {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      setActiveItem(items, activeIndex);
    }
    // Tecla Enter
    else if (e.keyCode === 13 && activeIndex !== -1) {
      e.preventDefault();
      items[activeIndex].click();
    }
    // Tecla Esc
    else if (e.keyCode === 27) {
      list.style.display = "none";
    }
  });
}

// Função para mostrar itens do autocomplete filtrados pelo input
function showAutocompleteItems(input, list, data) {
  // Limpar lista atual
  list.innerHTML = "";
  list.style.display = "none";

  // Se não houver dados, não mostrar nada
  if (!data || data.length === 0) return;

  const val = input.value.trim().toLowerCase();
  let matches = false;

  // Filtrar e adicionar itens que correspondem à busca
  data.forEach((item) => {
    if (item.nome.toLowerCase().includes(val)) {
      const div = document.createElement("div");
      div.innerHTML = highlightMatch(item.nome, val);
      div.dataset.id = item.id;
      div.dataset.nome = item.nome;

      // Callback quando um item é selecionado
      div.addEventListener("click", function () {
        input.value = item.nome;
        list.style.display = "none";
        if (onSelect) onSelect(item);
      });

      list.appendChild(div);
      matches = true;
    }
  });

  // Mostrar lista se houver correspondências
  if (matches) {
    list.style.display = "block";
  }
}

// Função para destacar parte correspondente do texto
function highlightMatch(text, match) {
  if (!match) return text;

  const regex = new RegExp("(" + match + ")", "gi");
  return text.replace(regex, "<strong>$1</strong>");
}

// Função para definir item ativo na lista
function setActiveItem(items, activeIndex) {
  // Remover classe ativa de todos os itens
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove("autocomplete-active");
  }

  // Adicionar classe ativa ao item selecionado
  if (activeIndex >= 0 && activeIndex < items.length) {
    items[activeIndex].classList.add("autocomplete-active");
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

// Event listeners para botões de adicionar
addPremioBtn.addEventListener("click", () => {
  novoPremioInput.value = "";
  premioModal.style.display = "flex";
});

addSecretariaBtn.addEventListener("click", () => {
  novaSecretariaInput.value = "";
  secretariaModal.style.display = "flex";
});

// Event listeners para fechar modais
closePremioModal.addEventListener("click", () => {
  premioModal.style.display = "none";
});

closeSecretariaModal.addEventListener("click", () => {
  secretariaModal.style.display = "none";
});

cancelPremioBtn.addEventListener("click", () => {
  premioModal.style.display = "none";
});

cancelSecretariaBtn.addEventListener("click", () => {
  secretariaModal.style.display = "none";
});

// Event listeners para confirmar adição
confirmPremioBtn.addEventListener("click", async () => {
  const novoPremio = novoPremioInput.value.trim();
  const categoria = document.getElementById("novo-premio-categoria").value;
  if (novoPremio && categoria) {
    // Adicionar estado de loading ao botão
    const originalBtnText = confirmPremioBtn.innerHTML;
    confirmPremioBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Adicionando...';
    confirmPremioBtn.disabled = true;
    confirmPremioBtn.style.opacity = "0.7";
    confirmPremioBtn.style.cursor = "not-allowed";

    try {
      const sucesso = await adicionarPremio(novoPremio, categoria);
      if (sucesso) {
        premioModal.style.display = "none";
        showToast("Prêmio adicionado com sucesso!");
      } else {
        alert("Erro ao adicionar prêmio. Tente novamente.");
      }
    } finally {
      // Restaurar o botão independentemente do resultado
      confirmPremioBtn.innerHTML = originalBtnText;
      confirmPremioBtn.disabled = false;
      confirmPremioBtn.style.opacity = "1";
      confirmPremioBtn.style.cursor = "pointer";
    }
  } else {
    alert("Por favor, preencha todos os campos.");
  }
});

confirmSecretariaBtn.addEventListener("click", async () => {
  const novaSecretaria = novaSecretariaInput.value.trim();
  if (novaSecretaria) {
    // Adicionar estado de loading ao botão
    const originalBtnText = confirmSecretariaBtn.innerHTML;
    confirmSecretariaBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Adicionando...';
    confirmSecretariaBtn.disabled = true;
    confirmSecretariaBtn.style.opacity = "0.7";
    confirmSecretariaBtn.style.cursor = "not-allowed";

    try {
      const sucesso = await adicionarSecretaria(novaSecretaria);
      if (sucesso) {
        secretariaModal.style.display = "none";
        showToast("Secretaria/Empresa adicionada com sucesso!");
      } else {
        alert("Erro ao adicionar secretaria/empresa. Tente novamente.");
      }
    } finally {
      // Restaurar o botão independentemente do resultado
      confirmSecretariaBtn.innerHTML = originalBtnText;
      confirmSecretariaBtn.disabled = false;
      confirmSecretariaBtn.style.opacity = "1";
      confirmSecretariaBtn.style.cursor = "pointer";
    }
  } else {
    alert("Por favor, digite o nome da secretaria/empresa.");
  }
});

// Inicializar eventos de autocomplete após carregar os dados
async function setupAutocomplete() {
  // Carregar dados primeiro
  await Promise.all([carregarPremios(), carregarSecretarias()]);

  // Inicializar autocomplete para prêmios
  initAutocomplete(
    premioInput,
    premioAutocompleteList,
    premioIdInput,
    premiosData,
    (item) => {
      premioIdInput.value = item.id;
    }
  );

  // Inicializar autocomplete para secretarias
  initAutocomplete(
    secretariaInput,
    secretariaAutocompleteList,
    secretariaIdInput,
    secretariasData,
    (item) => {
      secretariaIdInput.value = item.id;
    }
  );
}

// Verificar se o formulário tem os IDs necessários antes de enviar
document.getElementById("premio-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Obter o botão de submit e desabilitar para evitar múltiplos envios
  const submitBtn = e.target.querySelector(".submit-btn");
  const originalBtnText = submitBtn.innerHTML;

  // Se estiver vazio, mas o usuário digitou algo no campo, criar novo item
  if (!premioIdInput.value && premioInput.value.trim()) {
    // Verificar se já existe um prêmio com esse nome
    const existingPremio = premiosData.find(
      (p) => p.nome.toLowerCase() === premioInput.value.trim().toLowerCase()
    );
    if (existingPremio) {
      premioIdInput.value = existingPremio.id;
    } else {
      // Abrir modal para criar novo prêmio
      novoPremioInput.value = premioInput.value;
      premioModal.style.display = "flex";

      // Restaurar o botão
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";

      return;
    }
  }

  if (!secretariaIdInput.value && secretariaInput.value.trim()) {
    // Verificar se já existe uma secretaria com esse nome
    const existingSecretaria = secretariasData.find(
      (s) => s.nome.toLowerCase() === secretariaInput.value.trim().toLowerCase()
    );
    if (existingSecretaria) {
      secretariaIdInput.value = existingSecretaria.id;
    } else {
      // Abrir modal para criar nova secretaria
      novaSecretariaInput.value = secretariaInput.value;
      secretariaModal.style.display = "flex";

      // Restaurar o botão
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";

      return;
    }
  }

  // Alterar o texto do botão e desabilitar
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
  submitBtn.disabled = true;
  submitBtn.style.opacity = "0.7";
  submitBtn.style.cursor = "not-allowed";

  const colaborador = document.getElementById("colaborador").value;
  const premioId = document.getElementById("premio_id").value;
  const quantidade = parseInt(document.getElementById("quantidade").value);
  const secretariaId = document.getElementById("secretaria_id").value;
  const data = document.getElementById("data").value;
  const notaFiscal = document.getElementById("nota-fiscal").value;
  const observacoes = document.getElementById("observacoes").value;

  // Verificar se os IDs necessários estão presentes
  if (!premioId || !secretariaId) {
    alert("Por favor, selecione um prêmio e uma secretaria/empresa válidos.");

    // Restaurar o botão
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
    submitBtn.style.cursor = "pointer";

    return;
  }

  try {
    // Buscar o nome do prêmio e da secretaria selecionados
    const premioDoc = await getDoc(doc(db, "premios", premioId));
    const secretariaDoc = await getDoc(doc(db, "secretarias", secretariaId));

    if (!premioDoc.exists() || !secretariaDoc.exists()) {
      throw new Error("Prêmio ou secretaria não encontrados");
    }

    const premio = premioDoc.data();
    const secretaria = secretariaDoc.data();

    // Adicionar doação ao Firestore
    await addDoc(collection(db, "doacoes"), {
      colaborador,
      premioId,
      premioNome: premio.nome,
      quantidade,
      secretariaId,
      secretariaNome: secretaria.nome,
      data: new Date(data),
      notaFiscal,
      observacoes,
      dataCadastro: new Date(),
      categoria: premio.categoria || "Não especificada",
    });

    // Limpar formulário
    e.target.reset();
    premioIdInput.value = "";
    secretariaIdInput.value = "";

    // Mostrar mensagem de sucesso
    showToast("Prêmio cadastrado com sucesso!");
  } catch (error) {
    console.error("Erro ao cadastrar prêmio:", error);
    alert("Erro ao cadastrar prêmio. Tente novamente.");
  } finally {
    // Restaurar o botão independentemente do resultado
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
    submitBtn.style.cursor = "pointer";
  }
});

// Função para verificar permissões do usuário
async function checkUserPermissions() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "../index.html";
    return null;
  }

  try {
    // Buscar o documento do usuário pelo UID
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("Usuário não encontrado no Firestore");
      window.location.href = "../index.html";
      return null;
    }

    // Pegar o primeiro documento (deve ser único)
    const userData = querySnapshot.docs[0].data();
    return userData.role;
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);
    return null;
  }
}

// Função para atualizar visibilidade do menu conforme o papel do usuário
function updateMenuVisibility(role) {
  const navItems = document.querySelectorAll(".dropdown-item.nav-item");
  const logoutBtn = document.getElementById("logout-btn");
  const dropdownToggle = document.querySelector(".dropdown-toggle");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  // Esconder todos os itens de navegação
  navItems.forEach((item) => {
    item.style.display = "none";
  });

  // Mostrar apenas os itens permitidos baseado no papel
  if (role === "admin") {
    // Admin tem acesso a tudo
    navItems.forEach((item) => {
      item.style.display = "flex";
    });
  } else if (role === "editor") {
    // Editor tem acesso a tudo exceto gerenciar usuários
    navItems.forEach((item) => {
      const page = item.getAttribute("data-page");
      if (page !== "gerenciar-usuarios.html") {
        item.style.display = "flex";
      }
    });
  } else if (role === "reader") {
    // Leitor só tem acesso ao dashboard
    navItems.forEach((item) => {
      const page = item.getAttribute("data-page");
      if (page === "dashboard.html") {
        item.style.display = "flex";
      }
    });
  }

  // Garantir que o botão de logout esteja sempre visível
  if (logoutBtn) {
    logoutBtn.style.display = "flex";
  }

  // Garantir que o dropdown toggle esteja sempre visível
  if (dropdownToggle) {
    dropdownToggle.style.display = "flex";
  }

  // Garantir que o dropdown menu tenha display padrão (não afete a exibição/ocultação via classe)
  if (dropdownMenu) {
    dropdownMenu.style.display = "";
  }
}

// Verificar se o usuário está autenticado
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Aplicar dados da sessão primeiro para carregar valores já salvos
      applyUserSessionData();

      // Verificar permissões
      const userRole = await checkUserPermissions();
      console.log("Papel do usuário:", userRole);

      // Verificar se o usuário tem permissão para acessar esta página
      if (userRole === "reader") {
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "dashboard.html";
        return;
      }

      // Atualizar o menu conforme o papel do usuário
      updateMenuVisibility(userRole);

      // Buscar dados do usuário no Firestore somente se ainda não estiver no sessionStorage
      if (
        !sessionStorage.getItem("userName") ||
        !sessionStorage.getItem("userInitial")
      ) {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          // Se encontrou o documento do usuário
          const userData = userDoc.data();
          const userName = userData.nome;

          // Atualizar apenas se o nome for diferente do que já está exibido
          if (
            userName &&
            userName !== document.getElementById("user-name").textContent
          ) {
            document.getElementById("user-name").textContent = userName;

            // Atualizar a primeira letra do avatar
            const avatarElement = document.querySelector(".avatar");
            if (userName.length > 0) {
              const userInitial = userName.charAt(0).toUpperCase();
              avatarElement.textContent = userInitial;

              // Atualizar no sessionStorage
              sessionStorage.setItem("userName", userName);
              sessionStorage.setItem("userInitial", userInitial);
            }
          }
        } else {
          // Usar email apenas se não houver nome no sessionStorage
          if (!sessionStorage.getItem("userName")) {
            const userEmail = user.email;
            document.getElementById("user-name").textContent = userEmail;
            sessionStorage.setItem("userName", userEmail);
          }
        }
      }

      // Carregar opções dos selects
      await carregarPremios();
      await carregarSecretarias();
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      // Não alterar a interface se já tiver dados no sessionStorage
    }
  } else {
    // Limpar o sessionStorage ao fazer logout
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userInitial");

    // Usuário não está logado, redirecionar para a página de login
    window.location.href = "../index.html";
  }
});

// Função de logout
document.getElementById("logout-btn").addEventListener("click", () => {
  // Limpar o sessionStorage ao fazer logout
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("userInitial");

  signOut(auth)
    .then(() => {
      // Logout bem-sucedido
      window.location.href = "../index.html";
    })
    .catch((error) => {
      // Erro no logout
      alert("Erro ao fazer logout: " + error.message);
    });
});

// Não definir a data automaticamente

// Função para mostrar toast notification
function showToast(message, duration = 3000) {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <div class="toast-message">${message}</div>
    `;

  toastContainer.appendChild(toast);

  // Trigger reflow to enable animation
  toast.offsetHeight;

  // Show toast
  toast.classList.add("show");

  // Remove toast after duration
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, duration);
}

// Adicionar event listeners para navegação com verificação de permissões
document.querySelectorAll(".dropdown-item.nav-item").forEach((item) => {
  item.addEventListener("click", async function (e) {
    e.preventDefault();
    const pageName = this.getAttribute("data-page");

    if (window.location.pathname.endsWith(pageName)) {
      document.querySelector(".dropdown-menu").classList.remove("show");
      return;
    }

    // Verificar permissões antes de navegar
    const userRole = await checkUserPermissions();

    if (!userRole) {
      window.location.href = "../index.html";
      return;
    }

    // Verificar permissões para a página específica
    if (userRole === "reader" && pageName !== "dashboard.html") {
      alert("Você não tem permissão para acessar esta página.");
      return;
    }

    if (userRole === "editor" && pageName === "gerenciar-usuarios.html") {
      alert("Você não tem permissão para acessar esta página.");
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
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(255, 255, 255, 0)";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.transition = "background-color 0.5s ease";

  // Adicionar efeito de fade para todo o corpo da página
  document.body.style.opacity = "1";
  document.body.style.transition = "opacity 0.3s ease-out";

  // Criar o spinner
  const spinner = document.createElement("div");
  spinner.innerHTML =
    '<i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #6c63ff; opacity: 0; transition: opacity 0.3s ease-in;"></i>';
  overlay.appendChild(spinner);

  // Adicionar ao corpo
  document.body.appendChild(overlay);

  // Salvar informações do usuário para recuperar rapidamente na próxima página
  const userName = document.getElementById("user-name").textContent;
  const userInitial = document.querySelector(".avatar").textContent;

  sessionStorage.setItem("userName", userName);
  sessionStorage.setItem("userInitial", userInitial);

  // Aplicar animação com delay para criar efeito suave
  setTimeout(() => {
    overlay.style.backgroundColor = "rgba(255, 255, 255, 0.97)";
    document.body.style.opacity = "0.8";
    spinner.querySelector("i").style.opacity = "1";
  }, 50);
}

// Aplicar dados do usuário da sessão
function applyUserSessionData() {
  const userName = sessionStorage.getItem("userName");
  const userInitial = sessionStorage.getItem("userInitial");

  if (userName) {
    document.getElementById("user-name").textContent = userName;
  }

  if (userInitial) {
    document.querySelector(".avatar").textContent = userInitial;
  }
}

// Executar imediatamente para aplicar os dados o mais rápido possível
applyUserSessionData();

// Adicionar efeito de fade-in ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
  setupAutocomplete();

  // Fechar modal ao clicar fora
  window.addEventListener("click", (event) => {
    if (event.target === premioModal) {
      premioModal.style.display = "none";
    }
    if (event.target === secretariaModal) {
      secretariaModal.style.display = "none";
    }
  });
});

// Dropdown functionality
document.addEventListener("DOMContentLoaded", function () {
  const dropdownToggle = document.querySelector(".dropdown-toggle");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (dropdownToggle && dropdownMenu) {
    // Toggle dropdown when clicked
    dropdownToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function () {
      if (dropdownMenu.classList.contains("show")) {
        dropdownMenu.classList.remove("show");
      }
    });

    // Prevent dropdown from closing when clicking inside it
    dropdownMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
});
