// Importar funções do Firebase
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
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

// Elementos DOM
const premiosTableBody = document.getElementById("premios-table-body");
const secretariasTableBody = document.getElementById("secretarias-table-body");
const doacoesTableBody = document.getElementById("doacoes-table-body");
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

// Modais
const editPremioModal = document.getElementById("edit-premio-modal");
const editSecretariaModal = document.getElementById("edit-secretaria-modal");
const editDoacaoModal = document.getElementById("edit-doacao-modal");
const deleteConfirmModal = document.getElementById("delete-confirm-modal");

// Inputs de edição
const editPremioNome = document.getElementById("edit-premio-nome");
const editPremioId = document.getElementById("edit-premio-id");
const editSecretariaNome = document.getElementById("edit-secretaria-nome");
const editSecretariaId = document.getElementById("edit-secretaria-id");

// Inputs de edição de doação
const editDoacaoColaborador = document.getElementById(
  "edit-doacao-colaborador"
);
const editDoacaoPremio = document.getElementById("edit-doacao-premio");
const editDoacaoQuantidade = document.getElementById("edit-doacao-quantidade");
const editDoacaoSecretaria = document.getElementById("edit-doacao-secretaria");
const editDoacaoData = document.getElementById("edit-doacao-data");
const editDoacaoNotaFiscal = document.getElementById("edit-doacao-nota-fiscal");
const editDoacaoId = document.getElementById("edit-doacao-id");

// Variável global para armazenar o item a ser excluído
let deleteItemData = null;

// Função para mostrar loading
function showLoading(tableBody) {
  tableBody.innerHTML = `
        <tr>
            <td colspan="6" style="border-bottom: none;">
                <div class="loading-container">
                    <div>
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Carregando dados...</div>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

// Mostrar loading em todas as tabelas imediatamente ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
  // Mostrar loading em todas as tabelas
  if (premiosTableBody) showLoading(premiosTableBody);
  if (secretariasTableBody) showLoading(secretariasTableBody);
  if (doacoesTableBody) showLoading(doacoesTableBody);

  // Definir opacidade inicial para 0 e depois animar para 1
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.5s ease-in";

  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 100);

  // Aplicar dados do usuário da sessão se disponíveis
  applyUserSessionData();
});

// Carregar prêmios
async function carregarPremios() {
  try {
    // Mostrar loading
    showLoading(premiosTableBody);

    const premiosQuery = query(collection(db, "premios"), orderBy("nome"));
    const querySnapshot = await getDocs(premiosQuery);

    premiosTableBody.innerHTML = "";

    if (querySnapshot.empty) {
      premiosTableBody.innerHTML =
        '<tr><td colspan="4" style="text-align: center;">Nenhum prêmio cadastrado</td></tr>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const premio = doc.data();
      const row = document.createElement("tr");

      // Formatação da data
      let dataFormatada = "Data não disponível";
      if (premio.dataCriacao) {
        if (premio.dataCriacao instanceof Timestamp) {
          const data = premio.dataCriacao.toDate();
          dataFormatada = data.toLocaleDateString("pt-BR");
        } else if (premio.dataCriacao.toDate) {
          const data = premio.dataCriacao.toDate();
          dataFormatada = data.toLocaleDateString("pt-BR");
        }
      }

      // Capitalizar categoria
      const categoria = premio.categoria
        ? premio.categoria.charAt(0).toUpperCase() + premio.categoria.slice(1)
        : "Não especificada";

      row.innerHTML = `
                <td>${premio.nome}</td>
                <td><span class="category-badge category-${
                  premio.categoria || "brinde"
                }">${categoria}</span></td>
                <td>${dataFormatada}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${doc.id}" data-nome="${
        premio.nome
      }" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${doc.id}" data-nome="${
        premio.nome
      }" data-type="premio" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

      premiosTableBody.appendChild(row);
    });

    // Adicionar event listeners para os botões de editar e excluir
    addEditPremioListeners();
    addDeleteItemListeners();
  } catch (error) {
    console.error("Erro ao carregar prêmios:", error);
    premiosTableBody.innerHTML =
      '<tr><td colspan="4" style="text-align: center;">Erro ao carregar prêmios</td></tr>';
  }
}

