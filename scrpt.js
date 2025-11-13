/* ===========================
   Konfigurasi
   =========================== */
const TEST_ENDPOINT = 'https://httpbin.org/post'; // ganti dengan webhook.site URL mu jika mau
const CART_KEY = 'benihcandi_cart_v1';
const USER_KEY = 'benihcandi_user_v1';

/* ===========================
   Helper fungsi
   =========================== */
function formatRp(n) {
  if (!n && n !== 0) return '0';
  return new Intl.NumberFormat('id-ID').format(n);
}

function showToast(message, type = 'success', timeout = 3000) {
  const t = document.createElement('div');
  t.className = `toast ${type === 'error' ? 'error' : 'success'}`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.remove(), timeout);
}

/* ===========================
   Cart helpers (localStorage)
   =========================== */
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse cart from storage', e);
    return { items: [] };
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function findCartItemIndex(cart, id, name) {
  return cart.items.findIndex(it => (it.id && it.id === id) || (it.name && it.name === name));
}

function cartTotals(cart) {
  let total = 0, count = 0;
  cart.items.forEach(it => {
    total += (Number(it.price || 0) * Number(it.qty || 1));
    count += Number(it.qty || 1);
  });
  return { total, count };
}

// PERUBAHAN: Fungsi addToCart sekarang mengarahkan ke halaman keranjang
function addToCart(productInfo) {
  const cart = loadCart();
  const idx = findCartItemIndex(cart, productInfo.id, productInfo.name);
  if (idx > -1) {
    cart.items[idx].qty = Number(cart.items[idx].qty || 0) + Number(productInfo.qty || 1);
  } else {
    cart.items.push({
      id: productInfo.id || null,
      name: productInfo.name,
      price: Number(productInfo.price || 0),
      qty: Number(productInfo.qty || 1),
      img: productInfo.img || ''
    });
  }
  saveCart(cart);
  showToast(`${productInfo.name} ditambahkan ke keranjang`);
  
  // Langsung arahkan ke halaman keranjang setelah menambah produk
  setTimeout(() => {
    window.location.href = 'keranjang.html';
  }, 1000); // Beri jeda 1 detik agar notifikasi muncul
}

/* ===========================
   Update Cart UI (untuk navbar)
   =========================== */
function updateCartUI() {
  const cart = loadCart();
  const totals = cartTotals(cart);
  
  const cartCountElements = document.querySelectorAll('.cart-count');
  cartCountElements.forEach(element => {
    element.textContent = totals.count;
    element.style.display = totals.count > 0 ? 'flex' : 'none';
  });
}

/* ===========================
   Bind add-to-cart buttons
   =========================== */
function bindAddToCartButtons() {
  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const btnEl = e.currentTarget;
      const name = btnEl.dataset.name;
      const price = btnEl.dataset.price;
      const id = btnEl.dataset.id;
      const img = btnEl.dataset.img;
      
      if (!name || !price) {
        showToast('Informasi produk tidak lengkap', 'error');
        return;
      }

      addToCart({ id, name, price: Number(price), qty: 1, img });
    });
  });
}

/* ===========================
   Render Cart Page (keranjang.html)
   =========================== */
function renderCartPage() {
  const cartContainer = document.querySelector('.cart-container');
  const summaryBox = document.querySelector('.cart-summary');

  if (!cartContainer) return; // Jika bukan di halaman keranjang, tidak jalankan

  const cart = loadCart();
  cartContainer.innerHTML = '';

  if (cart.items.length === 0) {
    cartContainer.innerHTML = `<div class="empty" style="grid-column: 1 / -1; text-align:center;padding:40px;">
      <h3>Keranjang kosong</h3>
      <p>Yuk, tambah produk dari daftar produk!</p>
      <a href="index.html#produk" class="btn-primary">Belanja Sekarang</a>
    </div>`;
    if (summaryBox) summaryBox.style.display = 'none';
    return;
  }

  cart.items.forEach((it, idx) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item fade-in-up';
    itemEl.innerHTML = `
      <img src="${it.img || 'images/produk/produk1.jpg'}" alt="${it.name}">
      <h4>${it.name}</h4>
      <span class="price">${formatRp(it.price)}</span>
      <input type="number" class="qty" value="${it.qty}" min="1" data-index="${idx}">
      <span class="total">${formatRp(it.price * it.qty)}</span>
      <button class="remove-btn" data-index="${idx}"><i class="fa fa-trash"></i></button>
    `;
    cartContainer.appendChild(itemEl);
  });

  // Update summary
  if (summaryBox) {
    const totals = cartTotals(cart);
    summaryBox.querySelector('.subtotal').textContent = formatRp(totals.total);
    summaryBox.querySelector('.total-amount').textContent = formatRp(totals.total);
    summaryBox.style.display = 'block';
  }

  // Attach event listeners
  cartContainer.querySelectorAll('.qty').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = Number(e.target.dataset.index);
      const newQty = Number(e.target.value);
      if (newQty < 1) return;
      
      const cartNow = loadCart();
      cartNow.items[idx].qty = newQty;
      saveCart(cartNow);
      renderCartPage(); // Re-render to update totals
    });
  });

  cartContainer.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.target.closest('button').dataset.index);
      const cartNow = loadCart();
      const removedItem = cartNow.items[idx];
      cartNow.items.splice(idx, 1);
      saveCart(cartNow);
      showToast(`${removedItem.name} dihapus dari keranjang`);
      renderCartPage();
    });
  });
}

