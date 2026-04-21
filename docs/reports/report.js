/** Ordered colour palette cycled across phases. */
const PHASE_PALETTE = [
  '#2563eb', '#7c3aed', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#65a30d',
];

/**
 * Escapes a value for safe insertion into HTML attribute or text content.
 * @param {*} s
 * @returns {string}
 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Converts a minimal markdown subset (**bold**, blank-line paragraphs) to HTML.
 * @param {string} text
 * @returns {string}
 */
function mdToHtml(text) {
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return text.split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${p}</p>`)
    .join('\n');
}

/**
 * Formats a duration in minutes as a human-readable string (e.g. "1h 30m").
 * @param {number} minutes
 * @returns {string}
 */
function fmtDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Builds a stable phase → colour mapping from the session list, in first-seen order.
 * @param {object[]} sessions
 * @returns {Record<string, string>}
 */
function phaseColorMap(sessions) {
  const colors = {};
  let i = 0;
  for (const s of sessions) {
    const phase = s.phase || '—';
    if (!(phase in colors)) colors[phase] = PHASE_PALETTE[i++ % PHASE_PALETTE.length];
  }
  return colors;
}

/**
 * Parses a JSONL string into an array of objects.
 * @param {string} text
 * @returns {object[]}
 */
function parseJsonl(text) {
  return text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}

/**
 * Extracts project name and purpose from a project_charter.md string.
 * @param {string} text
 * @returns {{ projectName: string, purpose: string }}
 */
function parseCharter(text) {
  const nameMatch = text.match(/^# Project Charter:\s*(.+)$/m);
  const projectName = nameMatch ? nameMatch[1].trim() : 'Project Report';
  const purposeMatch = text.match(/## Overarching Objective\n\n([\s\S]*?)(?=\n---|\n## )/);
  const purpose = purposeMatch ? purposeMatch[1].trim() : '';
  return { projectName, purpose };
}

/**
 * Parses deliverables.md into a structured array.
 * Each deliverable block must begin with **DEL-N: Name**.
 * @param {string} text
 * @returns {{ id: string, name: string, description: string, issueId: string|null }[]}
 */
function parseDeliverables(text) {
  if (!text.trim()) return [];
  const deliverables = [];

  for (const block of text.trim().split(/\n\n+/)) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const headerMatch = lines[0].match(/^\*\*DEL-(\w+):\s*(.+?)\*\*$/);
    if (!headerMatch) continue;

    const id = `DEL-${headerMatch[1]}`;
    const name = headerMatch[2].trim();
    const descParts = [];
    let issueId = null;

    for (const line of lines.slice(1)) {
      if (line.startsWith('Justification:')) continue;
      if (line.startsWith('Issue:')) {
        const raw = line.slice('Issue:'.length).trim();
        issueId = raw === '[pending]' ? null : raw;
      } else {
        descParts.push(line);
      }
    }

    deliverables.push({ id, name, description: descParts.join(' '), issueId });
  }

  return deliverables;
}

/**
 * Fetches a required text resource; throws if the response is not OK.
 * @param {string} url
 * @returns {Promise<string>}
 */
const fetchRequired = url =>
  fetch(url).then(r => { if (!r.ok) throw new Error(r.statusText); return r.text(); });

/**
 * Fetches all report data from source files in the repo.
 * Paths are resolved relative to the server root, so the server must be
 * started from the repository root (not from the reports/ directory).
 * @returns {Promise<{ projectName: string, purpose: string, sessions: object[],
 *   issues: object[], deliverables: object[] }>}
 *
 * Generate issues.jsonl before serving with: bd export --no-memories -o reports/issues.jsonl
 */
async function loadData() {
  const [jsonlRes, charterRes, deliverablesRes, issuesRes] = await Promise.allSettled([
    fetchRequired('change_and_decision_log.jsonl'),
    fetchRequired('../project_charter.md'),
    fetch('../deliverables.md').then(r => r.ok ? r.text() : ''),
    fetch('issues.jsonl').then(r => r.ok ? r.text().then(parseJsonl) : []),
  ]);

  if (jsonlRes.status === 'rejected') throw new Error(`Could not load session log: ${jsonlRes.reason.message}`);
  if (charterRes.status === 'rejected') throw new Error(`Could not load project charter: ${charterRes.reason.message}`);

  const sessions = parseJsonl(jsonlRes.value);
  const { projectName, purpose } = parseCharter(charterRes.value);
  const deliverables = parseDeliverables(deliverablesRes.status === 'fulfilled' ? deliverablesRes.value : '');
  const issues = issuesRes.status === 'fulfilled' ? issuesRes.value : [];

  return { projectName, purpose, sessions, issues, deliverables };
}

/**
 * Renders the top-level stats row (hours logged, open issues, closed issues).
 * @param {object[]} sessions
 * @param {object[]} issues
 * @returns {string} HTML
 */
function renderStats(sessions, issues) {
  const openCount = issues.filter(i => ['open', 'in_progress'].includes(i.status)).length;
  const closedCount = issues.filter(i => i.status === 'closed').length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const hoursLabel = totalMinutes ? fmtDuration(totalMinutes) : '—';

  const card = (n, label) =>
    `<div class="stat-card"><span class="stat-n">${n}</span><span class="stat-label">${label}</span></div>`;
  const linkedCard = (n, label, href) =>
    `<a href="${href}" class="stat-card-link">${card(n, label)}</a>`;

  return `<div class="stats-row">
    ${card(hoursLabel, 'Hours Logged')}
    ${linkedCard(openCount, 'Open Issues', 'issues.html')}
    ${linkedCard(closedCount, 'Closed Issues', 'issues.html?status=closed')}
  </div>`;
}

/**
 * Renders the current status card from the most recent session entry.
 * @param {object[]} sessions
 * @returns {string} HTML
 */
function renderStatus(sessions) {
  const last = sessions[sessions.length - 1];
  if (!last) return '';

  const phase = last.phase || '—';
  const context = last.context || '';
  const nextFocus = last.next_session_focus || [];

  let rows = '';
  if (phase && phase !== '—') {
    rows += `<div class="status-row"><span class="status-label">Phase</span><span class="status-value">${esc(phase)}</span></div>`;
  }
  if (context) {
    rows += `<div class="status-row"><span class="status-label">Last session</span><span class="status-value">${esc(context)}</span></div>`;
  }
  if (nextFocus.length) {
    const items = nextFocus.map(f => `<li>${esc(f.title)}</li>`).join('');
    rows += `<div class="status-row"><span class="status-label">Next focus</span><span class="status-value"><ol class="focus-list">${items}</ol></span></div>`;
  }

  return rows ? `<div class="status-card">${rows}</div>` : '';
}

/**
 * Renders the deliverables list with live status derived from issues.json.
 * Deliverables without a linked issue are shown as "Not Started".
 * @param {object[]} deliverables
 * @param {object[]} issues
 * @returns {string} HTML
 */
function renderDeliverables(deliverables, issues) {
  if (!deliverables.length) {
    return '<p class="no-data">No deliverables defined for this project.</p>';
  }

  const issueStatus = Object.fromEntries(issues.map(i => [i.id, i.status]));
  const STATUS_LABEL = {
    open: 'In Progress', in_progress: 'In Progress',
    closed: 'Complete', deferred: 'Deferred',
  };

  return deliverables.map(d => {
    const rawStatus = d.issueId ? issueStatus[d.issueId] : null;
    const statusKey = rawStatus || 'not_started';
    const statusLabel = STATUS_LABEL[statusKey] || (rawStatus ? rawStatus.replace(/_/g, ' ') : 'Not Started');

    return `<div class="issue-row">
      <span class="issue-title"><strong>${esc(d.name)}</strong>
        <span style="display:block;font-size:0.8rem;color:#6b7280;margin-top:0.2rem">${esc(d.description)}</span>
      </span>
      <span class="issue-status status-${statusKey}">${esc(statusLabel)}</span>
    </div>`;
  }).join('\n');
}

/**
 * Renders the time-worked stacked bar chart as an inline SVG.
 * Sessions without a duration are excluded. Multiple sessions on the same date
 * are stacked into a single bar, each segment coloured by phase.
 * @param {object[]} sessions
 * @returns {string} HTML (SVG + legend)
 */
function renderGantt(sessions) {
  if (!sessions.length) return '<p class="no-data">No sessions recorded yet.</p>';

  const colors = phaseColorMap(sessions);
  const byDate = {};
  for (const s of sessions) {
    if (!s.duration_minutes) continue;
    (byDate[s.date] = byDate[s.date] || []).push(s);
  }
  const dates = Object.keys(byDate).sort();
  if (!dates.length) return '<p class="no-data">No timed sessions recorded yet.</p>';

  const maxMinutes = Math.max(...dates.map(d => byDate[d].reduce((sum, s) => sum + s.duration_minutes, 0)), 60);
  const maxHours = Math.ceil(maxMinutes / 60);
  const barW = 12, gap = 4, chartH = 60, padL = 28, padB = 40;
  const svgW = padL + dates.length * (barW + gap);
  const svgH = chartH + padB;

  let grid = `<line x1="${padL}" y1="${chartH}" x2="${svgW}" y2="${chartH}" stroke="#2d3348" stroke-width="1"/>`;
  for (let h = 1; h <= maxHours; h++) {
    const y = chartH - Math.round(h * 60 / maxMinutes * chartH);
    grid += `<line x1="${padL}" y1="${y}" x2="${svgW}" y2="${y}" stroke="#2d3348" stroke-width="1"/>`;
    grid += `<text x="${padL - 4}" y="${y + 4}" font-size="9" fill="#475569" text-anchor="end" font-family="sans-serif">${h}h</text>`;
  }

  const bars = dates.map((date, i) => {
    const x = padL + i * (barW + gap);
    let yTop = chartH;
    const segments = byDate[date].map(s => {
      const segH = Math.max(1, Math.round(s.duration_minutes / maxMinutes * chartH));
      yTop -= segH;
      const color = colors[s.phase || '—'] || '#6b7280';
      return `<rect x="${x}" y="${yTop}" width="${barW}" height="${segH}" fill="${color}"><title>${esc(`S${s.session} · ${fmtDuration(s.duration_minutes)}`)}</title></rect>`;
    }).join('');
    const cx = x + barW / 2;
    const label = `<text x="${cx}" y="${chartH + 5}" font-size="8" fill="#475569" text-anchor="end" transform="rotate(-60,${cx},${chartH + 5})" font-family="sans-serif">${esc(date.slice(5))}</text>`;
    return segments + label;
  }).join('');

  const svg = `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:140px;display:block">${grid}${bars}</svg>`;

  const seenPhases = new Set(
    Object.values(byDate).flat().map(s => s.phase || '—')
  );
  const legendItems = Object.entries(colors)
    .filter(([phase]) => seenPhases.has(phase))
    .map(([phase, color]) =>
      `<span class="gantt-legend-item"><span class="gantt-legend-swatch" style="background:${color}"></span>${esc(phase)}</span>`)
    .join('');

  return svg + `<div class="gantt-legend">${legendItems}</div>`;
}