// Carregar secretarias
async function carregarSecretarias() {
  try {
    // Mostrar loading
    showLoading(secretariasTableBody);

    const secretariasQuery = query(
      collection(db, "secretarias"),
      orderBy("nome")
    );
    const querySnapshot = await getDocs(secretariasQuery);

    secretariasTableBody.innerHTML = "";

    if (querySnapshot.empty) {
      secretariasTableBody.innerHTML =
        '<tr><td colspan="3" style="text-align: center;">Nenhuma secretaria/empresa cadastrada</td></tr>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const secretaria = doc.data();
      const row = document.createElement("tr");

      // Formatação da data
      let dataFormatada = "Data não disponível";
      if (secretaria.dataCriacao) {
        if (secretaria.dataCriacao instanceof Timestamp) {
          const data = secretaria.dataCriacao.toDate();
          dataFormatada = data.toLocaleDateString("pt-BR");
        } else if (secretaria.dataCriacao.toDate) {
          const data = secretaria.dataCriacao.toDate();
          dataFormatada = data.toLocaleDateString("pt-BR");
        }
      }

      row.innerHTML = `
                <td>${secretaria.nome}</td>
                <td>${dataFormatada}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${doc.id}" data-nome="${secretaria.nome}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${doc.id}" data-nome="${secretaria.nome}" data-type="secretaria" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

      secretariasTableBody.appendChild(row);
    });

    // Adicionar event listeners para os botões de editar e excluir
    addEditSecretariaListeners();
    addDeleteItemListeners();
  } catch (error) {
    console.error("Erro ao carregar secretarias:", error);
    secretariasTableBody.innerHTML =
      '<tr><td colspan="3" style="text-align: center;">Erro ao carregar secretarias</td></tr>';
  }
}

// Carregar doações
async function carregarDoacoes() {
  try {
    // Mostrar loading
    showLoading(doacoesTableBody);

    const doacoesQuery = query(
      collection(db, "doacoes"),
      orderBy("dataCadastro", "desc")
    );
    const querySnapshot = await getDocs(doacoesQuery);

    doacoesTableBody.innerHTML = "";

    if (querySnapshot.empty) {
      doacoesTableBody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">Nenhuma doação cadastrada</td></tr>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const doacao = doc.data();
      const row = document.createElement("tr");

      // Formatação da data
      let dataFormatada = "Data não disponível";
      if (doacao.data) {
        if (doacao.data instanceof Timestamp) {
          const data = doacao.data.toDate();
          dataFormatada = data.toLocaleDateString("pt-BR");
        } else if (doacao.data.toDate) {
          const data = doacao.data.toDate();
          dataFormatada = data.toLocaleDateString("pt-BR");
        }
      }

      // Capitalizar a primeira letra da categoria
      const categoria = doacao.categoria
        ? doacao.categoria.charAt(0).toUpperCase() + doacao.categoria.slice(1)
        : "Não definida";

      row.innerHTML = `
                <td>${doacao.colaborador}</td>
                <td>${doacao.premioNome}</td>
                <td>${doacao.quantidade}</td>
                <td>${doacao.secretariaNome}</td>
                <td>${dataFormatada}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${doc.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${doc.id}" data-nome="${doacao.premioNome} - ${doacao.colaborador}" data-type="doacao" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

      doacoesTableBody.appendChild(row);
    });

    // Adicionar event listeners para os botões de editar e excluir
    addEditDoacaoListeners();
    addDeleteItemListeners();
  } catch (error) {
    console.error("Erro ao carregar doações:", error);
    doacoesTableBody.innerHTML =
      '<tr><td colspan="6" style="text-align: center;">Erro ao carregar doações</td></tr>';
  }
}

// Adicionar listeners para editar prêmios
function addEditPremioListeners() {
  const editButtons = premiosTableBody.querySelectorAll(".edit-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const id = this.getAttribute("data-id");
      const nome = this.getAttribute("data-nome");

      try {
        // Buscar os dados do prêmio
        const premioDoc = await getDoc(doc(db, "premios", id));

        if (premioDoc.exists()) {
          const premio = premioDoc.data();

          editPremioId.value = id;
          editPremioNome.value = nome;
          document.getElementById("edit-premio-categoria").value =
            premio.categoria || "brinde";

          editPremioModal.style.display = "flex";
        }
      } catch (error) {
        console.error("Erro ao carregar dados do prêmio:", error);
        alert("Erro ao carregar dados do prêmio.");
      }
    });
  });
}