function clearCart() {
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
        saveCart({ items: [] });
        renderCartPage();
        showToast('Keranjang dikosongkan');
    }
}

function proceedToCheckout() {
    const cart = loadCart();
    if (cart.items.length === 0) {
        showToast('Keranjang Anda kosong', 'error');
        return;
    }
    showToast('Melanjutkan ke pembayaran... (Fitur ini masih simulasi)');
    console.log('Checkout Data:', cart);
}

/* ===========================
   PERBAIKAN: Scrollspy & Smooth Scroll (untuk index.html)
   =========================== */
function initScrollSpy() {
  const sectionIds = ['beranda', 'artikel', 'produk'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('.nav-links .nav-link'); // Perbaikan: gunakan kelas .nav-link

  if (sections.length === 0 || navLinks.length === 0) return;

  function onScroll() {
    const scrollPosition = window.scrollY + 150; // Tambah offset untuk akurasi
    
    let currentId = sectionIds[0]; // Default ke section pertama
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section.offsetTop <= scrollPosition) {
        currentId = section.id;
        break;
      }
    }

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Panggil sekali saat load untuk set state awal
}

function bindSmoothScroll() {
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      const headerOffset = 80; // Sesuaikan dengan tinggi navbar
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    });
  });
}

/* ===========================
   Product Filter
   =========================== */
function bindProductFilter() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const produkCards = document.querySelectorAll('.produk-card');

    if(filterTabs.length === 0) return;

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.dataset.filter;

            produkCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* ===========================
   Mobile Menu Toggle
   =========================== */
function bindMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navbar = document.querySelector('.navbar');

    if(hamburger) {
        hamburger.addEventListener('click', () => {
            navbar.classList.toggle('nav-open');
        });
    }
}

