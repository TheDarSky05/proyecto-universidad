import { showToast } from "./dialogs.js";

const templatesScreen = document.getElementById("templates-screen");
const recordsScreen = document.getElementById("records-screen");
const mobileTitle = document.getElementById("mobile-title");
const templateNav = document.getElementById("nav-templates");
const recordsNav = document.getElementById("nav-records");
const drafts = new Map();

const templates = {
  worker: {
    title: "Ficha médica del trabajador",
    description: "Identificación, datos personales y antecedentes patológicos.",
    statusKey: "Ficha médica",
    form: `
      <fieldset class="template-fieldset">
        <legend>Datos del ingreso</legend>
        <div class="template-fields template-fields--two">
          ${field("Fecha de ingreso", "date", "fechaIngreso")}
          ${field("Ficha de salud N.º", "text", "numeroFicha")}
          ${field("Dependencia", "text", "dependencia")}
          ${field("Cargo", "text", "cargo")}
          ${field("Supervisor inmediato", "text", "supervisor", "wide")}
        </div>
      </fieldset>
      <fieldset class="template-fieldset">
        <legend>Datos personales</legend>
        <div class="template-fields template-fields--two">
          ${field("Nombre y apellido", "text", "nombre", "wide", true)}
          ${field("Cédula de identidad", "text", "cedula")}
          ${field("Edad", "number", "edad", null, false, 'min="0" max="120"')}
          <div class="template-field"><span class="template-label">Sexo</span><div class="template-radio-group"><label><input type="radio" name="sexo" value="F"> F</label><label><input type="radio" name="sexo" value="M"> M</label></div></div>
          ${field("Estado civil", "text", "estadoCivil")}
          ${field("Fecha de nacimiento", "date", "fechaNacimiento")}
          ${field("Grupo sanguíneo", "text", "grupoSanguineo")}
          ${field("Talla (cm)", "number", "talla", null, false, 'min="0" step="0.1"')}
          ${field("Peso (kg)", "number", "peso", null, false, 'min="0" step="0.1"')}
          ${field("Lugar de nacimiento", "text", "lugarNacimiento")}
          ${field("Teléfono", "tel", "telefono")}
          ${field("Dirección de habitación", "text", "direccion", "wide")}
          ${field("Grado de instrucción", "text", "instruccion", "wide")}
        </div>
      </fieldset>
      <fieldset class="template-fieldset">
        <legend>Antecedentes patológicos</legend>
        ${repeatableTable("history", ["Fecha", "Diagnóstico", "Tratamiento", "Observación"], 4)}
      </fieldset>`
  },
  vaccines: {
    title: "Inmunizaciones y valoración física",
    description: "Control de dosis, signos vitales y observaciones médicas.",
    statusKey: "Inmunizaciones",
    form: `
      <fieldset class="template-fieldset">
        <legend>Inmunizaciones</legend>
        <div class="template-table-scroll"><table class="template-table template-vaccines">
          <thead><tr><th scope="col">Vacuna</th><th scope="col">1.ª dosis</th><th scope="col">2.ª dosis</th><th scope="col">3.ª dosis</th><th scope="col">Refuerzo</th><th scope="col">Refuerzo</th><th scope="col">Observación</th></tr></thead>
          <tbody>${["COVID-19", "Fiebre amarilla", "Toxoide", "Hepatitis", "Sarampión"].map((vaccine, index) => `<tr><th scope="row">${vaccine}</th>${["Primera dosis", "Segunda dosis", "Tercera dosis", "Primer refuerzo", "Segundo refuerzo"].map((label, dose) => `<td><input id="vaccine-${index}-${dose}" name="vacuna-${index}-${dose}" type="date" aria-label="${label} · ${vaccine}"></td>`).join("")}<td>${textInput(`Observación · ${vaccine}`, `vacuna-${index}-observacion`)}</td></tr>`).join("")}</tbody>
        </table></div>
      </fieldset>
      <fieldset class="template-fieldset">
        <legend>Valoración física</legend>
        <div class="template-fields template-fields--four">
          ${field("Temperatura (°C)", "number", "temperatura", null, false, 'step="0.1"')}
          ${field("F.C. (lpm)", "number", "frecuenciaCardiaca", null, false, 'min="0"')}
          ${field("F.R. (rpm)", "number", "frecuenciaRespiratoria", null, false, 'min="0"')}
          ${field("T.A. (mmHg)", "text", "presionArterial")}
        </div>
      </fieldset>
      <fieldset class="template-fieldset">
        <legend>Observaciones médicas</legend>
        <label class="template-field"><span class="template-label">Detalles y hallazgos del examen físico / observaciones clínicas</span><textarea name="observaciones" rows="8"></textarea></label>
      </fieldset>`
  },
  leave: {
    title: "Control de reposo médico",
    description: "Seguimiento de reposos, diagnósticos y duración indicada.",
    statusKey: "Control de reposo",
    form: `
      <fieldset class="template-fieldset">
        <legend>Reposos médicos</legend>
        ${repeatableTable("leave", ["Fecha", "Diagnóstico", "Duración", "Médico"], 5)}
      </fieldset>`
  }
};

