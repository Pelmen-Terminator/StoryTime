// ============================================================
// StoryTime v1.4 — редакторы, схема отношений и настройки
// ============================================================
'use strict';

// ---------- ХЕЛПЕРЫ ----------
const $ = id => document.getElementById(id);
const rnd = arr => Array.isArray(arr) && arr.length ? arr[Math.floor(Math.random() * arr.length)] : '';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function escMultiline(str) {
  return esc(str).replace(/\n/g, '<br>');
}
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ============================================================
// ТЕМА
// ============================================================
(function initTheme() {
  const valid = ['light', 'beige', 'dark', 'navy', 'green', 'red', 'purple'];
  let savedTheme = 'dark';
  // На мобильных браузерах/в приватном режиме localStorage иногда недоступен.
  try {
    const stored = localStorage.getItem('storytime-theme');
    if (stored && valid.includes(stored)) savedTheme = stored;
  } catch (_) {}

  function applyTheme(theme, persist = true) {
    const safeTheme = valid.includes(theme) ? theme : 'dark';
    document.documentElement.dataset.theme = safeTheme;
    document.querySelectorAll('.theme-btn').forEach(btn => {
      const active = btn.dataset.theme === safeTheme;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (persist) {
      try { localStorage.setItem('storytime-theme', safeTheme); } catch (_) {}
    }
  }

  applyTheme(savedTheme, false);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
})();

// ============================================================
// TOAST
// ============================================================
let toastTimer;
function toast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ============================================================
// МОДАЛКА (Promise)
// ============================================================
let modalCleanup = null;
function promptModal(title, fields) {
  return new Promise(resolve => {
    if (modalCleanup) modalCleanup();

    const modal = $('modal');
    $('modal-title').textContent = title;
    const body = $('modal-body');

    body.innerHTML = fields.map(f => {
      const labelHtml = `<label style="display:block;font-size:0.82rem;color:var(--muted);margin-bottom:4px;">${esc(f.label)}</label>`;
      if (f.type === 'select') {
        const opts = f.options.map(o =>
          `<option value="${esc(o.v)}"${o.v === f.value ? ' selected' : ''}>${esc(o.l)}</option>`
        ).join('');
        return labelHtml + `<select id="mf-${esc(f.id)}">${opts}</select>`;
      }
      if (f.type === 'textarea') {
        return labelHtml + `<textarea id="mf-${esc(f.id)}" rows="5" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>`;
      }
      return labelHtml + `<input type="text" id="mf-${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" value="${esc(f.value || '')}">`;
    }).join('');

    const confirm = $('modal-confirm');
    const cancel = $('modal-cancel');

    const close = (val) => {
      modal.classList.remove('show');
      confirm.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKey);
      modalCleanup = null;
      resolve(val);
    };
    const onOk = () => {
      const values = {};
      fields.forEach(f => {
        const el = $('mf-' + f.id);
        if (el) values[f.id] = el.value;
      });
      close(values);
    };
    const onCancel = () => close(null);
    const onKey = (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !e.shiftKey) onOk();
      else if (e.key === 'Escape') onCancel();
    };

    confirm.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);
    modalCleanup = () => close(null);

    modal.classList.add('show');
    setTimeout(() => {
      const first = body.querySelector('input, select, textarea');
      if (first) first.focus();
    }, 60);
  });
}

// ============================================================
// ВКЛАДКИ
// ============================================================
(function initTabs() {
  const tabs = [...document.querySelectorAll('.tab[data-tab]')];
  function activateTab(id, updateHash = true) {
    const tab = tabs.find(item => item.dataset.tab === id);
    const panel = $(id);
    if (!tab || !panel) return;
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      item.setAttribute('tabindex', active ? '0' : '-1');
    });
    document.querySelectorAll('.panel').forEach(item => item.classList.toggle('active', item === panel));
    if (updateHash) {
      try { history.replaceState(null, '', `#${id}`); } catch (_) {}
    }
  }
  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
  document.querySelectorAll('[data-open-tab="updates"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      activateTab('updates');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  const initial = location.hash.slice(1);
  if (tabs.some(tab => tab.dataset.tab === initial)) activateTab(initial, false);
  else activateTab('projects', false);
})();

// ============================================================
// SELECT'Ы
// ============================================================
function fillSelect(id, items, { any = false, anyLabel = '🎲 Любой' } = {}) {
  const sel = $(id);
  if (!sel) return;
  const frag = document.createDocumentFragment();
  if (any) {
    const o = document.createElement('option');
    o.value = 'any';
    o.textContent = anyLabel;
    frag.appendChild(o);
  }
  items.forEach(([val, label]) => {
    const o = document.createElement('option');
    o.value = val;
    o.textContent = label;
    frag.appendChild(o);
  });
  sel.innerHTML = '';
  sel.appendChild(frag);
}

(function initSelects() {
  fillSelect('plot-genre', Object.entries(DATA.genres).map(([k, v]) => [k, v.name]), { any: true });
  fillSelect('char-origin', Object.entries(DATA.names).map(([k, v]) => [k, v.name]), { any: true });
  fillSelect('char-archetype', Object.entries(DATA.archetypes).map(([k, v]) => [k, v.name]), { any: true });
  fillSelect('creature-type', Object.entries(DATA.creatures).map(([k, v]) => [k, v.name]), { any: true });
  fillSelect('location-type', Object.entries(DATA.locations).map(([k, v]) => [k, v.name]), { any: true });
  fillSelect('name-origin', Object.entries(DATA.names).map(([k, v]) => [k, v.name]), { any: true });
})();

// ============================================================
// БИБЛИОТЕКА
// ============================================================
function getSaved() {
  try {
    const raw = localStorage.getItem('storytime-saved');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(x => x && typeof x === 'object') : [];
  } catch { return []; }
}
function setSaved(arr) {
  try { localStorage.setItem('storytime-saved', JSON.stringify(arr)); }
  catch { toast('Ошибка сохранения (переполнение?)'); }
}
function saveItem(type, content) {
  const arr = getSaved();
  arr.unshift({ type, content, date: new Date().toLocaleString('ru-RU') });
  if (arr.length > 500) arr.length = 500;
  setSaved(arr);
  renderSaved();
}

