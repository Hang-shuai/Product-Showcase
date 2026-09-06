const products = [
  {
    id: "garden-stickers",
    category: "stickers",
    categoryName: "贴纸 STICKERS",
    name: "花园散步贴纸包",
    subtitle: "把春日花园贴进每一页",
    price: "¥ 18",
    image: "assets/products/garden-stickers.svg",
    description: "收录花朵、蝴蝶结、小邮票与温柔短句，半透明材质叠贴也轻盈，适合装点周计划、手账边角和日常照片。",
    size: "20 枚 / 包",
    material: "和纸不干胶"
  },
  {
    id: "bubble-stickers",
    category: "stickers",
    categoryName: "贴纸 STICKERS",
    name: "泡泡日记贴纸卷",
    subtitle: "圆滚滚的小情绪收藏家",
    price: "¥ 16",
    image: "assets/products/bubble-stickers.svg",
    description: "一卷装进晴天、心动、发呆和灵光乍现。沿轮廓轻松撕取，让每一种微小情绪都有可爱的落脚处。",
    size: "40 mm × 2 m",
    material: "哑光和纸"
  },
  {
    id: "cloud-notes",
    category: "notes",
    categoryName: "便签 NOTES",
    name: "云朵碎碎念便签",
    subtitle: "今天想说的话，云知道",
    price: "¥ 12",
    image: "assets/products/cloud-notes.svg",
    description: "柔软云朵异形设计，留白刚好装下一句提醒、一份愿望或突然冒出的灵感。可反复揭贴，不轻易留下胶痕。",
    size: "50 张 / 本",
    material: "书写纸"
  },
  {
    id: "petal-notes",
    category: "notes",
    categoryName: "便签 NOTES",
    name: "花瓣清单便签本",
    subtitle: "慢慢完成，也是一种浪漫",
    price: "¥ 15",
    image: "assets/products/petal-notes.svg",
    description: "把待办事项分成轻巧的小格子，再用一朵花标记完成。顺滑纸面适配中性笔、钢笔与彩色铅笔。",
    size: "60 张 / 本",
    material: "100g 米白纸"
  },
  {
    id: "letter-card",
    category: "cards",
    categoryName: "卡片 CARDS",
    name: "写给春天明信片",
    subtitle: "寄一封不会迟到的花信",
    price: "¥ 20",
    image: "assets/products/letter-card.svg",
    description: "四款原创花信主题插画，正面留住春日颜色，背面写下想说的话。适合邮寄，也适合夹进手账做章节页。",
    size: "4 款 / 套",
    material: "350g 棉感卡纸"
  },
  {
    id: "memory-card",
    category: "cards",
    categoryName: "卡片 CARDS",
    name: "闪光时刻记录卡",
    subtitle: "给值得记住的小事颁一枚奖",
    price: "¥ 22",
    image: "assets/products/memory-card.svg",
    description: "从日期、天气到此刻心情，循着小小提示记录今天最闪亮的瞬间。金色细节在光线下会悄悄发亮。",
    size: "12 张 / 盒",
    material: "特种纸＋烫金"
  },
  {
    id: "sakura-tape",
    category: "tapes",
    categoryName: "胶带 TAPES",
    name: "樱花来信和纸胶带",
    subtitle: "沿着纸页，开一条花路",
    price: "¥ 19",
    image: "assets/products/sakura-tape.svg",
    description: "粉白花瓣与细线手写字交替延伸，单独使用轻柔，叠贴更有层次。自带离型纸，剪裁拼贴更方便。",
    size: "45 mm × 3 m",
    material: "和纸＋离型纸"
  },
  {
    id: "starlight-tape",
    category: "tapes",
    categoryName: "胶带 TAPES",
    name: "晚风星光PET胶带",
    subtitle: "把今晚的星星留一点给明天",
    price: "¥ 24",
    image: "assets/products/starlight-tape.svg",
    description: "透明底材承载粉蓝渐变、细碎星光与银色线条，适合装饰深色纸张、照片边缘，也能裁成独立小贴纸。",
    size: "50 mm × 3 m",
    material: "透明 PET＋银墨"
  }
];

const grid = document.querySelector("[data-product-grid]");
const resultCount = document.querySelector("[data-result-count]");
const emptyState = document.querySelector("[data-empty-state]");
const favoriteCounters = document.querySelectorAll("[data-favorite-count]");
const modal = document.querySelector("[data-product-modal]");
const toast = document.querySelector("[data-toast]");

let activeFilter = "all";
let activeProductId = null;
let toastTimer;
let favorites = readFavorites();

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
    <article class="product-card" style="animation-delay:${index * 55}ms">
      <div class="product-visual" data-open-product="${product.id}">
        <img src="${product.image}" alt="${product.name}粉色系商品插画" loading="lazy" width="480" height="560">
        <button class="favorite-button ${isFavorite ? "is-favorite" : ""}" type="button" data-favorite="${product.id}" aria-pressed="${isFavorite}" aria-label="${isFavorite ? "取消收藏" : "收藏"}${product.name}">${isFavorite ? "♥" : "♡"}</button>
        <button class="quick-view" type="button" data-open-product="${product.id}">查看小物详情</button>
      </div>
      <div class="product-info">
        <p class="product-category">${product.categoryName}</p>
        <div class="product-title-row">
          <h3>${product.name}</h3>
          <span class="product-price">${product.price}</span>
        </div>
        <p class="product-subtitle">${product.subtitle}</p>
      </div>
    </article>`;
}

function renderProducts() {
  const visible = getVisibleProducts();
  grid.innerHTML = visible.map(productCard).join("");
  grid.hidden = visible.length === 0;
  emptyState.hidden = visible.length !== 0;
  resultCount.textContent = String(visible.length);
  favoriteCounters.forEach((counter) => { counter.textContent = String(favorites.size); });
}

function toggleFavorite(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  const adding = !favorites.has(id);
  adding ? favorites.add(id) : favorites.delete(id);
  saveFavorites();
  renderProducts();
  updateModalFavorite();
  showToast(adding ? `已把「${product.name}」放进收藏` : `已取消收藏「${product.name}」`);
}

function selectFilter(filter) {
  activeFilter = filter;
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
  modal.querySelector("[data-modal-image]").alt = `${product.name}粉色系商品插画`;
  modal.querySelector("[data-modal-category]").textContent = product.categoryName;
  modal.querySelector("[data-modal-title]").textContent = product.name;
  modal.querySelector("[data-modal-subtitle]").textContent = product.subtitle;
  modal.querySelector("[data-modal-description]").textContent = product.description;
  modal.querySelector("[data-modal-size]").textContent = product.size;
  modal.querySelector("[data-modal-material]").textContent = product.material;
  modal.querySelector("[data-modal-price]").textContent = product.price;
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

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

document.querySelector("[data-filters]").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) selectFilter(button.dataset.filter);
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
    selectFilter("favorites");
    smoothScrollTo(document.querySelector("#collections"));
    closeMenu();
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
