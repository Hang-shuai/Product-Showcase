const welcomeScene = document.querySelector("[data-welcome-scene]");
const welcomeSkip = document.querySelector("[data-welcome-skip]");
const firstVisitNotice = document.querySelector("[data-first-visit-notice]");
const noticeCloseButtons = [...document.querySelectorAll("[data-notice-close]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const noticeStorageKey = "boiling-bubbles-rose-notice-v3";
const welcomeStorageKey = document.body.classList.contains("scheme-three")
  ? "boiling-bubbles-welcome-scheme-three"
  : document.body.classList.contains("scheme-two")
    ? "boiling-bubbles-welcome-scheme-two-v2"
    : "boiling-bubbles-welcome-scheme-one";
let welcomeTimer;
let noticeDismissedForPage = false;

function hasDismissedNotice() {
  if (noticeDismissedForPage) return true;
  try {
    return localStorage.getItem(noticeStorageKey) === "dismissed";
  } catch {
    return false;
  }
}

function showFirstVisitNotice() {
  if (!firstVisitNotice || hasDismissedNotice() || firstVisitNotice.open) return;
  firstVisitNotice.showModal();
  document.body.classList.add("modal-open");
}

function dismissFirstVisitNotice() {
  if (!firstVisitNotice) return;
  noticeDismissedForPage = true;
  try {
    localStorage.setItem(noticeStorageKey, "dismissed");
  } catch {
    // Keep the dismissal for the current page when storage is unavailable.
  }
  firstVisitNotice.close();
  document.body.classList.remove("modal-open");
}

if (firstVisitNotice) {
  noticeCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.noticeSound === "on") window.BoilingBubblesAudio?.enable();
      if (button.dataset.noticeSound === "off") window.BoilingBubblesAudio?.disable();
      dismissFirstVisitNotice();
    });
  });
  firstVisitNotice.addEventListener("cancel", (event) => event.preventDefault());
  firstVisitNotice.addEventListener("close", () => document.body.classList.remove("modal-open"));
}

function hasSeenWelcome() {
  try {
    return sessionStorage.getItem(welcomeStorageKey) === "seen";
  } catch {
    return false;
  }
}

function rememberWelcome() {
  try {
    sessionStorage.setItem(welcomeStorageKey, "seen");
  } catch {
    // The introduction can still close when storage is unavailable.
  }
}

function finishWelcome(immediate = false) {
  if (!welcomeScene || welcomeScene.hidden) return;
  clearTimeout(welcomeTimer);
  rememberWelcome();
  document.body.classList.remove("is-welcoming");

  if (immediate) {
    welcomeScene.hidden = true;
    showFirstVisitNotice();
    return;
  }

  welcomeScene.classList.add("is-leaving");
  setTimeout(() => {
    welcomeScene.hidden = true;
    showFirstVisitNotice();
  }, 430);
}

if (welcomeScene) {
  if (reduceMotion || hasSeenWelcome()) {
    finishWelcome(true);
  } else {
    document.body.classList.add("is-welcoming");
    requestAnimationFrame(() => welcomeScene.classList.add("is-playing"));
    welcomeTimer = setTimeout(() => finishWelcome(), 3000);
    welcomeSkip.addEventListener("click", () => finishWelcome());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") finishWelcome();
    }, { once: true });
  }
} else {
  showFirstVisitNotice();
}

const backgroundBubbles = [...document.querySelectorAll(".page-bubbles i")];

