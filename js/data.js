export const records = [
  { id: "B-1042", name: "Camila Rojas", station: "Estación Central", lastExam: "2026-09-18", nextExam: "2026-11-02", status: "Control próximo" },
  { id: "B-1088", name: "Diego Fuentes", station: "Estación Norte", lastExam: "2026-08-14", nextExam: "2026-11-04", status: "Control próximo" },
  { id: "B-1016", name: "Valentina Muñoz", station: "Estación Central", lastExam: "2026-09-25", nextExam: "2027-03-25", status: "Apto" },
  { id: "B-1130", name: "Tomás Herrera", station: "Estación Sur", lastExam: "2026-07-12", nextExam: null, status: "Evaluación pendiente" },
  { id: "B-1104", name: "Javiera Soto", station: "Estación Norte", lastExam: "2026-09-03", nextExam: "2027-03-03", status: "Apto" },
  { id: "B-1071", name: "Matías Pérez", station: "Estación Sur", lastExam: "2026-08-21", nextExam: "2027-02-21", status: "Apto" },
  { id: "B-1152", name: "Antonia Silva", station: "Estación Central", lastExam: "2026-06-11", nextExam: "2026-12-11", status: "Restricción temporal" },
  { id: "B-1029", name: "Benjamín Díaz", station: "Estación Norte", lastExam: "2026-09-29", nextExam: "2027-03-29", status: "Apto" }
];

export const statusClasses = {
  "Apto": "status--fit",
  "Control próximo": "status--due",
  "Evaluación pendiente": "status--pending",
  "Restricción temporal": "status--restricted"
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

export function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(value) {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : "—";
}

export function isDuplicateId(id) {
  return records.some((record) => record.id.toLocaleLowerCase("es") === id.toLocaleLowerCase("es"));
}

export function addRecord(record) {
  if (isDuplicateId(record.id)) return false;
  records.unshift(record);
  return true;
}

export function getSummary() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const weekAhead = new Date(today);
  weekAhead.setUTCDate(weekAhead.getUTCDate() + 7);
  const upcoming = records.filter((record) => {
    const date = parseDate(record.nextExam);
    return date && date >= today && date <= weekAhead;
  }).length;
  const pending = records.filter((record) => record.status === "Evaluación pendiente").length;

  return { total: records.length, upcoming, pending };
}