const renderSaved = () => {
  const arr = getSaved();
  const filterEl = $('filter-saved');
  const searchEl = $('search-saved');
  if (!filterEl || !searchEl) return;
  const filter = filterEl.value;
  const search = searchEl.value.toLowerCase().trim();
  const list = $('saved-list');

  const filtered = arr.filter(it => {
    if (filter !== 'all' && it.type !== filter) return false;
    if (search) {
      const hay = (it.content + ' ' + it.type).toLowerCase();
      if (!hay.includes(search)) return false;
    }
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
        <button class="del" data-i="${idx}" title="Удалить" aria-label="Удалить">✕</button>
        <div class="type">${esc(item.type)} · ${esc(item.date)}</div>
        <div class="content">${escMultiline(item.content)}</div>
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
};

$('search-saved')?.addEventListener('input', debounce(renderSaved, 150));
$('filter-saved')?.addEventListener('change', renderSaved);

$('clear-all')?.addEventListener('click', async () => {
  const res = await promptModal('Очистить библиотеку?', [
    { id: 'confirm', label: 'Напиши «да» для подтверждения', placeholder: 'да' }
  ]);
  if (!res || res.confirm.trim().toLowerCase() !== 'да') return toast('Отменено');
  setSaved([]);
  renderSaved();
  toast('Очищено');
});

$('export-json')?.addEventListener('click', () => {
  const data = getSaved();
  if (!data.length) return toast('Нет данных');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storytime-library-${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Экспортировано ✓');
});

$('import-json')?.addEventListener('click', () => $('import-file').click());
$('import-file')?.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('Файл слишком большой (лимит 5 МБ)'); e.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error('Not an array');
      const clean = imported.filter(x =>
        x && typeof x === 'object' &&
        typeof x.type === 'string' &&
        typeof x.content === 'string'
      ).map(x => ({
        type: String(x.type).slice(0, 50),
        content: String(x.content).slice(0, 100000),
        date: typeof x.date === 'string' ? x.date : new Date().toLocaleString('ru-RU')
      }));
      const arr = getSaved();
      setSaved([...clean, ...arr].slice(0, 500));
      renderSaved();
      toast(`Импортировано: ${clean.length}`);
    } catch {
      toast('Ошибка импорта: неверный формат');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ============================================================
// ГЕНЕРАТОР: СЮЖЕТ
// ============================================================
let lastPlot = '';
function genPlot() {
  const genre = $('plot-genre').value;
  const tone = $('plot-tone').value;
  const key = genre === 'any' ? rnd(Object.keys(DATA.genres)) : genre;
  const g = DATA.genres[key];
  if (!g) return;

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
$('gen-plot')?.addEventListener('click', genPlot);
$('new-writing-prompt')?.addEventListener('click', () => {
  const el = $('writing-prompt');
  if (el) el.textContent = rnd(DATA.writingPrompts) || 'Добавь собственную идею в базу.';
});
$('save-plot')?.addEventListener('click', () => {
  if (!lastPlot) return toast('Сначала сгенерируй сюжет');
  saveItem('Сюжет', lastPlot);
  toast('Сохранено ✓');
});
$('send-plot-to-project')?.addEventListener('click', () => {
  if (!lastPlot) return toast('Сначала сгенерируй сюжет');
  addNodeToActiveProject('Сюжет', lastPlot, 'plot');
  toast('Отправлено в проект ✓');
});

// ============================================================
// ГЕНЕРАТОР: ПЕРСОНАЖ
// ============================================================
let lastChar = '';
function genChar() {
  const origin = $('char-origin').value;
  const genderSel = $('char-gender').value;
  const archSel = $('char-archetype').value;

  const originKey = origin === 'any' ? rnd(Object.keys(DATA.names)) : origin;
  const gender = genderSel === 'any' ? rnd(['m', 'f']) : genderSel;
  const nameData = DATA.names[originKey];
  if (!nameData) return;
  const first = rnd(nameData[gender]);
  const last = rnd(gender === 'm' ? nameData.lastM : nameData.lastF);

  const archKey = archSel === 'any' ? rnd(Object.keys(DATA.archetypes)) : archSel;
  const arch = DATA.archetypes[archKey] || DATA.archetypes.hero;

  const c = DATA.character;
  const char = {
    name: `${first} ${last}`,
    origin: nameData.name,
    age: 16 + Math.floor(Math.random() * 55),
    gender: gender === 'm' ? 'Мужской' : 'Женский',
    archetype: arch.name,
    appearance: rnd(c.appearance),
    trait: `${rnd(arch.traits)}, ${rnd(c.traits)}`,
    flaw: `${rnd(arch.flaws)}, ${rnd(c.flaws)}`,
    secret: rnd(c.secrets),
    goal: `${rnd(arch.goals)}, ${rnd(c.goals)}`,
    quirk: rnd(c.quirks)
  };

  $('char-output').innerHTML = [
    ['Имя', char.name], ['Происхождение', char.origin], ['Архетип', char.archetype],
    ['Возраст', `${char.age} лет`], ['Пол', char.gender], ['Внешность', char.appearance],
    ['Черты', char.trait], ['Слабости', char.flaw], ['Привычка', char.quirk],
    ['Тайна', char.secret], ['Цель', char.goal]
  ].map(([k, v]) => `<div class="row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('');

  lastChar = `${char.name} (${char.age}, ${char.gender.toLowerCase()}, ${char.origin}).
Архетип: ${char.archetype}.
Внешность: ${char.appearance}.
Черты: ${char.trait}.
Слабости: ${char.flaw}.
Привычка: ${char.quirk}.
Тайна: ${char.secret}.
Цель: ${char.goal}.`;
  populateDetailedCharacter({ name: char.name, age: char.age, gender: char.gender, race: '', origin: char.origin, role: char.archetype, appearance: char.appearance, personality: `${char.trait}; слабости: ${char.flaw}; цель: ${char.goal}`, notes: `Тайна: ${char.secret}. Привычка: ${char.quirk}.` });
}
$('gen-char')?.addEventListener('click', genChar);
$('save-char')?.addEventListener('click', () => {
  if (!lastChar) return toast('Сначала создай персонажа');
  saveItem('Персонаж', lastChar);
  toast('Сохранено ✓');
});
$('send-char-to-project')?.addEventListener('click', () => {
  if (!lastChar) return toast('Сначала создай персонажа');
  addNodeToActiveProject('Персонаж', lastChar, 'character');
  toast('Отправлено в проект ✓');
});

// ============================================================
// ГЕНЕРАТОР: МИР
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
$('gen-world')?.addEventListener('click', genWorld);
$('save-world')?.addEventListener('click', () => {
  if (!lastWorld) return toast('Сначала сгенерируй мир');
  saveItem('Мир', withExtraNotes(lastWorld, 'Дополнительные сведения', [['world-detail-era','Эпоха и технологии'],['world-detail-geography','География и климат'],['world-detail-society','Общество и культура'],['world-detail-history','История и дополнительные конфликты']]));
  toast('Сохранено ✓');
});
$('send-world-to-project')?.addEventListener('click', () => {
  if (!lastWorld) return toast('Сначала сгенерируй мир');
  addNodeToActiveProject('Мир', withExtraNotes(lastWorld, 'Дополнительные сведения', [['world-detail-era','Эпоха и технологии'],['world-detail-geography','География и климат'],['world-detail-society','Общество и культура'],['world-detail-history','История и дополнительные конфликты']]), 'note');
  toast('Отправлено в проект ✓');
});

// ============================================================
// ГЕНЕРАТОР: СУЩЕСТВО
// ============================================================
let lastCreature = '';
function genCreature() {
  const typeSel = $('creature-type').value;
  const typeKey = typeSel === 'any' ? rnd(Object.keys(DATA.creatures)) : typeSel;
  const c = DATA.creatures[typeKey];
  if (!c) return;
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

  $('creature-output').innerHTML = [
    ['Имя', creature.name], ['Тип', creature.type], ['Характер', creature.trait],
    ['Способность', creature.ability], ['Слабость', creature.weakness],
    ['Среда обитания', creature.habitat]
  ].map(([k, v]) => `<div class="row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('');

  lastCreature = `${creature.name}.
Тип: ${creature.type}.
Характер: ${creature.trait}.
Способность: ${creature.ability}.
Слабость: ${creature.weakness}.
Обитает в: ${creature.habitat}.`;
}
$('gen-creature')?.addEventListener('click', genCreature);
$('save-creature')?.addEventListener('click', () => {
  if (!lastCreature) return toast('Сначала создай существо');
  saveItem('Существо', withExtraNotes(lastCreature, 'Дополнительные сведения', [['creature-detail-habitat','Среда обитания'],['creature-detail-behavior','Поведение и интеллект'],['creature-detail-abilities','Способности и ограничения'],['creature-detail-ecology','Роль в экосистеме']]));
  toast('Сохранено ✓');
});
$('send-creature-to-project')?.addEventListener('click', () => {
  if (!lastCreature) return toast('Сначала создай существо');
  addNodeToActiveProject('Существо', withExtraNotes(lastCreature, 'Дополнительные сведения', [['creature-detail-habitat','Среда обитания'],['creature-detail-behavior','Поведение и интеллект'],['creature-detail-abilities','Способности и ограничения'],['creature-detail-ecology','Роль в экосистеме']]), 'creature');
  toast('Отправлено в проект ✓');
});

// ============================================================
// ГЕНЕРАТОР: ЛОКАЦИЯ
// ============================================================
let lastLocation = '';
function genLocation() {
  const typeSel = $('location-type').value;
  const typeKey = typeSel === 'any' ? rnd(Object.keys(DATA.locations)) : typeSel;
  const l = DATA.locations[typeKey];
  if (!l) return;
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

  $('location-output').innerHTML = [
    ['Название', loc.name], ['Тип', loc.type], ['Ключевая черта', loc.feature],
    ['Проблема', loc.problem], ['Кто правит', loc.ruler]
  ].map(([k, v]) => `<div class="row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('');

  lastLocation = `${loc.name}.
Тип: ${loc.type}.
Черта: ${loc.feature}.
Проблема: ${loc.problem}.
Правитель: ${loc.ruler}.`;
}
$('gen-location')?.addEventListener('click', genLocation);
$('save-location')?.addEventListener('click', () => {
  if (!lastLocation) return toast('Сначала создай локацию');
  saveItem('Локация', withExtraNotes(lastLocation, 'Дополнительные сведения', [['location-detail-population','Население и устройство'],['location-detail-landmarks','Важные места'],['location-detail-atmosphere','Атмосфера и история'],['location-detail-dangers','Опасности и возможности']]));
  toast('Сохранено ✓');
});
$('send-location-to-project')?.addEventListener('click', () => {
  if (!lastLocation) return toast('Сначала создай локацию');
  addNodeToActiveProject('Локация', withExtraNotes(lastLocation, 'Дополнительные сведения', [['location-detail-population','Население и устройство'],['location-detail-landmarks','Важные места'],['location-detail-atmosphere','Атмосфера и история'],['location-detail-dangers','Опасности и возможности']]), 'location');
  toast('Отправлено в проект ✓');
});

// ============================================================
// ГЕНЕРАТОР: ИМЕНА
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
  if (!data) return;
  const genders = genderSel === 'any' ? ['m', 'f'] : [genderSel];

  const frag = document.createDocumentFragment();
  for (let i = 0; i < 9; i++) {
    const g = rnd(genders);
    let full = '';
    if (type === 'nick') full = rnd(DATA.nicknames);
    else if (type === 'first') full = rnd(data[g]);
    else full = `${rnd(data[g])} ${rnd(g === 'm' ? data.lastM : data.lastF)}`;
    lastNames.push(full);

    const card = document.createElement('div');
    card.className = 'name-card';
    const label = type === 'nick' ? 'прозвище' : (g === 'm' ? 'муж.' : 'жен.');
    card.innerHTML = `<div class="n">${esc(full)}</div><div class="tag">${esc(data.name)} · ${esc(label)}</div>`;
    card.addEventListener('click', () => {
      navigator.clipboard?.writeText(full).then(
        () => toast(`Скопировано: ${full}`),
        () => toast('Не удалось скопировать')
      );
    });
    frag.appendChild(card);
  }
  out.appendChild(frag);
}
$('gen-name')?.addEventListener('click', genNames);
$('save-names')?.addEventListener('click', () => {
  if (!lastNames.length) return toast('Сначала сгенерируй имена');
  lastNames.forEach(n => saveItem('Имя', n));
  toast(`${lastNames.length} имён сохранено ✓`);
});

// ============================================================
// КОНСТРУКТОР СЮЖЕТА
// ============================================================
const PB_FIELDS = ['exposition', 'inciting', 'rising', 'crisis', 'climax', 'resolution'];
const PB_LABELS = {
  exposition: 'Экспозиция',
  inciting: 'Завязка',
  rising: 'Развитие',
  crisis: 'Кризис',
  climax: 'Кульминация',
  resolution: 'Развязка'
};
const PB_KEY = 'storytime-plotbuilder';

function pbUpdateProgress() {
  let filled = 0;
  PB_FIELDS.forEach(f => {
    const el = $('pb-' + f);
    const step = el?.closest('.pb-step');
    if (!el) return;
    const isFilled = el.value.trim().length > 0;
    if (isFilled) filled++;
    if (step) step.classList.toggle('filled', isFilled);
  });
  const pct = Math.round((filled / PB_FIELDS.length) * 100);
  const fill = $('pb-progress-fill');
  const text = $('pb-progress-text');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = `${filled} / ${PB_FIELDS.length} шагов заполнено`;
}

const pbSaveLocal = debounce(() => {
  const data = {};
  PB_FIELDS.forEach(f => data[f] = $('pb-' + f)?.value || '');
  try { localStorage.setItem(PB_KEY, JSON.stringify(data)); } catch {}
}, 400);

PB_FIELDS.forEach(f => {
  const el = $('pb-' + f);
  if (!el) return;
  el.addEventListener('input', () => {
    pbUpdateProgress();
    pbSaveLocal();
  });
});

document.querySelectorAll('[data-roll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.roll;
    const hints = DATA.plotbuilderHints?.[key];
    if (!hints || !hints.length) return;
    const el = $('pb-' + key);
    if (!el) return;
    el.value = rnd(hints);
    pbUpdateProgress();
    pbSaveLocal();
  });
});

$('pb-clear')?.addEventListener('click', async () => {
  const res = await promptModal('Очистить конструктор?', [
    { id: 'confirm', label: 'Напиши «да» для подтверждения', placeholder: 'да' }
  ]);
  if (!res || res.confirm.trim().toLowerCase() !== 'да') return;
  PB_FIELDS.forEach(f => { const el = $('pb-' + f); if (el) el.value = ''; });
  pbUpdateProgress();
  pbSaveLocal();
  toast('Очищено');
});

$('pb-load-last')?.addEventListener('click', () => {
  try {
    const data = JSON.parse(localStorage.getItem(PB_KEY) || 'null');
    if (!data) return toast('Нет сохранённых данных');
    PB_FIELDS.forEach(f => { const el = $('pb-' + f); if (el && data[f]) el.value = data[f]; });
    pbUpdateProgress();
    toast('Загружено');
  } catch { toast('Ошибка загрузки'); }
});

function pbCollect() {
  const parts = [];
  PB_FIELDS.forEach(f => {
    const v = $('pb-' + f)?.value.trim();
    if (v) parts.push(`${PB_LABELS[f]}:\n${v}`);
  });
  return parts.join('\n\n');
}

$('pb-save')?.addEventListener('click', () => {
  const text = pbCollect();
  if (!text) return toast('Заполни хотя бы один шаг');
  saveItem('Конструктор', text);
  toast('Сохранено в библиотеку ✓');
});

$('pb-to-project')?.addEventListener('click', () => {
  const text = pbCollect();
  if (!text) return toast('Заполни хотя бы один шаг');
  addNodeToActiveProject('Сюжет (конструктор)', text, 'plot');
  toast('Отправлено в проект ✓');
});

document.querySelectorAll('[data-template]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.template;
    const tpl = DATA.plotTemplates?.[key];
    if (!tpl) return;
    const stepsText = tpl.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const target = $('pb-rising');
    if (target && !target.value.trim()) {
      target.value = `Схема «${tpl.name}»:\n${stepsText}`;
    } else {
      promptModal(`Шаблон: ${tpl.name}`, [
        { id: 'info', label: 'Скопируй схему:', type: 'textarea', value: stepsText }
      ]);
      return;
    }
    pbUpdateProgress();
    pbSaveLocal();
    toast(`Шаблон «${tpl.name}» применён`);
  });
});

(function pbRestore() {
  try {
    const data = JSON.parse(localStorage.getItem(PB_KEY) || 'null');
    if (data) {
      PB_FIELDS.forEach(f => { const el = $('pb-' + f); if (el && data[f]) el.value = data[f]; });
    }
  } catch {}
  pbUpdateProgress();
})();

// ============================================================
// ПРОЕКТЫ — ключи и миграция
// ============================================================
const PROJECTS_KEY = 'storytime-projects';
const PROJECTS_VERSION_KEY = 'storytime-projects-version';
const CURRENT_DATA_VERSION = 2;
const BACKUP_KEY = 'storytime-backups';

function guessTypeFromIcon(icon) {
  const map = {
    '📖': 'chapter', '🎬': 'act', '🎯': 'plot', '👤': 'character',
    '🌍': 'note', '🐉': 'creature', '🗺': 'location', '📝': 'note', '📄': 'note'
  };
  return map[icon] || 'note';
}

function migrateProjects(arr) {
  const fromVersion = +localStorage.getItem(PROJECTS_VERSION_KEY) || 1;
  if (fromVersion >= CURRENT_DATA_VERSION) return arr;

  const migrated = arr.map(p => ({
    ...p,
    nodes: (p.nodes || []).map(n => ({
      ...n,
      type: n.type || guessTypeFromIcon(n.icon),
      parentId: n.parentId || null,
      collapsed: n.collapsed || false
    }))
  }));

  localStorage.setItem(PROJECTS_VERSION_KEY, String(CURRENT_DATA_VERSION));
  return migrated;
}

function getProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    const valid = arr.filter(p => p && typeof p === 'object' && Array.isArray(p.nodes));
    return migrateProjects(valid);
  } catch { return []; }
}
function setProjects(arr) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(arr));
    localStorage.setItem(PROJECTS_VERSION_KEY, String(CURRENT_DATA_VERSION));
  } catch {
    toast('Ошибка сохранения. Сделай бэкап!');
  }
}

// ============================================================
// АВТОБЭКАП
// ============================================================
function createBackup(label = 'auto') {
  try {
    const snapshot = {
      date: new Date().toISOString(),
      label,
      projects: getProjects(),
      saved: getSaved(),
      plotbuilder: JSON.parse(localStorage.getItem(PB_KEY) || 'null'),
      relationships: JSON.parse(localStorage.getItem('storytime-relationships-v1') || '{"people":[],"links":[]}'),
      displaySettings: JSON.parse(localStorage.getItem('storytime-display-settings') || 'null')
    };
    const backups = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
    backups.unshift(snapshot);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0, 5)));
  } catch {}
}
function getBackups() {
  try { return JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]'); }
  catch { return []; }
}

(function scheduleAutoBackup() {
  const lastBackup = localStorage.getItem('storytime-last-backup') || '';
  const today = new Date().toISOString().slice(0, 10);
  if (lastBackup !== today) {
    setTimeout(() => {
      createBackup('auto-daily');
      localStorage.setItem('storytime-last-backup', today);
    }, 3000);
  }
})();

// ============================================================
// СОСТОЯНИЕ РЕДАКТОРА
// ============================================================
let activeProjectId = null;
let activeNodeId = null;
let isRenderingProject = false;

// ============================================================
// СПИСОК ПРОЕКТОВ
// ============================================================
function renderProjects() {
  const list = $('project-list');
  if (!list) return;
  const projects = getProjects();
  if (!projects.length) {
    list.innerHTML = '<p class="placeholder" style="font-size:0.85rem;">Пока нет проектов</p>';
    return;
  }
  list.innerHTML = projects.map(p => `
    <div class="project-item ${p.id === activeProjectId ? 'active' : ''}" data-id="${esc(p.id)}">
      <span class="pname">📚 ${esc(p.title || 'Без названия')}</span>
      <button class="pdel" data-del="${esc(p.id)}" title="Удалить" aria-label="Удалить">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('.project-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.pdel')) return;
      openProject(el.dataset.id);
    });
  });
  list.querySelectorAll('.pdel').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const res = await promptModal('Удалить проект?', [
        { id: 'confirm', label: 'Напиши «да» для подтверждения', placeholder: 'да' }
      ]);
      if (!res || res.confirm.trim().toLowerCase() !== 'да') return;
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
  const empty = $('editor-empty');
  const content = $('editor-content');
  if (empty) empty.style.display = 'flex';
  if (content) content.style.display = 'none';
  const pp = $('project-progress');
  if (pp) pp.innerHTML = '';
}

function openProject(id) {
  const p = getProjects().find(x => x.id === id);
  if (!p) return;
  activeProjectId = id;
  if (!p.nodes.length) {
    p.nodes.push({
      id: uid(), title: 'Глава 1', content: '',
      type: 'chapter', parentId: null,
      created: new Date().toLocaleString('ru-RU'), collapsed: false
    });
    saveProject(p);
  }
  activeNodeId = p.nodes[0].id;
  const empty = $('editor-empty');
  const content = $('editor-content');
  if (empty) empty.style.display = 'none';
  if (content) content.style.display = 'flex';
  const titleInput = $('project-title');
  if (titleInput) titleInput.value = p.title || '';
  renderProject();
  renderProjects();
}

function saveProject(p) {
  const arr = getProjects();
  const i = arr.findIndex(x => x.id === p.id);
  if (i >= 0) arr[i] = p;
  else arr.push(p);
  setProjects(arr);
}

function updateProjectProgress(p) {
  let words = 0, chars = 0;
  p.nodes.forEach(n => {
    const text = (n.content || '').trim();
    chars += text.length;
    words += text ? text.split(/\s+/).length : 0;
  });
  const filled = p.nodes.filter(n => (n.content || '').trim().length > 0).length;
  const pp = $('project-progress');
  if (!pp) return;
  pp.innerHTML = `
    <div class="pp-item">📄 Разделов: <strong>${p.nodes.length}</strong></div>
    <div class="pp-item">✍️ Заполнено: <strong>${filled}</strong></div>
    <div class="pp-item">📝 Слов: <strong>${words}</strong></div>
    <div class="pp-item">🔤 Символов: <strong>${chars}</strong></div>
  `;
}

// ============================================================
// ДЕРЕВО (с иерархией)
// ============================================================
function buildTree(nodes) {
  const byParent = {};
  nodes.forEach(n => {
    const p = n.parentId || 'root';
    if (!byParent[p]) byParent[p] = [];
    byParent[p].push(n);
  });
  return byParent;
}

function renderTreeNodes(parentId, byParent, depth = 0) {
  const children = byParent[parentId] || [];
  return children.map(n => {
    const hasKids = (byParent[n.id] || []).length > 0;
    const type = DATA.nodeTypes[n.type] || DATA.nodeTypes.note;
    const arrow = hasKids ? (n.collapsed ? '▶' : '▼') : ' ';
    const active = n.id === activeNodeId ? 'active' : '';
    const childHtml = hasKids && !n.collapsed
      ? renderTreeNodes(n.id, byParent, depth + 1)
      : '';
    return `
      <div class="tree-node ${active}" data-id="${esc(n.id)}" data-depth="${depth}">
        <span class="tree-arrow" data-toggle="${esc(n.id)}" style="width:14px;opacity:${hasKids ? 1 : 0.2};cursor:${hasKids ? 'pointer' : 'default'}">${arrow}</span>
        <span class="icon" style="color:${type.color}">${esc(type.icon)}</span>
        <span class="nlabel">${esc(n.title || 'Без названия')}</span>
        <button class="ndel" data-del="${esc(n.id)}" title="Удалить" aria-label="Удалить">✕</button>
      </div>
      ${childHtml}
    `;
  }).join('');
}

function renderProject() {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) { showEditorEmpty(); return; }

  isRenderingProject = true;

  const tree = $('chapter-tree');
  if (!tree) { isRenderingProject = false; return; }

  if (!p.nodes.length) {
    tree.innerHTML = '<p class="placeholder" style="font-size:0.85rem;">Пусто. Нажми ＋</p>';
  } else {
    const byParent = buildTree(p.nodes);
    tree.innerHTML = renderTreeNodes('root', byParent);

    tree.querySelectorAll('.tree-node').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.ndel') || e.target.closest('.tree-arrow')) return;
        activeNodeId = el.dataset.id;
        renderProject();
      });
    });
    tree.querySelectorAll('.tree-arrow').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = el.dataset.toggle;
        const node = p.nodes.find(n => n.id === id);
        if (!node) return;
        node.collapsed = !node.collapsed;
        saveProject(p);
        renderProject();
      });
    });
    tree.querySelectorAll('.ndel').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const res = await promptModal('Удалить раздел?', [
          { id: 'confirm', label: 'Напиши «да» для подтверждения', placeholder: 'да' }
        ]);
        if (!res || res.confirm.trim().toLowerCase() !== 'да') return;

        const toDelete = new Set([btn.dataset.del]);
        let changed = true;
        while (changed) {
          changed = false;
          p.nodes.forEach(n => {
            if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
              toDelete.add(n.id); changed = true;
            }
          });
        }
        p.nodes = p.nodes.filter(n => !toDelete.has(n.id));
        if (toDelete.has(activeNodeId)) activeNodeId = p.nodes[0]?.id || null;
        saveProject(p);
        renderProject();
        toast(`Удалено: ${toDelete.size}`);
      });
    });
  }

  // Редактор
  const node = p.nodes.find(n => n.id === activeNodeId);
  const titleInput = $('node-title');
  const contentInput = $('node-content');
  const iconDisplay = $('node-icon-display');
  const typeSelect = $('node-type-select');
  const meta = $('node-meta');

  if (node) {
    if (titleInput) titleInput.value = node.title || '';
    if (contentInput) contentInput.value = node.content || '';
    const type = DATA.nodeTypes[node.type] || DATA.nodeTypes.note;
    if (iconDisplay) {
      iconDisplay.textContent = type.icon;
      iconDisplay.style.color = type.color;
    }
    if (typeSelect) typeSelect.value = node.type || 'note';
    const parent = node.parentId ? p.nodes.find(n => n.id === node.parentId) : null;
    if (meta) meta.textContent = `Создано: ${node.created || '—'}` +
      (parent ? ` · Внутри: ${parent.title}` : '');
    updateNodeCounts();
  } else {
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    if (iconDisplay) iconDisplay.textContent = '📄';
    if (typeSelect) typeSelect.value = 'note';
    if (meta) meta.textContent = '';
    updateNodeCounts();
  }

  updateProjectProgress(p);
  renderProjectLore(p);
  isRenderingProject = false;
}

