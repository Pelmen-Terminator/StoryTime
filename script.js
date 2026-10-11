// ============================================================
// StoryTime v1.0 — логика приложения
// ============================================================

const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const $ = id => document.getElementById(id);

// ---------- ТЕМА ----------
const savedTheme = localStorage.getItem('storytime-theme') || 'dark';
document.documentElement.dataset.theme = savedTheme;
document.querySelectorAll('.theme-btn').forEach(btn => {
  if (btn.dataset.theme === savedTheme) btn.classList.add('active');
  else btn.classList.remove('active');
});

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.theme;
    document.documentElement.dataset.theme = t;
    localStorage.setItem('storytime-theme', t);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b === btn));
  });
});

// ---------- TOAST ----------
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- МОДАЛКА (промис) ----------
function promptModal(title, fields) {
  return new Promise(resolve => {
    const modal = $('modal');
    $('modal-title').textContent = title;
    const body = $('modal-body');
    body.innerHTML = fields.map(f => {
      if (f.type === 'select') {
        return `<label style="display:block;font-size:0.82rem;color:var(--muted);margin-bottom:4px;">${f.label}</label>
        <select id="mf-${f.id}">${f.options.map(o => `<option value="${o.v}">${o.l}</option>`).join('')}</select>`;
      }
      return `<label style="display:block;font-size:0.82rem;color:var(--muted);margin-bottom:4px;">${f.label}</label>
      <input type="text" id="mf-${f.id}" placeholder="${f.placeholder || ''}" value="${f.value || ''}">`;
    }).join('');

    const confirm = $('modal-confirm');
    const cancel = $('modal-cancel');
    const close = (val) => {
      modal.classList.remove('show');
      confirm.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = () => {
      const values = {};
      fields.forEach(f => values[f.id] = $('mf-' + f.id).value);
      close(values);
    };
    const onCancel = () => close(null);
    confirm.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    modal.classList.add('show');
    setTimeout(() => {
      const first = body.querySelector('input, select');
      if (first) first.focus();
    }, 100);
  });
}

// ---------- ВКЛАДКИ ----------
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    $(tab.dataset.tab).classList.add('active');
  });
});

// ---------- ЗАПОЛНЕНИЕ SELECT'ОВ ----------
function fillSelect(id, items, { any = false, anyLabel = '🎲 Любой' } = {}) {
  const sel = $(id);
  sel.innerHTML = '';
  if (any) sel.insertAdjacentHTML('beforeend', `<option value="any">${anyLabel}</option>`);
  items.forEach(([val, label]) => sel.insertAdjacentHTML('beforeend', `<option value="${val}">${label}</option>`));
}

fillSelect('plot-genre', Object.entries(DATA.genres).map(([k, v]) => [k, v.name]), { any: true });
fillSelect('char-origin', Object.entries(DATA.names).map(([k, v]) => [k, v.name]), { any: true });
fillSelect('char-archetype', Object.entries(DATA.archetypes).map(([k, v]) => [k, v.name]), { any: true });
fillSelect('creature-type', Object.entries(DATA.creatures).map(([k, v]) => [k, v.name]), { any: true });
fillSelect('location-type', Object.entries(DATA.locations).map(([k, v]) => [k, v.name]), { any: true });
fillSelect('name-origin', Object.entries(DATA.names).map(([k, v]) => [k, v.name]), { any: true });

// ============================================================
// СЮЖЕТ
// ============================================================
let lastPlot = '';
function genPlot() {
  const genre = $('plot-genre').value;
  const tone = $('plot-tone').value;
  const key = genre === 'any' ? rnd(Object.keys(DATA.genres)) : genre;
  const g = DATA.genres[key];

  const setting = rnd(g.settings);
  const problem = rnd(g.problems);
  const goal = rnd(g.goals);
  const twist = rnd(g.twists);
  const heroName = rnd(DATA.names.fantasy.m);
  const toneText = tone === 'any' ? '' : `\n🎭 ТОН: ${tone}`;

  lastPlot = `🎬 ЖАНР: ${g.name}${toneText}

📍 МЕСТО: ${setting}
⚠️ ПРОБЛЕМА: ${problem}
🎯 ЦЕЛЬ ГЕРОЯ: ${goal}
💥 ПОВОРОТ: ${twist}

👤 ГЛАВНЫЙ ГЕРОЙ: ${heroName}`;

  $('plot-output').textContent = lastPlot;
}
$('gen-plot').addEventListener('click', genPlot);
$('reroll-plot').addEventListener('click', genPlot);
$('save-plot').addEventListener('click', () => {
  if (!lastPlot) return toast('Сначала сгенерируй сюжет');
  saveItem('Сюжет', lastPlot);
  toast('Сохранено ✓');
});
$('send-plot-to-project').addEventListener('click', () => {
  if (!lastPlot) return toast('Сначала сгенерируй сюжет');
  addNodeToActiveProject('Сюжет', lastPlot, '🎬');
  toast('Отправлено в проект ✓');
});

