// ===== DogGuide — Основная логика =====

// --- Элементы DOM ---
const breedList = document.getElementById("breedList");
const countEl = document.getElementById("count");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("breedModal");
const modalBody = document.getElementById("modalBody");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const favoritesBtn = document.getElementById("favoritesBtn");
const favoritesCount = document.getElementById("favoritesCount");
const startTestBtn = document.getElementById("startTestBtn");
const scrollToCatalog = document.getElementById("scrollToCatalog");

// --- Состояние ---
let currentFilters = { size: "all", activity: "all", coat: "all" };
let searchQuery = "";
let showFavoritesOnly = false;
let favorites = JSON.parse(localStorage.getItem("dogguide_favorites")) || [];

// --- Избранное ---
function saveFavorites() {
  localStorage.setItem("dogguide_favorites", JSON.stringify(favorites));
  favoritesCount.textContent = favorites.length;
}

function toggleFavorite(breedId) {
  const idx = favorites.indexOf(breedId);
  if (idx === -1) favorites.push(breedId);
  else favorites.splice(idx, 1);
  saveFavorites();
  renderBreeds();
}

// --- Фильтрация ---
function getFilteredBreeds() {
  let result = breeds;

  // Режим "только избранное"
  if (showFavoritesOnly) {
    result = result.filter(b => favorites.includes(b.id));
    if (result.length === 0) return result;
  }

  // Поиск
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  }

  // Размер
  if (currentFilters.size !== "all") {
    result = result.filter(b => b.size === currentFilters.size);
  }

  // Активность
  if (currentFilters.activity !== "all") {
    result = result.filter(b => b.activity === currentFilters.activity);
  }

  // Шерсть
  if (currentFilters.coat !== "all") {
    if (currentFilters.coat === "hypoallergenic") {
      result = result.filter(b => b.hypoallergenic);
    } else {
      result = result.filter(b => b.coat === currentFilters.coat);
    }
  }

  return result;
}

// --- Вспомогательные функции ---
function getSizeLabel(size) {
  return { small: "🐾 Маленькая", medium: "🐾 Средняя", large: "🐾 Большая" }[size] || size;
}
function getActivityLabel(activity) {
  return { low: "🛋 Низкая", medium: "🚶 Средняя", high: "🏃 Высокая" }[activity] || activity;
}
function getCoatLabel(coat) {
  return { short: "✂️ Короткая", long: "💇 Длинная" }[coat] || coat;
}

function starsHTML(rating) {
  return "★".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "½" : "");
}