// ============================================================
// ЭНЦИКЛОПЕДИЯ ТЕКУЩЕГО ПРОЕКТА (не генератор)
// ============================================================
const PROJECT_ENTITY_TYPES = {
  character: { label: 'Персонаж', icon: '👤' },
  location: { label: 'Локация', icon: '🗺️' },
  event: { label: 'Событие', icon: '📅' },
  faction: { label: 'Организация / фракция', icon: '⚔️' },
  item: { label: 'Предмет', icon: '🗝️' },
  creature: { label: 'Существо / вид', icon: '🐉' }
};
function ensureProjectLore(p) {
  if (!Array.isArray(p.entities)) p.entities = [];
  if (!Array.isArray(p.relationships)) p.relationships = [];
}
function renderProjectLore(p) {
  const list = $('project-entity-list');
  const relList = $('project-relation-list');
  if (!list || !p) return;
  ensureProjectLore(p);
  const filter = $('project-entity-filter')?.value || 'all';
  const entities = p.entities.filter(e => filter === 'all' || e.type === filter);
  list.innerHTML = entities.length ? entities.map(e => {
    const type = PROJECT_ENTITY_TYPES[e.type] || PROJECT_ENTITY_TYPES.item;
    const details = e.type === 'character'
      ? [['Возраст',e.age],['Пол',e.gender],['Раса / вид',e.race],['Внешность',e.appearance],['Характер',e.personality],['Цель и мотивация',e.goals],['Биография',e.biography],['Друзья',e.friends],['Враги',e.enemies],['Родственники',e.family],['Прочее',e.notes]]
      : [['Происхождение / дата',e.origin],['Описание',e.description],['Связанные события и примечания',e.notes]];
    const text = details.filter(x => x[1]).map(x => `<p><strong>${esc(x[0])}:</strong> ${esc(x[1])}</p>`).join('');
    return `<article class="project-entity-card"><div class="project-entity-title"><span>${type.icon} <strong>${esc(e.name)}</strong></span><span class="project-entity-actions"><button class="btn ghost small" data-project-entity-edit="${esc(e.id)}">Изменить</button><button class="btn danger small" data-project-entity-delete="${esc(e.id)}">Удалить</button></span></div><span class="muted-small">${esc(type.label)}</span><div class="project-entity-details">${text || '<p class="muted-small">Пока нет дополнительных сведений.</p>'}</div></article>`;
  }).join('') : '<p class="placeholder">В этой категории пока нет элементов. Добавь их кнопкой выше — они сохранятся в текущем проекте.</p>';
  if (relList) {
    const chars = p.entities.filter(e => e.type === 'character');
    relList.innerHTML = p.relationships.length ? p.relationships.map(r => {
      const a = chars.find(e => e.id === r.from), b = chars.find(e => e.id === r.to);
      return a && b ? `<div class="project-relation-row"><span>👤 <strong>${esc(a.name)}</strong> <span class="relation-kind">${esc(r.kind)}</span> 👤 <strong>${esc(b.name)}</strong></span><button class="btn danger small" data-project-relation-delete="${esc(r.id)}">Удалить</button>${r.notes ? `<p>${esc(r.notes)}</p>` : ''}</div>` : '';
    }).join('') : '<p class="placeholder">Добавь минимум двух персонажей, затем нажми «Связать персонажей».</p>';
  }
  list.querySelectorAll('[data-project-entity-edit]').forEach(b => b.addEventListener('click', () => editProjectEntity(p, b.dataset.projectEntityEdit)));
  list.querySelectorAll('[data-project-entity-delete]').forEach(b => b.addEventListener('click', async () => {
    const e = p.entities.find(x => x.id === b.dataset.projectEntityDelete); if (!e) return;
    const res = await promptModal('Удалить элемент сюжета?', [{id:'confirm',label:`Напиши «да», чтобы удалить «${e.name}»`,placeholder:'да'}]);
    if (!res || res.confirm.trim().toLowerCase() !== 'да') return;
    p.entities = p.entities.filter(x => x.id !== e.id);
    p.relationships = p.relationships.filter(r => r.from !== e.id && r.to !== e.id);
    saveProject(p); renderProjectLore(p); toast('Элемент удалён');
  }));
  relList?.querySelectorAll('[data-project-relation-delete]').forEach(b => b.addEventListener('click', () => {
    p.relationships = p.relationships.filter(r => r.id !== b.dataset.projectRelationDelete); saveProject(p); renderProjectLore(p);
  }));
}
async function editProjectEntity(p, id = null) {
  ensureProjectLore(p);
  const old = id ? p.entities.find(e => e.id === id) : null;
  const typeOptions = Object.entries(PROJECT_ENTITY_TYPES).map(([v,t]) => ({v,l:`${t.icon} ${t.label}`}));
  const base = [
    {id:'type',label:'Тип элемента',type:'select',options:typeOptions,value:old?.type || 'character'},
    {id:'name',label:'Имя / название',placeholder:'Название элемента',value:old?.name || ''}
  ];
  // Ask type first so the editor remains compact and tailored to the selected kind.
  const first = await promptModal(old ? 'Изменить элемент сюжета' : 'Новый элемент собственного сюжета', base);
  if (!first || !first.name.trim()) return;
  const type = first.type || old?.type || 'character';
  let fields;
  if (type === 'character') fields = [
    {id:'age',label:'Возраст',value:old?.age || ''},{id:'gender',label:'Пол / гендер',value:old?.gender || ''},{id:'race',label:'Раса / вид и происхождение',value:old?.race || ''},
    {id:'appearance',label:'Внешность',type:'textarea',value:old?.appearance || ''},{id:'personality',label:'Характер',type:'textarea',value:old?.personality || ''},{id:'goals',label:'Цели, мотивация и внутренний конфликт',type:'textarea',value:old?.goals || ''},{id:'biography',label:'Биография и роль в сюжете',type:'textarea',value:old?.biography || ''},{id:'friends',label:'Друзья и союзники',type:'textarea',value:old?.friends || ''},{id:'enemies',label:'Враги и соперники',type:'textarea',value:old?.enemies || ''},{id:'family',label:'Родственники',type:'textarea',value:old?.family || ''},{id:'notes',label:'Остальная информация',type:'textarea',value:old?.notes || ''}
  ]; else if (type === 'location') fields = [{id:'origin',label:'Расположение / эпоха',value:old?.origin || ''},{id:'description',label:'Описание, атмосфера и назначение',type:'textarea',value:old?.description || ''},{id:'notes',label:'История, жители, важные сцены и опасности',type:'textarea',value:old?.notes || ''}];
  else if (type === 'event') fields = [{id:'origin',label:'Дата / период',value:old?.origin || ''},{id:'description',label:'Причина и участники',type:'textarea',value:old?.description || ''},{id:'notes',label:'Ход события, последствия и связь с сюжетом',type:'textarea',value:old?.notes || ''}];
  else if (type === 'faction') fields = [{id:'origin',label:'Основание / эпоха',value:old?.origin || ''},{id:'description',label:'Цели, идеология, руководство',type:'textarea',value:old?.description || ''},{id:'notes',label:'Союзники, противники, история и структура',type:'textarea',value:old?.notes || ''}];
  else if (type === 'creature') fields = [{id:'origin',label:'Среда обитания / происхождение',value:old?.origin || ''},{id:'description',label:'Внешность, поведение, способности',type:'textarea',value:old?.description || ''},{id:'notes',label:'Экология, ограничения и роль в истории',type:'textarea',value:old?.notes || ''}];
  else fields = [{id:'origin',label:'Происхождение / владелец',value:old?.origin || ''},{id:'description',label:'Свойства и описание',type:'textarea',value:old?.description || ''},{id:'notes',label:'История и значение для повествования',type:'textarea',value:old?.notes || ''}];
  const details = await promptModal(`Подробности: ${first.name.trim()}`, fields);
  if (!details) return;
  const entity = {...(old || {}), id:old?.id || uid(), type, name:first.name.trim(), ...details};
  if (old) p.entities = p.entities.map(e => e.id === old.id ? entity : e); else p.entities.push(entity);
  saveProject(p); renderProjectLore(p); toast(old ? 'Элемент обновлён' : 'Добавлено в собственный сюжет');
}
$('project-entity-add')?.addEventListener('click', () => {
  const p = getProjects().find(x => x.id === activeProjectId); if (!p) return toast('Сначала открой свой проект'); editProjectEntity(p);
});
$('project-entity-filter')?.addEventListener('change', () => { const p=getProjects().find(x=>x.id===activeProjectId); if(p) renderProjectLore(p); });
$('project-relation-add')?.addEventListener('click', async () => {
  const p = getProjects().find(x => x.id === activeProjectId); if (!p) return toast('Сначала открой свой проект'); ensureProjectLore(p);
  const chars = p.entities.filter(e => e.type === 'character'); if (chars.length < 2) return toast('Сначала добавь минимум двух персонажей в свой сюжет');
  const opts = chars.map(c => ({v:c.id,l:c.name}));
  const kinds = ['Друзья','Враги','Родственники','Коллеги','Любовный интерес','Союзники','Соперники','Предательство','Наставник и ученик','Знакомые','Другое'].map(x=>({v:x,l:x}));
  const r = await promptModal('Связь между персонажами этого сюжета', [{id:'from',label:'Первый персонаж',type:'select',options:opts},{id:'kind',label:'Тип отношений',type:'select',options:kinds},{id:'to',label:'Второй персонаж',type:'select',options:opts},{id:'notes',label:'История / примечание',type:'textarea',placeholder:'Почему они связаны? Что между ними произошло?'}]);
  if (!r || r.from === r.to) return r ? toast('Выбери двух разных персонажей') : null;
  p.relationships.push({id:uid(),from:r.from,to:r.to,kind:r.kind,notes:r.notes || ''}); saveProject(p); renderProjectLore(p); toast('Связь добавлена в проект');
});

