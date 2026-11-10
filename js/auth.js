const authScreen = document.getElementById("auth-screen");
const appShell = document.getElementById("app-shell");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");
const authTitle = document.getElementById("auth-title");
const authDescription = document.getElementById("auth-description");
const accounts = new Map();
const passwordIterations = 120_000;
const invalidCredentialsMessage = "La cédula o la contraseña no coinciden. Las cuentas de demostración solo existen en esta pestaña.";
let activeSession = false;

function normalizeCedula(value) {
  const compact = value.trim().replace(/[.\s]/g, "").toUpperCase();
  const match = compact.match(/^([VE])?-?(\d{5,10})$/);
  if (!match) return null;

  const [, documentType = "V", number] = match;
  return `${documentType}-${number}`;
}

async function deriveVerifier(password, salt) {
  if (!window.crypto?.subtle) {
    throw new Error("La autenticación de demostración requiere un navegador compatible y un origen seguro (HTTPS o localhost).");
  }

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const verifier = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: passwordIterations },
    keyMaterial,
    256
  );
  return new Uint8Array(verifier);
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function showFeedback(form, message) {
  const feedback = document.getElementById(`${form.id.replace("-form", "")}-feedback`);
  feedback.textContent = message;
  feedback.hidden = false;
}

function clearFeedback(form) {
  const feedback = document.getElementById(`${form.id.replace("-form", "")}-feedback`);
  feedback.textContent = "";
  feedback.hidden = true;
}

function resetPasswordVisibility(form) {
  form.querySelectorAll(".password-control input").forEach((input) => {
    input.type = "password";
    const toggle = form.querySelector(`[data-password-toggle="${input.id}"]`);
    toggle.setAttribute("aria-pressed", "false");
    toggle.setAttribute("aria-label", "Mostrar contraseña");
  });
}

function animateForm(form) {
  form.classList.remove("is-entering");
  void form.offsetWidth;
  form.classList.add("is-entering");
  window.setTimeout(() => form.classList.remove("is-entering"), 750);
}

function showMode(mode, focusField = false) {
  const registering = mode === "register";
  loginForm.hidden = registering;
  registerForm.hidden = !registering;
  animateForm(registering ? registerForm : loginForm);
  loginTab.setAttribute("aria-selected", String(!registering));
  loginTab.tabIndex = registering ? -1 : 0;
  registerTab.setAttribute("aria-selected", String(registering));
  registerTab.tabIndex = registering ? 0 : -1;
  authTitle.textContent = registering ? "Crea tu cuenta" : "Inicia sesión";
  authDescription.textContent = registering
    ? "Regístrate con tu cédula de identidad y crea una contraseña."
    : "Ingresa con tu cédula de identidad y contraseña.";
  clearFeedback(loginForm);
  clearFeedback(registerForm);
  if (focusField) {
    (registering ? document.getElementById("register-identity") : document.getElementById("login-identity")).focus();
  }
}

function enterApp() {
  activeSession = true;
  authScreen.hidden = true;
  appShell.hidden = false;
  appShell.inert = false;
  appShell.classList.add("is-entering");
  window.setTimeout(() => appShell.classList.remove("is-entering"), 700);
  document.querySelector(".profile-copy strong").textContent = "Sesión iniciada";
  document.querySelector(".profile-copy small").textContent = "Acceso de demostración";
  document.querySelector(".profile-initials").textContent = "GU";
  document.getElementById("logout").focus();
}

function leaveApp() {
  activeSession = false;
  appShell.hidden = true;
  appShell.inert = true;
  authScreen.hidden = false;
  loginForm.reset();
  registerForm.reset();
  resetPasswordVisibility(loginForm);
  resetPasswordVisibility(registerForm);
  showMode("login", true);
}

loginTab.addEventListener("click", () => showMode("login"));
registerTab.addEventListener("click", () => showMode("register"));
document.querySelector(".auth-tabs").addEventListener("keydown", (event) => {
  const tabs = [loginTab, registerTab];
  const currentIndex = tabs.indexOf(document.activeElement);
  if (currentIndex < 0) return;

  let nextIndex = currentIndex;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex + tabs.length - 1) % tabs.length;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = tabs.length - 1;
  else return;

  event.preventDefault();
  showMode(nextIndex === 0 ? "login" : "register");
  tabs[nextIndex].focus();
});
document.querySelectorAll("[data-show-register]").forEach((button) => {
  button.addEventListener("click", () => showMode("register", true));
});
document.querySelectorAll("[data-show-login]").forEach((button) => {
  button.addEventListener("click", () => showMode("login", true));
});

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    button.setAttribute("aria-pressed", String(reveal));
    button.setAttribute("aria-label", reveal ? "Ocultar contraseña" : "Mostrar contraseña");
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback(loginForm);
  const cedula = normalizeCedula(loginForm.elements.identity.value);
  if (!cedula) {
    showFeedback(loginForm, "Ingresa una cédula venezolana válida: V o E seguida de 5 a 10 dígitos.");
    loginForm.elements.password.value = "";
    loginForm.elements.identity.focus();
    return;
  }
  const account = accounts.get(cedula);
  if (!account) {
    showFeedback(loginForm, invalidCredentialsMessage);
    loginForm.elements.password.value = "";
    return;
  }

  const password = loginForm.elements.password.value;
  const submitButton = loginForm.querySelector("[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Verificando…";
  loginForm.setAttribute("aria-busy", "true");
  loginForm.elements.identity.disabled = true;
  loginForm.elements.password.disabled = true;
  try {
    const attempt = await deriveVerifier(password, account.salt);
    if (!equalBytes(attempt, account.verifier)) {
      showFeedback(loginForm, invalidCredentialsMessage);
      return;
    }
    enterApp();
  } catch (error) {
    showFeedback(loginForm, error.message);
  } finally {
    loginForm.elements.password.value = "";
    loginForm.elements.identity.disabled = false;
    loginForm.elements.password.disabled = false;
    loginForm.removeAttribute("aria-busy");
    submitButton.disabled = false;
    submitButton.textContent = "Entrar";
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback(registerForm);
  const cedula = normalizeCedula(registerForm.elements.identity.value);
  if (!cedula) {
    showFeedback(registerForm, "Ingresa una cédula venezolana válida: V o E seguida de 5 a 10 dígitos.");
    registerForm.elements.identity.focus();
    return;
  }
  if (accounts.has(cedula)) {
    showFeedback(registerForm, "Ya existe una cuenta de demostración con esa cédula. Inicia sesión.");
    return;
  }

  const password = registerForm.elements.password.value;
  if (password.length < 12) {
    showFeedback(registerForm, "La contraseña debe tener al menos 12 caracteres.");
    registerForm.elements.password.focus();
    return;
  }
  if (password !== registerForm.elements.confirm.value) {
    showFeedback(registerForm, "Las contraseñas no coinciden.");
    registerForm.elements.confirm.focus();
    return;
  }

  const submitButton = registerForm.querySelector("[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Creando cuenta…";
  try {
    if (!window.crypto?.getRandomValues) {
      throw new Error("La autenticación de demostración requiere un navegador compatible y un origen seguro (HTTPS o localhost).");
    }
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const verifier = await deriveVerifier(password, salt);
    accounts.set(cedula, { salt, verifier });
    registerForm.reset();
    resetPasswordVisibility(registerForm);
    enterApp();
  } catch (error) {
    showFeedback(registerForm, error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Crear cuenta";
  }
});

document.getElementById("logout").addEventListener("click", () => {
  if (activeSession) leaveApp();
});
