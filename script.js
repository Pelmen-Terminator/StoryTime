// ============================================================
// StoryTime v1.3 — полная логика приложения
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
  saveItem('Мир', lastWorld);
  toast('Сохранено ✓');
});
$('send-world-to-project')?.addEventListener('click', () => {
  if (!lastWorld) return toast('Сначала сгенерируй мир');
  addNodeToActiveProject('Мир', lastWorld, 'note');
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
  saveItem('Существо', lastCreature);
  toast('Сохранено ✓');
});
$('send-creature-to-project')?.addEventListener('click', () => {
  if (!lastCreature) return toast('Сначала создай существо');
  addNodeToActiveProject('Существо', lastCreature, 'creature');
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
  saveItem('Локация', lastLocation);
  toast('Сохранено ✓');
});
$('send-location-to-project')?.addEventListener('click', () => {
  if (!lastLocation) return toast('Сначала создай локацию');
  addNodeToActiveProject('Локация', lastLocation, 'location');
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
      plotbuilder: JSON.parse(localStorage.getItem(PB_KEY) || 'null')
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
  isRenderingProject = false;
}

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
      plotbuilder: JSON.parse(localStorage.getItem(PB_KEY) || 'null')
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