// ============================================================
// СЧЁТЧИКИ И СТАТУС СОХРАНЕНИЯ
// ============================================================
function updateNodeCounts() {
  const t = $('node-content')?.value || '';
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  const wc = $('word-count');
  const cc = $('char-count');
  if (wc) wc.textContent = `${words} слов`;
  if (cc) cc.textContent = `${t.length} символов`;
}

function setSaveStatus(status) {
  const el = $('save-status');
  if (!el) return;
  if (status === 'saving') {
    el.textContent = '💾 Сохранение…';
    el.className = 'save-status saving';
  } else {
    el.textContent = '✓ Сохранено';
    el.className = 'save-status saved';
  }
}

const autoSaveNode = debounce(() => {
  if (isRenderingProject) return;
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  const node = p.nodes.find(n => n.id === activeNodeId);
  if (!node) return;
  node.title = $('node-title')?.value || '';
  node.content = $('node-content')?.value || '';
  saveProject(p);

  const tree = $('chapter-tree');
  if (tree) {
    const el = tree.querySelector(`.tree-node[data-id="${CSS.escape(activeNodeId)}"] .nlabel`);
    if (el) el.textContent = node.title || 'Без названия';
  }
  updateProjectProgress(p);
  setSaveStatus('saved');
}, 600);

