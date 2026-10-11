// ========== ДАННЫЕ ==========
const DATA = {
  genres: {
    fantasy: {
      settings: ["древнее королевство Элдория", "лес вечных туманов", "парящий город Аэлит", "подземный город гномов"],
      problems: ["проклятие, иссушающее землю", "пробуждение древнего дракона", "предательство в королевском совете", "исчезновение магии"],
      goals: ["найти Кристалл Света", "объединить разрозненные кланы", "снять проклятие с принцессы", "остановить тёмного мага"],
      twists: ["герой — на самом деле наследник врага", "спаситель оказывается предателем", "древнее пророчество было ложью"]
    },
    scifi: {
      settings: ["колония на Марсе", "космическая станция «Гелиос»", "заброшенный корабль поколений", "квантовый город"],
      problems: ["восстание ИИ", "утечка вируса", "потеря связи с Землёй", "парадокс времени"],
      goals: ["найти пропавшую экспедицию", "отключить ядро ИИ", "восстановить связь", "спасти колонию"],
      twists: ["реальность — симуляция", "капитан — клон", "сигнал шёл из будущего"]
    },
    detective: {
      settings: ["дождливый Лондон", "особняк на побережье", "закрытый пансион", "ночной поезд"],
      problems: ["загадочное убийство", "похищение реликвии", "серия странных смертей", "исчезновение наследницы"],
      goals: ["найти убийцу", "разоблачить заговор", "восстановить справедливость", "защитить свидетеля"],
      twists: ["жертва инсценировала свою смерть", "детектив — соучастник", "преступление совершено ребёнком"]
    },
    romance: {
      settings: ["приморский городок", "старый книжный магазин", "свадьба друзей", "Париж весной"],
      problems: ["давняя ссора", "социальное неравенство", "бывший возвращается", "тайна из прошлого"],
      goals: ["завоевать сердце", "примириться с семьёй", "начать новую жизнь", "признаться в чувствах"],
      twists: ["влюблённые — сводные siblings", "письма писал кто-то другой", "она уезжает навсегда"]
    },
    horror: {
      settings: ["заброшенная больница", "деревня, которой нет на карте", "старый дом с чердаком", "подвал церкви"],
      problems: ["проклятый предмет", "дух умершей девушки", "странные исчезновения", "шёпот в стенах"],
      goals: ["выжить до утра", "разорвать проклятие", "найти пропавшую сестру", "сбежать из ловушки"],
      twists: ["главный герой уже мёртв", "зло — в самом рассказчике", "всё происходит во сне"]
    },
    adventure: {
      settings: ["необитаемый остров", "джунгли Амазонки", "затерянный храм", "горные вершины"],
      problems: ["карта указывает не туда", "предательство в команде", "природная катастрофа", "охота за сокровищем"],
      goals: ["найти древний артефакт", "спасти команду", "разгадать загадку", "вернуться домой"],
      twists: ["сокровище — проклято", "карта — подделка", "гид — настоящий злодей"]
    }
  },

  character: {
    traits: ["смелый", "загадочный", "вспыльчивый", "добрый", "хитрый", "мечтательный", "циничный", "наивный", "упрямый", "великодушный"],
    flaws: ["боится темноты", "не умеет доверять", "страдает от гордыни", "зависим от прошлого", "не умеет проигрывать", "слишком доверчив"],
    secrets: ["на самом деле шпион", "скрывает своё происхождение", "виновен в смерти близкого", "имеет магическую метку", "знает будущее"],
    goals: ["найти себя", "отомстить", "защитить семью", "добиться славы", "искупить вину", "обрести любовь"],
    appearance: ["высокий, с пронзительными серыми глазами", "невысокая с рыжими кудрями", "шрам на щеке и тяжёлый взгляд", "изящная фигура, всегда в чёрном", "крепкого телосложения, с татуировками"]
  },

  world: {
    types: ["континент", "остров-государство", "подземный город", "парящие острова", "пустынные кочевья"],
    politics: ["монархия на грани революции", "теократия с тёмными тайнами", "анархия кланов", "корпоратократия"],
    magic: ["магия течёт в крови", "магия запрещена под страхом казни", "магия умирает", "магия — технология"],
    conflicts: ["война с соседями", "внутренние распри", "природные катаклизмы", "эпидемия"]
  },

  names: {
    ru: {
      m: ["Александр", "Иван", "Дмитрий", "Михаил", "Сергей", "Андрей", "Николай", "Пётр", "Владимир", "Егор"],
      f: ["Анна", "Мария", "Екатерина", "Ольга", "София", "Дарья", "Елена", "Алиса", "Кристина", "Вера"],
      lastM: ["Иванов", "Петров", "Смирнов", "Волков", "Соколов", "Морозов", "Новиков", "Орлов", "Зайцев", "Лебедев"],
      lastF: ["Иванова", "Петрова", "Смирнова", "Волкова", "Соколова", "Морозова", "Новикова", "Орлова", "Зайцева", "Лебедева"]
    },
    en: {
      m: ["James", "Oliver", "William", "Henry", "Lucas", "Daniel", "Ethan", "Alexander", "Noah", "Benjamin"],
      f: ["Emma", "Olivia", "Sophia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn"],
      lastM: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Anderson", "Taylor"],
      lastF: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Anderson", "Taylor"]
    },
    fantasy: {
      m: ["Элдор", "Тирион", "Кайлен", "Аэрон", "Драго", "Фенрис", "Орион", "Валер", "Тэлон", "Зефир"],
      f: ["Аэлин", "Лириэль", "Селеста", "Моргана", "Элария", "Нимерия", "Сильвана", "Аврора", "Иллюзия", "Кайра"],
      lastM: ["Тенерождённый", "Лунный", "Огнедышащий", "Тихий Ветер", "Драконобой", "Звёздный", "Тёмный", "Вечный"],
      lastF: ["Тенерождённая", "Лунная", "Огнедышащая", "Тихий Ветер", "Драконобой", "Звёздная", "Тёмная", "Вечная"]
    },
    japan: {
      m: ["Харуто", "Рен", "Соута", "Юки", "Каито", "Рику", "Такуми", "Хирото", "Дайки", "Акира"],
      f: ["Сакура", "Юи", "Аой", "Хината", "Мио", "Рин", "Юна", "Акари", "Мидори", "Хару"],
      lastM: ["Танака", "Сато", "Судзуки", "Такахаси", "Ватанабэ", "Ито", "Ямамото", "Накамура", "Кобаяси", "Ёсида"],
      lastF: ["Танака", "Сато", "Судзуки", "Такахаси", "Ватанабэ", "Ито", "Ямамото", "Накамура", "Кобаяси", "Ёсида"]
    },
    scandi: {
      m: ["Бьорн", "Эрик", "Лейф", "Хальвар", "Сигурд", "Рагнар", "Торстейн", "Олаф", "Гуннар", "Асбьорн"],
      f: ["Астрид", "Фрейя", "Сигрун", "Ингрид", "Хельга", "Рагнхильд", "Тора", "Гудрун", "Сольвейг", "Лив"],
      lastM: ["Ларссон", "Хансен", "Йохансен", "Андерссон", "Нильсен", "Олсен", "Петерсен", "Хансен", "Свенссон", "Эриксон"],
      lastF: ["Ларссон", "Хансен", "Йохансен", "Андерссон", "Нильсен", "Олсен", "Петерсен", "Хансен", "Свенссон", "Эриксон"]
    }
  }
};