if (backgroundBubbles.length && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  const bubblePhysics = backgroundBubbles.map(() => ({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0
  }));
  let physicsFrame = 0;
  let previousPhysicsTime = performance.now();
  let pointerUpdatePending = false;
  let latestPointerEvent = null;

  function animateBubblePhysics(now) {
    const step = Math.min((now - previousPhysicsTime) / 16.67, 2);
    previousPhysicsTime = now;
    let stillMoving = false;
    const edgePadding = 10;
    const boundsList = backgroundBubbles.map((bubble) => bubble.getBoundingClientRect());

    bubblePhysics.forEach((state, index) => {
      const bounds = boundsList[index];
      if (!bounds.width) return;

      state.velocityX += -state.x * 0.00045 * step;
      state.velocityY += -state.y * 0.00035 * step;
      state.x += state.velocityX * step;
      state.y += state.velocityY * step;

      const nextLeft = bounds.left + state.velocityX * step;
      const nextRight = bounds.right + state.velocityX * step;
      if (nextLeft < edgePadding && state.velocityX < 0) {
        state.x += edgePadding - nextLeft;
        state.velocityX = Math.abs(state.velocityX) * 0.76;
      } else if (nextRight > window.innerWidth - edgePadding && state.velocityX > 0) {
        state.x -= nextRight - (window.innerWidth - edgePadding);
        state.velocityX = -Math.abs(state.velocityX) * 0.76;
      }

      state.velocityX *= Math.pow(0.986, step);
      state.velocityY *= Math.pow(0.98, step);
      if (Math.abs(state.x) < 0.02) state.x = 0;
      if (Math.abs(state.y) < 0.02) state.y = 0;

      backgroundBubbles[index].style.setProperty("--parallax-x", `${state.x}px`);
      backgroundBubbles[index].style.setProperty("--parallax-y", `${state.y}px`);

      if (Math.abs(state.velocityX) > 0.02 || Math.abs(state.velocityY) > 0.02 || Math.abs(state.x) > 0.2 || Math.abs(state.y) > 0.2) {
        stillMoving = true;
      }
    });

    physicsFrame = stillMoving ? requestAnimationFrame(animateBubblePhysics) : 0;
  }

  function startBubblePhysics() {
    if (physicsFrame) return;
    previousPhysicsTime = performance.now();
    physicsFrame = requestAnimationFrame(animateBubblePhysics);
  }

  function applyPointerPush() {
    const event = latestPointerEvent;
    const boundsList = backgroundBubbles.map((bubble) => bubble.getBoundingClientRect());

    bubblePhysics.forEach((state, index) => {
      const bounds = boundsList[index];
      if (!bounds.width) return;
      const offsetX = bounds.left + bounds.width / 2 - event.clientX;
      const offsetY = bounds.top + bounds.height / 2 - event.clientY;
      const distance = Math.hypot(offsetX, offsetY);
      const radius = 130 + bounds.width * 0.35;
      if (distance >= radius) return;

      const force = Math.pow(1 - distance / radius, 1.2) * (1.8 + bounds.width * 0.018);
      const safeDistance = Math.max(distance, 1);
      const directionX = distance > 1 ? offsetX / safeDistance : 1;
      const directionY = distance > 1 ? offsetY / safeDistance : -0.35;
      state.velocityX += directionX * force + (event.movementX || 0) * 0.045;
      state.velocityY += directionY * force + (event.movementY || 0) * 0.025;
      state.velocityX = Math.max(-8, Math.min(8, state.velocityX));
      state.velocityY = Math.max(-6, Math.min(6, state.velocityY));
    });

    pointerUpdatePending = false;
    startBubblePhysics();
  }

  window.addEventListener("pointermove", (event) => {
    latestPointerEvent = event;
    if (pointerUpdatePending) return;
    pointerUpdatePending = true;
    requestAnimationFrame(applyPointerPush);
  }, { passive: true });
}