// Adicionar listeners para editar secretarias
function addEditSecretariaListeners() {
  const editButtons = secretariasTableBody.querySelectorAll(".edit-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const nome = this.getAttribute("data-nome");

      editSecretariaId.value = id;
      editSecretariaNome.value = nome;

      editSecretariaModal.style.display = "flex";
    });
  });
}

// Adicionar listeners para editar doações
function addEditDoacaoListeners() {
  const editButtons = doacoesTableBody.querySelectorAll(".edit-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const id = this.getAttribute("data-id");

      try {
        // Carregar dados para os selects
        await carregarSelects();

        // Buscar os dados da doação
        const doacaoDoc = await getDoc(doc(db, "doacoes", id));

        if (doacaoDoc.exists()) {
          const doacao = doacaoDoc.data();

          // Preencher os campos do modal
          editDoacaoColaborador.value = doacao.colaborador || "";
          editDoacaoQuantidade.value = doacao.quantidade || 1;
          editDoacaoNotaFiscal.value = doacao.notaFiscal || "";
          editDoacaoId.value = id;

          // Selecionar o prêmio correto
          Array.from(editDoacaoPremio.options).forEach((option) => {
            if (option.value === doacao.premioId) {
              option.selected = true;
            }
          });

          // Selecionar a secretaria correta
          Array.from(editDoacaoSecretaria.options).forEach((option) => {
            if (option.value === doacao.secretariaId) {
              option.selected = true;
            }
          });

          // Formatar a data para o campo de data
          if (doacao.data) {
            const data =
              doacao.data instanceof Timestamp
                ? doacao.data.toDate()
                : doacao.data.toDate();

            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, "0");
            const dia = String(data.getDate()).padStart(2, "0");
            editDoacaoData.value = `${ano}-${mes}-${dia}`;
          } else {
            editDoacaoData.value = "";
          }

          // Mostrar o modal
          editDoacaoModal.style.display = "flex";
        } else {
          alert("Doação não encontrada.");
        }
      } catch (error) {
        console.error("Erro ao carregar dados da doação:", error);
        alert("Erro ao carregar dados da doação.");
      }
    });
  });
}

