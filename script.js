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
let testAnswers = {};

function openTest() {
  testAnswers = {};
  document.querySelectorAll(".test-step").forEach(s => s.classList.remove("test-step--active"));
  document.getElementById("testStep0").classList.add("test-step--active");
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

// Начать тест
testStart.addEventListener("click", () => goToStep(1));

// Переключение шагов
function goToStep(step) {
  document.querySelectorAll(".test-step").forEach(s => s.classList.remove("test-step--active"));
  const el = document.getElementById(`testStep${step}`);
  if (el) el.classList.add("test-step--active");
}

// Выбор ответа — активируем кнопку Далее
document.querySelectorAll(".test-option input").forEach(input => {
  input.addEventListener("change", () => {
    const question = input.name;
    testAnswers[question] = input.value;
    const btn = input.closest(".test-question").querySelector(".test-next");
    btn.disabled = false;
  });
});

// Кнопки Далее
document.querySelectorAll(".test-next").forEach(btn => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.next;
    if (next === "result") {
      showTestResult();
    } else {
      goToStep(parseInt(next));
    }
  });
});

// Показать результат
function showTestResult() {
  const q1 = testAnswers.q1; // размер
  const q2 = testAnswers.q2; // активность
  const q3 = testAnswers.q3; // квартира/дом
  const q4 = testAnswers.q4; // дети
  const q5 = testAnswers.q5; // аллергия

  // Оцениваем каждую породу
  const scored = breeds.map(breed => {
    let score = 0;

    // Размер
    if (breed.size === q1) score += 3;
    else if ((q1 === "small" && breed.size === "medium") ||
             (q1 === "medium" && breed.size === "small")) score += 1;

    // Активность
    if (breed.activity === q2) score += 3;
    else if ((q2 === "low" && breed.activity === "medium") ||
             (q2 === "medium" && breed.activity === "low")) score += 1;
    else if (q2 === "low" && breed.activity === "high") score -= 1;
    else if (q2 === "high" && breed.activity === "low") score -= 1;

    // Квартира
    if (q3 === "apartment" && breed.goodForApartment) score += 2;
    else if (q3 === "apartment" && !breed.goodForApartment) score -= 1;
    else if (q3 === "house" && !breed.goodForApartment) score += 1;

    // Дети
    if (q4 === "yes" && breed.goodWithKids) score += 2;
    else if (q4 === "yes" && !breed.goodWithKids) score -= 1;

    // Аллергия
    if (q5 === "yes" && breed.hypoallergenic) score += 3;
    else if (q5 === "yes" && !breed.hypoallergenic) score -= 2;

    return { breed, score };
  });

  // Сортируем по убыванию баллов
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter(s => s.score > 0);
  const display = top.length > 0 ? top.slice(0, 3) : scored.slice(0, 3);

  goToStep("Result");

  const content = document.getElementById("testResultContent");
  const restartBtn = document.getElementById("testRestart");
  content.innerHTML = `
    <h3 class="test-result__title">🎉 Твои идеальные породы!</h3>
    <p class="test-result__subtitle">Мы подобрали ${display.length} пород${display.length > 1 ? "ы" : "у"}, которые тебе подходят</p>
    <div class="test-result__cards">
      ${display.map((item, i) => `
        <div class="test-result__card" data-id="${item.breed.id}">
          <img src="${item.breed.image}" alt="${item.breed.name}" />
          <div class="test-result__card-info">
            <h4>${i === 0 ? "🥇 " : i === 1 ? "🥈 " : "🥉 "}${item.breed.name}</h4>
            <p>${item.breed.description}</p>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  restartBtn.style.display = "";

  // Клик по карточке результата — открываем модалку породы
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

// --- Инициализация ---
saveFavorites();
renderBreeds();