/**
 * Renders the decisions log grouped by phase, each group collapsible.
 * Decision cards embed a `data-text` attribute used by `filterAll()`.
 * @param {object[]} sessions
 * @returns {string} HTML
 */
function renderDecisions(sessions) {
  const phaseOrder = [];
  const phases = {};

  for (const s of sessions) {
    const phase = s.phase || '—';
    if (!(phase in phases)) { phaseOrder.push(phase); phases[phase] = []; }
    for (const d of (s.decisions || [])) {
      phases[phase].push({
        session: s.session, date: s.date,
        title: d.title || '', description: d.description || '', rationale: d.rationale || '',
      });
    }
  }

  return phaseOrder.map(phase => {
    const decisions = phases[phase];
    if (!decisions.length) return '';
    const phaseId = phase.toLowerCase().replace(/\W+/g, '-');

    const cards = decisions.map(d =>
      `<div class="decision-card searchable" data-text="${esc(`${d.title} ${d.description} ${d.rationale}`)}">
        <div class="decision-header" onclick="this.closest('.decision-card').classList.toggle('expanded')">
          <span class="decision-title">${esc(d.title)}</span>
          <span class="decision-meta">Session ${d.session} &middot; ${d.date}</span>
        </div>
        <div class="decision-body">
          <p>${esc(d.description)}</p>
          <p class="rationale"><strong>Rationale:</strong> ${esc(d.rationale)}</p>
        </div>
      </div>`
    ).join('\n');

    return `<div class="phase-group" id="phase-${phaseId}">
      <div class="phase-header" onclick="togglePhase(this)">
        <span class="phase-chevron">▶</span>
        <span class="phase-name">${esc(phase)}</span>
        <span class="phase-count">${decisions.length}</span>
      </div>
      <div class="phase-body">${cards}</div>
    </div>`;
  }).join('\n');
}

