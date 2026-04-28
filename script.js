import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const DAYS5 = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const DAYS6 = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const TIMES = {
  6: ['9:00–9:50','9:50–10:40','11:00–11:50','11:50–12:40','1:20–2:10','2:10–3:00'],
  7: ['9:00–9:50','9:50–10:40','10:50–11:40','11:40–12:30','1:10–2:00','2:00–2:50','2:50–3:40'],
  8: ['8:30–9:20','9:20–10:10','10:20–11:10','11:10–12:00','12:40–1:30','1:30–2:20','2:20–3:10','3:10–4:00']
};


let subjects      = [];
let timetableData = null;

const COLLECTION = 'subjects';


function goStep(n) {
  document.querySelectorAll('.panel')
    .forEach((p, i) => p.classList.toggle('active', i + 1 === n));
  document.querySelectorAll('.step-btn')
    .forEach((b, i) => b.classList.toggle('active', i + 1 === n));
}


function buildTimingsGrid() {
  const pp       = parseInt(document.getElementById('periodsPerDay').value);
  const defaults = TIMES[pp] || TIMES[7];
  const grid     = document.getElementById('timingsGrid');

  grid.innerHTML = '';

  for (let i = 0; i < pp; i++) {
    const div = document.createElement('div');
    div.innerHTML = `
      <label>Period ${i + 1}</label>
      <input type="text" id="t${i}" value="${defaults[i] || ''}">
    `;
    grid.appendChild(div);
  }
}

async function addSubject() {
  const name    = document.getElementById('subName').value.trim();
  const code    = document.getElementById('subCode').value.trim();
  const teacher = document.getElementById('subTeacher').value.trim();
  const type    = document.getElementById('subType').value;
  const periods = parseInt(document.getElementById('subPeriods').value);
  const colors  = document.getElementById('subColor').value.split(',');

  const pp      = parseInt(document.getElementById('periodsPerDay').value);
  const timings = [];
  for (let i = 0; i < pp; i++)
    timings.push(document.getElementById('t' + i)?.value || `P${i + 1}`);

  if (!name)    { showToast('⚠ Enter subject name');  return; }
  if (!teacher) { showToast('⚠ Enter teacher name');  return; }

  const subjectDoc = {
    name,
    code,
    teacher,
    type,
    periods,
    periodsPerDay: pp,
    timings,                 
    fg:      colors[0],
    bg:      colors[1],
    createdAt: serverTimestamp()
  };

  try {
    showToast('⏳ Saving to Firebase…');

    const docRef = await addDoc(collection(db, COLLECTION), subjectDoc);

    subjects.push({ ...subjectDoc, id: docRef.id });

    document.getElementById('subName').value    = '';
    document.getElementById('subCode').value    = '';
    document.getElementById('subTeacher').value = '';
    document.getElementById('subPeriods').value = 4;

    renderSubjects();
    showToast(`✓ ${name} saved to Firebase`);

  } catch (err) {
    console.error('Firebase write error:', err);
    showToast('❌ Firebase error — check console');
  }
}

async function loadSubjectsFromDB() {
  try {
    showToast('⏳ Loading from Firebase…');
    const snapshot = await getDocs(collection(db, COLLECTION));

    subjects = [];
    snapshot.forEach(docSnap => {
      subjects.push({ ...docSnap.data(), id: docSnap.id });
    });

    renderSubjects();
    showToast(`✓ Loaded ${subjects.length} subject(s) from Firebase`);

  } catch (err) {
    console.error('Firebase read error:', err);
    showToast('❌ Could not load from Firebase');
  }
}

async function removeSubject(id) {
  try {
    // Delete from Firestore using the document ID
    await deleteDoc(doc(db, COLLECTION, id));

    // Remove from local state
    subjects = subjects.filter(s => s.id !== id);
    renderSubjects();
    showToast('✓ Subject removed from Firebase');

  } catch (err) {
    console.error('Firebase delete error:', err);
    showToast('❌ Could not delete — check console');
  }
}

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
            <div class="subject-meta" style="margin-top:3px;color:#34d399;">
              🔥 Saved in Firebase
            </div>
          </div>
          <button class="remove-btn" onclick="removeSubject('${s.id}')">✕</button>
        </div>
      `).join('')}
    </div>`;
}

async function loadSample() {
  const samples = [
    { name:'Compiler Design',   code:'CS601', teacher:'Dr. Ramesh Kumar',  type:'theory',   periods:4, fg:'#00e5ff', bg:'#003344' },
    { name:'Computer Networks', code:'CS602', teacher:'Prof. Anita Singh', type:'theory',   periods:4, fg:'#a8ff78', bg:'#1a3300' },
    { name:'Software Engg',     code:'CS603', teacher:'Dr. Pankaj Yadav',  type:'theory',   periods:4, fg:'#ff6b35', bg:'#3d1500' },
    { name:'Machine Learning',  code:'CS604', teacher:'Dr. Meera Sharma',  type:'elective', periods:3, fg:'#c084fc', bg:'#2d1050' },
    { name:'DBMS',              code:'CS605', teacher:'Prof. S. Verma',    type:'theory',   periods:3, fg:'#fbbf24', bg:'#3d2a00' },
    { name:'CN Lab',            code:'CS651', teacher:'Prof. Anita Singh', type:'lab',      periods:2, fg:'#34d399', bg:'#003322' },
    { name:'Compiler Lab',      code:'CS652', teacher:'Dr. Ramesh Kumar',  type:'lab',      periods:2, fg:'#60a5fa', bg:'#001233' },
  ];

  showToast('⏳ Saving sample data to Firebase…');
  subjects = [];

  const pp      = parseInt(document.getElementById('periodsPerDay').value);
  const timings = [];
  for (let i = 0; i < pp; i++)
    timings.push(document.getElementById('t' + i)?.value || `P${i + 1}`);

  try {
    for (const s of samples) {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...s,
        periodsPerDay: pp,
        timings,
        createdAt: serverTimestamp()
      });
      subjects.push({ ...s, id: docRef.id, periodsPerDay: pp, timings });
    }
    renderSubjects();
    showToast('✓ Sample data saved to Firebase!');
  } catch (err) {
    console.error(err);
    showToast('❌ Firebase error saving sample data');
  }
}

