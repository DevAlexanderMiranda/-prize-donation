const container = document.getElementById("container");

function showSignUp() {
  container.classList.add("active");
  container.classList.remove("forgot");
}

function showSignIn() {
  container.classList.remove("active");
  container.classList.remove("forgot");
}

function showForgotPassword() {
  container.classList.add("forgot");
  container.classList.remove("active");
}

// Função para alternar visibilidade da senha
function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  const icon = event.target;

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  } else {
    passwordInput.type = "password";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  }
}
