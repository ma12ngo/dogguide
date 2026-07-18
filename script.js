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
let currentFilters = {
  size: "all",
  activity: "all",
  coat: "all"
};
let searchQuery = "";
let favorites = JSON.parse(localStorage.getItem("dogguide_favorites")) || [];

// --- Сохраняем избранное ---
function saveFavorites() {
  localStorage.setItem("dogguide_favorites", JSON.stringify(favorites));
  favoritesCount.textContent = favorites.length;
}

// --- Переключение избранного ---
function toggleFavorite(breedId) {
  const idx = favorites.indexOf(breedId);
  if (idx === -1) {
    favorites.push(breedId);
  } else {
    favorites.splice(idx, 1);
  }
  saveFavorites();
  renderBreeds(); // перерисовываем, чтобы обновить иконки
}

// --- Фильтрация ---
function getFilteredBreeds() {
  return breeds.filter(breed => {
    // Поиск
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!breed.name.toLowerCase().includes(q) &&
          !breed.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    // Размер
    if (currentFilters.size !== "all" && breed.size !== currentFilters.size) {
      return false;
    }
    // Активность
    if (currentFilters.activity !== "all" && breed.activity !== currentFilters.activity) {
      return false;
    }
    // Шерсть
    if (currentFilters.coat !== "all") {
      if (currentFilters.coat === "hypoallergenic" && !breed.hypoallergenic) {
        return false;
      }
      if (currentFilters.coat !== "hypoallergenic" && breed.coat !== currentFilters.coat) {
        return false;
      }
    }
    return true;
  });
}

// --- Отрисовка карточек ---
function renderBreeds() {
  const filtered = getFilteredBreeds();
  countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    breedList.innerHTML = `
      <div class="no-results">
        <p style="text-align:center;padding:60px 20px;color:#999;font-size:18px;">
          😕 Ничего не найдено. Попробуй изменить фильтры.
        </p>
      </div>
    `;
    return;
  }

  breedList.innerHTML = filtered.map(breed => {
    const isFav = favorites.includes(breed.id);
    const stars = "★".repeat(Math.floor(breed.rating)) + (breed.rating % 1 >= 0.5 ? "½" : "");

    return `
      <div class="breed-card" data-id="${breed.id}">
        <img
          src="${breed.image}"
          alt="${breed.name}"
          class="breed-card__image"
          loading="lazy"
        />
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
            <span class="breed-card__rating">${stars}</span>
            <button class="breed-card__fav ${isFav ? 'active' : ''}" data-id="${breed.id}" title="В избранное">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // --- События на карточках ---
  document.querySelectorAll(".breed-card").forEach(card => {
    card.addEventListener("click", (e) => {
      // Не открываем модалку, если кликнули по кнопке избранного
      if (e.target.closest(".breed-card__fav")) return;
      const id = parseInt(card.dataset.id);
      const breed = breeds.find(b => b.id === id);
      if (breed) openModal(breed);
    });
  });

  document.querySelectorAll(".breed-card__fav").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      toggleFavorite(id);
    });
  });
}

// --- Вспомогательные функции для подписей ---
function getSizeLabel(size) {
  const map = { small: "🐾 Маленькая", medium: "🐾 Средняя", large: "🐾 Большая" };
  return map[size] || size;
}

function getActivityLabel(activity) {
  const map = { low: "🛋 Низкая", medium: "🚶 Средняя", high: "🏃 Высокая" };
  return map[activity] || activity;
}

function getCoatLabel(coat) {
  const map = { short: "✂️ Короткая", long: "💇 Длинная" };
  return map[coat] || coat;
}

// --- Модальное окно ---
function openModal(breed) {
  const stars = "★".repeat(Math.floor(breed.rating)) + (breed.rating % 1 >= 0.5 ? "½" : "");

  modalBody.innerHTML = `
    <img src="${breed.image}" alt="${breed.name}" class="breed-detail__image" />
    <h2 class="breed-detail__title">${breed.name}</h2>
    <div class="breed-detail__rating">${stars} (${breed.rating})</div>

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
          <ul>
            ${breed.pros.map(p => `<li>✓ ${p}</li>`).join("")}
          </ul>
        </div>
        <div class="breed-detail__cons">
          <h4>❌ Минусы</h4>
          <ul>
            ${breed.cons.map(c => `<li>✗ ${c}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// --- События модалки ---
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// --- Фильтры ---
document.querySelectorAll(".filter-btns").forEach(group => {
  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    // Убираем active у всех кнопок в группе
    group.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Определяем, какой фильтр обновить
    const parent = group.closest(".filter-group");
    const label = parent.querySelector(".filter-label").textContent.trim();

    const filterMap = {
      "Размер": "size",
      "Активность": "activity",
      "Шерсть": "coat"
    };

    const filterKey = filterMap[label];
    if (filterKey) {
      currentFilters[filterKey] = btn.dataset.value;
      renderBreeds();
    }
  });
});

// --- Поиск ---
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderBreeds();
});

// --- Показать избранное ---
favoritesBtn.addEventListener("click", () => {
  if (favorites.length === 0) {
    alert("😕 У тебя пока нет избранных пород. Нажми 🤍 на карточке, чтобы добавить!");
    return;
  }

  // Показываем только избранные
  const favBreeds = breeds.filter(b => favorites.includes(b.id));
  countEl.textContent = favBreeds.length;

  breedList.innerHTML = favBreeds.map(breed => {
    const stars = "★".repeat(Math.floor(breed.rating)) + (breed.rating % 1 >= 0.5 ? "½" : "");
    return `
      <div class="breed-card" data-id="${breed.id}">
        <img src="${breed.image}" alt="${breed.name}" class="breed-card__image" loading="lazy" />
        <div class="breed-card__body">
          <h3 class="breed-card__title">${breed.name}</h3>
          <div class="breed-card__tags">
            <span class="breed-card__tag">${getSizeLabel(breed.size)}</span>
            <span class="breed-card__tag">${getActivityLabel(breed.activity)}</span>
            <span class="breed-card__tag">${getCoatLabel(breed.coat)}</span>
          </div>
          <p class="breed-card__desc">${breed.description}</p>
          <div class="breed-card__footer">
            <span class="breed-card__rating">${stars}</span>
            <button class="breed-card__fav active" data-id="${breed.id}">❤️</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Вешаем события заново
  document.querySelectorAll(".breed-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".breed-card__fav")) return;
      const id = parseInt(card.dataset.id);
      const breed = breeds.find(b => b.id === id);
      if (breed) openModal(breed);
    });
  });

  document.querySelectorAll(".breed-card__fav").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      toggleFavorite(id);
    });
  });
});

// --- Скролл к каталогу ---
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