// ============================================================
// ПЕРСОНАЖ
// ============================================================
let lastChar = '';
function genChar() {
  const origin = $('char-origin').value;
  const genderSel = $('char-gender').value;
  const archSel = $('char-archetype').value;

  const originKey = origin === 'any' ? rnd(Object.keys(DATA.names)) : origin;
  const gender = genderSel === 'any' ? rnd(['m', 'f']) : genderSel;
  const nameData = DATA.names[originKey];
  const first = rnd(nameData[gender]);
  const last = rnd(gender === 'm' ? nameData.lastM : nameData.lastF);

  const archKey = archSel === 'any' ? rnd(Object.keys(DATA.archetypes)) : archSel;
  const arch = DATA.archetypes[archKey];

  const c = DATA.character;
  const char = {
    name: `${first} ${last}`,
    origin: nameData.name,
    age: 16 + Math.floor(Math.random() * 55),
    gender: gender === 'm' ? 'Мужской' : 'Женский',
    archetype: arch.name,
    appearance: rnd(c.appearance),
    trait: `${rnd(arch.traits)}, ${rnd(c.traits)}`,
    flaw: rnd(arch.flaws) + ', ' + rnd(c.flaws),
    secret: rnd(c.secrets),
    goal: `${rnd(arch.goals)}, ${rnd(c.goals)}`,
    quirk: rnd(c.quirks)
  };

  $('char-output').innerHTML = `
    <div class="row"><span>Имя</span><span>${char.name}</span></div>
    <div class="row"><span>Происхождение</span><span>${char.origin}</span></div>
    <div class="row"><span>Архетип</span><span>${char.archetype}</span></div>
    <div class="row"><span>Возраст</span><span>${char.age} лет</span></div>
    <div class="row"><span>Пол</span><span>${char.gender}</span></div>
    <div class="row"><span>Внешность</span><span>${char.appearance}</span></div>
    <div class="row"><span>Черты</span><span>${char.trait}</span></div>
    <div class="row"><span>Слабости</span><span>${char.flaw}</span></div>
    <div class="row"><span>Привычка</span><span>${char.quirk}</span></div>
    <div class="row"><span>Тайна</span><span>${char.secret}</span></div>
    <div class="row"><span>Цель</span><span>${char.goal}</span></div>
  `;
  lastChar = `${char.name} (${char.age}, ${char.gender.toLowerCase()}, ${char.origin}).
Архетип: ${char.archetype}.
Внешность: ${char.appearance}.
Черты: ${char.trait}.
Слабости: ${char.flaw}.
Привычка: ${char.quirk}.
Тайна: ${char.secret}.
Цель: ${char.goal}.`;
}
$('gen-char').addEventListener('click', genChar);
$('save-char').addEventListener('click', () => {
  if (!lastChar) return toast('Сначала создай персонажа');
  saveItem('Персонаж', lastChar);
  toast('Сохранено ✓');
});
$('send-char-to-project').addEventListener('click', () => {
  if (!lastChar) return toast('Сначала создай персонажа');
  addNodeToActiveProject('Персонаж', lastChar, '👤');
  toast('Отправлено в проект ✓');
});

