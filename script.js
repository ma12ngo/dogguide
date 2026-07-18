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
            <button class="breed-card__fav ${isFav ? 'active' : ''}" data-id="${breed.id}" title="В избранное">${isFav ? '❤️' : '🤍'}</button>
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

// --- Тест-подбор (заглушка) ---
startTestBtn.addEventListener("click", () => {
  alert("🎯 Тест-подбор пока в разработке! А пока можешь посмотреть все породы и выбрать по фильтрам.");
});

// --- Инициализация ---
saveFavorites();
renderBreeds();
