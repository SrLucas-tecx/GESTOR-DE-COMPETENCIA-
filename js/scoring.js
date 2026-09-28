// Reglas de puntuación: único lugar donde se define cómo se calculan los puntos.
const CONFIG = {
  killPoints: 1,
  totalRounds: 5,
  placement: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
};
const placementPts = (pos) => CONFIG.placement[pos] || 0;
function standings(db, roundIds = null, withPenalties = true) {
  const t = {};
  db.teams
    .filter((x) => x.status === "aprobado")
    .forEach((x) => (t[x.id] = { team: x, matches: 0, kills: 0, posPts: 0, pen: 0 }));
  db.rounds
    .filter((r) => !roundIds || roundIds.includes(r.id))
    .forEach((r) =>
      r.matches.forEach((m) =>
        m.results.forEach((e) => {
          const s = t[e.teamId];
          if (!s) return;
          s.matches++;
          s.kills += e.kills;
          s.posPts += placementPts(e.pos);
        }),
      ),
    );
  if (withPenalties)
    db.penalties.forEach((p) => {
      if (t[p.teamId] && (!roundIds || roundIds.includes(p.roundId)))
        t[p.teamId].pen += p.points;
    });
  return Object.values(t)
    .map((s) => ({ ...s, total: s.posPts + s.kills * CONFIG.killPoints - s.pen }))
    .sort((a, b) => b.total - a.total || b.kills - a.kills);
}