// ========== УТИЛИТЫ ==========
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const rndN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

// ========== УВЕДОМЛЕНИЯ ==========
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ========== ВКЛАДКИ ==========
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ========== СЮЖЕТ ==========
let lastPlot = '';
document.getElementById('gen-plot').addEventListener('click', () => {
  const genre = document.getElementById('plot-genre').value;
  const keys = genre === 'any' ? Object.keys(DATA.genres) : [genre];
  const g = rnd(keys);
  const data = DATA.genres[g];

  const setting = rnd(data.settings);
  const problem = rnd(data.problems);
  const goal = rnd(data.goals);
  const twist = rnd(data.twists);
  const hero = rnd(DATA.names.fantasy.m);

  lastPlot = `🎬 ЖАНР: ${g.toUpperCase()}

📍 МЕСТО: ${setting}
⚠️ ПРОБЛЕМА: ${problem}
🎯 ЦЕЛЬ ГЕРОЯ: ${goal}
💥 ПОВОРОТ: ${twist}

👤 ГЛАВНЫЙ ГЕРОЙ: ${hero}`;

  document.getElementById('plot-output').textContent = lastPlot;
});

document.getElementById('save-plot').addEventListener('click', () => {
  if (!lastPlot) return toast('Сначала сгенерируй сюжет');
  saveItem('Сюжет', lastPlot);
  toast('Сюжет сохранён ✓');
});