function field(label, type, name, width, required = false, extra = "") {
  const classes = ["template-field", width === "wide" ? "template-field--wide" : ""].filter(Boolean).join(" ");
  return `<label class="${classes}"><span class="template-label">${label}</span><input name="${name}" type="${type}" ${required ? "required" : ""} ${extra}></label>`;
}

function textInput(label, name) {
  return `<label><span class="sr-only">${label}</span><input name="${name}" type="text" aria-label="${label}"></label>`;
}

function repeatableTable(group, columns, initialRows) {
  return `<div class="template-table-scroll"><table class="template-table">
    <thead><tr>${columns.map((column) => `<th scope="col">${column}</th>`).join("")}<th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
    <tbody data-repeatable="${group}">${Array.from({ length: initialRows }, (_, index) => repeatableRow(group, columns, index)).join("")}</tbody>
  </table></div>
  <button class="button button-secondary template-add-row" type="button" data-add-row="${group}">Agregar fila</button>`;
}

function repeatableRow(group, columns, index) {
  const cells = columns.map((column, columnIndex) => {
    const type = columnIndex === 0 ? "date" : "text";
    const name = `${group}-${index}-${columnIndex}`;
    return `<td><input id="${name}" name="${name}" type="${type}" aria-label="${column} · fila ${index + 1}"></td>`;
  }).join("");
  return `<tr>${cells}<td class="template-row-action"><button class="template-remove-row" type="button" data-remove-row aria-label="Eliminar fila ${index + 1}"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L14 6M8.5 9v4M11.5 9v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td></tr>`;
}

function showTemplateList() {
  mobileTitle.textContent = "Plantillas médicas";
  templatesScreen.innerHTML = `
    <header class="page-heading">
      <div><h1 id="templates-heading">Plantillas médicas</h1><p class="page-description">Elige un formato para completar, guardar en esta sesión o imprimir.</p></div>
    </header>
    <div class="prototype-notice" role="note"><span class="notice-mark" aria-hidden="true"></span><span><strong>Prototipo de demostración.</strong> No ingreses datos personales ni clínicos reales. Los borradores solo permanecen en la memoria de esta página.</span></div>
    <section class="template-list" aria-label="Formatos disponibles">
      ${Object.entries(templates).map(([id, template]) => `<button class="template-choice" type="button" data-open-template="${id}">
        <span class="template-choice-copy"><strong>${template.title}</strong><span>${template.description}</span></span>
        <span class="template-choice-state" data-template-status="${id}">${drafts.has(id) ? "Borrador en esta sesión" : "Sin completar"}</span>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7.5 4 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`).join("")}
    </section>`;
}

