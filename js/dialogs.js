import { formatDate } from "./data.js";

const modalRoot = document.getElementById("modal-root");
const toast = document.getElementById("toast");
let toastTimer;
let toastHideTimer;
let returnFocus = null;

export function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  window.clearTimeout(toastHideTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    toastHideTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 180);
  }, 3200);
}

function closeDialog() {
  modalRoot.replaceChildren();
  document.body.style.overflow = "";
  if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
}

function openDialog(content, title) {
  returnFocus = document.activeElement;
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-backdrop>
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header class="dialog-header">
          <div><h2 id="dialog-title"></h2><p></p></div>
          <button class="icon-button" type="button" data-close aria-label="Cerrar ventana">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </header>
        <div class="dialog-body"></div>
      </section>
    </div>`;

  const backdrop = modalRoot.querySelector("[data-backdrop]");
  backdrop.querySelector("#dialog-title").textContent = title;
  backdrop.querySelector(".dialog-header p").textContent = "Demostración temporal · no uses datos reales";
  backdrop.querySelector(".dialog-body").append(content);
  document.body.style.overflow = "hidden";
  backdrop.querySelector("[data-close]").focus();
}

function setFieldError(field, message) {
  if (!field) return;
  const hasError = Boolean(message);
  field.setAttribute("aria-invalid", String(hasError));
  field.setCustomValidity(hasError ? message : "");
}

function getDateValue(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateRecordInput(form) {
  const fields = {
    name: form.querySelector("[name='name']"),
    id: form.querySelector("[name='id']"),
    station: form.querySelector("[name='station']"),
    lastExam: form.querySelector("[name='lastExam']"),
    nextExam: form.querySelector("[name='nextExam']")
  };

  const name = String(fields.name.value).trim();
  if (name.length < 2) {
    setFieldError(fields.name, "El nombre debe tener al menos 2 caracteres.");
    return false;
  }
  setFieldError(fields.name, "");

  const id = String(fields.id.value).trim();
  if (!/^[A-Za-z]{1,4}-?\d{3,12}$/.test(id)) {
    setFieldError(fields.id, "Usa un código con letras y números, por ejemplo B-1042.");
    return false;
  }
  setFieldError(fields.id, "");

  const station = String(fields.station.value).trim();
  if (station.length < 3) {
    setFieldError(fields.station, "La estación debe tener al menos 3 caracteres.");
    return false;
  }
  setFieldError(fields.station, "");

  const lastExam = getDateValue(fields.lastExam.value);
  if (!lastExam) {
    setFieldError(fields.lastExam, "Selecciona la fecha de la última evaluación.");
    return false;
  }
  setFieldError(fields.lastExam, "");

  const nextExam = getDateValue(fields.nextExam.value);
  if (fields.nextExam.value && nextExam && nextExam < lastExam) {
    setFieldError(fields.nextExam, "El próximo control no puede ser anterior a la última evaluación.");
    return false;
  }
  setFieldError(fields.nextExam, "");

  return true;
}

export function openRecordDialog(record) {
  const content = document.createElement("div");
  content.innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><span>Nombre</span><strong data-name></strong></div>
      <div class="detail-item"><span>Código de personal</span><strong data-id></strong></div>
      <div class="detail-item"><span>Estación</span><strong data-station></strong></div>
      <div class="detail-item"><span>Aptitud ocupacional</span><strong data-status></strong></div>
      <div class="detail-item"><span>Última evaluación</span><strong data-last></strong></div>
      <div class="detail-item"><span>Próximo control</span><strong data-next></strong></div>
    </div>
    <div class="detail-note">Vista de referencia. El historial clínico y los documentos médicos no forman parte de este prototipo.</div>`;
  content.querySelector("[data-name]").textContent = record.name;
  content.querySelector("[data-id]").textContent = record.id;
  content.querySelector("[data-station]").textContent = record.station;
  content.querySelector("[data-status]").textContent = record.status;
  content.querySelector("[data-last]").textContent = formatDate(record.lastExam);
  content.querySelector("[data-next]").textContent = formatDate(record.nextExam);
  openDialog(content, "Ficha de personal");
}

