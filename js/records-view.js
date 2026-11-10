import { formatDate, getSummary, records, statusClasses } from "./data.js";

const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("status-filter");
const tableBody = document.getElementById("records-body");

function renderSummary() {
  const summary = getSummary();
  document.getElementById("total-count").textContent = String(summary.total);
  const upcomingCount = document.getElementById("upcoming-count");
  upcomingCount.firstChild.textContent = String(summary.upcoming);
  upcomingCount.classList.toggle("attention", summary.upcoming > 0);
  document.getElementById("pending-count").textContent = String(summary.pending);
}

function createRecordRow(record) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="person-cell">
      <button class="person-button" type="button">
        <span class="person-name"></span>
        <span class="person-id"></span>
      </button>
    </td>
    <td class="unit-cell" data-label="Estación"><span class="unit-name"></span></td>
    <td class="date-cell" data-label="Última evaluación"></td>
    <td class="date-cell" data-label="Próximo control"></td>
    <td class="status-cell"><span class="status"></span></td>
    <td class="action-cell">
      <button class="row-action" type="button">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4.2 10s2.1-4 5.8-4 5.8 4 5.8 4-2.1 4-5.8 4-5.8-4-5.8-4Z" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="1.7" stroke="currentColor" stroke-width="1.4"/></svg>
      </button>
    </td>`;

  row.querySelector(".person-button").setAttribute("data-record-id", record.id);
  row.querySelector(".row-action").setAttribute("data-record-id", record.id);
  row.querySelector(".row-action").setAttribute("aria-label", `Ver ficha de ${record.name}`);
  row.querySelector(".person-name").textContent = record.name;
  row.querySelector(".person-id").textContent = record.id;
  row.querySelector(".unit-name").textContent = record.station;
  row.querySelectorAll(".date-cell")[0].textContent = formatDate(record.lastExam);
  row.querySelectorAll(".date-cell")[1].textContent = formatDate(record.nextExam);

  const status = row.querySelector(".status");
  status.classList.add(statusClasses[record.status]);
  status.textContent = record.status;

  return row;
}

export function renderRecords() {
  const query = searchInput.value.trim().toLocaleLowerCase("es");
  const selectedStatus = statusFilter.value;
  const filtered = records.filter((record) => {
    const matchesQuery = `${record.name} ${record.id} ${record.station}`.toLocaleLowerCase("es").includes(query);
    return matchesQuery && (selectedStatus === "all" || record.status === selectedStatus);
  });

  tableBody.replaceChildren();
  if (filtered.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = "No hay fichas que coincidan con esta búsqueda.";
    row.append(cell);
    tableBody.append(row);
  } else {
    filtered.forEach((record) => tableBody.append(createRecordRow(record)));
  }

  const noun = filtered.length === 1 ? "ficha" : "fichas";
  document.getElementById("results-count").textContent = `${filtered.length} ${noun}`;
  renderSummary();
}