/* ===========================
   Initialize everything on DOMContentLoaded
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  // Update cart display saat halaman dimuat
  updateCartUI();

  // Bind tombol "Beli" / "Tambah ke Keranjang"
  bindAddToCartButtons();

  // Render halaman keranjang jika kita berada di sana
  renderCartPage();

  // Bind smooth scroll untuk navigasi di halaman utama
  bindSmoothScroll();

  // PERBAIKAN: Inisialisasi scrollspy untuk navigasi di halaman utama
  initScrollSpy();

  // Inisialisasi filter produk
  bindProductFilter();

  // Inisialisasi menu mobile
  bindMobileMenu();

  // Handle dynamic btn-cart clicks (untuk item yang ditambahkan via JS)
  document.body.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('btn-cart')) {
      const btnEl = e.target;
      const name = btnEl.dataset.name;
      const price = btnEl.dataset.price;
      const id = btnEl.dataset.id;
      const img = btnEl.dataset.img;
      if (name && price) {
        addToCart({ id, name, price: Number(price), qty: 1, img });
      }
    }
  });

  // Expose untuk debugging
  window.__benihcandi = {
    loadCart, saveCart, addToCart, cartTotals, TEST_ENDPOINT
  };
});

// script.js
(function () {
  const gallery = document.querySelector('.gallery');
  const leftBtn = document.querySelector('.nav-btn.left');
  const rightBtn = document.querySelector('.nav-btn.right');
  const range = document.getElementById('thumbRange');

  // Set initial CSS variable for item width
  function setItemWidth(w) {
    gallery.style.setProperty('--item-w', w + 'px');
  }
  setItemWidth(Number(range.value));

  // Buttons scroll by item width
  function scrollByDirection(dir = 1) {
    const itemW = parseFloat(getComputedStyle(gallery).getPropertyValue('--item-w')) || 300;
    const gap = 14; // same gap as CSS
    gallery.scrollBy({ left: dir * (itemW + gap), behavior: 'smooth' });
  }

  leftBtn.addEventListener('click', () => scrollByDirection(-1));
  rightBtn.addEventListener('click', () => scrollByDirection(1));

  // Range control to change thumbnail size
  range.addEventListener('input', (e) => setItemWidth(e.target.value));

  // Drag to scroll (mouse and touch)
  let isDown = false, startX, scrollLeft;
  gallery.addEventListener('mousedown', (e) => {
    isDown = true;
    gallery.classList.add('dragging');
    startX = e.pageX - gallery.offsetLeft;
    scrollLeft = gallery.scrollLeft;
    gallery.style.scrollBehavior = 'auto'; // immediate while dragging
  });
  gallery.addEventListener('mouseleave', () => endDrag());
  gallery.addEventListener('mouseup', () => endDrag());
  gallery.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - gallery.offsetLeft;
    const walk = (x - startX) * 1; // multiplier for sensitivity
    gallery.scrollLeft = scrollLeft - walk;
  });

  // touch events
  gallery.addEventListener('touchstart', (e) => {
    isDown = true;
    startX = e.touches[0].pageX - gallery.offsetLeft;
    scrollLeft = gallery.scrollLeft;
    gallery.style.scrollBehavior = 'auto';
  }, {passive: true});
  gallery.addEventListener('touchend', () => endDrag());
  gallery.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - gallery.offsetLeft;
    const walk = (x - startX) * 1;
    gallery.scrollLeft = scrollLeft - walk;
  }, {passive: true});

  function endDrag() {
    if (!isDown) return;
    isDown = false;
    gallery.classList.remove('dragging');
    // restore smooth snapping
    gallery.style.scrollBehavior = 'smooth';
    // optional: after drag, snap to nearest item center
    snapToClosest();
  }

  // Snap to the closest item (smooth)
  function snapToClosest() {
    const children = Array.from(gallery.querySelectorAll('.item'));
    const galleryCenter = gallery.scrollLeft + gallery.clientWidth / 2;
    let closest = null;
    let minDist = Infinity;
    for (const child of children) {
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - galleryCenter);
      if (dist < minDist) { minDist = dist; closest = child; }
    }
    if (closest) {
      const target = closest.offsetLeft + closest.clientWidth / 2 - gallery.clientWidth / 2;
      gallery.scrollTo({ left: target, behavior: 'smooth' });
    }
  }

  // keyboard support
  gallery.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { scrollByDirection(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { scrollByDirection(-1); e.preventDefault(); }
    if (e.key === 'Home') { gallery.scrollTo({ left: 0, behavior: 'smooth' }); }
    if (e.key === 'End')  { gallery.scrollTo({ left: gallery.scrollWidth, behavior: 'smooth' }); }
  });

  // optional: double-click an image to open in new tab (or lightbox enhancement)
  gallery.addEventListener('dblclick', (e) => {
    const img = e.target.closest('img');
    if (img) window.open(img.src, '_blank');
  });

  // On resize, ensure snapping position remains sensible
  window.addEventListener('resize', () => setTimeout(snapToClosest, 120));
})();

// tombol kembali
document.getElementById("backBtn").addEventListener("click", () => {
  // kembali ke halaman sebelumnya
  window.history.back();
});

// efek halus saat scroll
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (window.scrollY > 20) {
    header.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  } else {
    header.style.boxShadow = "none";
  }
});

// animasi ketikan judul
const title = document.querySelector("h1");
const text = title.textContent;
title.textContent = "";
let i = 0;
const typing = setInterval(() => {
  if (i < text.length) {
    title.textContent += text.charAt(i);
    i++;
  } else {
    clearInterval(typing);
  }
}, 70);


// Menampilkan alert saat pengguna membuka halaman
window.addEventListener("DOMContentLoaded", () => {
  console.log("Halaman Syarat dan Ketentuan berhasil dimuat.");
});



document.addEventListener("DOMContentLoaded", () => {
  const members = document.querySelectorAll(".member");

  // Link GitHub masing-masing anggota
  const githubLinks = [
    "https://github.com/teguh-santoso",
    "https://github.com/rafipratama",
    "https://github.com/rizkyananda",
    "https://github.com/dewilestari",
    "https://github.com/fajarhidayat",
    "https://github.com/putriamelia"
  ];

  // Klik foto => buka GitHub
  members.forEach((member, index) => {
    member.addEventListener("click", () => {
      window.open(githubLinks[index], "_blank");
    });

    // Efek hover warna lembut
    member.addEventListener("mouseenter", () => {
      member.style.backgroundColor = "#eafaf1";
    });
    member.addEventListener("mouseleave", () => {
      member.style.backgroundColor = "#fff";
    });
  });

  // Animasi masuk
  members.forEach((member, i) => {
    member.style.opacity = 0;
    member.style.transform = "translateY(30px)";
    setTimeout(() => {
      member.style.transition = "all 0.6s ease";
      member.style.opacity = 1;
      member.style.transform = "translateY(0)";
    }, i * 150);
  });
});





// ===== TOGGLE MENU (untuk mobile) =====
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// ===== CONTOH: Update jumlah keranjang (dummy) =====
const cartCount = document.querySelector('.cart-count');
let count = 0;

// Klik ikon keranjang untuk menambah dummy jumlah
document.querySelector('.cart-icon').addEventListener('click', (e) => {
  e.preventDefault();
  count++;
  cartCount.textContent = count;
});