export function openNewRecordDialog(onSave, isDuplicate) {
  const form = document.createElement("form");
  form.innerHTML = `
    <div class="form-grid">
      <div class="form-field form-field--wide"><label for="record-name">Nombre del personal</label><input id="record-name" name="name" autocomplete="off" required maxlength="80"></div>
      <div class="form-field"><label for="record-id">Código de personal</label><input id="record-id" name="id" autocomplete="off" required maxlength="24"></div>
      <div class="form-field"><label for="record-station">Estación</label><input id="record-station" name="station" autocomplete="off" required maxlength="60"></div>
      <div class="form-field"><label for="record-last">Última evaluación</label><input id="record-last" name="lastExam" type="date" required></div>
      <div class="form-field"><label for="record-next">Próximo control</label><input id="record-next" name="nextExam" type="date"></div>
      <div class="form-field form-field--wide"><label for="record-status">Aptitud ocupacional</label>
        <select id="record-status" name="status" required>
          <option value="Apto">Apto</option>
          <option value="Control próximo">Control próximo</option>
          <option value="Evaluación pendiente">Evaluación pendiente</option>
          <option value="Restricción temporal">Restricción temporal</option>
        </select>
        <p class="form-help">Solo para mostrar la interfaz. No agregues diagnósticos ni información médica real.</p>
      </div>
    </div>
    <div class="dialog-actions">
      <button class="button button-secondary" type="button" data-cancel>Cancelar</button>
      <button class="button button-primary" type="submit">Agregar a esta sesión</button>
    </div>`;

  openDialog(form, "Nuevo registro");
  form.querySelector("[name='name']").focus();
  form.querySelectorAll("input, select").forEach((field) => {
    ["input", "change"].forEach((eventName) => {
      field.addEventListener(eventName, () => {
        setFieldError(field, "");
        if (field.name === "id") {
          const id = String(field.value).trim();
          if (isDuplicate(id)) {
            setFieldError(field, "Este código ya existe en la lista de demostración.");
          }
        }
        if (field.name === "nextExam") {
          const lastExam = form.querySelector("[name='lastExam']");
          if (field.value && lastExam.value) {
            const nextDate = getDateValue(field.value);
            const lastDate = getDateValue(lastExam.value);
            if (nextDate && lastDate && nextDate < lastDate) {
              setFieldError(field, "El próximo control no puede ser anterior a la última evaluación.");
            }
          }
        }
      });
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateRecordInput(form)) {
      const firstInvalid = form.querySelector("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    const formData = new FormData(form);
    const id = String(formData.get("id")).trim();
    if (isDuplicate(id)) {
      const idField = form.querySelector("[name='id']");
      setFieldError(idField, "Este código ya existe en la lista de demostración.");
      idField.focus();
      return;
    }

    const saved = onSave({
      id,
      name: String(formData.get("name")).trim(),
      station: String(formData.get("station")).trim(),
      lastExam: String(formData.get("lastExam")),
      nextExam: String(formData.get("nextExam")) || null,
      status: String(formData.get("status"))
    });
    if (saved) closeDialog();
  });
}

export function bindDialogDismissal() {
  modalRoot.addEventListener("click", (event) => {
    if (event.target.matches("[data-backdrop]") || event.target.closest("[data-close], [data-cancel]")) closeDialog();
  });

  document.addEventListener("keydown", (event) => {
    if (!modalRoot.childElementCount) return;
    if (event.key === "Escape") closeDialog();
    if (event.key !== "Tab") return;

    const dialog = modalRoot.querySelector(".dialog");
    const focusable = [...dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled])")];
    if (focusable.length === 0) return;
    if (event.shiftKey && document.activeElement === focusable[0]) {
      event.preventDefault();
      focusable[focusable.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
      event.preventDefault();
      focusable[0].focus();
    }
  });
}