const products = [
  {
    id: "rose-music-strip-roll",
    category: "tapes",
    categoryName: "胶带 TAPES",
    name: "玫瑰音符点缀小拉条贴纸卷",
    subtitle: "玫瑰与音符沿纸页轻轻延伸",
    image: "assets/products/real/玫瑰音符点缀小拉条贴纸卷.webp",
    description: "纤细的小拉条设计集合玫瑰、音符、蝴蝶结与蕾丝边饰，适合装点手账分隔线、照片边缘和页眉。",
    size: "宽 5cm｜35cm 一循环｜总长 525cm｜15 个整循环",
    material: "PET 哑膜",
    isPhoto: true
  },
  {
    id: "vintage-rose-ironwork-roll",
    category: "tapes",
    categoryName: "胶带 TAPES",
    name: "古早蔷薇藤蔓铁艺贴纸卷",
    subtitle: "像走进一座柔软的复古花园",
    image: "assets/products/real/古早蔷薇藤蔓铁艺贴纸卷.webp",
    description: "以蔷薇、藤蔓和铁艺窗花为主题，粉、蓝、奶油黄交织出古早浪漫气息，适合复古拼贴与主题手账。",
    size: "宽 5cm｜50cm 一循环｜总长 500cm｜10 个整循环",
    material: "PET 哑膜",
    isPhoto: true
  },
  {
    id: "little-animal-rose-roll",
    category: "tapes",
    categoryName: "胶带 TAPES",
    name: "小动物玫瑰贴纸卷",
    subtitle: "把甜点、玫瑰和小动物一起收藏",
    image: "assets/products/real/小动物玫瑰贴纸卷.webp",
    description: "软萌小动物藏进玫瑰与甜点之间，闪砂表面会在光线下呈现细碎光泽，为可爱风手账增加丰富层次。",
    size: "宽 5cm｜35cm 一循环｜总长 525cm｜15 个整循环",
    material: "PET 哑膜闪砂",
    isPhoto: true
  },
  {
    id: "rose-m5-inserts",
    category: "inserts",
    categoryName: "手账内页 INSERTS",
    name: "玫瑰异形 M5 内页",
    subtitle: "正反两面，都藏着不同的玫瑰心事",
    image: "assets/products/real/玫瑰异形M5内页.webp",
    description: "适配 M5 活页手账的玫瑰主题异形内页，正反面采用不同图案并已预先打孔，可直接装入手账使用。",
    size: "67 × 105mm｜两款各 10 张｜正反面不同图｜已打孔",
    material: "印刷纸品",
    isPhoto: true
  },
  {
    id: "rose-material-book",
    category: "materials",
    categoryName: "素材纸 MATERIALS",
    name: "玫瑰素材本",
    subtitle: "十二种玫瑰边框，留给十二段小故事",
    image: "assets/products/real/玫瑰素材本.webp",
    description: "集合花框、蕾丝、草莓与爱心等十二款玫瑰主题素材，小巧尺寸适合直接拼贴，也可用于标题和留言装饰。",
    size: "4 × 6cm｜12 图｜每图 10 张",
    material: "纸质拼贴素材",
    isPhoto: true
  },
  {
    id: "little-animal-collage-notes",
    category: "notes",
    categoryName: "便签 NOTES",
    name: "小动物拼贴素材便签",
    subtitle: "一整页都是软乎乎的可爱灵感",
    image: "assets/products/real/小动物拼贴素材便签.webp",
    description: "以小动物、甜点和蝴蝶结组成多格拼贴，既可以整页收藏，也可以沿图案剪下作为手账局部装饰。",
    size: "10 × 14cm｜整本单款 50 张｜分装单款 10 张",
    material: "纸质素材便签",
    isPhoto: true
  },
  {
    id: "rose-material-notebook",
    category: "notes",
    categoryName: "便签 NOTES",
    name: "玫瑰素材便签本",
    subtitle: "粉蓝与可可色写成一页复古圆舞曲",
    image: "assets/products/real/玫瑰素材便签本.webp",
    description: "玫瑰、音符、蝴蝶与蕾丝边框组成丰富版面，可整页使用，也能自由裁切搭配，适合打造层次感拼贴。",
    size: "10 × 14cm｜整本单色 50 张｜分装单款双色 20 张",
    material: "纸质素材便签",
    isPhoto: true
  }
];