function openTemplate(id) {
  const template = templates[id];
  if (!template) return;
  const draft = drafts.get(id);
  templatesScreen.innerHTML = `
    <header class="page-heading template-page-heading">
      <div><h1 id="templates-heading">${template.title}</h1><p class="page-description">${template.description}</p></div>
      <button class="button button-secondary template-print" type="button" data-print>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 7V3.5h8V7M6 14H4a1.5 1.5 0 0 1-1.5-1.5v-4A1.5 1.5 0 0 1 4 7h12a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 16 14h-2M6 11h8v5.5H6z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        Imprimir / Guardar PDF
      </button>
    </header>
    <div class="template-toolbar"><button class="template-back" type="button" data-template-back><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m12.5 4-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Volver a plantillas</button><span>Los cambios se conservan solo mientras esta página permanezca abierta.</span></div>
    <form class="medical-form" data-template-form="${id}">
      ${template.form}
      <div class="template-form-actions"><button class="button button-secondary" type="button" data-template-back>Cancelar</button><button class="button button-primary" type="submit">Guardar borrador</button></div>
    </form>`;
  const repeatable = templatesScreen.querySelector("[data-repeatable]");
  if (repeatable && draft && Number(draft.__rowCount) > repeatable.rows.length) {
    const group = repeatable.dataset.repeatable;
    const columns = group === "history" ? ["Fecha", "Diagnóstico", "Tratamiento", "Observación"] : ["Fecha", "Diagnóstico", "Duración", "Médico"];
    while (repeatable.rows.length < Number(draft.__rowCount)) {
      repeatable.insertAdjacentHTML("beforeend", repeatableRow(group, columns, repeatable.rows.length));
    }
  } else if (repeatable && draft && Number(draft.__rowCount) < repeatable.rows.length) {
    while (repeatable.rows.length > Math.max(Number(draft.__rowCount), 1)) repeatable.deleteRow(-1);
  }
  if (draft) {
    for (const [name, value] of Object.entries(draft)) {
      if (name.startsWith("__")) continue;
      const controls = templatesScreen.querySelectorAll(`[name="${CSS.escape(name)}"]`);
      controls.forEach((control) => {
        if (control.type === "radio") control.checked = control.value === value;
        else control.value = value;
      });
    }
  }
  templatesScreen.querySelectorAll(`[data-add-row]`).forEach((button) => {
    button.addEventListener("click", () => {
      const tbody = templatesScreen.querySelector(`[data-repeatable="${button.dataset.addRow}"]`);
      const index = tbody.rows.length;
      const columns = button.dataset.addRow === "history" ? ["Fecha", "Diagnóstico", "Tratamiento", "Observación"] : ["Fecha", "Diagnóstico", "Duración", "Médico"];
      tbody.insertAdjacentHTML("beforeend", repeatableRow(button.dataset.addRow, columns, index));
    });
  });
  const form = templatesScreen.querySelector("[data-template-form]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const repeatable = form.querySelector("[data-repeatable]");
    if (repeatable) values.__rowCount = repeatable.rows.length;
    drafts.set(id, values);
    showToast("Borrador guardado en la memoria de esta sesión.");
    showTemplateList();
  }, { once: true });
  mobileTitle.textContent = template.statusKey;
}

function handleTemplateClick(event) {
  const removeButton = event.target.closest("[data-remove-row]");
  if (removeButton) {
    const tbody = removeButton.closest("tbody");
    if (tbody.rows.length > 1) removeButton.closest("tr").remove();
    return;
  }
  if (event.target.closest("[data-template-back]")) showTemplateList();
  if (event.target.closest("[data-print]")) window.print();
}

function showTemplatesScreen() {
  recordsScreen.hidden = true;
  templatesScreen.hidden = false;
  templateNav.setAttribute("aria-current", "page");
  recordsNav.removeAttribute("aria-current");
  mobileTitle.textContent = "Plantillas médicas";
  showTemplateList();
}

templateNav.addEventListener("click", showTemplatesScreen);
templatesScreen.addEventListener("click", handleTemplateClick);
templatesScreen.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-open-template]");
  if (choice) openTemplate(choice.dataset.openTemplate);
});
