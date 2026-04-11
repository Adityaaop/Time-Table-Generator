// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

const DAYS5 = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const DAYS6 = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Default period timings per day length
const TIMES = {
  6: ['9:00–9:50','9:50–10:40','11:00–11:50','11:50–12:40','1:20–2:10','2:10–3:00'],
  7: ['9:00–9:50','9:50–10:40','10:50–11:40','11:40–12:30','1:10–2:00','2:00–2:50','2:50–3:40'],
  8: ['8:30–9:20','9:20–10:10','10:20–11:10','11:10–12:00','12:40–1:30','1:30–2:20','2:20–3:10','3:10–4:00']
};

// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════

let subjects     = [];   // Array of subject objects
let timetableData = null; // Holds last generated timetable

// ═══════════════════════════════════════════════════════
//  STEP NAVIGATION
// ═══════════════════════════════════════════════════════

function goStep(n) {
  // Show only the active panel
  document.querySelectorAll('.panel')
    .forEach((p, i) => p.classList.toggle('active', i + 1 === n));

  // Highlight the active tab button
  document.querySelectorAll('.step-btn')
    .forEach((b, i) => b.classList.toggle('active', i + 1 === n));
}

// ═══════════════════════════════════════════════════════
//  STEP 1 — PERIOD TIMINGS GRID
//  Dynamically builds input fields based on periods/day
// ═══════════════════════════════════════════════════════

function buildTimingsGrid() {
  const pp       = parseInt(document.getElementById('periodsPerDay').value);
  const defaults = TIMES[pp] || TIMES[7];
  const grid     = document.getElementById('timingsGrid');

  grid.innerHTML = ''; // Clear old inputs

  for (let i = 0; i < pp; i++) {
    const div = document.createElement('div');
    div.innerHTML = `
      <label>Period ${i + 1}</label>
      <input type="text" id="t${i}" value="${defaults[i] || ''}">
    `;
    grid.appendChild(div);
  }
}

// ═══════════════════════════════════════════════════════
//  STEP 2 — ADD SUBJECT
// ═══════════════════════════════════════════════════════

function addSubject() {
  // Read form values
  const name    = document.getElementById('subName').value.trim();
  const code    = document.getElementById('subCode').value.trim();
  const teacher = document.getElementById('subTeacher').value.trim();
  const type    = document.getElementById('subType').value;
  const periods = parseInt(document.getElementById('subPeriods').value);
  const colors  = document.getElementById('subColor').value.split(',');

  // Validation
  if (!name)    { showToast('⚠ Enter subject name');  return; }
  if (!teacher) { showToast('⚠ Enter teacher name');  return; }

  // Push to state array
  subjects.push({
    id:      Date.now(),   // unique ID
    name, code, teacher, type, periods,
    fg:      colors[0],    // foreground (text) color
    bg:      colors[1]     // background color
  });

  // Clear form inputs
  document.getElementById('subName').value    = '';
  document.getElementById('subCode').value    = '';
  document.getElementById('subTeacher').value = '';
  document.getElementById('subPeriods').value = 4;

  renderSubjects();
  showToast(`✓ ${name} added`);
}

// ═══════════════════════════════════════════════════════
//  REMOVE SUBJECT
// ═══════════════════════════════════════════════════════

function removeSubject(id) {
  subjects = subjects.filter(s => s.id !== id);
  renderSubjects();
}

// ═══════════════════════════════════════════════════════
//  RENDER SUBJECT LIST  (reads from subjects[] state)
// ═══════════════════════════════════════════════════════