const productTotal = products.length;
const categoryTotal = new Set(products.map((product) => product.category)).size;
document.querySelectorAll("[data-product-total]").forEach((counter) => {
  counter.textContent = String(productTotal).padStart(2, "0");
});
document.querySelectorAll("[data-category-total]").forEach((counter) => {
  counter.textContent = String(categoryTotal).padStart(2, "0");
});

const grid = document.querySelector("[data-product-grid]");
const resultCount = document.querySelector("[data-result-count]");
const emptyState = document.querySelector("[data-empty-state]");
const collectionsSection = document.querySelector("#collections");
const favoriteCounters = document.querySelectorAll("[data-favorite-count]");
const modal = document.querySelector("[data-product-modal]");
const toast = document.querySelector("[data-toast]");
const productPagination = document.createElement("nav");
productPagination.className = "catalog-pagination catalog-pagination--products";
productPagination.setAttribute("aria-label", "商品分页");
productPagination.setAttribute("data-product-pagination", "");
emptyState.insertAdjacentElement("afterend", productPagination);

let activeFilter = "all";
let activeProductId = null;
let toastTimer;
let favorites = readFavorites();
let productPage = 1;
const productPageMedia = window.matchMedia("(max-width: 780px)");

function productsPerPage() {
  return productPageMedia.matches ? 4 : 8;
}

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("boiling-bubbles-favorites") || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("boiling-bubbles-favorites", JSON.stringify([...favorites]));
  } catch {
    showToast("当前浏览器无法保存收藏，但本次浏览仍然有效。");
  }
}

function getVisibleProducts() {
  if (activeFilter === "favorites") {
    return products.filter((product) => favorites.has(product.id));
  }
  return activeFilter === "all"
    ? products
    : products.filter((product) => product.category === activeFilter);
}

function productCard(product, index) {
  const isFavorite = favorites.has(product.id);
  return `
    <article class="product-card ${product.isPhoto ? "product-card--photo" : ""}" style="animation-delay:${index * 55}ms">
      <div class="product-visual" data-open-product="${product.id}">
        <img src="${product.image}" alt="${product.name}${product.isPhoto ? "商品实拍" : "粉色系商品插画"}" loading="lazy" decoding="async" width="480" height="560">
        <button class="favorite-button ${isFavorite ? "is-favorite" : ""}" type="button" data-favorite="${product.id}" aria-pressed="${isFavorite}" aria-label="${isFavorite ? "取消收藏" : "收藏"}${product.name}">${isFavorite ? "♥" : "♡"}</button>
        <button class="quick-view" type="button" data-open-product="${product.id}">查看小物详情</button>
      </div>
      <div class="product-info">
        <p class="product-category">${product.categoryName}</p>
        <div class="product-title-row">
          <h3>${product.name}</h3>
        </div>
        <p class="product-subtitle">${product.subtitle}</p>
      </div>
    </article>`;
}

function paginationTokens(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const ordered = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const tokens = [];
  ordered.forEach((page, index) => {
    if (index && page - ordered[index - 1] > 1) tokens.push("ellipsis");
    tokens.push(page);
  });
  return tokens;
}

function renderProductPagination(totalPages, totalItems) {
  if (!totalItems) {
    productPagination.hidden = true;
    return;
  }
  productPagination.hidden = false;
  const pages = paginationTokens(productPage, totalPages).map((token) => token === "ellipsis"
    ? '<span class="catalog-pagination-ellipsis" aria-hidden="true">…</span>'
    : `<button type="button" data-product-page="${token}" class="${token === productPage ? "is-active" : ""}" aria-current="${token === productPage ? "page" : "false"}" aria-label="第 ${token} 页">${token}</button>`
  ).join("");
  productPagination.innerHTML = `
    <button type="button" data-product-page="${productPage - 1}" ${productPage === 1 ? "disabled" : ""} aria-label="上一页">‹</button>
    ${pages}
    <button type="button" data-product-page="${productPage + 1}" ${productPage === totalPages ? "disabled" : ""} aria-label="下一页">›</button>`;
}