function onEditorInput() {
  updateNodeCounts();
  setSaveStatus('saving');
  autoSaveNode();
}

$('node-title')?.addEventListener('input', onEditorInput);
$('node-content')?.addEventListener('input', onEditorInput);

// ============================================================
// ТИП УЗЛА — SELECT
// ============================================================
(function initNodeTypeSelect() {
  const sel = $('node-type-select');
  if (!sel) return;
  sel.innerHTML = Object.entries(DATA.nodeTypes).map(([k, v]) =>
    `<option value="${k}">${v.icon} ${v.label}</option>`
  ).join('');
  sel.addEventListener('change', () => {
    const p = getProjects().find(x => x.id === activeProjectId);
    if (!p) return;
    const node = p.nodes.find(n => n.id === activeNodeId);
    if (!node) return;
    node.type = sel.value;
    saveProject(p);
    renderProject();
  });
})();

// ============================================================
// СОЗДАНИЕ ПРОЕКТОВ
// ============================================================
$('new-project')?.addEventListener('click', async () => {
  const res = await promptModal('Новый проект', [
    { id: 'title', label: 'Название проекта', placeholder: 'Например: «Хроники Севера»', value: 'Новый проект' }
  ]);
  if (!res) return;
  const p = {
    id: uid(),
    title: res.title.trim() || 'Без названия',
    nodes: [{
      id: uid(), title: 'Глава 1', content: '',
      type: 'chapter', parentId: null,
      created: new Date().toLocaleString('ru-RU'), collapsed: false
    }]
  };
  const arr = getProjects();
  arr.unshift(p);
  setProjects(arr);
  activeProjectId = p.id;
  openProject(p.id);
  toast('Проект создан ✓');
});