// ============================================================
// МИР
// ============================================================
let lastWorld = '';
function genWorld() {
  const w = DATA.world;
  const world = {
    name: rnd(w.names),
    type: rnd(w.types),
    politics: rnd(w.politics),
    magic: rnd(w.magic),
    religion: rnd(w.religion),
    economy: rnd(w.economy),
    conflict: rnd(w.conflicts)
  };
  lastWorld = `🌍 МИР: ${world.name}

Тип: ${world.type}
Политика: ${world.politics}
Магия: ${world.magic}
Религия: ${world.religion}
Экономика: основана ${world.economy}
Главный конфликт: ${world.conflict}`;
  $('world-output').textContent = lastWorld;
}
$('gen-world').addEventListener('click', genWorld);
$('reroll-world').addEventListener('click', genWorld);
$('save-world').addEventListener('click', () => {
  if (!lastWorld) return toast('Сначала сгенерируй мир');
  saveItem('Мир', lastWorld);
  toast('Сохранено ✓');
});
$('send-world-to-project').addEventListener('click', () => {
  if (!lastWorld) return toast('Сначала сгенерируй мир');
  addNodeToActiveProject('Мир', lastWorld, '🌍');
  toast('Отправлено в проект ✓');
});

// ============================================================
// СУЩЕСТВО
// ============================================================
let lastCreature = '';
function genCreature() {
  const typeSel = $('creature-type').value;
  const typeKey = typeSel === 'any' ? rnd(Object.keys(DATA.creatures)) : typeSel;
  const c = DATA.creatures[typeKey];
  const sub = rnd(c.types);
  const nameWords = ["Грозовой", "Тёмный", "Вечный", "Кровавый", "Лунный", "Огненный", "Ледяной", "Проклятый", "Древний", "Святой"];
  const nick = `${rnd(nameWords)} ${c.name}`;

  const creature = {
    name: nick,
    type: `${c.name} (${sub})`,
    trait: rnd(c.traits),
    ability: rnd(c.abilities),
    weakness: rnd(c.weakness),
    habitat: rnd(DATA.locations.nature.types)
  };

  $('creature-output').innerHTML = `
    <div class="row"><span>Имя</span><span>${creature.name}</span></div>
    <div class="row"><span>Тип</span><span>${creature.type}</span></div>
    <div class="row"><span>Характер</span><span>${creature.trait}</span></div>
    <div class="row"><span>Способность</span><span>${creature.ability}</span></div>
    <div class="row"><span>Слабость</span><span>${creature.weakness}</span></div>
    <div class="row"><span>Среда обитания</span><span>${creature.habitat}</span></div>
  `;
  lastCreature = `${creature.name}.
Тип: ${creature.type}.
Характер: ${creature.trait}.
Способность: ${creature.ability}.
Слабость: ${creature.weakness}.
Обитает в: ${creature.habitat}.`;
}
$('gen-creature').addEventListener('click', genCreature);
$('save-creature').addEventListener('click', () => {
  if (!lastCreature) return toast('Сначала создай существо');
  saveItem('Существо', lastCreature);
  toast('Сохранено ✓');
});
$('send-creature-to-project').addEventListener('click', () => {
  if (!lastCreature) return toast('Сначала создай существо');
  addNodeToActiveProject('Существо', lastCreature, '🐉');
  toast('Отправлено в проект ✓');
});

// ============================================================
// ЛОКАЦИЯ
// ============================================================
let lastLocation = '';
function genLocation() {
  const typeSel = $('location-type').value;
  const typeKey = typeSel === 'any' ? rnd(Object.keys(DATA.locations)) : typeSel;
  const l = DATA.locations[typeKey];
  const sub = rnd(l.types);
  const nameWords = ["Старый", "Тёмный", "Забытый", "Проклятый", "Великий", "Затерянный", "Древний", "Святой", "Кровавый", "Загадочный"];
  const nick = `${rnd(nameWords)} ${sub}`;

  const loc = {
    name: nick.charAt(0).toUpperCase() + nick.slice(1),
    type: `${l.name} (${sub})`,
    feature: rnd(l.features),
    problem: rnd(l.problems),
    ruler: rnd(["мэр-взяточник", "древний дух", "совет старейшин", "жестокий барон", "королева-призрак", "никто — анархия"])
  };

  $('location-output').innerHTML = `
    <div class="row"><span>Название</span><span>${loc.name}</span></div>
    <div class="row"><span>Тип</span><span>${loc.type}</span></div>
    <div class="row"><span>Ключевая черта</span><span>${loc.feature}</span></div>
    <div class="row"><span>Проблема</span><span>${loc.problem}</span></div>
    <div class="row"><span>Кто правит</span><span>${loc.ruler}</span></div>
  `;
  lastLocation = `${loc.name}.
Тип: ${loc.type}.
Черта: ${loc.feature}.
Проблема: ${loc.problem}.
Правитель: ${loc.ruler}.`;
}
$('gen-location').addEventListener('click', genLocation);
$('save-location').addEventListener('click', () => {
  if (!lastLocation) return toast('Сначала создай локацию');
  saveItem('Локация', lastLocation);
  toast('Сохранено ✓');
});
$('send-location-to-project').addEventListener('click', () => {
  if (!lastLocation) return toast('Сначала создай локацию');
  addNodeToActiveProject('Локация', lastLocation, '🗺');
  toast('Отправлено в проект ✓');
});

