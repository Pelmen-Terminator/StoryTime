// ============================================================
// StoryTime v1.1 — логика
// ============================================================
'use strict';

// ---------- ХЕЛПЕРЫ ----------
const $ = id => document.getElementById(id);
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Экранирование HTML (защита от XSS при импорте и генерации)
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Безопасная вставка многострочного текста
function escMultiline(str) {
  return esc(str).replace(/\n/g, '<br>');
}

// Debounce
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ---------- ТЕМА ----------
(function initTheme() {
  const savedTheme = localStorage.getItem('storytime-theme') || 'dark';
  const valid = ['light', 'beige', 'dark'];
  const theme = valid.includes(savedTheme) ? savedTheme : 'dark';
  document.documentElement.dataset.theme = theme;

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
    btn.addEventListener('click', () => {
      const t = btn.dataset.theme;
      document.documentElement.dataset.theme = t;
      localStorage.setItem('storytime-theme', t);
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });
})();

// ---------- TOAST ----------
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- МОДАЛКА (Promise) ----------
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
        return labelHtml + `<select id="mf-${esc(f.id)}">${
          f.options.map(o => `<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('')
        }</select>`;
      }
      if (f.type === 'textarea') {
        return labelHtml + `<textarea id="mf-${esc(f.id)}" rows="4" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>`;
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
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') onOk();
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

// ---------- ВКЛАДКИ ----------
(function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $(tab.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });
})();

// ---------- ЗАПОЛНЕНИЕ SELECT'ОВ ----------
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
  catch (e) { toast('Ошибка сохранения (переполнение?)'); }
}
function saveItem(type, content) {
  const arr = getSaved();
  arr.unshift({ type, content, date: new Date().toLocaleString('ru-RU') });
  // ограничим 500 записей
  if (arr.length > 500) arr.length = 500;
  setSaved(arr);
  renderSaved();
}

const renderSaved = () => {
  const arr = getSaved();
  const filter = $('filter-saved').value;
  const search = $('search-saved').value.toLowerCase().trim();
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

$('search-saved').addEventListener('input', debounce(renderSaved, 150));
$('filter-saved').addEventListener('change', renderSaved);

$('clear-all').addEventListener('click', async () => {
  const res = await promptModal('Очистить библиотеку?', [
    { id: 'confirm', label: 'Напиши «да» для подтверждения', placeholder: 'да' }
  ]);
  if (!res || res.confirm.trim().toLowerCase() !== 'да') return toast('Отменено');
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
  a.download = `storytime-library-${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      if (!Array.isArray(imported)) throw new Error('Not an array');
      // валидация записей
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
$('gen-name').addEventListener('click', genNames);
$('save-names').addEventListener('click', () => {
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
  $('pb-progress-fill').style.width = pct + '%';
  $('pb-progress-text').textContent = `${filled} / ${PB_FIELDS.length} шагов заполнено`;
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

$('pb-clear').addEventListener('click', async () => {
  const res = await promptModal('Очистить конструктор?', [
    { id: 'confirm', label: 'Напиши «да» для подтверждения', placeholder: 'да' }
  ]);
  if (!res || res.confirm.trim().toLowerCase() !== 'да') return;
  PB_FIELDS.forEach(f => { const el = $('pb-' + f); if (el) el.value = ''; });
  pbUpdateProgress();
  pbSaveLocal();
  toast('Очищено');
});

$('pb-load-last').addEventListener('click', () => {
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

$('pb-save').addEventListener('click', () => {
  const text = pbCollect();
  if (!text) return toast('Заполни хотя бы один шаг');
  saveItem('Конструктор', text);
  toast('Сохранено в библиотеку ✓');
});

$('pb-to-project').addEventListener('click', () => {
  const text = pbCollect();
  if (!text) return toast('Заполни хотя бы один шаг');
  addNodeToActiveProject('Сюжет (конструктор)', text, '🎯');
  toast('Отправлено в проект ✓');
});

document.querySelectorAll('[data-template]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.template;
    const tpl = DATA.plotTemplates?.[key];
    if (!tpl) return;
    const stepsText = tpl.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    // Вставляем в "Развитие" как ориентир, если пусто
    const target = $('pb-rising');
    if (target && !target.value.trim()) {
      target.value = `Схема «${tpl.name}»:\n${stepsText}`;
    } else {
      // если уже что-то есть — покажем модалкой
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

// восстановление из localStorage при загрузке
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
// ПРОЕКТЫ И РЕДАКТОР
// ============================================================
const PROJECTS_KEY = 'storytime-projects';

function getProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(p => p && typeof p === 'object' && Array.isArray(p.nodes));
  } catch { return []; }
}
function setProjects(arr) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(arr)); }
  catch (e) { toast('Ошибка: хранилище переполнено'); }
}

let activeProjectId = null;
let activeNodeId = null;
let isRenderingProject = false; // защита от перезаписи при рендере

function renderProjects() {
  const list = $('project-list');
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
  $('editor-empty').style.display = 'flex';
  $('editor-content').style.display = 'none';
  $('project-progress').innerHTML = '';
}

function openProject(id) {
  const p = getProjects().find(x => x.id === id);
  if (!p) return;
  activeProjectId = id;
  if (!p.nodes.length) {
    p.nodes.push({ id: uid(), title: 'Глава 1', content: '', icon: '📖', created: new Date().toLocaleString('ru-RU') });
    saveProject(p);
  }
  activeNodeId = p.nodes[0].id;
  $('editor-empty').style.display = 'none';
  $('editor-content').style.display = 'flex';
  $('project-title').value = p.title;
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
  $('project-progress').innerHTML = `
    <div class="pp-item">📄 Разделов: <strong>${p.nodes.length}</strong></div>
    <div class="pp-item">✍️ Заполнено: <strong>${filled}</strong></div>
    <div class="pp-item">📝 Слов: <strong>${words}</strong></div>
    <div class="pp-item">🔤 Символов: <strong>${chars}</strong></div>
  `;
}

function renderProject() {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) { showEditorEmpty(); return; }

  isRenderingProject = true;

  // ---- Дерево ----
  const tree = $('chapter-tree');
  if (!p.nodes.length) {
    tree.innerHTML = '<p class="placeholder" style="font-size:0.85rem;">Пусто. Нажми ＋</p>';
  } else {
    tree.innerHTML = p.nodes.map(n => `
      <div class="tree-node ${n.id === activeNodeId ? 'active' : ''}" data-id="${esc(n.id)}">
        <span class="icon">${esc(n.icon || '📄')}</span>
        <span class="nlabel">${esc(n.title || 'Без названия')}</span>
        <button class="ndel" data-del="${esc(n.id)}" title="Удалить" aria-label="Удалить">✕</button>
      </div>
    `).join('');

    tree.querySelectorAll('.tree-node').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.ndel')) return;
        activeNodeId = el.dataset.id;
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
        p.nodes = p.nodes.filter(n => n.id !== btn.dataset.del);
        if (activeNodeId === btn.dataset.del) activeNodeId = p.nodes[0]?.id || null;
        saveProject(p);
        renderProject();
        toast('Раздел удалён');
      });
    });
  }

  // ---- Редактор ----
  const node = p.nodes.find(n => n.id === activeNodeId);
  if (node) {
    $('node-title').value = node.title || '';
    $('node-content').value = node.content || '';
    $('node-icon-display').textContent = node.icon || '📄';
    $('node-meta').textContent = `Создано: ${node.created || '—'}`;
    updateNodeCounts();
  } else {
    $('node-title').value = '';
    $('node-content').value = '';
    $('node-icon-display').textContent = '📄';
    $('node-meta').textContent = '';
    updateNodeCounts();
  }

  updateProjectProgress(p);
  isRenderingProject = false;
}

