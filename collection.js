(() => {
  if (typeof products === "undefined" || !Array.isArray(products)) return;

  const storageKey = "boiling-bubbles-owned-products-v1";
  const openButtons = [...document.querySelectorAll("[data-open-collection]")];
  const headerCounts = [...document.querySelectorAll("[data-collection-count]")];
  const categoryLabels = {
    all: "全部",
    owned: "已点亮",
    unowned: "待收集",
    stickers: "贴纸",
    notes: "便签",
    cards: "卡片",
    tapes: "胶带",
    materials: "素材纸",
    inserts: "手账内页"
  };
  const availableCategories = new Set(products.map((product) => product.category));
  const categoryOrder = ["all", "owned", "unowned", "stickers", "notes", "cards", "tapes", "materials", "inserts"]
    .filter((category) => ["all", "owned", "unowned"].includes(category) || availableCategories.has(category));
  const milestoneBlueprint = [
    { count: 1, name: "初次相遇", symbol: "◇" },
    { count: Math.max(1, Math.round(products.length * .4)), name: "泡泡拾光者", symbol: "✦" },
    { count: Math.max(1, Math.round(products.length * .65)), name: "手账收藏家", symbol: "♡" },
    { count: Math.max(1, Math.round(products.length * .85)), name: "蔷薇珍藏师", symbol: "♛" },
    { count: products.length, name: "全图鉴收藏家", symbol: "✺" }
  ];
  const milestones = milestoneBlueprint.filter((item, index, list) => (
    list.findIndex((candidate) => candidate.count === item.count) === index
  ));

  let owned = readOwned();
  let activeCategory = "all";
  let unlockingId = null;
  let collectionPage = 1;
  const collectionPageMedia = window.matchMedia("(max-width: 780px)");

  function collectionItemsPerPage() {
    return collectionPageMedia.matches ? 4 : 8;
  }

  const dialog = document.createElement("dialog");
  dialog.className = "collection-book";
  dialog.setAttribute("aria-labelledby", "collection-book-title");
  dialog.innerHTML = `
    <div class="collection-book-shell">
      <button class="collection-book-close" type="button" data-collection-close aria-label="关闭泡泡图鉴">×</button>
      <header class="collection-book-hero">
        <div class="collection-book-copy">
          <p class="collection-kicker"><span>✦</span> BOILING BUBBLES COLLECTION <span>✦</span></p>
          <h2 id="collection-book-title">我的泡泡图鉴</h2>
          <p>每一件真实拥有的小物，都会在这里恢复色彩，留下属于你的珍藏印记。</p>
          <button class="collection-share-button" type="button" data-generate-share-card>
            <span aria-hidden="true">✦</span><b>生成我的图鉴卡</b><small>保存后分享收藏进度</small>
          </button>
        </div>
        <div class="collection-progress-card" aria-live="polite">
          <div class="collection-progress-number"><strong data-owned-total>0</strong><span>/ ${products.length} 已收集</span></div>
          <div class="collection-progress-track" role="progressbar" aria-label="泡泡图鉴收集进度" aria-valuemin="0" aria-valuemax="${products.length}" aria-valuenow="0">
            <i data-progress-fill></i>
          </div>
          <div class="collection-bubbles" data-progress-bubbles aria-hidden="true"></div>
          <p class="collection-next-goal" data-next-goal></p>
        </div>
      </header>

      <section class="collection-milestones" aria-label="收藏家徽章" data-milestones></section>

      <div class="collection-toolbar">
        <div class="collection-filters" role="toolbar" aria-label="筛选图鉴" data-collection-filters></div>
        <p class="collection-visible-count" data-collection-visible></p>
      </div>

      <section class="collection-grid" aria-label="泡泡图鉴商品" data-collection-grid></section>
      <nav class="catalog-pagination catalog-pagination--collection" aria-label="图鉴分页" data-collection-pagination></nav>
    </div>`;
  document.body.append(dialog);

  const showcase = document.createElement("section");
  showcase.className = "collection-showcase";
  showcase.setAttribute("aria-labelledby", "collection-showcase-title");
  showcase.innerHTML = `
    <div class="collection-showcase-frame">
      <div class="collection-showcase-copy">
        <p class="collection-showcase-kicker"><span>✦</span> MY BUBBLE ARCHIVE <span>✦</span></p>
        <p class="collection-showcase-label">当前收藏家头衔</p>
        <h2 id="collection-showcase-title" data-showcase-title>见习收藏员</h2>
        <p data-showcase-copy>第一枚珍藏印章，正等待被你点亮。</p>
        <button class="collection-showcase-button" type="button" data-open-collection>
          打开我的泡泡图鉴 <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div class="collection-showcase-archive" aria-hidden="true">
        <div class="collection-showcase-matrix" data-showcase-matrix></div>
        <div class="collection-showcase-seal">
          <strong data-showcase-count>0</strong><span>/ ${products.length}</span><small>COLLECTED</small>
        </div>
      </div>
      <div class="collection-showcase-progress">
        <div class="collection-showcase-progress-head"><span>总图鉴</span><strong><b data-showcase-overall>0</b> / ${products.length}</strong></div>
        <div class="collection-showcase-track" role="progressbar" aria-label="首页泡泡图鉴收集进度" aria-valuemin="0" aria-valuemax="${products.length}" aria-valuenow="0"><i data-showcase-fill></i></div>
        <div class="collection-showcase-category-stats" data-showcase-category-stats></div>
        <p data-showcase-next>再点亮 1 款，解锁「初次相遇」</p>
        <div class="collection-showcase-badges" aria-label="已获得徽章" data-showcase-badges></div>
      </div>
    </div>`;
  document.querySelector("main")?.prepend(showcase);
  openButtons.push(showcase.querySelector("[data-open-collection]"));

  const grid = dialog.querySelector("[data-collection-grid]");
  const filters = dialog.querySelector("[data-collection-filters]");
  const progressFill = dialog.querySelector("[data-progress-fill]");
  const progressTrack = dialog.querySelector("[role=progressbar]");
  const bubbles = dialog.querySelector("[data-progress-bubbles]");
  const milestonesContainer = dialog.querySelector("[data-milestones]");
  const ownedTotal = dialog.querySelector("[data-owned-total]");
  const nextGoal = dialog.querySelector("[data-next-goal]");
  const visibleCount = dialog.querySelector("[data-collection-visible]");
  const collectionPagination = dialog.querySelector("[data-collection-pagination]");
  const showcaseTitle = showcase.querySelector("[data-showcase-title]");
  const showcaseCopy = showcase.querySelector("[data-showcase-copy]");
  const showcaseCount = showcase.querySelector("[data-showcase-count]");
  const showcaseOverall = showcase.querySelector("[data-showcase-overall]");
  const showcaseFill = showcase.querySelector("[data-showcase-fill]");
  const showcaseTrack = showcase.querySelector("[role=progressbar]");
  const showcaseMatrix = showcase.querySelector("[data-showcase-matrix]");
  const showcaseCategoryStats = showcase.querySelector("[data-showcase-category-stats]");
  const showcaseNext = showcase.querySelector("[data-showcase-next]");
  const showcaseBadges = showcase.querySelector("[data-showcase-badges]");

  function readOwned() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (Array.isArray(saved)) {
        return Object.fromEntries(saved.map((id) => [id, new Date().toISOString()]));
      }
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  }

  function saveOwned() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(owned));
    } catch {
      showToast("当前浏览器无法长期保存图鉴，本次浏览仍然有效。");
    }
  }

  function ownedCount() {
    return products.reduce((count, product) => count + (owned[product.id] ? 1 : 0), 0);
  }

  function updateHeaderCount() {
    const count = ownedCount();
    headerCounts.forEach((element) => {
      element.textContent = `${count}/${products.length}`;
    });
    openButtons.forEach((button) => {
      button.setAttribute("aria-label", `打开我的泡泡图鉴，已收集 ${count} 件，共 ${products.length} 件`);
    });
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "已收录";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date).replaceAll("/", ".");
  }

  function productCategory(product) {
    return categoryLabels[product.category] || product.categoryName.split(" ")[0];
  }

  function visibleProducts() {
    if (activeCategory === "owned") return products.filter((product) => owned[product.id]);
    if (activeCategory === "unowned") return products.filter((product) => !owned[product.id]);
    if (activeCategory === "all") return products;
    return products.filter((product) => product.category === activeCategory);
  }

  function renderFilters() {
    filters.innerHTML = categoryOrder.map((category) => `
      <button class="collection-filter ${activeCategory === category ? "is-active" : ""}" type="button" data-collection-filter="${category}" aria-pressed="${activeCategory === category}">${categoryLabels[category]}</button>
    `).join("");
  }

  function renderMilestones(count) {
    if (!milestonesContainer.children.length) {
      milestonesContainer.innerHTML = milestones.map((milestone) => `
        <article class="collection-milestone ${count >= milestone.count ? "is-earned" : ""}">
          <span class="collection-milestone-medal" aria-hidden="true">${milestone.symbol}</span>
          <div><strong>${milestone.name}</strong><small>${milestone.count} 款点亮</small></div>
        </article>`).join("");
    }
    [...milestonesContainer.children].forEach((element, index) => {
      element.classList.toggle("is-earned", count >= milestones[index].count);
    });
  }

  function updateShowcase(count, upcoming, progress) {
    const earned = [...milestones].reverse().find((milestone) => count >= milestone.count);
    showcaseTitle.textContent = earned ? earned.name : "见习收藏员";
    showcaseCopy.textContent = count === products.length
      ? "整本图鉴已经闪闪发光，每一次相遇都被好好收藏。"
      : count === 0
        ? "第一枚珍藏印章，正等待被你点亮。"
        : `你已经珍藏了 ${count} 件小物，泡泡图鉴正在慢慢发光。`;
    showcaseCount.textContent = String(count);
    showcaseOverall.textContent = String(count);
    showcaseFill.style.width = `${progress}%`;
    showcaseTrack.setAttribute("aria-valuenow", String(count));
    const columns = Math.max(1, Math.ceil(Math.sqrt(products.length)));
    const gap = columns > 14 ? 2 : columns > 9 ? 3 : columns > 5 ? 5 : 10;
    const cellSize = Math.max(6, Math.min(54, Math.floor((270 - gap * (columns - 1)) / columns)));
    showcaseMatrix.style.setProperty("--matrix-columns", String(columns));
    showcaseMatrix.style.setProperty("--matrix-gap", `${gap}px`);
    showcaseMatrix.style.setProperty("--matrix-cell", `${cellSize}px`);
    if (showcaseMatrix.children.length !== products.length) {
      showcaseMatrix.innerHTML = products.map((product, index) => `
        <span data-showcase-cell="${product.id}" title="${String(index + 1).padStart(2, "0")} · ${product.name}"></span>
      `).join("");
    }
    showcaseMatrix.querySelectorAll("[data-showcase-cell]").forEach((cell) => {
      cell.classList.toggle("is-owned", Boolean(owned[cell.dataset.showcaseCell]));
    });
    const orderedCategories = ["tapes", "notes", "materials", "inserts", "stickers", "cards"]
      .filter((category) => availableCategories.has(category));
    showcaseCategoryStats.innerHTML = orderedCategories.map((category) => {
      const categoryProducts = products.filter((product) => product.category === category);
      const categoryOwned = categoryProducts.filter((product) => owned[product.id]).length;
      return `<div><span>${categoryLabels[category]}</span><strong>${categoryOwned} / ${categoryProducts.length}</strong></div>`;
    }).join("");
    showcaseNext.textContent = upcoming
      ? `再点亮 ${upcoming.count - count} 款，解锁「${upcoming.name}」`
      : "全图鉴达成 · 每一颗泡泡都已点亮";
    showcaseBadges.innerHTML = milestones
      .filter((milestone) => count >= milestone.count)
      .map((milestone) => `<span title="${milestone.name}">${milestone.symbol}</span>`)
      .join("") || "<small>徽章等待解锁</small>";
  }

  function renderProgress() {
    const count = ownedCount();
    const progress = products.length ? (count / products.length) * 100 : 0;
    const upcoming = milestones.find((milestone) => count < milestone.count);
    ownedTotal.textContent = String(count);
    progressFill.style.width = `${progress}%`;
    progressTrack.setAttribute("aria-valuenow", String(count));
    bubbles.style.gridTemplateColumns = `repeat(${Math.max(products.length, 1)}, 1fr)`;
    if (bubbles.children.length !== products.length) {
      bubbles.innerHTML = products.map(() => "<span></span>").join("");
    }
    [...bubbles.children].forEach((bubble, index) => bubble.classList.toggle("is-filled", index < count));
    nextGoal.textContent = upcoming
      ? `再点亮 ${upcoming.count - count} 款，解锁「${upcoming.name}」`
      : "所有泡泡都亮起来了，你完成了整本图鉴 ♡";
    renderMilestones(count);
    updateShowcase(count, upcoming, progress);
    updateHeaderCount();
  }

  function collectionCard(product, index) {
    const isOwned = Boolean(owned[product.id]);
    const sequence = String(products.indexOf(product) + 1).padStart(2, "0");
    return `
      <article class="collection-card ${isOwned ? "is-owned" : "is-locked"} ${unlockingId === product.id ? "is-unlocking" : ""}" data-collection-card="${product.id}" style="--card-order:${index}">
        <div class="collection-card-visual">
          <img src="${product.image}" alt="${product.name}${product.isPhoto ? "商品实拍" : "商品图"}" loading="lazy" decoding="async" width="480" height="560">
          <span class="collection-card-number">NO. ${sequence}</span>
          <div class="collection-lock" aria-hidden="true"><span>?</span><small>尚未点亮</small></div>
          <div class="collection-stamp" aria-hidden="true"><span>珍藏</span><small>COLLECTED</small></div>
          <div class="collection-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="collection-card-copy">
          <p>${productCategory(product)}</p>
          <h3>${product.name}</h3>
          <small>${isOwned ? `${formatDate(owned[product.id])} 收录` : "等待与你相遇"}</small>
          <button class="collection-own-toggle" type="button" data-owned-toggle="${product.id}" aria-pressed="${isOwned}">
            <span aria-hidden="true">${isOwned ? "✓" : "◇"}</span>${isOwned ? "我已拥有" : "我有这个"}
          </button>
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

  function renderCollectionPagination(totalPages, totalItems) {
    if (!totalItems) {
      collectionPagination.hidden = true;
      return;
    }
    collectionPagination.hidden = false;
    const pages = paginationTokens(collectionPage, totalPages).map((token) => token === "ellipsis"
      ? '<span class="catalog-pagination-ellipsis" aria-hidden="true">…</span>'
      : `<button type="button" data-collection-page="${token}" class="${token === collectionPage ? "is-active" : ""}" aria-current="${token === collectionPage ? "page" : "false"}" aria-label="图鉴第 ${token} 页">${token}</button>`
    ).join("");
    collectionPagination.innerHTML = `
      <button type="button" data-collection-page="${collectionPage - 1}" ${collectionPage === 1 ? "disabled" : ""} aria-label="图鉴上一页">‹</button>
      ${pages}
      <button type="button" data-collection-page="${collectionPage + 1}" ${collectionPage === totalPages ? "disabled" : ""} aria-label="图鉴下一页">›</button>`;
  }

  function renderGrid() {
    const visible = visibleProducts();
    const pageSize = collectionItemsPerPage();
    const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
    collectionPage = Math.min(collectionPage, totalPages);
    const start = (collectionPage - 1) * pageSize;
    const pageProducts = visible.slice(start, start + pageSize);
    grid.dataset.pageItems = String(pageProducts.length);
    grid.innerHTML = visible.length
      ? pageProducts.map(collectionCard).join("")
      : `<div class="collection-empty"><span>◇</span><h3>这一页还没有点亮</h3><p>切换到“待收集”，看看下一件想遇见的小物吧。</p><button type="button" data-collection-filter="unowned">看看待收集</button></div>`;
    visibleCount.textContent = visible.length
      ? `第 ${start + 1}–${Math.min(start + pageSize, visible.length)} 件，共 ${visible.length} 款`
      : "暂无小物";
    renderCollectionPagination(totalPages, visible.length);
  }

  function renderCollection() {
    renderFilters();
    renderProgress();
    renderGrid();
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function loadShareImage(product) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = product.image;
    });
  }

  function drawCover(context, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  async function generateShareCard(button) {
    const originalMarkup = button.innerHTML;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML = '<span aria-hidden="true">◌</span><b>正在制作图鉴卡…</b><small>把泡泡们排整齐</small>';

    try {
      const count = ownedCount();
      const progress = products.length ? Math.round((count / products.length) * 100) : 0;
      const earned = [...milestones].reverse().find((milestone) => count >= milestone.count);
      const title = earned ? earned.name : "见习收藏员";
      const isMidnight = document.body.classList.contains("scheme-three");
      const palette = isMidnight
        ? { top: "#351522", bottom: "#190910", paper: "#4a2030", panel: "#2d111c", ink: "#f9eaeb", muted: "#d3b5ba", rose: "#c66f91", deep: "#7f3653", gold: "#dfbd72", empty: "#6b5960" }
        : { top: "#fff8f8", bottom: "#f6e3e9", paper: "#fffdf9", panel: "#faeef2", ink: "#5b3d48", muted: "#987782", rose: "#d47b9c", deep: "#944e69", gold: "#c6a35f", empty: "#d9ccd0" };
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1440;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");

      const background = context.createLinearGradient(0, 0, 1080, 1440);
      background.addColorStop(0, palette.top);
      background.addColorStop(1, palette.bottom);
      context.fillStyle = background;
      context.fillRect(0, 0, 1080, 1440);

      context.globalAlpha = .14;
      context.fillStyle = palette.rose;
      [[90, 110, 130], [970, 245, 175], [120, 1260, 165], [945, 1320, 110]].forEach(([x, y, radius]) => {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;

      roundedRect(context, 58, 58, 964, 1324, 54);
      context.fillStyle = palette.paper;
      context.shadowColor = isMidnight ? "rgba(0,0,0,.34)" : "rgba(104,53,72,.16)";
      context.shadowBlur = 45;
      context.fill();
      context.shadowColor = "transparent";
      context.strokeStyle = palette.gold;
      context.lineWidth = 2;
      context.stroke();

      context.textAlign = "center";
      context.fillStyle = palette.gold;
      context.font = "italic 700 24px Georgia, serif";
      context.fillText("✦  BOILING BUBBLES COLLECTION  ✦", 540, 135);
      context.fillStyle = palette.ink;
      context.font = '500 72px "Microsoft YaHei", "Noto Sans SC", sans-serif';
      context.fillText("我的泡泡图鉴", 540, 230);
      context.fillStyle = palette.rose;
      context.font = '700 39px "Microsoft YaHei", "Noto Sans SC", sans-serif';
      context.fillText(title, 540, 298);

      roundedRect(context, 145, 335, 790, 118, 30);
      context.fillStyle = palette.panel;
      context.fill();
      context.textAlign = "left";
      context.fillStyle = palette.ink;
      context.font = '700 45px "Microsoft YaHei", "Noto Sans SC", sans-serif';
      context.fillText(`${count} / ${products.length}`, 190, 405);
      context.fillStyle = palette.muted;
      context.font = '500 25px "Microsoft YaHei", "Noto Sans SC", sans-serif';
      context.fillText(`已收集 · 图鉴完成度 ${progress}%`, 390, 402);

      const images = await Promise.all(products.map(loadShareImage));
      const columns = Math.max(1, Math.ceil(Math.sqrt(products.length)));
      const rows = Math.max(1, Math.ceil(products.length / columns));
      const areaX = 110;
      const areaY = 500;
      const areaWidth = 860;
      const areaHeight = 720;
      const gap = products.length > 64 ? 7 : products.length > 24 ? 10 : 18;
      const cell = Math.min((areaWidth - gap * (columns - 1)) / columns, (areaHeight - gap * (rows - 1)) / rows);
      const gridWidth = cell * columns + gap * (columns - 1);
      const gridHeight = cell * rows + gap * (rows - 1);
      const startX = 540 - gridWidth / 2;
      const startY = areaY + (areaHeight - gridHeight) / 2;

      products.forEach((product, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = startX + column * (cell + gap);
        const y = startY + row * (cell + gap);
        const isOwned = Boolean(owned[product.id]);
        roundedRect(context, x, y, cell, cell, Math.max(8, cell * .1));
        context.save();
        context.clip();
        context.fillStyle = isOwned ? palette.panel : palette.empty;
        context.fillRect(x, y, cell, cell);
        if (images[index]) {
          context.globalAlpha = isOwned ? 1 : .32;
          context.filter = isOwned ? "none" : "grayscale(1) saturate(.15)";
          drawCover(context, images[index], x, y, cell, cell);
          context.filter = "none";
          context.globalAlpha = 1;
        }
        if (!isOwned) {
          context.fillStyle = isMidnight ? "rgba(31,13,20,.34)" : "rgba(255,250,250,.3)";
          context.fillRect(x, y, cell, cell);
        }
        context.restore();
        roundedRect(context, x, y, cell, cell, Math.max(8, cell * .1));
        context.strokeStyle = isOwned ? palette.rose : palette.empty;
        context.lineWidth = isOwned ? Math.max(3, cell * .025) : 2;
        context.stroke();
        if (cell >= 72) {
          context.textAlign = "center";
          context.fillStyle = isOwned ? palette.rose : palette.muted;
          context.font = `700 ${Math.max(13, Math.min(22, cell * .13))}px Georgia, serif`;
          context.fillText(isOwned ? "✓" : String(index + 1).padStart(2, "0"), x + cell / 2, y + cell - Math.max(9, cell * .08));
        }
      });

      context.textAlign = "center";
      context.fillStyle = palette.ink;
      context.font = '500 27px "Microsoft YaHei", "Noto Sans SC", sans-serif';
      context.fillText(count === products.length ? "每一颗泡泡，都已经被好好收藏。" : "下一次相遇，也会成为图鉴里闪亮的一格。", 540, 1285);
      context.fillStyle = palette.gold;
      context.font = "italic 700 22px Georgia, serif";
      context.fillText("开水泡泡  ·  BOILING BUBBLES", 540, 1335);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", .96));
      if (!blob) throw new Error("Image export failed");
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url;
      download.download = `我的泡泡图鉴-${count}of${products.length}.png`;
      document.body.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      showToast("图鉴卡制作好啦，已经保存到下载文件夹 ♡", { duration: 3600 });
    } catch {
      showToast("这次图鉴卡没有生成成功，请稍后再试。", { duration: 3600 });
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.innerHTML = originalMarkup;
    }
  }

  collectionPageMedia.addEventListener("change", () => {
    collectionPage = 1;
    renderGrid();
  });

  function updateCard(id) {
    if (activeCategory === "owned" || activeCategory === "unowned") {
      renderGrid();
      return;
    }
    const product = products.find((item) => item.id === id);
    const card = dialog.querySelector(`[data-collection-card="${id}"]`);
    if (!product || !card) return;
    const isOwned = Boolean(owned[id]);
    card.classList.toggle("is-owned", isOwned);
    card.classList.toggle("is-locked", !isOwned);
    card.classList.toggle("is-unlocking", isOwned && unlockingId === id);
    card.querySelector(".collection-card-copy > small").textContent = isOwned
      ? `${formatDate(owned[id])} 收录`
      : "等待与你相遇";
    const toggle = card.querySelector("[data-owned-toggle]");
    toggle.setAttribute("aria-pressed", String(isOwned));
    toggle.innerHTML = `<span aria-hidden="true">${isOwned ? "✓" : "◇"}</span>${isOwned ? "我已拥有" : "我有这个"}`;
  }

  function celebrate(milestone) {
    const celebration = document.createElement("div");
    celebration.className = "collection-celebration";
    celebration.setAttribute("role", "status");
    celebration.innerHTML = `<span>${milestone.symbol}</span><small>新徽章解锁</small><strong>${milestone.name}</strong>`;
    dialog.querySelector(".collection-book-shell").append(celebration);
    requestAnimationFrame(() => celebration.classList.add("is-visible"));
    setTimeout(() => celebration.classList.add("is-leaving"), 1900);
    setTimeout(() => celebration.remove(), 2350);
  }

  function addOwned(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    owned[id] = new Date().toISOString();
    unlockingId = id;
    saveOwned();
    renderProgress();
    updateCard(id);
    window.BoilingBubblesAudio?.playEffect("collect");
    const count = ownedCount();
    const milestone = milestones.find((item) => item.count === count);
    showToast(`泡泡图鉴 +1｜「${product.name}」已点亮`, { duration: 3000 });
    if (milestone) celebrate(milestone);
    setTimeout(() => {
      unlockingId = null;
      dialog.querySelector(`[data-collection-card="${id}"]`)?.classList.remove("is-unlocking");
    }, 1100);
  }

  function removeOwned(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    const previousDate = owned[id];
    delete owned[id];
    saveOwned();
    renderProgress();
    updateCard(id);
    window.BoilingBubblesAudio?.playEffect("close");
    showToast(`已将「${product.name}」移出图鉴`, {
      actionLabel: "撤销",
      duration: 4200,
      onAction: () => {
        owned[id] = previousDate;
        saveOwned();
        renderProgress();
        updateCard(id);
        window.BoilingBubblesAudio?.playEffect("collect");
      }
    });
  }

  function openCollection() {
    renderCollection();
    closeMenu();
    dialog.showModal();
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
  }

  function closeCollection() {
    dialog.close();
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
  }

  openButtons.forEach((button) => button.addEventListener("click", openCollection));
  dialog.querySelector("[data-collection-close]").addEventListener("click", closeCollection);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeCollection();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
  });
  dialog.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-collection-filter]");
    if (filter) {
      activeCategory = filter.dataset.collectionFilter;
      collectionPage = 1;
      renderCollection();
      return;
    }
    const shareButton = event.target.closest("[data-generate-share-card]");
    if (shareButton) {
      generateShareCard(shareButton);
      return;
    }
    const toggle = event.target.closest("[data-owned-toggle]");
    if (!toggle) return;
    const id = toggle.dataset.ownedToggle;
    if (owned[id]) removeOwned(id);
    else addOwned(id);
  });
  collectionPagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-collection-page]");
    if (!button || button.disabled) return;
    collectionPage = Number(button.dataset.collectionPage);
    renderGrid();
    dialog.querySelector(".collection-toolbar")?.scrollIntoView({ block: "start", behavior: "smooth" });
  });

  renderProgress();
})();
