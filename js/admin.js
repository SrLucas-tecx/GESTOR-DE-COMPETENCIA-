let db = load(),
  tab = "equipos",
  msg = "";
const panel = document.getElementById("panel"),
  tabsEl = document.getElementById("tabs");
const TABS = {
  equipos: "Equipos",
  jugadores: "Jugadores",
  jornadas: "Jornadas",
  resultados: "Resultados",
  sanciones: "Sanciones",
  historial: "Historial",
};
const commit = (t) => {
  logAction(db, t);
  save(db);
  render();
};
const opts = (a, f) =>
  a.map((x) => `<option value="${x.id}">${esc(f(x))}</option>`).join("");
const v = (id) => document.getElementById(id).value;
const views = {
  equipos:
    () => `<h2>Equipos</h2><form class="row" onsubmit="addTeam(event)"><label>Nombre<input id="tn" required></label><label>Tag<input id="tt" maxlength="4" required></label><button class="btn">Registrar equipo</button></form>
  ${db.teams.map((t) => `<div class="card row"><b>${esc(t.name)}</b><span class="tag ${t.status === "aprobado" ? "ok" : ""}">${t.status}</span>${t.status !== "aprobado" ? `<button class="btn" onclick="approve('${t.id}')">Aprobar</button>` : ""}</div>`).join("")}`,
  jugadores:
    () => `<h2>Jugadores por equipo</h2><form class="row" onsubmit="addPlayer(event)"><label>Equipo<select id="pt">${opts(db.teams, (t) => t.name)}</select></label><label>Nick<input id="pn" required></label><button class="btn">Agregar jugador</button></form>
  ${db.teams.map((t) => `<div class="card"><b>${esc(t.name)}</b>: ${t.players.map((p) => esc(p.nick)).join(", ") || '<span class="muted">sin jugadores</span>'}</div>`).join("")}`,
  jornadas:
    () => `<h2>Jornadas</h2>${db.rounds.length < CONFIG.totalRounds ? `<button class="btn" onclick="addRound()">Crear jornada ${db.rounds.length + 1}</button>` : '<p class="muted">Ya están creadas las 5 jornadas.</p>'}
  ${db.rounds.map((r) => `<div class="card row"><b>${esc(r.name)}</b><label>Fecha<input type="date" value="${r.date}" onchange="setDate('${r.id}',this.value)"></label><span class="muted">${r.matches.length} partidas</span></div>`).join("")}`,
  resultados: () => {
    const ts = db.teams.filter((t) => t.status === "aprobado");
    return `<h2>Registrar partida</h2><p class="err">${msg}</p><label>Jornada<select id="rr">${opts(db.rounds, (r) => r.name)}</select></label>
  <div class="wrap"><table><thead><tr><th>Equipo</th><th>Posición</th><th>Eliminaciones</th></tr></thead><tbody>${ts.map((t) => `<tr><td>${esc(t.name)}</td><td><input type="number" min="1" data-pos="${t.id}"></td><td><input type="number" min="0" value="0" data-kills="${t.id}"></td></tr>`).join("")}</tbody></table></div>
  <p><button class="btn" onclick="addMatch()">Guardar partida y calcular puntos</button></p>
  <h3>Clasificación acumulada</h3>${standings(db)
    .map(
      (s, i) =>
        `<div>${i + 1}. ${esc(s.team.name)}: <b>${s.total}</b> pts (${s.kills} elim.)</div>`,
    )
    .join("")}`;
  },
  sanciones:
    () => `<h2>Sanciones y descuentos</h2><form class="row" onsubmit="addPen(event)"><label>Equipo<select id="st">${opts(db.teams, (t) => t.name)}</select></label><label>Jornada<select id="sr">${opts(db.rounds, (r) => r.name)}</select></label><label>Puntos a restar<input id="sp" type="number" min="1" required></label><label>Motivo<input id="sm" required></label><button class="btn">Aplicar</button></form>
  ${db.penalties.map((p) => `<div class="card">-${p.points} a ${esc(db.teams.find((t) => t.id === p.teamId)?.name)}: ${esc(p.reason)}</div>`).join("")}`,
  historial:
    () => `<h2>Historial</h2>${db.log.map((l) => `<div class="card"><span class="muted">${esc(l.at)}</span> ${esc(l.text)}</div>`).join("") || '<p class="muted">Sin movimientos todavía.</p>'}
  <h3>Respaldo de datos</h3>
  <p class="muted">Los datos se guardan en este navegador. Descarga un respaldo para no perderlos o para abrirlos en otro equipo.</p>
  <div class="row">
    <button class="btn" onclick="exportDb()">Descargar respaldo</button>
    <label>Cargar respaldo<input type="file" accept=".json" onchange="importDb(this.files[0])"></label>
  </div>
  <button class="ghost" onclick="if(confirm('¿Borrar todos los datos y volver a los de ejemplo?')){localStorage.removeItem(KEY);db=seed();render()}">Restablecer datos de ejemplo</button>`,
};
function addTeam(e) {
  e.preventDefault();
  db.teams.push({
    id: uid(),
    name: v("tn"),
    tag: v("tt").toUpperCase(),
    status: "pendiente",
    players: [],
  });
  commit("Equipo registrado: " + v("tn"));
}
function approve(id) {
  const t = db.teams.find((x) => x.id === id);
  t.status = "aprobado";
  commit("Equipo aprobado: " + t.name);
}
function addPlayer(e) {
  e.preventDefault();
  const t = db.teams.find((x) => x.id === v("pt"));
  t.players.push({ id: uid(), nick: v("pn") });
  commit(`Jugador ${v("pn")} agregado a ${t.name}`);
}
function addRound() {
  const n = db.rounds.length + 1;
  db.rounds.push({ id: "r" + n, name: "Jornada " + n, date: "", matches: [] });
  commit("Jornada creada: " + n);
}
function setDate(id, d) {
  db.rounds.find((r) => r.id === id).date = d;
  save(db);
}
function addMatch() {
  const r = db.rounds.find((x) => x.id === v("rr"));
  const results = [];
  document.querySelectorAll("[data-pos]").forEach((i) => {
    if (i.value)
      results.push({
        teamId: i.dataset.pos,
        pos: +i.value,
        kills:
          +document.querySelector(`[data-kills="${i.dataset.pos}"]`).value || 0,
      });
  });
  const ps = results.map((x) => x.pos);
  if (!results.length) {
    msg = "Captura la posición de al menos un equipo.";
    return render();
  }
  if (new Set(ps).size !== ps.length) {
    msg = "Hay posiciones repetidas.";
    return render();
  }
  msg = "";
  r.matches.push({ id: uid(), results });
  commit(`Partida ${r.matches.length} registrada en ${r.name}`);
}
function addPen(e) {
  e.preventDefault();
  db.penalties.push({
    teamId: v("st"),
    roundId: v("sr"),
    points: +v("sp"),
    reason: v("sm"),
  });
  commit(`Sanción de ${v("sp")} pts: ${v("sm")}`);
}
function render() {
  tabsEl.innerHTML = Object.entries(TABS)
    .map(
      ([k, l]) =>
        `<button class="${k === tab ? "on" : ""}" onclick="tab='${k}';msg='';render()">${l}</button>`,
    )
    .join("");
  panel.innerHTML = views[tab]();
}
render();

// ---------- Respaldo local ----------
function exportDb() {
  const blob = new Blob([JSON.stringify(db, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download =
    "torneo-respaldo-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importDb(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.teams || !data.rounds || !data.penalties)
        throw new Error("formato");
      if (!confirm("Esto reemplaza los datos actuales. ¿Continuar?")) return;
      db = data;
      commit("Respaldo cargado desde archivo");
    } catch (e) {
      alert("El archivo no es un respaldo válido del torneo.");
    }
  };
  reader.readAsText(file);
}