function renderProducts() {
  const visible = getVisibleProducts();
  const pageSize = productsPerPage();
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  productPage = Math.min(productPage, totalPages);
  const start = (productPage - 1) * pageSize;
  const pageProducts = visible.slice(start, start + pageSize);
  grid.dataset.pageItems = String(pageProducts.length);
  grid.innerHTML = pageProducts.map(productCard).join("");
  grid.hidden = visible.length === 0;
  emptyState.hidden = visible.length !== 0;
  resultCount.textContent = String(visible.length);
  favoriteCounters.forEach((counter) => { counter.textContent = String(favorites.size); });
  renderProductPagination(totalPages, visible.length);
}

productPageMedia.addEventListener("change", () => {
  productPage = 1;
  renderProducts();
});

function updateProductFavorite(id) {
  const button = grid.querySelector(`[data-favorite="${id}"]`);
  const product = products.find((item) => item.id === id);
  if (!button || !product) return;
  const isFavorite = favorites.has(id);
  button.classList.toggle("is-favorite", isFavorite);
  button.setAttribute("aria-pressed", String(isFavorite));
  button.setAttribute("aria-label", `${isFavorite ? "取消收藏" : "收藏"}${product.name}`);
  button.textContent = isFavorite ? "♥" : "♡";
}

function toggleFavorite(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  const adding = !favorites.has(id);
  adding ? favorites.add(id) : favorites.delete(id);
  saveFavorites();
  if (activeFilter === "favorites") renderProducts();
  else updateProductFavorite(id);
  updateModalFavorite();
  showToast(adding ? `已把「${product.name}」放进收藏` : `已取消收藏「${product.name}」`);
}

function selectFilter(filter) {
  activeFilter = filter;
  productPage = 1;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderProducts();
}

function openProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  activeProductId = id;
  modal.querySelector("[data-modal-image]").src = product.image;
  modal.querySelector("[data-modal-image]").alt = `${product.name}${product.isPhoto ? "商品实拍" : "粉色系商品插画"}`;
  modal.querySelector(".modal-image-wrap").classList.toggle("is-photo", Boolean(product.isPhoto));
  modal.querySelector("[data-modal-category]").textContent = product.categoryName;
  modal.querySelector("[data-modal-title]").textContent = product.name;
  modal.querySelector("[data-modal-subtitle]").textContent = product.subtitle;
  modal.querySelector("[data-modal-description]").textContent = product.description;
  modal.querySelector("[data-modal-size]").textContent = product.size;
  modal.querySelector("[data-modal-material]").textContent = product.material;
  updateModalFavorite();
  modal.showModal();
  document.body.classList.add("modal-open");
}

function closeModal() {
  modal.close();
  document.body.classList.remove("modal-open");
  activeProductId = null;
}

function updateModalFavorite() {
  if (!activeProductId) return;
  const button = modal.querySelector("[data-modal-favorite]");
  const isFavorite = favorites.has(activeProductId);
  button.textContent = isFavorite ? "♥ 已收藏" : "♡ 收藏这件小物";
  button.setAttribute("aria-pressed", String(isFavorite));
}

function showToast(message, options = {}) {
  clearTimeout(toastTimer);
  toast.replaceChildren(document.createTextNode(message));
  if (options.actionLabel && typeof options.onAction === "function") {
    const action = document.createElement("button");
    action.className = "toast-action";
    action.type = "button";
    action.textContent = options.actionLabel;
    action.addEventListener("click", () => {
      options.onAction();
      toast.classList.remove("is-visible");
    }, { once: true });
    toast.append(action);
  }
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), options.duration || 2400);
}