function updateNodeCounts() {
  const t = $('node-content').value;
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  $('word-count').textContent = `${words} слов`;
  $('char-count').textContent = `${t.length} символов`;
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

// Автосохранение текущего узла
const autoSaveNode = debounce(() => {
  if (isRenderingProject) return;
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  const node = p.nodes.find(n => n.id === activeNodeId);
  if (!node) return;
  node.title = $('node-title').value;
  node.content = $('node-content').value;
  saveProject(p);
  // обновляем только дерево и прогресс, не трогая текстовые поля
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

$('node-title').addEventListener('input', onEditorInput);
$('node-content').addEventListener('input', onEditorInput);

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

// ---- Переименование проекта ----
const saveProjectTitle = debounce(() => {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  p.title = $('project-title').value.trim() || 'Без названия';
  saveProject(p);
  renderProjects();
  setSaveStatus('saved');
}, 500);

$('project-title').addEventListener('input', () => {
  setSaveStatus('saving');
  saveProjectTitle();
});

// ---- Удалить проект ----
$('delete-project').addEventListener('click', async () => {
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

// ---- Экспорт проекта ----
$('export-project').addEventListener('click', () => {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${p.title.replace(/[^a-zа-я0-9]/gi, '_')}-${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Проект экспортирован ✓');
});

// ---- Статистика проекта ----
$('project-stats').addEventListener('click', () => {
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  let words = 0, chars = 0;
  const byIcon = {};
  p.nodes.forEach(n => {
    const text = (n.content || '').trim();
    chars += text.length;
    words += text ? text.split(/\s+/).length : 0;
    byIcon[n.icon || '📄'] = (byIcon[n.icon || '📄'] || 0) + 1;
  });
  const byIconText = Object.entries(byIcon).map(([k, v]) => `${k} ${v}`).join(' · ');
  promptModal(`Статистика: ${p.title}`, [
    { id: 'stats', label: 'Данные', type: 'textarea', value:
`Разделов: ${p.nodes.length}
Заполнено: ${p.nodes.filter(n => (n.content || '').trim()).length}
Слов: ${words}
Символов: ${chars}
Состав: ${byIconText}` }
  ]);
});

// ---- Добавить раздел ----
$('add-node').addEventListener('click', async () => {
  if (!activeProjectId) return toast('Сначала открой проект');
  const res = await promptModal('Новый раздел', [
    { id: 'title', label: 'Название', placeholder: 'Например: Глава 2' },
    { id: 'icon', label: 'Тип', type: 'select', options: [
      { v: '📖', l: '📖 Глава / Акт' },
      { v: '🎬', l: '🎬 Сцена / Сюжет' },
      { v: '🎯', l: '🎯 Конструктор' },
      { v: '👤', l: '👤 Персонаж' },
      { v: '🌍', l: '🌍 Мир' },
      { v: '🐉', l: '🐉 Существо' },
      { v: '🗺', l: '🗺 Локация' },
      { v: '📝', l: '📝 Заметка' }
    ] }
  ]);
  if (!res) return;
  const p = getProjects().find(x => x.id === activeProjectId);
  if (!p) return;
  const node = {
    id: uid(),
    title: res.title.trim() || 'Без названия',
    content: '',
    icon: res.icon || '📄',
    created: new Date().toLocaleString('ru-RU')
  };
  p.nodes.push(node);
  activeNodeId = node.id;
  saveProject(p);
  renderProject();
  toast('Раздел добавлен ✓');
});

// ---- Отправка материала в проект ----
async function addNodeToActiveProject(title, content, icon) {
  const projects = getProjects();

  // если открыт проект — добавляем туда
  if (activeProjectId) {
    const p = getProjects().find(x => x.id === activeProjectId);
    if (p) {
      p.nodes.push({ id: uid(), title, content, icon, created: new Date().toLocaleString('ru-RU') });
      saveProject(p);
      // обновляем дерево, не трогая редактор (чтобы не сбить фокус)
      renderProject();
      return;
    }
  }

  // если проектов нет — создаём новый
  if (!projects.length) {
    const p = {
      id: uid(),
      title: 'Мой проект',
      nodes: [{ id: uid(), title, content, icon, created: new Date().toLocaleString('ru-RU') }]
    };
    setProjects([p]);
    renderProjects();
    openProject(p.id);
    return;
  }

  // иначе — спросим, куда добавить
  const options = projects.map(p => ({ v: p.id, l: p.title }));
  const res = await promptModal('Куда добавить?', [
    { id: 'projectId', label: 'Проект', type: 'select', options }
  ]);
  if (!res) return;
  const p = getProjects().find(x => x.id === res.projectId);
  if (!p) return;
  p.nodes.push({ id: uid(), title, content, icon, created: new Date().toLocaleString('ru-RU') });
  saveProject(p);
  activeProjectId = p.id;
  openProject(p.id);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
renderSaved();
renderProjects();
showEditorEmpty();

// Горячие клавиши
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + S — сохранить в текущем контексте
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (activeProjectId && $('projects').classList.contains('active')) {
      const p = getProjects().find(x => x.id === activeProjectId);
      if (p) {
        p.title = $('project-title').value.trim() || 'Без названия';
        const node = p.nodes.find(n => n.id === activeNodeId);
        if (node) {
          node.title = $('node-title').value;
          node.content = $('node-content').value;
        }
        saveProject(p);
        renderProjects();
        setSaveStatus('saved');
        toast('Сохранено ✓');
      }
    }
  }
});

// Защита от потери данных при закрытии (если есть несохранённое)
window.addEventListener('beforeunload', (e) => {
  // Всё автосохраняется через debounce — но на всякий случай
  if (activeProjectId) {
    const p = getProjects().find(x => x.id === activeProjectId);
    if (p) {
      const node = p.nodes.find(n => n.id === activeNodeId);
      if (node) {
        node.title = $('node-title').value;
        node.content = $('node-content').value;
        saveProject(p);
      }
    }
  }
});