// --- Отрисовка карточек (только HTML, без событий!) ---
function renderBreeds() {
  const filtered = getFilteredBreeds();
  countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    breedList.innerHTML = `<p style="text-align:center;padding:60px 20px;color:#999;font-size:18px;">😕 Ничего не найдено. Попробуй изменить фильтры.</p>`;
    return;
  }

  breedList.innerHTML = filtered.map(breed => {
    const isFav = favorites.includes(breed.id);
    return `
      <div class="breed-card" data-id="${breed.id}">
        <img src="${breed.image}" alt="${breed.name}" class="breed-card__image" loading="lazy" />
        <div class="breed-card__body">
          <h3 class="breed-card__title">${breed.name}</h3>
          <div class="breed-card__tags">
            <span class="breed-card__tag">${getSizeLabel(breed.size)}</span>
            <span class="breed-card__tag">${getActivityLabel(breed.activity)}</span>
            <span class="breed-card__tag">${getCoatLabel(breed.coat)}</span>
            ${breed.hypoallergenic ? '<span class="breed-card__tag" style="background:#E8F5E9;color:#4CAF50;">✅ Гипоаллергенная</span>' : ''}
          </div>
          <p class="breed-card__desc">${breed.description}</p>
          <div class="breed-card__footer">
            <span class="breed-card__rating">${starsHTML(breed.rating)}</span>
            <div class="breed-card__actions">
              <button class="breed-card__compare" data-id="${breed.id}" title="Сравнить">🆚</button>
              <button class="breed-card__fav ${isFav ? 'active' : ''}" data-id="${breed.id}" title="В избранное">${isFav ? '❤️' : '🤍'}</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join("");
}

// --- Делегирование событий (один обработчик на весь список!) ---
breedList.addEventListener("click", (e) => {
  const card = e.target.closest(".breed-card");
  if (!card) return;

  const id = parseInt(card.dataset.id);
  const breed = breeds.find(b => b.id === id);
  if (!breed) return;

  // Клик по кнопке избранного
  if (e.target.closest(".breed-card__fav")) {
    toggleFavorite(id);
    return;
  }

  // Клик по кнопке сравнения
  if (e.target.closest(".breed-card__compare")) {
    addToCompare(id);
    return;
  }

  // Клик по карточке — открыть модалку
  openModal(breed);
});

// --- Модальное окно ---
function openModal(breed) {
  modalBody.innerHTML = `
    <img src="${breed.image}" alt="${breed.name}" class="breed-detail__image" />
    <h2 class="breed-detail__title">${breed.name}</h2>
    <div class="breed-detail__rating">${starsHTML(breed.rating)} (${breed.rating})</div>
    <div class="breed-detail__info">
      <div class="breed-detail__info-item">
        <div class="breed-detail__info-label">Размер</div>
        <div class="breed-detail__info-value">${getSizeLabel(breed.size)}</div>
      </div>
      <div class="breed-detail__info-item">
        <div class="breed-detail__info-label">Вес</div>
        <div class="breed-detail__info-value">${breed.weight}</div>
      </div>
      <div class="breed-detail__info-item">
        <div class="breed-detail__info-label">Рост</div>
        <div class="breed-detail__info-value">${breed.height}</div>
      </div>
      <div class="breed-detail__info-item">
        <div class="breed-detail__info-label">Продолжительность жизни</div>
        <div class="breed-detail__info-value">${breed.lifeExpectancy}</div>
      </div>
      <div class="breed-detail__info-item">
        <div class="breed-detail__info-label">Активность</div>
        <div class="breed-detail__info-value">${getActivityLabel(breed.activity)}</div>
      </div>
      <div class="breed-detail__info-item">
        <div class="breed-detail__info-label">Шерсть</div>
        <div class="breed-detail__info-value">${getCoatLabel(breed.coat)}</div>
      </div>
    </div>
    <div class="breed-detail__section">
      <h3>📖 Характер</h3>
      <p>${breed.character}</p>
    </div>
    <div class="breed-detail__section">
      <h3>🎯 Кому подходит</h3>
      <p>${breed.suitableFor}</p>
    </div>
    <div class="breed-detail__section">
      <div class="breed-detail__pros-cons">
        <div class="breed-detail__pros">
          <h4>✅ Плюсы</h4>
          <ul>${breed.pros.map(p => `<li>✓ ${p}</li>`).join("")}</ul>
        </div>
        <div class="breed-detail__cons">
          <h4>❌ Минусы</h4>
          <ul>${breed.cons.map(c => `<li>✗ ${c}</li>`).join("")}</ul>
        </div>
      </div>
    </div>`;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// --- Фильтры (делегирование) ---
document.querySelectorAll(".filter-btns").forEach(group => {
  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    group.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const label = group.closest(".filter-group").querySelector(".filter-label").textContent.trim();
    const key = { "Размер": "size", "Активность": "activity", "Шерсть": "coat" }[label];
    if (!key) return;

    currentFilters[key] = btn.dataset.value;
    showFavoritesOnly = false; // сбрасываем режим избранного при клике на фильтр
    renderBreeds();
  });
});

// --- Поиск ---
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  showFavoritesOnly = false;
  renderBreeds();
});

// --- Избранное ---
favoritesBtn.addEventListener("click", () => {
  if (favorites.length === 0) {
    alert("😕 У тебя пока нет избранных пород. Нажми 🤍 на карточке, чтобы добавить!");
    return;
  }
  showFavoritesOnly = !showFavoritesOnly;
  favoritesBtn.style.background = showFavoritesOnly ? "#F5E6D3" : "";
  favoritesBtn.style.borderColor = showFavoritesOnly ? "#D4A373" : "";
  renderBreeds();
});

// --- Скролл ---
scrollToCatalog.addEventListener("click", () => {
  document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
});

// --- Тест-подбор ---
const testModal = document.getElementById("testModal");
const testOverlay = document.getElementById("testOverlay");
const testClose = document.getElementById("testClose");
const testStart = document.getElementById("testStart");
const testProgress = document.getElementById("testProgress");
const testProgressBar = document.getElementById("testProgressBar");
const testProgressDots = document.getElementById("testProgressDots");
let testAnswers = {};
const TOTAL_QUESTIONS = 7;

function openTest() {
  testAnswers = {};
  document.querySelectorAll(".test-step").forEach(s => s.classList.remove("test-step--active"));
  document.getElementById("testStep0").classList.add("test-step--active");
  updateProgress(0);
  testModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeTest() {
  testModal.classList.remove("active");
  document.body.style.overflow = "";
}

startTestBtn.addEventListener("click", openTest);
testClose.addEventListener("click", closeTest);
testOverlay.addEventListener("click", closeTest);
testStart.addEventListener("click", () => goToStep(1));

// Прогресс-бар
function updateProgress(step) {
  if (step === 0) {
    testProgress.style.display = "none";
    return;
  }
  testProgress.style.display = "block";
  const pct = Math.round((step / TOTAL_QUESTIONS) * 100);
  testProgressBar.style.setProperty("--pct", `${pct}%`);
  testProgressBar.style.setProperty("width", `${pct}%`);

  // Точки
  testProgressDots.innerHTML = "";
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    const dot = document.createElement("span");
    if (i === step) dot.className = "active";
    else if (i < step) dot.className = "done";
    testProgressDots.appendChild(dot);
  }
}

// Навигация
function goToStep(step) {
  if (step === 0) {
    document.querySelectorAll(".test-step").forEach(s => s.classList.remove("test-step--active"));
    document.getElementById("testStep0").classList.add("test-step--active");
    updateProgress(0);
    return;
  }

  document.querySelectorAll(".test-step").forEach(s => s.classList.remove("test-step--active"));
  const el = document.getElementById(`testStep${step}`);
  if (el) el.classList.add("test-step--active");
  updateProgress(step);
}

// Обработчики ответов (через делегирование на testBody)
document.getElementById("testBody").addEventListener("change", (e) => {
  const input = e.target.closest(".test-option input");
  if (!input) return;

  const question = input.name;
  testAnswers[question] = input.value;

  // Активируем кнопку "Далее" в текущем шаге
  const step = input.closest(".test-step");
  if (step) {
    const nextBtn = step.querySelector(".test-next");
    if (nextBtn) nextBtn.disabled = false;
  }
});

// Кнопки "Далее" и "Назад" (делегирование)
document.getElementById("testBody").addEventListener("click", (e) => {
  const nextBtn = e.target.closest(".test-next");
  if (nextBtn && !nextBtn.disabled) {
    const next = nextBtn.dataset.next;
    if (next === "result") {
      showTestResult();
    } else {
      goToStep(parseInt(next));
    }
    return;
  }

  const prevBtn = e.target.closest(".test-prev");
  if (prevBtn) {
    const prev = parseInt(prevBtn.dataset.prev);
    goToStep(prev);
  }
});

// Показать результат
function showTestResult() {
  const answers = testAnswers;

  // 1. Жёсткие фильтры (отсеиваем неподходящие породы)
  let candidates = [...breeds];

  // Аллергия: если да — ТОЛЬКО гипоаллергенные
  if (answers.q5 === "yes") {
    candidates = candidates.filter(b => b.hypoallergenic);
    if (candidates.length === 0) {
      // Если ничего не осталось — показываем ближайшие гипоаллергенные
      candidates = breeds.filter(b => b.hypoallergenic).length > 0
        ? breeds.filter(b => b.hypoallergenic)
        : breeds.filter(b => b.coat === "long" && !b.hypoallergenic); // Длинношёрстные линяют меньше
    }
  }

  // Квартира + не подходит: уменьшаем баллы жёстко
  // (но не убираем полностью — вдруг человек готов мириться)

  // 2. Оценка в баллах (каждая порода получает % совпадения 0-100)
  const scored = candidates.map(breed => {
    let total = 0;
    const maxScore = 3 + 3 + 2 + 2 + 3 + 2 + 2; // по макс. баллу на вопрос
    const maxScorePerQuestion = { q1: 3, q2: 3, q3: 2, q4: 2, q5: 3, q6: 2, q7: 2 };

    let qs = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 };

    // Размер (q1: small/medium/large)
    if (breed.size === answers.q1) { qs.q1 = 3; total += 3; }
    else if (
      (answers.q1 === "small" && breed.size === "medium") ||
      (answers.q1 === "medium" && breed.size === "small")
    ) { qs.q1 = 1; total += 1; }
    else if (
      (answers.q1 === "small" && breed.size === "large") ||
      (answers.q1 === "large" && breed.size === "small")
    ) { qs.q1 = -2; total -= 2; }

    // Активность (q2: low/medium/high)
    if (breed.activity === answers.q2) { qs.q2 = 3; total += 3; }
    else if (
      (answers.q2 === "low" && breed.activity === "medium") ||
      (answers.q2 === "medium" && breed.activity === "low")
    ) { qs.q2 = 1; total += 1; }
    else { qs.q2 = -1; total -= 1; }

    // Жильё (q3: apartment/house)
    if (answers.q3 === "apartment" && breed.goodForApartment) { qs.q3 = 2; total += 2; }
    else if (answers.q3 === "apartment" && !breed.goodForApartment) { qs.q3 = -2; total -= 2; }
    else if (answers.q3 === "house" && !breed.goodForApartment) { qs.q3 = 1; total += 1; }
    else if (answers.q3 === "house") { qs.q3 = 1; total += 1; }

    // Дети (q4: yes/no)
    if (answers.q4 === "yes" && breed.goodWithKids) { qs.q4 = 2; total += 2; }
    else if (answers.q4 === "yes" && !breed.goodWithKids) { qs.q4 = -2; total -= 2; }
    else { qs.q4 = 1; total += 1; }

    // Аллергия (q5: yes/no) — уже отфильтровано, но даём бонус
    if (answers.q5 === "yes" && breed.hypoallergenic) { qs.q5 = 3; total += 3; }
    else if (answers.q5 === "no") { qs.q5 = 1; total += 1; }

    // Опыт (q6: beginner/intermediate/advanced)
    if (breed.experience === answers.q6) { qs.q6 = 2; total += 2; }
    else if (
      (answers.q6 === "beginner" && breed.experience === "intermediate") ||
      (answers.q6 === "intermediate" && breed.experience === "beginner")
    ) { qs.q6 = 1; total += 1; }
    else if (answers.q6 === "beginner" && breed.experience === "advanced") { qs.q6 = -2; total -= 2; }
    else if (answers.q6 === "advanced" && breed.experience === "beginner") { qs.q6 = 1; total += 1; }

    // Груминг (q7: low/medium/high)
    if (breed.grooming === answers.q7) { qs.q7 = 2; total += 2; }
    else if (
      (answers.q7 === "low" && breed.grooming === "medium") ||
      (answers.q7 === "medium" && breed.grooming === "low")
    ) { qs.q7 = 1; total += 1; }
    else { qs.q7 = -1; total -= 1; }

    // Вычисляем процент совпадения: max возможный = sum(maxScorePerQuestion)
    // Если total отрицательный — ставим 0
    const rawPct = Math.max(0, Math.round((total / 17) * 100));

    return { breed, score: total, pct: Math.min(rawPct, 100), details: qs };
  });

  // Сортируем по проценту
  scored.sort((a, b) => b.pct - a.pct);

  // Топ-3 (минимум 60% или топ-3 в любом случае)
  const top = scored.filter(s => s.pct >= 40);
  const display = top.length >= 2 ? top.slice(0, 3) : scored.slice(0, 3);

  goToStep(999);
  document.getElementById("testStepResult").classList.add("test-step--active");
  updateProgress(99);

  const content = document.getElementById("testResultContent");
  const restartBtn = document.getElementById("testRestart");

  // Цвета для процентов
  function pctColor(p) {
    if (p >= 80) return "test-result__match--high";
    if (p >= 55) return "test-result__match--medium";
    return "test-result__match--low";
  }
  function barColor(p) {
    if (p >= 80) return "#4CAF50";
    if (p >= 55) return "#FF9800";
    return "#E74C3C";
  }
  function getSizeLabel(s) {
    return { small: "🐾 Маленькая", medium: "🐾 Средняя", large: "🐾 Большая" }[s] || s;
  }
  function getActivityLabel(a) {
    return { low: "🛋 Низкая", medium: "🚶 Средняя", high: "🏃 Высокая" }[a] || a;
  }
  function getGroomingLabel(g) {
    return { low: "💁 Простой", medium: "🪮 Средний", high: "✂️ Сложный" }[g] || g;
  }
  function getExperienceLabel(e) {
    return { beginner: "🐶 Новичок", intermediate: "🐕 Был опыт", advanced: "🦮 Опытный" }[e] || e;
  }

  content.innerHTML = `
    <h3 class="test-result__title">🎉 Твои идеальные породы!</h3>
    <p class="test-result__subtitle">Мы подобрали ${display.length} пород${display.length > 1 ? "ы" : "у"} с % совпадения</p>
    <div class="test-result__cards">
      ${display.map((item, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
        const pctClass = pctColor(item.pct);
        return `
        <div class="test-result__card" data-id="${item.breed.id}">
          <img src="${item.breed.image}" alt="${item.breed.name}" />
          <div class="test-result__card-info">
            <h4>${medal} ${item.breed.name}</h4>
            <div class="test-result__match ${pctClass}">${item.pct}% совпадения</div>
            <div class="test-result__match-bar">
              <div class="test-result__match-bar-fill" style="width:${item.pct}%;background:${barColor(item.pct)}"></div>
            </div>
            <p>${item.breed.description}</p>
            <div class="test-result__card-stats">
              <span class="test-result__card-stat">${getSizeLabel(item.breed.size)}</span>
              <span class="test-result__card-stat">${getActivityLabel(item.breed.activity)}</span>
              <span class="test-result__card-stat">${getGroomingLabel(item.breed.grooming)}</span>
              <span class="test-result__card-stat">${getExperienceLabel(item.breed.experience)}</span>
              ${item.breed.hypoallergenic ? '<span class="test-result__card-stat" style="background:#E8F5E9;color:#4CAF50">✅ Гипоаллергенная</span>' : ''}
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>
    <p class="test-result__note">💡 Нажми на карточку, чтобы узнать подробнее о породе</p>
  `;
  restartBtn.style.display = "";

  // Клик по карточке
  content.querySelectorAll(".test-result__card").forEach(card => {
    card.addEventListener("click", () => {
      const id = parseInt(card.dataset.id);
      const breed = breeds.find(b => b.id === id);
      if (breed) {
        closeTest();
        openModal(breed);
      }
    });
  });

  // Кнопка "Пройти заново"
  restartBtn.addEventListener("click", () => {
    testAnswers = {};
    document.querySelectorAll(".test-option input").forEach(i => i.checked = false);
    document.querySelectorAll(".test-next").forEach(b => b.disabled = true);
    restartBtn.style.display = "none";
    goToStep(0);
  });
}

// --- Сравнение пород ---
const compareModal = document.getElementById("compareModal");
const compareOverlay = document.getElementById("compareOverlay");
const compareClose = document.getElementById("compareClose");
const compareSelect1 = document.getElementById("compareSelect1");
const compareSelect2 = document.getElementById("compareSelect2");
const compareTable = document.getElementById("compareTable");
let compareList = [];

// Заполняем селекты
function populateCompareSelects() {
  const opts = breeds.map(b => `<option value="${b.id}">${b.name}</option>`).join("");
  compareSelect1.innerHTML = `<option value="">— Выберите —</option>${opts}`;
  compareSelect2.innerHTML = `<option value="">— Выберите —</option>${opts}`;
}

// Добавить в сравнение
function addToCompare(id) {
  if (compareList.includes(id)) {
    alert("Эта порода уже в сравнении!");
    return;
  }
  if (compareList.length >= 2) {
    alert("Можно сравнивать только 2 породы одновременно. Закрой сравнение и попробуй снова.");
    return;
  }
  // Заполняем селекты, если ещё не заполнены
  if (!compareSelect1.options.length || compareSelect1.options.length <= 1) {
    populateCompareSelects();
  }
  compareList.push(id);
  if (compareList.length === 1) {
    compareSelect1.value = id;
  } else {
    compareSelect2.value = id;
  }
  updateCompareTable();
  if (!compareModal.classList.contains("active")) {
    compareModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// Обновить таблицу сравнения
function updateCompareTable() {
  const id1 = parseInt(compareSelect1.value);
  const id2 = parseInt(compareSelect2.value);
  const b1 = breeds.find(b => b.id === id1);
  const b2 = breeds.find(b => b.id === id2);

  if (!b1 || !b2) {
    compareTable.innerHTML = `
      <div class="compare__empty">
        <span class="compare__empty-icon">🆚</span>
        Выбери две породы для сравнения
      </div>`;
    return;
  }

  const rows = [
    { label: "Размер", v1: getSizeLabel(b1.size), v2: getSizeLabel(b2.size) },
    { label: "Вес", v1: b1.weight, v2: b2.weight },
    { label: "Рост", v1: b1.height, v2: b2.height },
    { label: "Активность", v1: getActivityLabel(b1.activity), v2: getActivityLabel(b2.activity) },
    { label: "Шерсть", v1: getCoatLabel(b1.coat), v2: getCoatLabel(b2.coat) },
    { label: "Гипоаллергенная", v1: b1.hypoallergenic ? "✅ Да" : "❌ Нет", v2: b2.hypoallergenic ? "✅ Да" : "❌ Нет" },
    { label: "Для квартиры", v1: b1.goodForApartment ? "✅ Да" : "❌ Нет", v2: b2.goodForApartment ? "✅ Да" : "❌ Нет" },
    { label: "С детьми", v1: b1.goodWithKids ? "✅ Да" : "❌ Нет", v2: b2.goodWithKids ? "✅ Да" : "❌ Нет" },
    { label: "Продолж. жизни", v1: b1.lifeExpectancy, v2: b2.lifeExpectancy },
    { label: "Рейтинг", v1: `${starsHTML(b1.rating)} (${b1.rating})`, v2: `${starsHTML(b2.rating)} (${b2.rating})` },
  ];

  compareTable.innerHTML = `
    <div class="compare__table-header">
      <div class="compare__table-label">Характеристика</div>
      <div class="compare__table-value">${b1.name}</div>
      <div class="compare__table-value">${b2.name}</div>
    </div>
    ${rows.map(r => {
      // Подсвечиваем, какая порода лучше
      let cls1 = "", cls2 = "";
      if (r.label === "Рейтинг") {
        if (b1.rating > b2.rating) cls1 = "compare__table-value--highlight";
        else if (b2.rating > b1.rating) cls2 = "compare__table-value--highlight";
      }
      if (r.label === "Гипоаллергенная" || r.label === "Для квартиры" || r.label === "С детьми") {
        if (b1.hypoallergenic && !b2.hypoallergenic) cls1 = "compare__table-value--highlight";
        if (b2.hypoallergenic && !b1.hypoallergenic) cls2 = "compare__table-value--highlight";
        if (b1.goodForApartment && !b2.goodForApartment) cls1 = "compare__table-value--highlight";
        if (b2.goodForApartment && !b1.goodForApartment) cls2 = "compare__table-value--highlight";
        if (b1.goodWithKids && !b2.goodWithKids) cls1 = "compare__table-value--highlight";
        if (b2.goodWithKids && !b1.goodWithKids) cls2 = "compare__table-value--highlight";
      }
      return `
        <div class="compare__table-row">
          <div class="compare__table-label">${r.label}</div>
          <div class="compare__table-value ${cls1}">${r.v1}</div>
          <div class="compare__table-value ${cls2}">${r.v2}</div>
        </div>`;
    }).join("")}
  `;
}

// События
compareSelect1.addEventListener("change", () => {
  const val = parseInt(compareSelect1.value);
  if (val) {
    if (!compareList.includes(val)) compareList = [val];
    if (compareList.length === 2 && compareList[1] === val) compareList.pop();
  }
  updateCompareTable();
});

compareSelect2.addEventListener("change", () => {
  const val = parseInt(compareSelect2.value);
  if (val) {
    if (compareList.length < 2) compareList.push(val);
    else compareList[1] = val;
  }
  updateCompareTable();
});

function openCompare() {
  populateCompareSelects();
  compareList = [];
  compareSelect1.value = "";
  compareSelect2.value = "";
  updateCompareTable();
  compareModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCompare() {
  compareModal.classList.remove("active");
  document.body.style.overflow = "";
}

compareClose.addEventListener("click", closeCompare);
compareOverlay.addEventListener("click", closeCompare);

// Кнопка сравнения в шапке
document.getElementById("compareBtn").addEventListener("click", openCompare);

// --- Тёмная тема ---
const themeToggle = document.getElementById("themeToggle");

function setTheme(dark) {
  if (dark) {
    document.body.classList.add("dark-theme");
    themeToggle.textContent = "☀️";
    themeToggle.title = "Светлая тема";
  } else {
    document.body.classList.remove("dark-theme");
    themeToggle.textContent = "🌙";
    themeToggle.title = "Тёмная тема";
  }
  localStorage.setItem("dogguide_theme", dark ? "dark" : "light");
}

// Применяем сохранённую тему
const savedTheme = localStorage.getItem("dogguide_theme");
if (savedTheme === "dark") setTheme(true);

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-theme");
  setTheme(!isDark);
});

// --- Инициализация ---
populateCompareSelects();
saveFavorites();
renderBreeds();

// --- Донат "Угости собачку" ---
const donateBtn = document.getElementById("donateBtn");
const fullnessBar = document.getElementById("fullnessBar");
const fullnessText = document.getElementById("fullnessText");
const donateDog = document.getElementById("donateDog");
const bowlFood = document.getElementById("bowlFood");
const donateThanks = document.getElementById("donateThanks");
const CARD_NUMBER = "2202 2083 5639 3273";

let fullness = parseInt(localStorage.getItem("dogguide_fullness")) || 0;
let donateCount = parseInt(localStorage.getItem("dogguide_donate_count")) || 0;

function updateFullness() {
  fullnessBar.style.width = Math.min(fullness, 100) + "%";
  fullnessText.textContent = `Сытость: ${Math.min(fullness, 100)}%`;
  if (fullness >= 100) {
    fullnessText.textContent = "🍖 Сытость: 100% — Пёсик счастлив!";
    fullnessBar.style.background = "linear-gradient(90deg, #7CB342, #4CAF50)";
  }
  if (bowlFood) {
    bowlFood.classList.toggle("visible", fullness > 0);
  }
  localStorage.setItem("dogguide_fullness", fullness);
  localStorage.setItem("dogguide_donate_count", donateCount);
}

// Восстанавливаем сытость при загрузке
updateFullness();

donateBtn.addEventListener("click", () => {
  // Копируем номер карты в буфер
  navigator.clipboard.writeText(CARD_NUMBER).catch(() => {});

  // Анимация: собачка прыгает
  donateDog.classList.remove("jumping", "wagging");
  void donateDog.offsetWidth;
  donateDog.classList.add("jumping");

  // Увеличиваем сытость
  fullness = Math.min(fullness + 15, 100);
  donateCount++;
  updateFullness();

  // Показываем "Спасибо"
  donateThanks.style.display = "block";
  setTimeout(() => { donateThanks.style.display = "none"; }, 3000);

  // Виляние хвостом после прыжка
  setTimeout(() => {
    donateDog.classList.remove("jumping");
    donateDog.classList.add("wagging");
    setTimeout(() => donateDog.classList.remove("wagging"), 1000);
  }, 1000);

  // Если сытость 100% — спецэффект
  if (fullness >= 100) {
    setTimeout(() => {
      donateDog.textContent = "🐶";
      setTimeout(() => { donateDog.textContent = "🐕"; }, 1500);
    }, 500);
  }
});

// Клик по собачке — тоже угощение (но без счётчика)
donateDog.addEventListener("click", () => {
  donateDog.classList.remove("wagging");
  void donateDog.offsetWidth;
  donateDog.classList.add("wagging");
  setTimeout(() => donateDog.classList.remove("wagging"), 1000);
});