/**
 * Mounts all sections into #app and updates the page title.
 * @param {{ projectName: string, purpose: string, sessions: object[],
 *   issues: object[], deliverables: object[] }} data
 */
function render(data) {
  const { projectName, purpose, sessions, issues, deliverables } = data;

  document.getElementById('project-name').textContent = projectName;
  document.getElementById('report-date').textContent = 'Live';
  document.title = `${projectName} — Report`;

  document.getElementById('app').innerHTML = `
    ${renderStats(sessions, issues)}

    <section id="status">
      <h2>Current Status</h2>
      ${renderStatus(sessions)}
    </section>

    <section id="deliverables">
      <h2>Deliverables</h2>
      ${renderDeliverables(deliverables, issues)}
    </section>

    <section id="time">
      <h2>Time Worked</h2>
      ${renderGantt(sessions)}
    </section>

    <section id="purpose">
      <h2>Project Purpose</h2>
      ${mdToHtml(purpose)}
    </section>

    <section id="decisions">
      <h2>Decisions</h2>
      <div class="search-wrapper">
        <input type="text" id="keyword-filter" placeholder="Filter by keyword…" oninput="filterAll()">
      </div>
      ${renderDecisions(sessions)}
      <p id="decisions-noresults" class="no-results hidden">No decisions match this filter.</p>
    </section>

    <footer>
      Live data &mdash; Structured LLM collaboration framework
    </footer>
  `;
}

/** Toggles a phase group open/closed. Called from inline onclick. */
function togglePhase(header) {
  header.closest('.phase-group').classList.toggle('open');
}

/**
 * Filters decision cards by keyword, hiding non-matching cards and
 * collapsing empty phase groups. Auto-expands groups with matches.
 */
function filterAll() {
  const q = document.getElementById('keyword-filter').value.trim().toLowerCase();
  let decisionsVisible = 0;

  document.querySelectorAll('.phase-group').forEach(group => {
    let groupVisible = 0;
    group.querySelectorAll('.decision-card.searchable').forEach(card => {
      const match = !q || card.dataset.text.toLowerCase().includes(q);
      card.classList.toggle('hidden', !match);
      if (match) groupVisible++;
    });
    group.classList.toggle('hidden', groupVisible === 0);
    if (q && groupVisible > 0) group.classList.add('open');
    decisionsVisible += groupVisible;
  });

  document.getElementById('decisions-noresults').classList.toggle('hidden', decisionsVisible > 0);
}

loadData()
  .then(render)
  .catch(err => {
    document.getElementById('app').innerHTML =
      `<p style="color:#dc2626;padding:2rem 0"><strong>Failed to load report data:</strong> ${esc(err.message)}</p>`;
  });