// Função para carregar selects (prêmios e secretarias)
async function carregarSelects() {
  try {
    // Limpar opções atuais
    editDoacaoPremio.innerHTML = "";
    editDoacaoSecretaria.innerHTML = "";

    // Carregar prêmios
    const premiosQuery = query(collection(db, "premios"), orderBy("nome"));
    const premiosSnapshot = await getDocs(premiosQuery);

    premiosSnapshot.forEach((doc) => {
      const premio = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = premio.nome;
      editDoacaoPremio.appendChild(option);
    });

    // Carregar secretarias
    const secretariasQuery = query(
      collection(db, "secretarias"),
      orderBy("nome")
    );
    const secretariasSnapshot = await getDocs(secretariasQuery);

    secretariasSnapshot.forEach((doc) => {
      const secretaria = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = secretaria.nome;
      editDoacaoSecretaria.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar selects:", error);
    throw error;
  }
}

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

// Função para atualizar prêmio
async function atualizarPremio(id, novoNome, novaCategoria) {
  try {
    const premioRef = doc(db, "premios", id);
    await updateDoc(premioRef, {
      nome: novoNome,
      categoria: novaCategoria,
    });

    // Buscar e atualizar todas as doações que usam este prêmio
    const doacoesQuery = query(
      collection(db, "doacoes"),
      where("premioId", "==", id)
    );
    const doacoesSnapshot = await getDocs(doacoesQuery);

    const atualizacoes = doacoesSnapshot.docs.map((doacaoDoc) => {
      const doacaoRef = doc(db, "doacoes", doacaoDoc.id);
      return updateDoc(doacaoRef, {
        premioNome: novoNome,
      });
    });

    // Executar todas as atualizações em paralelo
    if (atualizacoes.length > 0) {
      await Promise.all(atualizacoes);
    }

    // Substituir alert por toast
    showToast("Prêmio atualizado com sucesso!");

    // Não fechamos o modal aqui, isso será feito após a restauração do botão
    carregarPremios();
    carregarDoacoes(); // Recarregar as doações para refletir os nomes atualizados
  } catch (error) {
    console.error("Erro ao atualizar prêmio:", error);
    alert("Erro ao atualizar prêmio. Tente novamente.");
  }
}

// Função para atualizar secretaria
async function atualizarSecretaria(id, novoNome) {
  try {
    const secretariaRef = doc(db, "secretarias", id);
    await updateDoc(secretariaRef, {
      nome: novoNome,
    });

    // Buscar e atualizar todas as doações que usam esta secretaria
    const doacoesQuery = query(
      collection(db, "doacoes"),
      where("secretariaId", "==", id)
    );
    const doacoesSnapshot = await getDocs(doacoesQuery);

    const atualizacoes = doacoesSnapshot.docs.map((doacaoDoc) => {
      const doacaoRef = doc(db, "doacoes", doacaoDoc.id);
      return updateDoc(doacaoRef, {
        secretariaNome: novoNome,
      });
    });

    // Executar todas as atualizações em paralelo
    if (atualizacoes.length > 0) {
      await Promise.all(atualizacoes);
    }

    // Substituir alert por toast
    showToast("Secretaria/Empresa atualizada com sucesso!");

    // Não fechamos o modal aqui, isso será feito após a restauração do botão
    carregarSecretarias();
    carregarDoacoes(); // Recarregar as doações para refletir os nomes atualizados
  } catch (error) {
    console.error("Erro ao atualizar secretaria:", error);
    alert("Erro ao atualizar secretaria/empresa. Tente novamente.");
  }
}

// Função para atualizar doação
async function atualizarDoacao(id, dadosAtualizados) {
  try {
    const doacaoRef = doc(db, "doacoes", id);

    // Buscar os dados atuais da doação para preservar os campos que não estão no formulário
    const doacaoDoc = await getDoc(doacaoRef);
    const dadosAtuais = doacaoDoc.exists() ? doacaoDoc.data() : {};

    // Buscar o nome do prêmio e da secretaria selecionados
    const premioDoc = await getDoc(
      doc(db, "premios", dadosAtualizados.premioId)
    );
    const secretariaDoc = await getDoc(
      doc(db, "secretarias", dadosAtualizados.secretariaId)
    );

    const dadosCompletos = {
      ...dadosAtuais, // Mantém os dados existentes (incluindo categoria e observações)
      ...dadosAtualizados, // Sobrescreve com os dados atualizados do formulário
      premioNome: premioDoc.exists() ? premioDoc.data().nome : "Não encontrado",
      secretariaNome: secretariaDoc.exists()
        ? secretariaDoc.data().nome
        : "Não encontrada",
    };

    await updateDoc(doacaoRef, dadosCompletos);

    // Substituir alert por toast
    showToast("Doação atualizada com sucesso!");

    // Não fechamos o modal aqui, isso será feito após a restauração do botão
    carregarDoacoes();
  } catch (error) {
    console.error("Erro ao atualizar doação:", error);
    alert("Erro ao atualizar doação. Tente novamente.");
  }
}

// Função para excluir item
async function excluirItem(id, type) {
  try {
    if (type === "premio") {
      await deleteDoc(doc(db, "premios", id));
      // Substituir alert por toast
      showToast("Prêmio excluído com sucesso!");
      carregarPremios();
    } else if (type === "secretaria") {
      await deleteDoc(doc(db, "secretarias", id));
      // Substituir alert por toast
      showToast("Secretaria/Empresa excluída com sucesso!");
      carregarSecretarias();
    } else if (type === "doacao") {
      await deleteDoc(doc(db, "doacoes", id));
      // Substituir alert por toast
      showToast("Doação excluída com sucesso!");
      carregarDoacoes();
    }

    // Não fechamos o modal aqui, isso será feito após a restauração do botão
  } catch (error) {
    console.error("Erro ao excluir item:", error);
    alert("Erro ao excluir item. Tente novamente.");
  }
}

// Adicionar listeners para excluir itens
function addDeleteItemListeners() {
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const nome = this.getAttribute("data-nome");
      const type = this.getAttribute("data-type");

      deleteItemData = { id, nome, type };

      document.getElementById(
        "delete-message"
      ).textContent = `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`;

      deleteConfirmModal.style.display = "flex";
    });
  });
}