async function createFromTemplate(templateKey) {
  const tpl = DATA.projectTemplates?.[templateKey];
  if (!tpl) return;
  const defaultName = tpl.name.replace(/^[^\s]+\s/, '') || 'Новый проект';
  const res = await promptModal('Название проекта', [
    { id: 'title', label: `Шаблон: ${tpl.name}`, placeholder: 'Введи название', value: defaultName }
  ]);
  if (!res) return;

  const created = new Date().toLocaleString('ru-RU');
  const nodes = [];
  const idMap = {};

  tpl.nodes.forEach((n, i) => {
    const id = uid();
    idMap[i] = id;
    nodes.push({
      id,
      title: n.title,
      content: '',
      type: n.typeKey || n.type || 'note',
      parentId: (n.parent !== undefined && idMap[n.parent]) ? idMap[n.parent] : null,
      created,
      collapsed: false
    });
  });

  const project = {
    id: uid(),
    title: res.title.trim() || defaultName,
    nodes
  };
  const arr = getProjects();
  arr.unshift(project);
  setProjects(arr);
  activeProjectId = project.id;
  openProject(project.id);
  toast(`Проект «${project.title}» создан ✓`);
}

$('new-from-template')?.addEventListener('click', async () => {
  const options = Object.entries(DATA.projectTemplates || {}).map(([k, v]) => ({ v: k, l: v.name }));
  const res = await promptModal('Выбери шаблон', [
    { id: 'tpl', label: 'Шаблон', type: 'select', options }
  ]);
  if (!res) return;
  createFromTemplate(res.tpl);
});

document.querySelectorAll('[data-template-quick]').forEach(btn => {
  btn.addEventListener('click', () => createFromTemplate(btn.dataset.templateQuick));
});

// ============================================================
// РЕДАКТИРОВАНИЕ ПРОЕКТА
// ============================================================
const saveProjectTitle = debounce(() => {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  p.title = $('project-title')?.value.trim() || 'Без названия';
  saveProject(p);
  renderProjects();
  setSaveStatus('saved');
}, 500);

$('project-title')?.addEventListener('input', () => {
  setSaveStatus('saving');
  saveProjectTitle();
});

$('delete-project')?.addEventListener('click', async () => {
  if (!activeProjectId) return;
  const res = await promptModal('Удалить проект?', [
    { id: 'confirm', label: 'Напиши «да» для подтверждения', placeholder: 'да' }
  ]);
  if (!res || res.confirm.trim().toLowerCase() !== 'да') return;
  const arr = getProjects().filter(p => p.id !== activeProjectId);
  setProjects(arr);
  activeProjectId = null;
  activeNodeId = null;
  showEditorEmpty();
  renderProjects();
  toast('Проект удалён');
});

$('export-project')?.addEventListener('click', () => {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(p.title || 'project').replace(/[^a-zа-я0-9]/gi, '_')}-${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Проект экспортирован ✓');
});

$('project-stats')?.addEventListener('click', () => {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  let words = 0, chars = 0;
  const byType = {};
  p.nodes.forEach(n => {
    const text = (n.content || '').trim();
    chars += text.length;
    words += text ? text.split(/\s+/).length : 0;
    const t = DATA.nodeTypes[n.type] || DATA.nodeTypes.note;
    const key = `${t.icon} ${t.label}`;
    byType[key] = (byType[key] || 0) + 1;
  });
  const byTypeText = Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join('\n');
  promptModal(`Статистика: ${p.title}`, [
    { id: 'stats', label: 'Данные', type: 'textarea', value:
`Разделов: ${p.nodes.length}
Заполнено: ${p.nodes.filter(n => (n.content || '').trim()).length}
Слов: ${words}
Символов: ${chars}

По типам:
${byTypeText}` }
  ]);
});

// ============================================================
// ДОБАВЛЕНИЕ УЗЛОВ
// ============================================================
async function addNode(parentId = null) {
  if (!activeProjectId) return toast('Сначала открой проект');
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;

  const typeOptions = Object.entries(DATA.nodeTypes).map(([k, v]) => ({ v: k, l: `${v.icon} ${v.label}` }));
  const parentOptions = [{ v: '', l: '— Корень проекта —' }].concat(
    p.nodes.filter(n => n.type === 'act' || n.type === 'chapter' || !n.parentId)
      .map(n => {
        const t = DATA.nodeTypes[n.type] || DATA.nodeTypes.note;
        return { v: n.id, l: `${t.icon} ${n.title}` };
      })
  );

  const fields = [
    { id: 'title', label: 'Название', placeholder: 'Например: Глава 2' },
    { id: 'type', label: 'Тип', type: 'select', options: typeOptions, value: 'chapter' }
  ];
  if (!parentId) {
    fields.push({ id: 'parentId', label: 'Внутри (опционально)', type: 'select', options: parentOptions });
  }

  const res = await promptModal(parentId ? 'Новый подраздел' : 'Новый раздел', fields);
  if (!res) return;

  const node = {
    id: uid(),
    title: res.title.trim() || 'Без названия',
    content: '',
    type: res.type || 'chapter',
    parentId: parentId || res.parentId || null,
    created: new Date().toLocaleString('ru-RU'),
    collapsed: false
  };
  p.nodes.push(node);
  activeNodeId = node.id;

  if (node.parentId) {
    const parent = p.nodes.find(n => n.id === node.parentId);
    if (parent) parent.collapsed = false;
  }

  saveProject(p);
  renderProject();
  toast('Раздел добавлен ✓');
}

$('add-node')?.addEventListener('click', () => addNode(null));
$('add-child')?.addEventListener('click', () => {
  if (!activeNodeId) return toast('Выбери раздел-родитель');
  addNode(activeNodeId);
});

// ============================================================
// ОТПРАВКА В ПРОЕКТ
// ============================================================
async function addNodeToActiveProject(title, content, suggestedType = 'note') {
  const projects = getProjects();

  if (!activeProjectId && projects.length) {
    activeProjectId = projects[0].id;
  }

  if (!activeProjectId) {
    const p = {
      id: uid(),
      title: 'Мой проект',
      nodes: [{
        id: uid(), title, content,
        type: suggestedType, parentId: null,
        created: new Date().toLocaleString('ru-RU'), collapsed: false
      }]
    };
    setProjects([p]);
    renderProjects();
    openProject(p.id);
    return;
  }

  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;

  const parentOptions = [{ v: '', l: '— В корень проекта —' }].concat(
    p.nodes.filter(n => n.type === 'act' || n.type === 'chapter')
      .map(n => {
        const t = DATA.nodeTypes[n.type] || DATA.nodeTypes.note;
        return { v: n.id, l: `${t.icon} ${n.title}` };
      })
  );

  const res = await promptModal(`Куда добавить «${title}»?`, [
    { id: 'parentId', label: 'Поместить внутрь', type: 'select', options: parentOptions }
  ]);
  if (!res) return;

  p.nodes.push({
    id: uid(), title, content,
    type: suggestedType,
    parentId: res.parentId || null,
    created: new Date().toLocaleString('ru-RU'),
    collapsed: false
  });
  if (res.parentId) {
    const parent = p.nodes.find(n => n.id === res.parentId);
    if (parent) parent.collapsed = false;
  }
  saveProject(p);
  renderProject();
  toast('Добавлено в проект ✓');
}

// ============================================================
// HELP-ПАНЕЛЬ
// ============================================================
function openHelp(key) {
  const panel = $('help-panel');
  if (!panel) return;
  const tips = DATA.helpTips || {};
  const titleEl = $('help-title');
  const textEl = $('help-text');
  if (titleEl) titleEl.textContent = '💡 Подсказка';
  if (textEl) textEl.textContent = tips[key] || 'Всё сохраняется автоматически.';
  panel.classList.add('show');
  panel.setAttribute('aria-hidden', 'false');
}
$('help-close')?.addEventListener('click', () => {
  const panel = $('help-panel');
  if (!panel) return;
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden', 'true');
});
document.querySelectorAll('[data-help]').forEach(btn => {
  btn.addEventListener('click', () => openHelp(btn.dataset.help));
});
$('help-btn')?.addEventListener('click', () => openHelp('projects'));