function renderSubjects() {
  const el = document.getElementById('subjectList');

  if (!subjects.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📚</div>
        <p>No subjects added yet.</p>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="subject-list">
      ${subjects.map(s => `
        <div class="subject-item">
          <div class="subject-color-dot" style="background:${s.fg}"></div>
          <div class="subject-info">
            <div class="subject-name">
              ${s.name}
              <span style="font-size:11px;color:var(--text-dim)">${s.code}</span>
            </div>
            <div class="subject-meta">
              👨‍🏫 ${s.teacher} · ${s.type.toUpperCase()} · ${s.periods} periods/wk
            </div>
          </div>
          <button class="remove-btn" onclick="removeSubject(${s.id})">✕</button>
        </div>
      `).join('')}
    </div>`;
}

// ═══════════════════════════════════════════════════════
//  LOAD SAMPLE DATA  (CSE Semester 6)
// ═══════════════════════════════════════════════════════

function loadSample() {
  subjects = [
    { id:1, name:'Compiler Design',   code:'CS601', teacher:'Dr. Ramesh Kumar',  type:'theory',   periods:4, fg:'#00e5ff', bg:'#003344' },
    { id:2, name:'Computer Networks', code:'CS602', teacher:'Prof. Anita Singh', type:'theory',   periods:4, fg:'#a8ff78', bg:'#1a3300' },
    { id:3, name:'Software Engg',     code:'CS603', teacher:'Dr. Pankaj Yadav',  type:'theory',   periods:4, fg:'#ff6b35', bg:'#3d1500' },
    { id:4, name:'Machine Learning',  code:'CS604', teacher:'Dr. Meera Sharma',  type:'elective', periods:3, fg:'#c084fc', bg:'#2d1050' },
    { id:5, name:'DBMS',              code:'CS605', teacher:'Prof. S. Verma',    type:'theory',   periods:3, fg:'#fbbf24', bg:'#3d2a00' },
    { id:6, name:'CN Lab',            code:'CS651', teacher:'Prof. Anita Singh', type:'lab',      periods:2, fg:'#34d399', bg:'#003322' },
    { id:7, name:'Compiler Lab',      code:'CS652', teacher:'Dr. Ramesh Kumar',  type:'lab',      periods:2, fg:'#60a5fa', bg:'#001233' },
  ];
  renderSubjects();
  showToast('✓ Sample subjects loaded');
}

// ═══════════════════════════════════════════════════════
//  STEP 3 — GENERATE TIMETABLE  (core algorithm)
// ═══════════════════════════════════════════════════════

function generateTimetable() {
  if (!subjects.length) {
    showToast('⚠ Add subjects first');
    goStep(2);
    return;
  }

  // --- Read config ---
  const pp   = parseInt(document.getElementById('periodsPerDay').value);
  const wd   = parseInt(document.getElementById('workingDays').value);
  const days = wd === 5 ? DAYS5 : DAYS6;

  // Collect period timing labels
  const timings = [];
  for (let i = 0; i < pp; i++)
    timings.push(document.getElementById('t' + i)?.value || `P${i + 1}`);

  // Middle period = break/recess slot
  const breakPeriod = Math.floor(pp / 2);

  // --- Build slot pool ---
  // Each subject generates N "tokens" equal to its periods/week
  // Lab subjects generate "pair tokens" (occupy 2 consecutive slots)
  let pool = [];
  for (const s of subjects) {
    if (s.type === 'lab') {
      const pairs = Math.floor(s.periods / 2);
      for (let i = 0; i < pairs; i++)
        pool.push({ ...s, isLab: true });
    } else {
      for (let i = 0; i < s.periods; i++)
        pool.push({ ...s, isLab: false });
    }
  }

  // --- Create empty grid: [day][period] = null ---
  const grid     = days.map(() => Array(pp).fill(null));
  const occupied = {};  // key = "teacher-day-period", prevents double booking

  // Fisher-Yates-style shuffle using sort
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  // ── 1. Place LABS first ──────────────────────────────
  // Labs need 2 back-to-back free slots on the same day
  for (const lab of shuffle(pool.filter(p => p.isLab))) {
    let placed = false;

    for (const d of shuffle([...Array(days.length).keys()])) {
      for (let p = 0; p < pp - 1; p++) {

        // Don't split a lab across the break slot
        if (p === breakPeriod - 1 || p === breakPeriod) continue;

        // Both slots must be free
        if (grid[d][p] !== null || grid[d][p + 1] !== null) continue;

        // Teacher must not be scheduled at either slot
        const k1 = `${lab.teacher}-${d}-${p}`;
        const k2 = `${lab.teacher}-${d}-${p + 1}`;
        if (occupied[k1] || occupied[k2]) continue;

        // Place lab as two linked cells
        grid[d][p]     = { ...lab, labFirst: true  };
        grid[d][p + 1] = { ...lab, labFirst: false };
        occupied[k1]   = true;
        occupied[k2]   = true;
        placed         = true;
        break;
      }
      if (placed) break;
    }
  }

  // ── 2. Place THEORY / ELECTIVES ─────────────────────
  for (const t of shuffle(pool.filter(p => !p.isLab))) {
    let placed = false;

    for (const d of shuffle([...Array(days.length).keys()])) {
      for (const p of shuffle([...Array(pp).keys()])) {

        // Skip the break slot
        if (p === breakPeriod) continue;

        // Slot must be free
        if (grid[d][p] !== null) continue;

        // Teacher must not already be at this slot
        const key = `${t.teacher}-${d}-${p}`;
        if (occupied[key]) continue;

        // SOFT RULE: avoid same subject appearing twice on same day
        // (skip with 70% probability if already on this day)
        const alreadyToday = grid[d].some(c => c && c.id === t.id);
        if (alreadyToday && Math.random() < 0.7) continue;

        // Place it
        grid[d][p]    = { ...t };
        occupied[key] = true;
        placed        = true;
        break;
      }
      if (placed) break;
    }
  }

  // Save result to state
  timetableData = { grid, days, timings, pp, breakPeriod };

  // Render all output sections
  renderTimetable();
  renderStats();
  renderLegend();
  showToast('⚡ Timetable generated!');
}

// ═══════════════════════════════════════════════════════
//  RENDER TIMETABLE  (builds HTML table from grid[][])
// ═══════════════════════════════════════════════════════

function renderTimetable() {
  const { grid, days, timings, pp, breakPeriod } = timetableData;

  // Update header labels
  document.getElementById('ttHeader').style.display = 'block';
  document.getElementById('ttTitle').textContent =
    `${document.getElementById('collegeName').value} — ${document.getElementById('department').value}`;
  document.getElementById('ttSubtitle').textContent =
    `${document.getElementById('semester').value} · Section ${document.getElementById('section').value} · Auto-Generated`;

  // ── Table header row ──
  let html = `<table class="tt-table"><thead><tr><th>Day</th>`;

  for (let p = 0; p < pp; p++) {
    if (p === breakPeriod)
      html += `<th style="color:var(--accent2)">BREAK</th>`;
    html += `<th>P${p + 1}<br>
             <span style="font-size:9px;font-weight:400;opacity:.7">${timings[p]}</span>
             </th>`;
  }
  html += `</tr></thead><tbody>`;

  // ── Table body rows ──
  for (let d = 0; d < days.length; d++) {
    html += `<tr><td>${days[d]}</td>`;

    for (let p = 0; p < pp; p++) {

      // Render break column
      if (p === breakPeriod)
        html += `<td><div class="cell-break">☕ RECESS</div></td>`;

      const cell = grid[d][p];

      if (!cell) {
        // Empty slot
        html += `<td></td>`;
      } else {
        // Dim the second cell of a lab pair
        const dim = (cell.isLab && !cell.labFirst) ? 'opacity:.65' : '';
        html += `
          <td>
            <div class="cell-content"
                 style="background:${cell.bg};color:${cell.fg};${dim}"
                 title="${cell.teacher}">
              <div>${cell.isLab && !cell.labFirst ? '↑ ' + cell.name : cell.name}</div>
              <div class="sub-code">${cell.code} · ${cell.teacher.split(' ').pop()}</div>
            </div>
          </td>`;
      }
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  document.getElementById('timetableOut').innerHTML = html;
}

// ═══════════════════════════════════════════════════════
//  RENDER STATS  (counts filled slots, teachers, etc.)
// ═══════════════════════════════════════════════════════

function renderStats() {
  const { grid, days, pp } = timetableData;

  let filled = 0, total = 0;
  grid.forEach(row => row.forEach(c => { total++; if (c) filled++; }));

  const teachers = new Set(subjects.map(s => s.teacher)).size;
  const el       = document.getElementById('statsRow');
  el.style.display = 'grid';

  el.innerHTML = [
    [subjects.length,                        'Subjects'],
    [teachers,                               'Teachers'],
    [days.length * pp,                       'Total Slots'],
    [filled,                                 'Filled Slots'],
    [Math.round(filled / total * 100) + '%', 'Utilization'],
  ].map(([val, label]) => `
    <div class="stat-box">
      <div class="stat-val">${val}</div>
      <div class="stat-label">${label}</div>
    </div>`
  ).join('');
}

// ═══════════════════════════════════════════════════════
//  RENDER LEGEND  (color key for each subject)
// ═══════════════════════════════════════════════════════

function renderLegend() {
  const el = document.getElementById('legendRow');
  el.style.display = 'flex';
  el.innerHTML = subjects.map(s => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${s.fg}"></div>
      <span>${s.name}</span>
    </div>`
  ).join('');
}

// ═══════════════════════════════════════════════════════
//  EXPORT CSV
// ═══════════════════════════════════════════════════════

function exportCSV() {
  if (!timetableData) { showToast('⚠ Generate first'); return; }

  const { grid, days, timings, pp, breakPeriod } = timetableData;

  // Header row
  let csv = 'Day,' +
    Array.from({ length: pp }, (_, i) => `"P${i + 1}(${timings[i]})"`).join(',') +
    '\n';

  // Data rows
  for (let d = 0; d < days.length; d++) {
    let row = [days[d]];
    for (let p = 0; p < pp; p++) {
      const c = grid[d][p];
      if (p === breakPeriod)        row.push('"BREAK"');
      else if (c)                   row.push(`"${c.name}(${c.teacher})"`);
      else                          row.push('""');
    }
    csv += row.join(',') + '\n';
  }

  // Trigger browser download
  const a   = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'timetable.csv';
  a.click();
  showToast('✓ CSV downloaded');
}

// ═══════════════════════════════════════════════════════
//  TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════

function showToast(msg) {
  const t    = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2500);
}
//  ═══════════════════════════════════════════════════════
//INIT  — run when page load
// ═══════════════════════════════════════════════════════

buildTimingsGrid();