// ============================================================
// ИМЕНА
// ============================================================
let lastNames = [];
function genNames() {
  const origin = $('name-origin').value;
  const genderSel = $('name-gender').value;
  const type = $('name-type').value;
  const out = $('names-output');
  out.innerHTML = '';
  lastNames = [];

  const originKey = origin === 'any' ? rnd(Object.keys(DATA.names)) : origin;
  const data = DATA.names[originKey];
  const genders = genderSel === 'any' ? ['m', 'f'] : [genderSel];

  for (let i = 0; i < 9; i++) {
    const g = rnd(genders);
    let full = '';
    if (type === 'nick') {
      full = rnd(DATA.nicknames);
    } else if (type === 'first') {
      full = rnd(data[g]);
    } else {
      full = `${rnd(data[g])} ${rnd(g === 'm' ? data.lastM : data.lastF)}`;
    }
    lastNames.push(full);

    const card = document.createElement('div');
    card.className = 'name-card';
    const label = type === 'nick' ? 'прозвище' : (g === 'm' ? 'муж.' : 'жен.');
    card.innerHTML = `<div class="n">${full}</div><div class="tag">${data.name} · ${label}</div>`;
    card.addEventListener('click', () => {
      navigator.clipboard?.writeText(full);
      toast(`Скопировано: ${full}`);
    });
    out.appendChild(card);
  }
}
$('gen-name').addEventListener('click', genNames);
$('save-names').addEventListener('click', () => {
  if (!lastNames.length) return toast('Сначала сгенерируй имена');
  lastNames.forEach(n => saveItem('Имя', n));
  toast(`${lastNames.length} имён сохранено ✓`);
});

// ============================================================
// БИБЛИОТЕКА (сохранённые)
// ============================================================
function getSaved() {
  try { return JSON.parse(localStorage.getItem('storytime-saved') || '[]'); }
  catch { return []; }
}
function setSaved(arr) { localStorage.setItem('storytime-saved', JSON.stringify(arr)); }

function saveItem(type, content) {
  const arr = getSaved();
  arr.unshift({ type, content, date: new Date().toLocaleString('ru-RU') });
  setSaved(arr);
  renderSaved();
}

