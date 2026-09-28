// Capa de datos. Hoy usa localStorage; al agregar el backend solo se reemplazan load() y save() por llamadas a la API.
const KEY = "torneo_db_v1";
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
function seed() {
  const names = ["Los Lobos", "Vortex", "Nova Squad", "Titanes", "Sombras", "Kraken"];
  const teams = names.map((n, i) => ({
    id: "t" + i,
    name: n,
    tag: n.slice(0, 3).toUpperCase(),
    status: i < 5 ? "aprobado" : "pendiente",
    players: [1, 2, 3, 4].map((k) => ({ id: uid(), nick: n.split(" ")[0] + k })),
  }));
  const rounds = [1, 2, 3, 4, 5].map((i) => ({
    id: "r" + i,
    name: "Jornada " + i,
    date: "2026-10-" + String(4 + 7 * (i - 1)).padStart(2, "0"),
    matches: [],
  }));
  return {
    teams,
    rounds,
    penalties: [],
    log: [],
    rules:
      "1. Equipos de 4 jugadores.\n2. 5 jornadas, una por semana, varias partidas cada una.\n3. Puntos por posición + 1 punto por eliminación.\n4. Las sanciones restan puntos y quedan registradas.",
  };
}
function load() {
  try {
    const d = localStorage.getItem(KEY);
    if (d) return JSON.parse(d);
  } catch (e) {}
  return seed();
}
function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {}
}
function logAction(db, text) {
  db.log.unshift({ at: new Date().toLocaleString("es-MX"), text });
}