// ============================================================
// БЭКАПЫ
// ============================================================
$('backup-btn')?.addEventListener('click', async () => {
  const backups = getBackups();
  const info = backups.length
    ? backups.map((b, i) => `${i + 1}. ${b.label} — ${new Date(b.date).toLocaleString('ru-RU')}`).join('\n')
    : 'Нет резервных копий';

  const res = await promptModal('Резервные копии', [
    { id: 'info', label: 'Сохранённые снапшоты:', type: 'textarea', value: info },
    { id: 'action', label: 'Действие', type: 'select', options: [
      { v: 'none', l: 'Ничего' },
      { v: 'create', l: '📦 Создать бэкап сейчас' },
      { v: 'restore-1', l: '↺ Восстановить последний' },
      { v: 'export-all', l: '⬇ Экспортировать ВСЁ (проекты + библиотека)' },
      { v: 'clear', l: '🗑 Очистить все бэкапы' }
    ] }
  ]);
  if (!res || res.action === 'none') return;

  if (res.action === 'create') {
    createBackup('manual');
    toast('Бэкап создан ✓');
  } else if (res.action === 'restore-1') {
    const b = getBackups()[0];
    if (!b) return toast('Нет бэкапов');
    const confirm = await promptModal('Восстановить?', [
      { id: 'c', label: `Восстановить от ${new Date(b.date).toLocaleString('ru-RU')}? Напиши «да»`, placeholder: 'да' }
    ]);
    if (!confirm || confirm.c.trim().toLowerCase() !== 'да') return;
    setProjects(b.projects || []);
    setSaved(b.saved || []);
    if (b.plotbuilder) localStorage.setItem(PB_KEY, JSON.stringify(b.plotbuilder));
    if (b.relationships) localStorage.setItem('storytime-relationships-v1', JSON.stringify(b.relationships));
    if (b.displaySettings) localStorage.setItem('storytime-display-settings', JSON.stringify(b.displaySettings));
    window.dispatchEvent(new Event('storytime-relationships-restored'));
    window.dispatchEvent(new Event('storytime-settings-restored'));
    renderProjects();
    renderSaved();
    activeProjectId = null;
    showEditorEmpty();
    toast('Восстановлено ✓');
  } else if (res.action === 'export-all') {
    const all = {
      version: CURRENT_DATA_VERSION,
      date: new Date().toISOString(),
      projects: getProjects(),
      saved: getSaved(),
      plotbuilder: JSON.parse(localStorage.getItem(PB_KEY) || 'null'),
      relationships: JSON.parse(localStorage.getItem('storytime-relationships-v1') || '{"people":[],"links":[]}'),
      displaySettings: JSON.parse(localStorage.getItem('storytime-display-settings') || 'null')
    };
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storytime-full-backup-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Экспортировано ✓');
  } else if (res.action === 'clear') {
    localStorage.removeItem(BACKUP_KEY);
    toast('Бэкапы очищены');
  }
});

// ============================================================
// ОНБОРДИНГ
// ============================================================
(function onboarding() {
  if (localStorage.getItem('storytime-onboarded')) return;
  const modal = $('onboarding');
  if (!modal) return;
  modal.classList.add('show');
  const finish = () => {
    modal.classList.remove('show');
    localStorage.setItem('storytime-onboarded', '1');
  };
  $('onboarding-start')?.addEventListener('click', finish);
  $('onboarding-later')?.addEventListener('click', finish);
})();

// ============================================================
// ГОРЯЧИЕ КЛАВИШИ
// ============================================================
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (activeProjectId && $('projects')?.classList.contains('active')) {
      const p = getProjects().find(x => x.id === activeProjectId);
      if (p) {
        p.title = $('project-title')?.value.trim() || 'Без названия';
        const node = p.nodes.find(n => n.id === activeNodeId);
        if (node) {
          node.title = $('node-title')?.value || '';
          node.content = $('node-content')?.value || '';
        }
        saveProject(p);
        renderProjects();
        setSaveStatus('saved');
        toast('Сохранено ✓');
      }
    }
  }
});

// ============================================================
// ЗАЩИТА ОТ ПОТЕРИ ДАННЫХ
// ============================================================
window.addEventListener('beforeunload', () => {
  if (activeProjectId) {
    const p = getProjects().find(x => x.id === activeProjectId);
    if (p) {
      const node = p.nodes.find(n => n.id === activeNodeId);
      if (node) {
        node.title = $('node-title')?.value || node.title;
        node.content = $('node-content')?.value || node.content;
        saveProject(p);
      }
    }
  }
});

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
renderSaved();
renderProjects();
showEditorEmpty();
// ============================================================
// StoryTime v1.4 — настройки отображения
// ============================================================
(function initDisplaySettings() {
  const defaults = { fontSize: 100, textWidth: 1200, lineHeight: 16, density: 'comfortable' };
  let settings = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem('storytime-display-settings') || 'null');
    if (saved && typeof saved === 'object') settings = { ...defaults, ...saved };
  } catch (_) {}

  const clamp = (v, min, max, fallback) => Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback;
  function apply() {
    settings.fontSize = clamp(settings.fontSize, 85, 125, defaults.fontSize);
    settings.textWidth = clamp(settings.textWidth, 800, 1600, defaults.textWidth);
    settings.lineHeight = clamp(settings.lineHeight, 12, 22, defaults.lineHeight);
    if (!['comfortable', 'normal', 'compact'].includes(settings.density)) settings.density = defaults.density;
    document.documentElement.style.setProperty('--user-font-scale', String(settings.fontSize / 100));
    document.documentElement.style.setProperty('--user-text-width', `${settings.textWidth}px`);
    document.documentElement.style.setProperty('--user-line-height', String(settings.lineHeight / 10));
    document.documentElement.dataset.density = settings.density;
    const font = $('setting-font-size'), width = $('setting-text-width'), line = $('setting-line-height'), density = $('setting-density');
    if (font) font.value = String(settings.fontSize);
    if (width) width.value = String(settings.textWidth);
    if (line) line.value = String(settings.lineHeight);
    if (density) density.value = settings.density;
    if ($('setting-font-size-value')) $('setting-font-size-value').textContent = `${settings.fontSize}%`;
    if ($('setting-text-width-value')) $('setting-text-width-value').textContent = `${settings.textWidth} px`;
    if ($('setting-line-height-value')) $('setting-line-height-value').textContent = (settings.lineHeight / 10).toFixed(1);
    try { localStorage.setItem('storytime-display-settings', JSON.stringify(settings)); } catch (_) {}
  }
  $('setting-font-size')?.addEventListener('input', e => { settings.fontSize = +e.target.value; apply(); });
  $('setting-text-width')?.addEventListener('input', e => { settings.textWidth = +e.target.value; apply(); });
  $('setting-line-height')?.addEventListener('input', e => { settings.lineHeight = +e.target.value; apply(); });
  $('setting-density')?.addEventListener('change', e => { settings.density = e.target.value; apply(); });
  $('settings-reset')?.addEventListener('click', () => { settings = { ...defaults }; apply(); toast('Настройки сброшены'); });
  window.addEventListener('storytime-settings-restored', () => { try { const restored = JSON.parse(localStorage.getItem('storytime-display-settings') || 'null'); settings = { ...defaults, ...(restored || {}) }; } catch (_) { settings = { ...defaults }; } apply(); });
  apply();
})();

// ============================================================
// StoryTime v1.4 — расширенная карточка персонажа
// ============================================================
function getDetailedCharacter() {
  const get = id => ($(id)?.value || '').trim();
  return {
    name: get('detail-char-name'), age: get('detail-char-age'), gender: get('detail-char-gender'),
    race: get('detail-char-race'), origin: get('detail-char-origin'), role: get('detail-char-role'),
    friends: get('detail-char-friends'), enemies: get('detail-char-enemies'), relatives: get('detail-char-relatives'),
    allies: get('detail-char-allies'), appearance: get('detail-char-appearance'), personality: get('detail-char-personality'), notes: get('detail-char-notes')
  };
}
function populateDetailedCharacter(c = {}) {
  const map = {
    'detail-char-name': c.name, 'detail-char-age': c.age, 'detail-char-gender': c.gender,
    'detail-char-race': c.race, 'detail-char-origin': c.origin, 'detail-char-role': c.role,
    'detail-char-friends': c.friends, 'detail-char-enemies': c.enemies, 'detail-char-relatives': c.relatives,
    'detail-char-allies': c.allies, 'detail-char-appearance': c.appearance, 'detail-char-personality': c.personality, 'detail-char-notes': c.notes
  };
  Object.entries(map).forEach(([id, value]) => { const el = $(id); if (el && value != null) el.value = String(value); });
}
function detailedCharacterText(c = getDetailedCharacter()) {
  const labels = { name: 'Имя', age: 'Возраст', gender: 'Пол / гендер', race: 'Раса / вид', origin: 'Происхождение', role: 'Роль в истории', friends: 'Друзья', enemies: 'Враги', relatives: 'Родственники', allies: 'Союзники и коллеги', appearance: 'Внешность', personality: 'Характер и мотивация', notes: 'Биография и прочая информация' };
  return Object.entries(labels).filter(([key]) => c[key] !== '' && c[key] != null).map(([key, label]) => `${label}: ${c[key]}`).join('\n');
}
$('save-detailed-char')?.addEventListener('click', () => {
  const c = getDetailedCharacter();
  if (!c.name) return toast('Укажи имя персонажа');
  saveItem('Персонаж', detailedCharacterText(c));
  toast('Карточка персонажа сохранена');
});
$('send-detailed-char-project')?.addEventListener('click', () => {
  const c = getDetailedCharacter();
  if (!c.name) return toast('Укажи имя персонажа');
  addNodeToActiveProject('Персонаж: ' + c.name, detailedCharacterText(c), 'character');
  toast('Карточка добавлена в проект');
});