function renderSaved() {
  const arr = getSaved();
  const filter = $('filter-saved').value;
  const search = $('search-saved').value.toLowerCase();
  const list = $('saved-list');

  const filtered = arr.filter(it => {
    if (filter !== 'all' && it.type !== filter) return false;
    if (search && !it.content.toLowerCase().includes(search) && !it.type.toLowerCase().includes(search)) return false;
    return true;
  });

  if (!filtered.length) {
    list.innerHTML = '<p class="placeholder">Ничего не найдено…</p>';
    return;
  }
  list.innerHTML = filtered.map((item) => {
    const idx = arr.indexOf(item);
    return `
      <div class="saved-item">
        <button class="del" data-i="${idx}" title="Удалить">✕</button>
        <div class="type">${item.type} · ${item.date}</div>
        <div class="content">${item.content.replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = +e.target.dataset.i;
      const arr = getSaved();
      arr.splice(i, 1);
      setSaved(arr);
      renderSaved();
      toast('Удалено');
    });
  });
}
$('search-saved').addEventListener('input', renderSaved);
$('filter-saved').addEventListener('change', renderSaved);

$('clear-all').addEventListener('click', () => {
  if (!confirm('Удалить все сохранения?')) return;
  setSaved([]);
  renderSaved();
  toast('Очищено');
});

$('export-json').addEventListener('click', () => {
  const data = getSaved();
  if (!data.length) return toast('Нет данных');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storytime-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Экспортировано ✓');
});

$('import-json').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error();
      const arr = getSaved();
      setSaved([...imported, ...arr]);
      renderSaved();
      toast(`Импортировано: ${imported.length}`);
    } catch {
      toast('Ошибка импорта');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ============================================================
// ПРОЕКТЫ И РЕДАКТОР
// ============================================================
function getProjects() {
  try { return JSON.parse(localStorage.getItem('storytime-projects') || '[]'); }
  catch { return []; }
}
function setProjects(arr) { localStorage.setItem('storytime-projects', JSON.stringify(arr)); }

let activeProjectId = null;
let activeNodeId = null;

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function renderProjects() {
  const list = $('project-list');
  const projects = getProjects();
  if (!projects.length) {
    list.innerHTML = '<p class="placeholder" style="font-size:0.85rem;">Пока нет проектов</p>';
    return;
  }
  list.innerHTML = projects.map(p => `
    <div class="project-item ${p.id === activeProjectId ? 'active' : ''}" data-id="${p.id}">
      <span class="pname">📚 ${p.title}</span>
      <button class="pdel" data-del="${p.id}" title="Удалить">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('.project-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.classList.contains('pdel')) return;
      openProject(el.dataset.id);
    });
  });
  list.querySelectorAll('.pdel').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Удалить проект?')) return;
      const arr = getProjects().filter(p => p.id !== btn.dataset.del);
      setProjects(arr);
      if (activeProjectId === btn.dataset.del) {
        activeProjectId = null;
        activeNodeId = null;
        showEditorEmpty();
      }
      renderProjects();
      toast('Проект удалён');
    });
  });
}

function showEditorEmpty() {
  $('editor-empty').style.display = 'flex';
  $('editor-content').style.display = 'none';
}

function openProject(id) {
  const p = getProjects().find(x => x.id === id);
  if (!p) return;
  activeProjectId = id;
  activeNodeId = p.nodes[0]?.id || null;
  $('editor-empty').style.display = 'none';
  $('editor-content').style.display = 'flex';
  $('project-title').value = p.title;
  renderProject();
  renderProjects();
}

function renderProject() {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;

  const tree = $('chapter-tree');
  tree.innerHTML = p.nodes.map(n => `
    <div class="tree-node ${n.id === activeNodeId ? 'active' : ''}" data-id="${n.id}">
      <span class="icon">${n.icon || '📄'}</span>
      <span class="nlabel">${n.title || 'Без названия'}</span>
      <button class="ndel" data-del="${n.id}" title="Удалить">✕</button>
    </div>
  `).join('') || '<p class="placeholder" style="font-size:0.85rem;">Пусто. Нажми ＋</p>';

  tree.querySelectorAll('.tree-node').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.classList.contains('ndel')) return;
      activeNodeId = el.dataset.id;
      renderProject();
    });
  });
  tree.querySelectorAll('.ndel').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm('Удалить раздел?')) return;
      p.nodes = p.nodes.filter(n => n.id !== btn.dataset.del);
      if (activeNodeId === btn.dataset.del) activeNodeId = p.nodes[0]?.id || null;
      saveProject(p);
      renderProject();
      toast('Раздел удалён');
    });
  });

  const node = p.nodes.find(n => n.id === activeNodeId);
  if (node) {
    $('node-title').value = node.title;
    $('node-content').value = node.content;
    $('node-meta').textContent = `Создано: ${node.created || '—'}`;
    updateCounts();
  } else {
    $('node-title').value = '';
    $('node-content').value = '';
    $('node-meta').textContent = '';
    updateCounts();
  }
}

function saveProject(p) {
  const arr = getProjects();
  const i = arr.findIndex(x => x.id === p.id);
  if (i >= 0) arr[i] = p;
  setProjects(arr);
}

function updateCounts() {
  const t = $('node-content').value;
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  $('word-count').textContent = `${words} слов`;
  $('char-count').textContent = `${t.length} символов`;
}

