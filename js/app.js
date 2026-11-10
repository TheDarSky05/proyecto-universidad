import { addRecord, isDuplicateId, records } from "./data.js";
import { bindDialogDismissal, openNewRecordDialog, openRecordDialog, showToast } from "./dialogs.js";
import { renderRecords } from "./records-view.js";

const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("status-filter");
const tableBody = document.getElementById("records-body");
const sidebar = document.getElementById("sidebar");
const menuOpen = document.getElementById("menu-open");
const menuClose = document.getElementById("sidebar-close");
const menuBackdrop = document.getElementById("sidebar-backdrop");

function setMenuOpen(open) {
  const isMobile = window.matchMedia("(max-width: 1050px)").matches;
  sidebar.classList.toggle("is-open", open);
  menuOpen.setAttribute("aria-expanded", String(isMobile && open));
  menuOpen.setAttribute("aria-label", isMobile && open ? "Cerrar menú" : "Abrir menú");
  menuClose.hidden = !isMobile || !open;
  menuBackdrop.hidden = !isMobile || !open;
  sidebar.inert = isMobile && !open;
  document.querySelector(".main").inert = isMobile && open;
  if (isMobile) {
    sidebar.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  } else {
    sidebar.removeAttribute("aria-hidden");
    document.body.style.overflow = "";
  }
  if (open && isMobile) menuClose.focus();
  else if (isMobile) menuOpen.focus();
}

function syncMenuForViewport() {
  const isMobile = window.matchMedia("(max-width: 1050px)").matches;
  const isOpen = isMobile && sidebar.classList.contains("is-open");

  menuClose.hidden = !isOpen;
  menuBackdrop.hidden = !isOpen;
  sidebar.inert = isMobile && !isOpen;
  document.querySelector(".main").inert = isOpen;
  menuOpen.setAttribute("aria-expanded", String(isOpen));
  menuOpen.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");

  if (isMobile) sidebar.setAttribute("aria-hidden", String(!isOpen));
  else {
    sidebar.classList.remove("is-open");
    sidebar.removeAttribute("aria-hidden");
  }
  if (!isOpen) document.body.style.overflow = "";
}

function initialize() {
  bindDialogDismissal();
  renderRecords();

  searchInput.addEventListener("input", renderRecords);
  statusFilter.addEventListener("change", renderRecords);
  document.getElementById("new-record").addEventListener("click", () => {
    openNewRecordDialog((record) => {
      if (!addRecord(record)) return false;
      searchInput.value = "";
      statusFilter.value = "all";
      renderRecords();
      showToast("Registro agregado en memoria. Se perderá al cerrar o recargar la página.");
      return true;
    }, isDuplicateId);
  });

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-record-id]");
    if (!button) return;
    const record = records.find((item) => item.id === button.dataset.recordId);
    if (record) openRecordDialog(record);
  });

  document.querySelectorAll("[data-coming-soon]").forEach((button) => {
    button.addEventListener("click", () => showToast(`${button.dataset.comingSoon}: disponible en una próxima etapa.`));
  });

  document.getElementById("nav-records").addEventListener("click", () => {
    document.getElementById("records-screen").hidden = false;
    document.getElementById("templates-screen").hidden = true;
    document.getElementById("nav-records").setAttribute("aria-current", "page");
    document.getElementById("nav-templates").removeAttribute("aria-current");
    document.getElementById("mobile-title").textContent = "Fichas clínicas";
  });

  menuOpen.addEventListener("click", () => setMenuOpen(true));
  menuClose.addEventListener("click", () => setMenuOpen(false));
  menuBackdrop.addEventListener("click", () => setMenuOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("is-open")) setMenuOpen(false);
  });
  window.addEventListener("resize", syncMenuForViewport);
  sidebar.addEventListener("click", (event) => {
    if (event.target.closest(".nav-link, .profile-button, .workspace-switcher")) {
      if (window.matchMedia("(max-width: 1050px)").matches) setMenuOpen(false);
    }
  });

  document.getElementById("filter-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const visible = statusFilter.classList.toggle("is-visible");
    button.setAttribute("aria-expanded", String(visible));
    if (visible) statusFilter.focus();
  });
}

initialize();
syncMenuForViewport();