// Event listeners para as abas
tabs.forEach((tab) => {
  tab.addEventListener("click", function () {
    const tabName = this.getAttribute("data-tab");

    // Atualizar classe ativa da aba
    tabs.forEach((t) => t.classList.remove("active"));
    this.classList.add("active");

    // Mostrar conteúdo da aba selecionada com efeito de fade
    tabContents.forEach((content) => {
      if (content.classList.contains("active")) {
        content.style.opacity = "0";
        setTimeout(() => {
          content.classList.remove("active");
        }, 300);
      }
    });

    setTimeout(() => {
      const selectedContent = document.getElementById(`${tabName}-tab`);
      selectedContent.classList.add("active");
      selectedContent.style.opacity = "1";
    }, 300);
  });
});

// Event listeners para modais
document
  .getElementById("close-edit-premio-modal")
  .addEventListener("click", () => {
    editPremioModal.style.display = "none";
  });

document
  .getElementById("cancel-edit-premio-btn")
  .addEventListener("click", () => {
    editPremioModal.style.display = "none";
  });

document
  .getElementById("save-premio-btn")
  .addEventListener("click", async () => {
    const id = editPremioId.value;
    const novoNome = editPremioNome.value.trim();
    const novaCategoria = document.getElementById(
      "edit-premio-categoria"
    ).value;

    if (novoNome) {
      // Adicionar estado de loading ao botão
      const savePremioBtn = document.getElementById("save-premio-btn");
      const originalBtnText = savePremioBtn.innerHTML;
      savePremioBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Salvando...';
      savePremioBtn.disabled = true;
      savePremioBtn.style.opacity = "0.7";
      savePremioBtn.style.cursor = "not-allowed";

      try {
        await atualizarPremio(id, novoNome, novaCategoria);
      } finally {
        // Restaurar o botão independentemente do resultado
        savePremioBtn.innerHTML = originalBtnText;
        savePremioBtn.disabled = false;
        savePremioBtn.style.opacity = "1";
        savePremioBtn.style.cursor = "pointer";

        // Fechar o modal após a operação
        editPremioModal.style.display = "none";
      }
    } else {
      alert("Por favor, digite o nome do prêmio.");
    }
  });

document
  .getElementById("close-edit-secretaria-modal")
  .addEventListener("click", () => {
    editSecretariaModal.style.display = "none";
  });

document
  .getElementById("cancel-edit-secretaria-btn")
  .addEventListener("click", () => {
    editSecretariaModal.style.display = "none";
  });

document
  .getElementById("save-secretaria-btn")
  .addEventListener("click", async () => {
    const id = editSecretariaId.value;
    const novoNome = editSecretariaNome.value.trim();

    if (novoNome) {
      // Adicionar estado de loading ao botão
      const saveSecretariaBtn = document.getElementById("save-secretaria-btn");
      const originalBtnText = saveSecretariaBtn.innerHTML;
      saveSecretariaBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Salvando...';
      saveSecretariaBtn.disabled = true;
      saveSecretariaBtn.style.opacity = "0.7";
      saveSecretariaBtn.style.cursor = "not-allowed";

      try {
        await atualizarSecretaria(id, novoNome);
      } finally {
        // Restaurar o botão independentemente do resultado
        saveSecretariaBtn.innerHTML = originalBtnText;
        saveSecretariaBtn.disabled = false;
        saveSecretariaBtn.style.opacity = "1";
        saveSecretariaBtn.style.cursor = "pointer";

        // Fechar o modal após a operação
        editSecretariaModal.style.display = "none";
      }
    } else {
      alert("Por favor, digite o nome da secretaria/empresa.");
    }
  });

document.getElementById("close-delete-modal").addEventListener("click", () => {
  deleteConfirmModal.style.display = "none";
});

document.getElementById("cancel-delete-btn").addEventListener("click", () => {
  deleteConfirmModal.style.display = "none";
});

document
  .getElementById("confirm-delete-btn")
  .addEventListener("click", async () => {
    if (deleteItemData) {
      // Adicionar estado de loading ao botão
      const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
      const originalBtnText = confirmDeleteBtn.innerHTML;
      confirmDeleteBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.style.opacity = "0.7";
      confirmDeleteBtn.style.cursor = "not-allowed";

      try {
        await excluirItem(deleteItemData.id, deleteItemData.type);
      } finally {
        // Restaurar o botão independentemente do resultado
        confirmDeleteBtn.innerHTML = originalBtnText;
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.style.opacity = "1";
        confirmDeleteBtn.style.cursor = "pointer";

        // Fechar o modal após a operação
        deleteConfirmModal.style.display = "none";
      }
    }
  });