document.querySelector("[data-filters]").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) selectFilter(button.dataset.filter);
});

productPagination.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-page]");
  if (!button || button.disabled) return;
  productPage = Number(button.dataset.productPage);
  renderProducts();
  smoothScrollTo(collectionsSection);
});

grid.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    event.stopPropagation();
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }
  const detailTrigger = event.target.closest("[data-open-product]");
  if (detailTrigger) openProduct(detailTrigger.dataset.openProduct);
});

document.querySelector("[data-modal-close]").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
modal.addEventListener("close", () => document.body.classList.remove("modal-open"));
modal.querySelector("[data-modal-favorite]").addEventListener("click", () => toggleFavorite(activeProductId));

document.querySelectorAll("[data-show-favorites]").forEach((button) => {
  button.addEventListener("click", () => {
    closeMenu();
    if (favorites.size === 0) {
      selectFilter("all");
      smoothScrollTo(collectionsSection);
      showToast("收藏夹还是空的～先逛逛小物，点亮卡片右上角的爱心就能收藏啦 ♡");
      collectionsSection.classList.remove("is-favorite-hint");
      requestAnimationFrame(() => collectionsSection.classList.add("is-favorite-hint"));
      setTimeout(() => collectionsSection.classList.remove("is-favorite-hint"), 2600);
      return;
    }
    selectFilter("favorites");
    smoothScrollTo(collectionsSection);
  });
});

document.querySelector("[data-show-all]").addEventListener("click", () => selectFilter("all"));

document.querySelectorAll("[data-coming-soon]").forEach((button) => {
  button.addEventListener("click", () => showToast(`${button.dataset.comingSoon}入口正在准备中，期待很快与你见面。`));
});

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

function closeMenu() {
  siteNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "打开导航菜单");
}

menuToggle.addEventListener("click", () => {
  const opening = !siteNav.classList.contains("is-open");
  siteNav.classList.toggle("is-open", opening);
  menuToggle.setAttribute("aria-expanded", String(opening));
  menuToggle.setAttribute("aria-label", opening ? "关闭导航菜单" : "打开导航菜单");
});

siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-wrap")) closeMenu();
});

let scrollAnimationFrame = 0;

function smoothScrollTo(target) {
  if (!target) return;

  cancelAnimationFrame(scrollAnimationFrame);
  const start = window.scrollY;
  const headerOffset = 92;
  const destination = Math.max(0, target.getBoundingClientRect().top + start - headerOffset);
  const distance = destination - start;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(distance) < 2) {
    window.scrollTo(0, destination);
    return;
  }

  const duration = Math.min(420, Math.max(240, Math.abs(distance) * 0.22));
  const startedAt = performance.now();

  function animate(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, start + distance * eased);
    if (progress < 1) scrollAnimationFrame = requestAnimationFrame(animate);
  }

  scrollAnimationFrame = requestAnimationFrame(animate);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.classList.contains("skip-link")) return;
    const hash = link.getAttribute("href");
    const target = hash && hash !== "#" ? document.querySelector(hash) : null;
    if (!target) return;

    event.preventDefault();
    closeMenu();
    smoothScrollTo(target);
    try {
      history.pushState(null, "", hash);
    } catch {
      // Direct file previews may restrict history updates; scrolling still works.
    }
  });
});

const header = document.querySelector(".site-header");
let headerUpdatePending = false;
let headerIsCompact = false;

window.addEventListener("scroll", () => {
  if (headerUpdatePending) return;
  headerUpdatePending = true;
  requestAnimationFrame(() => {
    const shouldCompact = window.scrollY > 24;
    if (shouldCompact !== headerIsCompact) {
      headerIsCompact = shouldCompact;
      header.classList.toggle("is-scrolled", shouldCompact);
    }
    headerUpdatePending = false;
  });
}, { passive: true });

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

document.querySelector("[data-year]").textContent = String(new Date().getFullYear());
renderProducts();
