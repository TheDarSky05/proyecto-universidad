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

function setFieldError(field, message) {
  if (!field) return;
  const hasError = Boolean(message);
  field.setAttribute("aria-invalid", String(hasError));
  field.setCustomValidity(hasError ? message : "");
  field.dataset.validationMessage = hasError ? message : "";
}

function clearFieldError(field) {
  setFieldError(field, "");
}

function validateIdentityInput(value) {
  const normalized = normalizeCedula(value);
  if (!normalized) {
    return "Ingresa una cédula venezolana válida: V o E seguida de 5 a 10 dígitos.";
  }
  return "";
}

function validatePasswordStrength(value) {
  if (!value || value.length < 12) {
    return "La contraseña debe tener al menos 12 caracteres.";
  }
  if (/\s/.test(value)) {
    return "La contraseña no debe incluir espacios.";
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "La contraseña debe incluir letras y números.";
  }
  return "";
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

loginForm.addEventListener("input", (event) => {
  const input = event.target;
  if (input.name === "identity") {
    const message = validateIdentityInput(input.value);
    setFieldError(input, message);
    if (!message) clearFeedback(loginForm);
  }
  if (input.name === "password" && input.value.trim() === "") {
    setFieldError(input, "La contraseña es obligatoria.");
  } else if (input.name === "password") {
    clearFieldError(input);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback(loginForm);
  const identityField = loginForm.elements.identity;
  const passwordField = loginForm.elements.password;
  const cedula = normalizeCedula(identityField.value);
  const identityError = validateIdentityInput(identityField.value);
  if (identityError) {
    setFieldError(identityField, identityError);
    showFeedback(loginForm, identityError);
    passwordField.value = "";
    identityField.focus();
    return;
  }
  if (!passwordField.value.trim()) {
    setFieldError(passwordField, "La contraseña es obligatoria.");
    showFeedback(loginForm, "La contraseña es obligatoria.");
    passwordField.focus();
    return;
  }
  clearFieldError(identityField);
  clearFieldError(passwordField);

  const account = accounts.get(cedula);
  if (!account) {
    showFeedback(loginForm, invalidCredentialsMessage);
    passwordField.value = "";
    return;
  }

  const password = passwordField.value;
  const submitButton = loginForm.querySelector("[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Verificando…";
  loginForm.setAttribute("aria-busy", "true");
  identityField.disabled = true;
  passwordField.disabled = true;
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
    passwordField.value = "";
    identityField.disabled = false;
    passwordField.disabled = false;
    loginForm.removeAttribute("aria-busy");
    submitButton.disabled = false;
    submitButton.textContent = "Entrar";
  }
});

registerForm.addEventListener("input", (event) => {
  const input = event.target;
  if (input.name === "identity") {
    const message = validateIdentityInput(input.value);
    setFieldError(input, message);
    if (!message) clearFeedback(registerForm);
  }
  if (input.name === "password") {
    const message = validatePasswordStrength(input.value);
    setFieldError(input, message);
    if (!message && registerForm.elements.confirm.value) {
      const confirmMessage = input.value !== registerForm.elements.confirm.value ? "Las contraseñas no coinciden." : "";
      setFieldError(registerForm.elements.confirm, confirmMessage);
    }
  }
  if (input.name === "confirm") {
    const message = input.value && input.value !== registerForm.elements.password.value ? "Las contraseñas no coinciden." : "";
    setFieldError(input, message);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback(registerForm);
  const identityField = registerForm.elements.identity;
  const passwordField = registerForm.elements.password;
  const confirmField = registerForm.elements.confirm;
  const cedula = normalizeCedula(identityField.value);
  const identityError = validateIdentityInput(identityField.value);
  if (identityError) {
    setFieldError(identityField, identityError);
    showFeedback(registerForm, identityError);
    identityField.focus();
    return;
  }
  if (accounts.has(cedula)) {
    setFieldError(identityField, "Ya existe una cuenta de demostración con esa cédula.");
    showFeedback(registerForm, "Ya existe una cuenta de demostración con esa cédula. Inicia sesión.");
    return;
  }

  const passwordError = validatePasswordStrength(passwordField.value);
  if (passwordError) {
    setFieldError(passwordField, passwordError);
    showFeedback(registerForm, passwordError);
    passwordField.focus();
    return;
  }
  if (!confirmField.value) {
    setFieldError(confirmField, "Debes confirmar la contraseña.");
    showFeedback(registerForm, "Debes confirmar la contraseña.");
    confirmField.focus();
    return;
  }
  if (passwordField.value !== confirmField.value) {
    setFieldError(confirmField, "Las contraseñas no coinciden.");
    showFeedback(registerForm, "Las contraseñas no coinciden.");
    confirmField.focus();
    return;
  }

  clearFieldError(identityField);
  clearFieldError(passwordField);
  clearFieldError(confirmField);

  const submitButton = registerForm.querySelector("[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Creando cuenta…";
  try {
    if (!window.crypto?.getRandomValues) {
      throw new Error("La autenticación de demostración requiere un navegador compatible y un origen seguro (HTTPS o localhost).");
    }
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const verifier = await deriveVerifier(passwordField.value, salt);
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