document
  .getElementById("close-edit-doacao-modal")
  .addEventListener("click", () => {
    editDoacaoModal.style.display = "none";
  });

document
  .getElementById("cancel-edit-doacao-btn")
  .addEventListener("click", () => {
    editDoacaoModal.style.display = "none";
  });

document
  .getElementById("save-doacao-btn")
  .addEventListener("click", async () => {
    const id = editDoacaoId.value;
    const colaborador = editDoacaoColaborador.value.trim();
    const premioId = editDoacaoPremio.value;
    const quantidade = parseInt(editDoacaoQuantidade.value);
    const secretariaId = editDoacaoSecretaria.value;
    const dataStr = editDoacaoData.value;
    const notaFiscal = editDoacaoNotaFiscal.value.trim();

    if (!colaborador || !premioId || !secretariaId || !dataStr) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Adicionar estado de loading ao botão
    const saveDoacaoBtn = document.getElementById("save-doacao-btn");
    const originalBtnText = saveDoacaoBtn.innerHTML;
    saveDoacaoBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    saveDoacaoBtn.disabled = true;
    saveDoacaoBtn.style.opacity = "0.7";
    saveDoacaoBtn.style.cursor = "not-allowed";

    const dadosAtualizados = {
      colaborador,
      premioId,
      quantidade: isNaN(quantidade) ? 1 : quantidade,
      secretariaId,
      data: adjustDateForTimezone(dataStr),
      notaFiscal,
    };

    try {
      await atualizarDoacao(id, dadosAtualizados);
    } finally {
      // Restaurar o botão independentemente do resultado
      saveDoacaoBtn.innerHTML = originalBtnText;
      saveDoacaoBtn.disabled = false;
      saveDoacaoBtn.style.opacity = "1";
      saveDoacaoBtn.style.cursor = "pointer";

      // Fechar o modal após a operação
      editDoacaoModal.style.display = "none";
    }
  });