// ========== ПЕРСОНАЖ ==========
let lastChar = '';
document.getElementById('gen-char').addEventListener('click', () => {
  const origin = rnd(['ru','en','fantasy','japan','scandi']);
  const gender = rnd(['m','f']);
  const nameData = DATA.names[origin];
  const first = rnd(nameData[gender]);
  const last = rnd(gender === 'm' ? nameData.lastM : nameData.lastF);

  const c = DATA.character;
  const char = {
    name: `${first} ${last}`,
    age: 16 + Math.floor(Math.random() * 55),
    gender: gender === 'm' ? 'Мужской' : 'Женский',
    appearance: rnd(c.appearance),
    trait: rnd(c.traits),
    flaw: rnd(c.flaws),
    secret: rnd(c.secrets),
    goal: rnd(c.goals)
  };

  const html = `
    <div class="row"><span>Имя</span><span>${char.name}</span></div>
    <div class="row"><span>Возраст</span><span>${char.age} лет</span></div>
    <div class="row"><span>Пол</span><span>${char.gender}</span></div>
    <div class="row"><span>Внешность</span><span>${char.appearance}</span></div>
    <div class="row"><span>Черта</span><span>${char.trait}</span></div>
    <div class="row"><span>Слабость</span><span>${char.flaw}</span></div>
    <div class="row"><span>Тайна</span><span>${char.secret}</span></div>
    <div class="row"><span>Цель</span><span>${char.goal}</span></div>
  `;
  document.getElementById('char-output').innerHTML = html;
  lastChar = `${char.name}, ${char.age} лет, ${char.gender.toLowerCase()}. ${char.appearance}. Характер: ${char.trait}. Слабость: ${char.flaw}. Тайна: ${char.secret}. Цель: ${char.goal}.`;
});

document.getElementById('save-char').addEventListener('click', () => {
  if (!lastChar) return toast('Сначала создай персонажа');
  saveItem('Персонаж', lastChar);
  toast('Персонаж сохранён ✓');
});

// ========== МИР ==========
let lastWorld = '';
document.getElementById('gen-world').addEventListener('click', () => {
  const w = DATA.world;
  const world = {
    type: rnd(w.types),
    politics: rnd(w.politics),
    magic: rnd(w.magic),
    conflict: rnd(w.conflicts),
    name: rnd(DATA.names.fantasy.m) + 'ия'
  };

  lastWorld = `🌍 МИР: ${world.name}

Тип: ${world.type}
Политика: ${world.politics}
Магия: ${world.magic}
Главный конфликт: ${world.conflict}`;

  document.getElementById('world-output').textContent = lastWorld;
});

document.getElementById('save-world').addEventListener('click', () => {
  if (!lastWorld) return toast('Сначала сгенерируй мир');
  saveItem('Мир', lastWorld);
  toast('Мир сохранён ✓');
});

// ========== ИМЕНА ==========
let lastNames = [];
document.getElementById('gen-name').addEventListener('click', () => {
  const origin = document.getElementById('name-origin').value;
  const genderSel = document.getElementById('name-gender').value;
  const out = document.getElementById('names-output');
  out.innerHTML = '';
  lastNames = [];

  const genders = genderSel === 'any' ? ['m','f'] : [genderSel];
  const data = DATA.names[origin];

  for (let i = 0; i < 6; i++) {
    const g = rnd(genders);
    const first = rnd(data[g]);
    const last = rnd(g === 'm' ? data.lastM : data.lastF);
    const full = `${first} ${last}`;
    lastNames.push(full);

    const card = document.createElement('div');
    card.className = 'name-card';
    card.innerHTML = `<div class="n">${full}</div><div class="tag">${origin} · ${g === 'm' ? 'муж.' : 'жен.'}</div>`;
    card.addEventListener('click', () => {
      navigator.clipboard?.writeText(full);
      toast(`Скопировано: ${full}`);
    });
    out.appendChild(card);
  }
});

document.getElementById('save-name').addEventListener('click', () => {
  if (!lastNames.length) return toast('Сначала сгенерируй имена');
  lastNames.forEach(n => saveItem('Имя', n));
  toast('Все имена сохранены ✓');
});

// ========== СОХРАНЕНИЯ ==========
function getSaved() {
  try { return JSON.parse(localStorage.getItem('storytime') || '[]'); }
  catch { return []; }
}
function setSaved(arr) { localStorage.setItem('storytime', JSON.stringify(arr)); }

function saveItem(type, content) {
  const arr = getSaved();
  arr.unshift({ type, content, date: new Date().toLocaleString('ru-RU') });
  setSaved(arr);
  renderSaved();
}

function renderSaved() {
  const arr = getSaved();
  const list = document.getElementById('saved-list');
  if (!arr.length) {
    list.innerHTML = '<p class="placeholder">Здесь появятся твои сохранения…</p>';
    return;
  }
  list.innerHTML = arr.map((item, i) => `
    <div class="saved-item">
      <button class="del" data-i="${i}" title="Удалить">✕</button>
      <div class="type">${item.type} · ${item.date}</div>
      <div class="content">${item.content.replace(/\n/g, '<br>')}</div>
    </div>
  `).join('');

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

document.getElementById('clear-all').addEventListener('click', () => {
  if (!confirm('Удалить все сохранения?')) return;
  setSaved([]);
  renderSaved();
  toast('Все сохранения удалены');
});

document.getElementById('export-json').addEventListener('click', () => {
  const data = getSaved();
  if (!data.length) return toast('Нет данных для экспорта');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storytime-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Экспортировано ✓');
});

// инициализация
renderSaved();