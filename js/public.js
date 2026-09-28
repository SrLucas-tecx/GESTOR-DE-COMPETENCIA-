const db = load(),
  view = document.getElementById("view");
const table = (head, rows) =>
  `<div class="wrap"><table><thead><tr>${head.map((h, i) => `<th class="${i > 1 ? "n" : ""}">${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
const standRows = (st) =>
  st.map(
    (s, i) =>
      `<tr class="${i ? "" : "top1"}"><td>${i + 1}</td><td><a href="#equipo/${s.team.id}">${esc(s.team.name)}</a></td><td class="n">${s.matches}</td><td class="n">${s.kills}</td><td class="n">${s.posPts}</td><td class="n">${s.pen ? "-" + s.pen : 0}</td><td class="n"><b>${s.total}</b></td></tr>`,
  );
const STH = [
  "Pos.",
  "Equipo",
  "Partidas",
  "Eliminaciones",
  "Puntos de posición",
  "Sanciones",
  "Total",
];
const approved = () => db.teams.filter((t) => t.status === "aprobado");
const pages = {
  inicio: () =>
    `<section class="hero"><h1>5 jornadas.<br>Un solo campeón.</h1><p>Cada semana, varias partidas. Suman la posición y las eliminaciones de tu equipo.</p><a class="btn" href="#clasificacion">Ver clasificación</a></section><h2>Top 3</h2>${table(STH, standRows(standings(db).slice(0, 3)))}`,
  equipos: () =>
    `<h2>Equipos participantes</h2><div class="grid">${
      approved()
        .map(
          (t) =>
            `<a class="card" href="#equipo/${t.id}"><h3>${esc(t.name)}</h3><span class="tag">${esc(t.tag)}</span> <span class="muted">${t.players.length} jugadores</span></a>`,
        )
        .join("") || '<p class="muted">Aún no hay equipos aprobados.</p>'
    }</div>`,
  calendario: () =>
    `<h2>Calendario</h2>${db.rounds.map((r) => `<div class="card"><h3>${esc(r.name)}</h3><span class="muted">${esc(r.date)}</span> · ${r.matches.length} partidas jugadas</div>`).join("")}`,
  clasificacion: () =>
    `<h2>Clasificación general</h2>${table(STH, standRows(standings(db)))}`,
  resultados: () =>
    `<h2>Resultados por jornada</h2>${db.rounds.map((r) => `<h3>${esc(r.name)}</h3>${r.matches.length ? table(STH, standRows(standings(db, [r.id]))) : '<p class="muted">Sin resultados todavía.</p>'}`).join("")}`,
  reglamento: () =>
    `<h2>Reglamento</h2><div class="card"><p style="white-space:pre-line">${esc(db.rules)}</p></div><h3>Puntos por posición</h3><p>${Object.entries(
      CONFIG.placement,
    )
      .map(([p, v]) => `${p}º: ${v}`)
      .join(" · ")} · Eliminación: ${CONFIG.killPoints}</p>`,
  equipo: (id) => {
    const t = db.teams.find((x) => x.id === id);
    if (!t) return "<p>Equipo no encontrado.</p>";
    const s = standings(db).findIndex((x) => x.team.id === id);
    const st = standings(db)[s];
    return `<h2>${esc(t.name)}</h2><p>${st ? `Lugar ${s + 1} con ${st.total} puntos, ${st.kills} eliminaciones.` : "Equipo pendiente de aprobación."}</p><div class="card"><h3>Jugadores</h3>${t.players.map((p) => `<div>${esc(p.nick)}</div>`).join("") || '<span class="muted">Sin jugadores.</span>'}</div>`;
  },
};
function route() {
  const [p, arg] = (location.hash.slice(1) || "inicio").split("/");
  view.innerHTML = (pages[p] || pages.inicio)(arg);
  document
    .querySelectorAll("#nav a")
    .forEach((a) => a.classList.toggle("on", a.hash === "#" + p));
}
addEventListener("hashchange", route);
route();