// ============================================================
// StoryTime v1.4 — интерактивная схема отношений
// ============================================================
(function initRelationshipMap() {
  const KEY = 'storytime-relationships-v1';
  const types = ['Друзья', 'Враги', 'Родственники', 'Коллеги', 'Предательство', 'Любовный интерес', 'Наставник и ученик', 'Союзники', 'Соперники', 'Долг / обязательство', 'Другое'];
  let graph = { people: [], links: [] };
  let selectedId = null;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (parsed && Array.isArray(parsed.people) && Array.isArray(parsed.links)) graph = parsed;
  } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(graph)); } catch (_) { toast('Не удалось сохранить схему: память браузера недоступна'); } };
  const personById = id => graph.people.find(p => p.id === id);
  function fillPeopleSelects() {
    ['relation-from', 'relation-to'].forEach(id => {
      const el = $(id); if (!el) return;
      const old = el.value;
      el.innerHTML = '<option value="">— Выбери персонажа —</option>' + graph.people.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
      if (graph.people.some(p => p.id === old)) el.value = old;
    });
  }
  function render() {
    fillPeopleSelects();
    const peopleList = $('relation-person-list');
    if (peopleList) peopleList.innerHTML = graph.people.length ? graph.people.map(p => `<div class="relation-person-row"><button class="text-link" data-select-person="${esc(p.id)}">${esc(p.name)}</button><button class="mini-delete" data-delete-person="${esc(p.id)}" aria-label="Удалить ${esc(p.name)}">×</button></div>`).join('') : '<p class="placeholder">Пока нет персонажей.</p>';
    const linksList = $('relation-links-list');
    if (linksList) linksList.innerHTML = graph.links.length ? graph.links.map(l => {
      const a = personById(l.from), b = personById(l.to);
      return `<div class="relation-link-row"><div><strong>${esc(a?.name || 'Удалён')}</strong> <span class="muted-small">— ${esc(l.type)} →</span> <strong>${esc(b?.name || 'Удалён')}</strong>${l.note ? `<p>${esc(l.note)}</p>` : ''}</div><button class="mini-delete" data-delete-link="${esc(l.id)}" aria-label="Удалить связь">×</button></div>`;
    }).join('') : '<p class="placeholder">Связей пока нет.</p>';
    renderMap();
  }
  function renderMap() {
    const holder = $('relationship-map'); if (!holder) return;
    if (!graph.people.length) { holder.innerHTML = '<p class="placeholder">Добавь персонажей, чтобы построить схему.</p>'; return; }
    const w = 720, h = Math.max(320, Math.ceil(graph.people.length / 4) * 145 + 80);
    const positions = new Map();
    graph.people.forEach((p, i) => {
      const cols = Math.min(4, Math.max(1, graph.people.length));
      const row = Math.floor(i / cols), col = i % cols;
      const rowCount = Math.min(cols, graph.people.length - row * cols);
      positions.set(p.id, { x: (w / (rowCount + 1)) * (col + 1), y: 58 + row * 145 });
    });
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Схема отношений персонажей');
    graph.links.forEach(l => {
      const a = positions.get(l.from), b = positions.get(l.to); if (!a || !b) return;
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y + 22); line.setAttribute('x2', b.x); line.setAttribute('y2', b.y - 22); line.setAttribute('class', 'relation-edge ' + relationClass(l.type)); svg.appendChild(line);
      const tx = document.createElementNS(svgNS, 'text'); tx.setAttribute('x', (a.x + b.x) / 2); tx.setAttribute('y', (a.y + b.y) / 2); tx.setAttribute('class', 'relation-edge-label'); tx.textContent = l.type; svg.appendChild(tx);
    });
    graph.people.forEach(p => {
      const pos = positions.get(p.id), g = document.createElementNS(svgNS, 'g'); g.setAttribute('class', 'relation-node' + (selectedId === p.id ? ' selected' : '')); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `Выбрать ${p.name}`); g.dataset.personId = p.id;
      const rect = document.createElementNS(svgNS, 'rect'); rect.setAttribute('x', pos.x - 72); rect.setAttribute('y', pos.y - 23); rect.setAttribute('width', 144); rect.setAttribute('height', 46); rect.setAttribute('rx', 13); g.appendChild(rect);
      const text = document.createElementNS(svgNS, 'text'); text.setAttribute('x', pos.x); text.setAttribute('y', pos.y + 5); text.textContent = p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name; g.appendChild(text);
      const choose = () => { selectedId = p.id; const info = $('relation-selected-info'); if (info) info.textContent = `${p.name}: ${graph.links.filter(l => l.from === p.id || l.to === p.id).length} связей`; renderMap(); };
      g.addEventListener('click', choose); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } }); svg.appendChild(g);
    });
    holder.replaceChildren(svg);
    const info = $('relation-selected-info'); if (info && selectedId) { const p = personById(selectedId); info.textContent = p ? `${p.name}: ${graph.links.filter(l => l.from === p.id || l.to === p.id).length} связей` : ''; }
  }
  function relationClass(type) {
    if (type === 'Друзья' || type === 'Союзники') return 'positive';
    if (type === 'Враги' || type === 'Предательство' || type === 'Соперники') return 'negative';
    if (type === 'Любовный интерес') return 'romantic';
    return 'neutral';
  }
  function addPerson(name) {
    const clean = String(name || '').trim(); if (!clean) return toast('Введи имя персонажа');
    if (graph.people.some(p => p.name.toLowerCase() === clean.toLowerCase())) return toast('Такой персонаж уже есть в схеме');
    const p = { id: uid(), name: clean }; graph.people.push(p); selectedId = p.id; save(); render(); toast('Персонаж добавлен в схему');
  }
  $('relation-add-person')?.addEventListener('click', () => { addPerson($('relation-person-name')?.value); if ($('relation-person-name')) $('relation-person-name').value = ''; });
  $('relation-person-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('relation-add-person')?.click(); } });
  $('add-detailed-char-relation')?.addEventListener('click', () => { const c = getDetailedCharacter(); if (!c.name) return toast('Сначала укажи имя персонажа'); addPerson(c.name); });
  $('relation-add-link')?.addEventListener('click', () => {
    const from = $('relation-from')?.value, to = $('relation-to')?.value, type = $('relation-type')?.value || types[0], note = ($('relation-note')?.value || '').trim();
    if (!from || !to) return toast('Выбери обоих персонажей');
    if (from === to) return toast('Нельзя связать персонажа с самим собой');
    if (graph.links.some(l => l.from === from && l.to === to && l.type === type)) return toast('Такая связь уже существует');
    graph.links.push({ id: uid(), from, to, type, note }); save(); render(); if ($('relation-note')) $('relation-note').value = ''; toast('Связь добавлена');
  });
  document.addEventListener('click', e => {
    const delPerson = e.target.closest('[data-delete-person]');
    const delLink = e.target.closest('[data-delete-link]');
    const selectPerson = e.target.closest('[data-select-person]');
    if (delPerson) {
      const id = delPerson.dataset.deletePerson; graph.people = graph.people.filter(p => p.id !== id); graph.links = graph.links.filter(l => l.from !== id && l.to !== id); if (selectedId === id) selectedId = null; save(); render();
    } else if (delLink) { graph.links = graph.links.filter(l => l.id !== delLink.dataset.deleteLink); save(); render(); }
    else if (selectPerson) { selectedId = selectPerson.dataset.selectPerson; renderMap(); }
  });
  window.addEventListener('storytime-relationships-restored', () => { try { const restored = JSON.parse(localStorage.getItem(KEY) || 'null'); if (restored && Array.isArray(restored.people) && Array.isArray(restored.links)) graph = restored; else graph = { people: [], links: [] }; } catch (_) { graph = { people: [], links: [] }; } selectedId = null; render(); });
  render();
})();

// Дополнительные заметки для расширенных редакторов мира, существ и локаций.
function withExtraNotes(base, prefix, fields) {
  const rows = fields.map(([id, label]) => ({ label, value: ($(id)?.value || '').trim() })).filter(x => x.value);
  return base + (rows.length ? `\n\n${prefix}\n` + rows.map(x => `${x.label}: ${x.value}`).join('\n') : '');
}