// ---- Автосохранение в редакторе ----
let saveTimer;
function autoSaveNode() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const p = getProjects().find(x => x.id === activeProjectId);
    if (!p) return;
    const node = p.nodes.find(n => n.id === activeNodeId);
    if (!node) return;
    node.title = $('node-title').value;
    node.content = $('node-content').value;
    saveProject(p);
    renderProject();
  }, 500);
}
$('node-title').addEventListener('input', autoSaveNode);
$('node-content').addEventListener('input', () => { updateCounts(); autoSaveNode(); });

// ---- Новый проект ----
$('new-project').addEventListener('click', async () => {
  const res = await promptModal('Новый проект', [
    { id: 'title', label: 'Название проекта', placeholder: 'Например: «Хроники Севера»', value: 'Новый проект' }
  ]);
  if (!res) return;
  const p = {
    id: uid(),
    title: res.title.trim() || 'Без названия',
    nodes: [
      { id: uid(), title: 'Глава 1', content: '', icon: '📖', created: new Date().toLocaleString('ru-RU') }
    ]
  };
  const arr = getProjects();
  arr.unshift(p);
  setProjects(arr);
  activeProjectId = p.id;
  openProject(p.id);
  toast('Проект создан ✓');
});

// ---- Переименовать проект ----
$('rename-project').addEventListener('click', () => {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  p.title = $('project-title').value.trim() || 'Без названия';
  saveProject(p);
  renderProjects();
  toast('Сохранено ✓');
});
$('project-title').addEventListener('input', () => {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  p.title = $('project-title').value || 'Без названия';
  saveProject(p);
  renderProjects();
});

// ---- Удалить проект ----
$('delete-project').addEventListener('click', () => {
  if (!confirm('Удалить весь проект?')) return;
  const arr = getProjects().filter(p => p.id !== activeProjectId);
  setProjects(arr);
  activeProjectId = null;
  activeNodeId = null;
  showEditorEmpty();
  renderProjects();
  toast('Проект удалён');
});

// ---- Добавить раздел ----
$('add-node').addEventListener('click', async () => {
  if (!activeProjectId) return toast('Сначала открой проект');
  const res = await promptModal('Новый раздел', [
    { id: 'title', label: 'Название', placeholder: 'Например: Глава 2' },
    { id: 'icon', label: 'Тип', type: 'select', options: [
      { v: '📖', l: '📖 Глава / Акт' },
      { v: '🎬', l: '🎬 Сцена / Сюжет' },
      { v: '👤', l: '👤 Персонаж' },
      { v: '🌍', l: '🌍 Мир' },
      { v: '🐉', l: '🐉 Существо' },
      { v: '🗺', l: '🗺 Локация' },
      { v: '📝', l: '📝 Заметка' }
    ] }
  ]);
  if (!res) return;
  const p = getProjects().find(x => x.id === activeProjectId);
  const node = {
    id: uid(),
    title: res.title.trim() || 'Без названия',
    content: '',
    icon: res.icon,
    created: new Date().toLocaleString('ru-RU')
  };
  p.nodes.push(node);
  activeNodeId = node.id;
  saveProject(p);
  renderProject();
  toast('Раздел добавлен ✓');
});

// ---- Отправить материал в проект ----
async function addNodeToActiveProject(title, content, icon) {
  const projects = getProjects();
  if (!projects.length) {
    // создадим новый проект
    const p = {
      id: uid(),
      title: 'Мой проект',
      nodes: [{ id: uid(), title, content, icon, created: new Date().toLocaleString('ru-RU') }]
    };
    setProjects([p]);
    activeProjectId = p.id;
    renderProjects();
    openProject(p.id);
    return;
  }
  // если проект открыт — добавим туда, иначе спросим
  if (activeProjectId) {
    const p = getProjects().find(x => x.id === activeProjectId);
    p.nodes.push({ id: uid(), title, content, icon, created: new Date().toLocaleString('ru-RU') });
    saveProject(p);
    renderProject();
    return;
  }
  // если проектов несколько, но не открыт — откроем первый
  openProject(projects[0].id);
  const p = getProjects().find(x => x.id === projects[0].id);
  p.nodes.push({ id: uid(), title, content, icon, created: new Date().toLocaleString('ru-RU') });
  saveProject(p);
  renderProject();
}

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
renderSaved();
renderProjects();
updateCounts();