function generateTimetable() {
  if (!subjects.length) {
    showToast('⚠ Add subjects first');
    goStep(2);
    return;
  }

  const pp   = parseInt(document.getElementById('periodsPerDay').value);
  const wd   = parseInt(document.getElementById('workingDays').value);
  const days = wd === 5 ? DAYS5 : DAYS6;

  const timings = [];
  for (let i = 0; i < pp; i++)
    timings.push(document.getElementById('t' + i)?.value || `P${i + 1}`);

  const breakPeriod = Math.floor(pp / 2);

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

  const grid     = days.map(() => Array(pp).fill(null));
  const occupied = {};

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  for (const lab of shuffle(pool.filter(p => p.isLab))) {
    let placed = false;
    for (const d of shuffle([...Array(days.length).keys()])) {
      for (let p = 0; p < pp - 1; p++) {
        if (p === breakPeriod - 1 || p === breakPeriod) continue;
        if (grid[d][p] !== null || grid[d][p + 1] !== null) continue;
        const k1 = `${lab.teacher}-${d}-${p}`;
        const k2 = `${lab.teacher}-${d}-${p + 1}`;
        if (occupied[k1] || occupied[k2]) continue;
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

  for (const t of shuffle(pool.filter(p => !p.isLab))) {
    let placed = false;
    for (const d of shuffle([...Array(days.length).keys()])) {
      for (const p of shuffle([...Array(pp).keys()])) {
        if (p === breakPeriod) continue;
        if (grid[d][p] !== null) continue;
        const key = `${t.teacher}-${d}-${p}`;
        if (occupied[key]) continue;
        const alreadyToday = grid[d].some(c => c && c.id === t.id);
        if (alreadyToday && Math.random() < 0.7) continue;
        grid[d][p]    = { ...t };
        occupied[key] = true;
        placed        = true;
        break;
      }
      if (placed) break;
    }
  }

  timetableData = { grid, days, timings, pp, breakPeriod };
  renderTimetable();
  renderStats();
  renderLegend();
  showToast('⚡ Timetable generated!');
}

function renderTimetable() {
  const { grid, days, timings, pp, breakPeriod } = timetableData;

  document.getElementById('ttHeader').style.display = 'block';
  document.getElementById('ttTitle').textContent =
    `${document.getElementById('collegeName').value} — ${document.getElementById('department').value}`;
  document.getElementById('ttSubtitle').textContent =
    `${document.getElementById('semester').value} · Section ${document.getElementById('section').value} · Auto-Generated`;

  let html = `<table class="tt-table"><thead><tr><th>Day</th>`;

  for (let p = 0; p < pp; p++) {
    if (p === breakPeriod)
      html += `<th style="color:var(--accent2)">BREAK</th>`;
    html += `<th>P${p + 1}<br>
             <span style="font-size:9px;font-weight:400;opacity:.7">${timings[p]}</span>
             </th>`;
  }
  html += `</tr></thead><tbody>`;

  for (let d = 0; d < days.length; d++) {
    html += `<tr><td>${days[d]}</td>`;
    for (let p = 0; p < pp; p++) {
      if (p === breakPeriod)
        html += `<td><div class="cell-break">☕ RECESS</div></td>`;
      const cell = grid[d][p];
      if (!cell) {
        html += `<td></td>`;
      } else {
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

function renderStats() {
  const { grid, days, pp } = timetableData;
  let filled = 0, total = 0;
  grid.forEach(row => row.forEach(c => { total++; if (c) filled++; }));
  const teachers = new Set(subjects.map(s => s.teacher)).size;
  const el = document.getElementById('statsRow');
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


function exportCSV() {
  if (!timetableData) { showToast('⚠ Generate first'); return; }
  const { grid, days, timings, pp, breakPeriod } = timetableData;
  let csv = 'Day,' +
    Array.from({ length: pp }, (_, i) => `"P${i + 1}(${timings[i]})"`).join(',') + '\n';
  for (let d = 0; d < days.length; d++) {
    let row = [days[d]];
    for (let p = 0; p < pp; p++) {
      const c = grid[d][p];
      if (p === breakPeriod)  row.push('"BREAK"');
      else if (c)             row.push(`"${c.name}(${c.teacher})"`);
      else                    row.push('""');
    }
    csv += row.join(',') + '\n';
  }
  const a   = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'timetable.csv';
  a.click();
  showToast('✓ CSV downloaded');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent   = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2500);
}

window.goStep           = goStep;
window.buildTimingsGrid = buildTimingsGrid;
window.addSubject       = addSubject;
window.removeSubject    = removeSubject;
window.loadSample       = loadSample;
window.generateTimetable = generateTimetable;
window.exportCSV        = exportCSV;

buildTimingsGrid();
loadSubjectsFromDB();   