// Fechar modais ao clicar fora
window.addEventListener("click", (event) => {
  if (event.target === editPremioModal) {
    editPremioModal.style.display = "none";
  }
  if (event.target === editSecretariaModal) {
    editSecretariaModal.style.display = "none";
  }
  if (event.target === editDoacaoModal) {
    editDoacaoModal.style.display = "none";
  }
  if (event.target === deleteConfirmModal) {
    deleteConfirmModal.style.display = "none";
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
  const menuItems = document.querySelectorAll(".dropdown-item[data-page]");
  const logoutBtn = document.getElementById("logout-btn");
  const dropdownToggle = document.querySelector(".dropdown-toggle");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  // Primeiro, esconder todos os itens
  menuItems.forEach((item) => {
    item.style.display = "none";
  });

  // Mostrar apenas os itens permitidos baseado no papel
  if (role === "admin") {
    // Admin tem acesso a tudo
    menuItems.forEach((item) => {
      item.style.display = "flex";
    });
  } else if (role === "editor") {
    // Editor tem acesso a tudo exceto gerenciar usuários
    menuItems.forEach((item) => {
      const page = item.getAttribute("data-page");
      if (page !== "gerenciar-usuarios.html") {
        item.style.display = "flex";
      }
    });
  } else if (role === "reader") {
    // Leitor só tem acesso ao dashboard
    menuItems.forEach((item) => {
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
      // Verificar permissões
      const userRole = await checkUserPermissions();

      // Verificar se o usuário tem permissão para acessar esta página
      if (userRole !== "admin" && userRole !== "editor") {
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "dashboard.html";
        return;
      }

      // Atualizar o menu conforme o papel do usuário
      updateMenuVisibility(userRole);

      // Buscar dados do usuário no Firestore (em segundo plano)
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        // Se encontrou o documento do usuário
        const userData = userDoc.data();
        const userName = userData.nome;

        if (userName) {
          document.getElementById("user-name").textContent = userName;

          const avatarElement = document.querySelector(".avatar");
          if (userName.length > 0) {
            const userInitial = userName.charAt(0).toUpperCase();
            avatarElement.textContent = userInitial;

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

      // Carregar dados
      await carregarDoacoes();
      await carregarPremios();
      await carregarSecretarias();

      // Configurar eventos de pesquisa
      configurarPesquisaDoacao();
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

// Função para configurar a pesquisa de doações
function configurarPesquisaDoacao() {
  const pesquisaInput = document.getElementById("pesquisa-doacao");
  const btnPesquisar = document.getElementById("btn-pesquisar-doacao");
  const btnLimpar = document.getElementById("btn-limpar-pesquisa");

  // Pesquisar ao clicar no botão
  btnPesquisar.addEventListener("click", () => {
    pesquisarDoacoes(pesquisaInput.value.trim());
  });

  // Pesquisar ao pressionar Enter
  pesquisaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      pesquisarDoacoes(pesquisaInput.value.trim());
    }
  });

  // Limpar pesquisa
  btnLimpar.addEventListener("click", () => {
    pesquisaInput.value = "";
    carregarDoacoes(); // Recarregar todas as doações
  });
}

// Função para pesquisar doações
async function pesquisarDoacoes(termo) {
  if (!termo) {
    carregarDoacoes();
    return;
  }

  try {
    const termoLowerCase = termo.toLowerCase();
    const doacoesQuery = query(
      collection(db, "doacoes"),
      orderBy("dataCadastro", "desc")
    );
    const querySnapshot = await getDocs(doacoesQuery);

    doacoesTableBody.innerHTML = "";

    let encontrouResultados = false;

    querySnapshot.forEach((doc) => {
      const doacao = doc.data();

      // Verificar se o termo de pesquisa está no colaborador ou no nome do prêmio
      if (
        doacao.colaborador.toLowerCase().includes(termoLowerCase) ||
        doacao.premioNome.toLowerCase().includes(termoLowerCase) ||
        doacao.secretariaNome.toLowerCase().includes(termoLowerCase)
      ) {
        encontrouResultados = true;

        const row = document.createElement("tr");

        // Formatação da data
        let dataFormatada = "Data não disponível";
        if (doacao.data) {
          if (doacao.data instanceof Timestamp) {
            const data = doacao.data.toDate();
            dataFormatada = data.toLocaleDateString("pt-BR");
          } else if (doacao.data.toDate) {
            const data = doacao.data.toDate();
            dataFormatada = data.toLocaleDateString("pt-BR");
          }
        }

        // Capitalizar a primeira letra da categoria
        const categoria = doacao.categoria
          ? doacao.categoria.charAt(0).toUpperCase() + doacao.categoria.slice(1)
          : "Não definida";

        row.innerHTML = `
                    <td>${doacao.colaborador}</td>
                    <td>${doacao.premioNome}</td>
                    <td>${doacao.quantidade}</td>
                    <td>${doacao.secretariaNome}</td>
                    <td>${dataFormatada}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" data-id="${doc.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" data-id="${doc.id}" data-nome="${doacao.premioNome} - ${doacao.colaborador}" data-type="doacao" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;

        doacoesTableBody.appendChild(row);
      }
    });

    if (!encontrouResultados) {
      doacoesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Nenhuma doação encontrada com o termo "${termo}"</td></tr>`;
    } else {
      // Adicionar event listeners aos botões de editar e excluir
      addEditDoacaoListeners();
      addDeleteItemListeners();
    }
  } catch (error) {
    console.error("Erro ao pesquisar doações:", error);
    doacoesTableBody.innerHTML =
      '<tr><td colspan="7" style="text-align: center;">Erro ao pesquisar doações</td></tr>';
  }
}

// Função de logout
document.getElementById("logout-btn").addEventListener("click", () => {
  // Limpar o sessionStorage ao fazer logout
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("userInitial");

  signOut(auth)
    .then(() => {
      window.location.href = "../index.html";
    })
    .catch((error) => {
      alert("Erro ao fazer logout: " + error.message);
    });
});

// Dropdown functionality com navegação otimizada
document.addEventListener("DOMContentLoaded", function () {
  const dropdownToggle = document.querySelector(".dropdown-toggle");
  const dropdownMenu = document.querySelector(".dropdown-menu");

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

  // Adicionar evento de clique para os itens de menu com data-page
  document.querySelectorAll(".dropdown-item[data-page]").forEach((item) => {
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

// Função para ajustar o timezone da data
function adjustDateForTimezone(dateString) {
  // Parse the date string (format: YYYY-MM-DD)
  const parts = dateString.split("-");
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Months are 0-indexed in JavaScript
  const day = parseInt(parts[2]);

  // Create date with local timezone (no UTC conversion)
  return new Date(year, month, day);
}
