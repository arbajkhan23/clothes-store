// Slider Functionality
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".slider-dot");
let currentSlide = 0;
const slideInterval = 5000;

function showSlide(index) {
  if (!slides.length) return;
  if (index < 0) index = 0;
  if (index >= slides.length) index = slides.length - 1;

  slides.forEach((slide) => slide.classList.remove("active"));
  dots.forEach((dot) => dot.classList.remove("active"));

  slides[index].classList.add("active");
  dots[index].classList.add("active");
  currentSlide = index;
}

function nextSlide() {
  let nextIndex = (currentSlide + 1) % slides.length;
  showSlide(nextIndex);
}

let slideTimer = setInterval(nextSlide, slideInterval);

if (dots.length && dots.length === slides.length) {
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      clearInterval(slideTimer);
      showSlide(index);
      slideTimer = setInterval(nextSlide, slideInterval);
    });
  });
}

// Tab switching functionality
(function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const productCols = document.querySelectorAll(
    ".trending-section .row > .col-lg-3"
  );

  function showTab(key) {
    productCols.forEach((col) => {
      const card = col.querySelector(".product-card");
      if (!card) return;
      const tab = card.getAttribute("data-tab") || "new";
      if (key === "all" || tab === key) {
        col.style.display = "";
      } else {
        col.style.display = "none";
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      const text = this.textContent.trim().toLowerCase();
      if (text.includes("new")) showTab("new");
      else if (text.includes("feature")) showTab("featured");
      else if (text.includes("best")) showTab("best");
      else showTab("all");
    });
  });

  showTab("new");
})();

// Countdown timer
function updateTimer() {
  const timerElement = document.querySelector(".timer");
  if (timerElement) {
    const now = new Date();
    const endTime = new Date(now);
    endTime.setHours(23, 59, 59);

    const diff = endTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timerElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
}

setInterval(updateTimer, 1000);
updateTimer();

// Newsletter subscription
document
  .querySelector(".newsletter-btn")
  ?.addEventListener("click", function () {
    const emailInput = document.querySelector(".newsletter-input");
    const email = emailInput.value;

    if (email && email.includes("@")) {
      showNotification("Thank you for subscribing to our newsletter!");
      emailInput.value = "";
    } else {
      showNotification("Please enter a valid email address");
    }
  });

// Search functionality
document
  .querySelector(".search-box button")
  ?.addEventListener("click", function () {
    const searchInput = this.previousElementSibling;
    if (searchInput.value.trim()) {
      showNotification(`Searching for: ${searchInput.value}`);
    }
  });

// Wishlist toggle
document.querySelectorAll(".fa-heart").forEach((icon) => {
  icon.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.classList.contains("far")) {
      this.classList.remove("far");
      this.classList.add("fas");
      this.style.color = "#ff3366";

      const wishlistBadge = document.querySelectorAll(".cart-badge")[1];
      if (wishlistBadge) {
        let currentCount = parseInt(wishlistBadge.textContent);
        wishlistBadge.textContent = currentCount + 1;
      }

      showNotification("Added to wishlist");
    } else {
      this.classList.remove("fas");
      this.classList.add("far");
      this.style.color = "";

      const wishlistBadge = document.querySelectorAll(".cart-badge")[1];
      if (wishlistBadge) {
        let currentCount = parseInt(wishlistBadge.textContent);
        wishlistBadge.textContent = currentCount - 1;
      }

      showNotification("Removed from wishlist");
    }
  });
});

// Simple notification function
function showNotification(message) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(
    ".toast-notification"
  );
  existingNotifications.forEach((notification) => notification.remove());

  // Create notification
  const notification = document.createElement("div");
  notification.className = "toast-notification";

  notification.innerHTML = `
      <div class="toast-content">
        <div class="toast-message">
          <i class="fas fa-check-circle me-2"></i>
          <span>${message}</span>
        </div>
        <button class="toast-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

  document.body.appendChild(notification);

  // Close button
  notification.querySelector(".toast-close").addEventListener("click", () => {
    notification.remove();
  });

  // Auto remove
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Pause slider on hover
const heroSlider = document.querySelector(".hero-slider");
if (heroSlider) {
  heroSlider.addEventListener("mouseenter", () => {
    clearInterval(slideTimer);
  });

  heroSlider.addEventListener("mouseleave", () => {
    slideTimer = setInterval(nextSlide, slideInterval);
  });
}

// Blog slider
(function initBlogSlider() {
  const blogSlider = document.querySelector(".blog-slider");
  if (!blogSlider) return;

  const card = blogSlider.querySelector(".col-lg-4");
  if (!card) return;

  const cardWidth = card.getBoundingClientRect().width + 20;
  let blogIndex = 0;

  function scrollToIndex(i) {
    blogSlider.scrollTo({
      left: Math.round(i * cardWidth),
      behavior: "smooth",
    });
  }

  setInterval(() => {
    const maxIndex = Math.max(
      0,
      Math.ceil(blogSlider.scrollWidth / cardWidth) - 1
    );
    blogIndex = (blogIndex + 1) % (maxIndex + 1);
    scrollToIndex(blogIndex);
  }, 3500);
})();

// Deal Slider functionality
(function initDealSlider() {
  const dealGrid = document.querySelector(".deal-grid");
  const prevBtn = document.querySelector(".slider-nav-prev");
  const nextBtn = document.querySelector(".slider-nav-next");

  if (!dealGrid || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  let cardWidth = 0;
  let visibleCards = 4;
  let maxIndex = 0;

  function calculateDimensions() {
    const cards = dealGrid.querySelectorAll(".product-card");
    if (cards.length === 0) return;

    const computedStyle = window.getComputedStyle(dealGrid);
    const gap = parseInt(computedStyle.gap) || 25;
    cardWidth = cards[0].offsetWidth + gap;

    if (window.innerWidth < 768) {
      visibleCards = 1;
    } else if (window.innerWidth < 992) {
      visibleCards = 2;
    } else {
      visibleCards = 4;
    }

    const totalCards = cards.length;
    maxIndex = Math.max(0, totalCards - visibleCards);
  }

  function slideToIndex(index) {
    if (index < 0) index = 0;
    if (index > maxIndex) index = maxIndex;

    currentIndex = index;
    const offset = -currentIndex * cardWidth;
    dealGrid.style.transform = `translateX(${offset}px)`;
  }

  prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    slideToIndex(currentIndex - 1);
  });

  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    slideToIndex(currentIndex + 1);
  });

  calculateDimensions();
  window.addEventListener("resize", () => {
    calculateDimensions();
    slideToIndex(currentIndex);
  });

  slideToIndex(0);
})();

// Testimonial Slider
document.addEventListener("DOMContentLoaded", function () {
  const testimonialSlider = document.querySelector(".testimonial-slider");
    if (testimonialSlider && typeof window.Swiper === 'function') {
    new Swiper(".testimonial-slider", {
      loop: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
  }

  // Login/Register Modal Tabs
  window.showTab = function (tabName) {
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.remove("active");
    });

    const selectedTab = document.querySelector(
      `.auth-tab[onclick*="${tabName}"]`
    );
    const selectedForm = document.getElementById(`${tabName}Tab`);

    if (selectedTab) selectedTab.classList.add("active");
    if (selectedForm) selectedForm.classList.add("active");
  };

    async function submitCustomerAuth(form, endpoint, getPayload) {
        const button = form.querySelector('.btn-dark');
        if (!button) return;

        let feedback = form.querySelector('.auth-feedback');
        if (!feedback) {
            feedback = document.createElement('p');
            feedback.className = 'auth-feedback alert py-2 small';
            feedback.setAttribute('role', 'alert');
            form.prepend(feedback);
        }
        feedback.hidden = true;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = endpoint === 'login' ? 'Signing in...' : 'Creating account...';

        try {
            const apiBase = (window.STORE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
            const response = await fetch(`${apiBase}/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(getPayload()),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'Your account request could not be completed.');

            localStorage.setItem('fashion_store_token', result.token);
            localStorage.setItem('fashion_store_user', JSON.stringify(result.user));
            const userIcon = document.querySelector('.icon-btn .fa-user');
            if (userIcon) {
                userIcon.classList.remove('far', 'fa-user');
                userIcon.classList.add('fas', 'fa-user-check');
            }
            window.renderStoreAccount?.();
            const modalElement = document.getElementById('loginModal');
            const modal = window.bootstrap?.Modal?.getInstance(modalElement);
            if (modal) modal.hide();
        } catch (error) {
            feedback.classList.add('alert-danger');
            feedback.textContent = error.message || 'Your account request could not be completed.';
            feedback.hidden = false;
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = loginForm.querySelector('input[type="email"]')?.value.trim() || '';
        const password = loginForm.querySelector('input[type="password"]')?.value || '';
        submitCustomerAuth(loginForm, 'login', () => ({ email, password }));
    });

    const registerForm = document.getElementById('registerForm');
    registerForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const names = [...registerForm.querySelectorAll('input[type="text"]')].map((input) => input.value.trim());
        const passwords = [...registerForm.querySelectorAll('input[type="password"]')].map((input) => input.value);
        if (passwords[0] !== passwords[1]) {
            let feedback = registerForm.querySelector('.auth-feedback');
            if (!feedback) {
                feedback = document.createElement('p');
                feedback.className = 'auth-feedback alert alert-danger py-2 small';
                feedback.setAttribute('role', 'alert');
                registerForm.prepend(feedback);
            }
            feedback.textContent = 'Passwords do not match.';
            feedback.hidden = false;
            return;
        }
        const email = registerForm.querySelector('input[type="email"]')?.value.trim() || '';
        submitCustomerAuth(registerForm, 'register', () => ({ name: names.filter(Boolean).join(' '), email, password: passwords[0] || '' }));
    });

    const authContainer = document.querySelector('#loginModal .auth-container');
    if (authContainer) {
        const accountPanel = document.createElement('section');
        accountPanel.className = 'auth-account';
        accountPanel.innerHTML = '<h3 data-account-name></h3><p data-account-email></p><div class="auth-account-actions"><button class="btn btn-dark" type="button" data-account-orders>View my orders</button><button class="btn btn-outline-secondary" type="button" data-account-signout>Sign out</button></div><div class="auth-order-list" data-account-order-list hidden></div>';
        authContainer.append(accountPanel);

        const authTabs = authContainer.querySelector('.auth-tabs');
        const authForms = authContainer.querySelectorAll('.auth-form');
        const orderList = accountPanel.querySelector('[data-account-order-list]');

        function renderAuthState() {
            let user = null;
            try { user = JSON.parse(localStorage.getItem('fashion_store_user') || 'null'); } catch (_) { /* Ignore invalid saved profile data. */ }
            accountPanel.classList.toggle('active', Boolean(user));
            if (authTabs) authTabs.hidden = Boolean(user);
            authForms.forEach((form) => form.classList.toggle('auth-account-hidden', Boolean(user)));
            accountPanel.querySelector('[data-account-name]').textContent = user?.name || '';
            accountPanel.querySelector('[data-account-email]').textContent = user?.email || '';
            const userIcon = document.querySelector('.icon-btn .fa-user, .icon-btn .fa-user-check');
            if (userIcon) {
                userIcon.classList.toggle('fa-user-check', Boolean(user));
                userIcon.classList.toggle('fa-user', !user);
            }
        }

        accountPanel.querySelector('[data-account-orders]').addEventListener('click', async () => {
            const token = localStorage.getItem('fashion_store_token');
            orderList.hidden = false;
            orderList.textContent = 'Loading your orders...';
            try {
                const apiBase = (window.STORE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
                const response = await fetch(`${apiBase}/users/me/orders`, { headers: { Authorization: `Bearer ${token}` } });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error || 'Your order history could not be loaded.');
                if (!result.items.length) {
                    orderList.textContent = 'No orders yet.';
                    return;
                }
                orderList.replaceChildren(...result.items.map((order) => {
                    const row = document.createElement('div');
                    row.className = 'auth-order-row';
                    const summary = document.createElement('span');
                    summary.textContent = `${order.orderNumber} · ${order.status} · ${new Date(order.createdAt).toLocaleDateString()}`;
                    const total = document.createElement('strong');
                    total.textContent = `$${Number(order.total).toFixed(2)}`;
                    row.append(summary, total);
                    return row;
                }));
            } catch (error) {
                orderList.textContent = error.message || 'Your order history could not be loaded.';
            }
        });

        accountPanel.querySelector('[data-account-signout]').addEventListener('click', () => {
            localStorage.removeItem('fashion_store_token');
            localStorage.removeItem('fashion_store_user');
            orderList.hidden = true;
            orderList.replaceChildren();
            renderAuthState();
            window.showTab('login');
        });
        document.getElementById('loginModal')?.addEventListener('show.bs.modal', renderAuthState);
        renderAuthState();
        window.renderStoreAccount = renderAuthState;
    }

  // Forgot Password
  const forgotLink = document.querySelector(".forgot-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", function (e) {
      e.preventDefault();
            let feedback = loginForm?.querySelector('.auth-feedback');
            if (!feedback && loginForm) {
                feedback = document.createElement('p');
                feedback.className = 'auth-feedback alert alert-warning py-2 small';
                feedback.setAttribute('role', 'status');
                loginForm.prepend(feedback);
      }
            if (feedback) {
                feedback.textContent = 'Password recovery is not configured for this store yet.';
                feedback.hidden = false;
            }
    });
  }
});

// Initialize first slide
showSlide(0);

// Product Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize only if we're on a product listing page
    const products = document.querySelectorAll('.product-card');
    if (products.length === 0) return;

    // DOM Elements
    const noResultsMessage = document.getElementById('noResultsMessage');
    const filterResults = document.getElementById('filterResults');
    const activeFiltersContainer = document.getElementById('activeFilters');
    
    // Check if elements exist before proceeding
    if (!noResultsMessage || !filterResults || !activeFiltersContainer) {
        console.log('Filter elements not found on this page');
        return;
    }

    // Filter Elements
    const brandFilters = document.querySelectorAll('.brand-filter');
    const sizeFilters = document.querySelectorAll('.size-filter');
    const typeFilters = document.querySelectorAll('.type-filter');
    const availabilityFilters = document.querySelectorAll('.availability-filter');
    const colorOptions = document.querySelectorAll('.color-option');
    const priceMinInput = document.getElementById('priceMin');
    const priceMaxInput = document.getElementById('priceMax');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const priceSliderFill = document.getElementById('priceSliderFill');
    const priceSliderThumbMin = document.getElementById('priceSliderThumbMin');
    const priceSliderThumbMax = document.getElementById('priceSliderThumbMax');
    
    // View toggle elements
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const sortSelect = document.getElementById('sortSelect');
    
    // Mobile filter elements
    const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
    const filterSidebar = document.querySelector('.filter-sidebar');
    const overlay = document.querySelector('.overlay');

    // State variables
    let selectedColors = [];
    let minPrice = 0;
    let maxPrice = 89;
    let isListView = false;
    let selectedAvailability = 'in'; // Default to 'in stock'

    // Initialize price slider
    function initializePriceSlider() {
        if (!priceMinInput || !priceMaxInput || !priceSliderThumbMin || !priceSliderThumbMax) {
            console.log('Price slider elements not found');
            return;
        }

        priceMinInput.value = minPrice;
        priceMaxInput.value = maxPrice;

        priceSliderThumbMin.style.left = "0%";
        priceSliderThumbMax.style.left = "100%";
        if (priceSliderFill) {
            priceSliderFill.style.width = "100%";
        }

        // Update price slider when inputs change
        priceMinInput.addEventListener('input', () => {
            let value = parseInt(priceMinInput.value) || 0;
            if (value < 0) value = 0;
            if (value > maxPrice) value = maxPrice - 1;

            minPrice = value;
            const percent = (minPrice / 89) * 100;
            if (priceSliderThumbMin) {
                priceSliderThumbMin.style.left = `${percent}%`;
                
                if (priceSliderThumbMax) {
                    const maxPercent = parseFloat(priceSliderThumbMax.style.left);
                    if (percent > maxPercent) {
                        priceSliderThumbMin.style.left = `${maxPercent}%`;
                        minPrice = Math.round((maxPercent / 100) * 89);
                        priceMinInput.value = minPrice;
                    }
                }
            }

            updateSliderFill();
            updateActiveFilters();
            applyFilters();
        });

        priceMaxInput.addEventListener('input', () => {
            let value = parseInt(priceMaxInput.value) || 89;
            if (value > 89) value = 89;
            if (value < minPrice) value = minPrice + 1;

            maxPrice = value;
            const percent = (maxPrice / 89) * 100;
            if (priceSliderThumbMax) {
                priceSliderThumbMax.style.left = `${percent}%`;
                
                if (priceSliderThumbMin) {
                    const minPercent = parseFloat(priceSliderThumbMin.style.left);
                    if (percent < minPercent) {
                        priceSliderThumbMax.style.left = `${minPercent}%`;
                        maxPrice = Math.round((minPercent / 100) * 89);
                        priceMaxInput.value = maxPrice;
                    }
                }
            }

            updateSliderFill();
            updateActiveFilters();
            applyFilters();
        });

        // Price slider thumb dragging
        let isDraggingMin = false;
        let isDraggingMax = false;

        if (priceSliderThumbMin) {
            priceSliderThumbMin.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isDraggingMin = true;
            });
        }

        if (priceSliderThumbMax) {
            priceSliderThumbMax.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isDraggingMax = true;
            });
        }

        document.addEventListener('mousemove', (e) => {
            if (!isDraggingMin && !isDraggingMax) return;

            const slider = document.querySelector('.price-slider');
            if (!slider) return;
            
            const rect = slider.getBoundingClientRect();
            let percent = ((e.clientX - rect.left) / rect.width) * 100;

            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;

            if (isDraggingMin && priceSliderThumbMin) {
                if (priceSliderThumbMax) {
                    const maxPercent = parseFloat(priceSliderThumbMax.style.left);
                    if (percent > maxPercent) {
                        percent = maxPercent;
                    }
                }
                priceSliderThumbMin.style.left = `${percent}%`;
                minPrice = Math.round((percent / 100) * 89);
                if (priceMinInput) priceMinInput.value = minPrice;
            }

            if (isDraggingMax && priceSliderThumbMax) {
                if (priceSliderThumbMin) {
                    const minPercent = parseFloat(priceSliderThumbMin.style.left);
                    if (percent < minPercent) {
                        percent = minPercent;
                    }
                }
                priceSliderThumbMax.style.left = `${percent}%`;
                maxPrice = Math.round((percent / 100) * 89);
                if (priceMaxInput) priceMaxInput.value = maxPrice;
            }

            updateSliderFill();
            updateActiveFilters();
            applyFilters();
        });

        document.addEventListener('mouseup', () => {
            isDraggingMin = false;
            isDraggingMax = false;
        });
    }

    function updateSliderFill() {
        if (!priceSliderFill || !priceSliderThumbMin || !priceSliderThumbMax) return;
        
        const minPercent = parseFloat(priceSliderThumbMin.style.left);
        const maxPercent = parseFloat(priceSliderThumbMax.style.left);

        priceSliderFill.style.left = `${minPercent}%`;
        priceSliderFill.style.width = `${maxPercent - minPercent}%`;
    }

    // Color selection
    colorOptions.forEach((color) => {
        color.addEventListener('click', () => {
            color.classList.toggle('selected');
            const colorValue = color.getAttribute('data-color');

            if (selectedColors.includes(colorValue)) {
                selectedColors = selectedColors.filter(c => c !== colorValue);
            } else {
                selectedColors.push(colorValue);
            }

            updateActiveFilters();
            applyFilters();
        });
    });

    // Availability selection
    if (availabilityFilters.length > 0) {
        availabilityFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                if (filter.checked) {
                    selectedAvailability = filter.value;
                }
                updateActiveFilters();
                applyFilters();
            });
        });
    }

    // Update active filters display
    function updateActiveFilters() {
        activeFiltersContainer.innerHTML = '';

        // Price filter
        if (minPrice > 0 || maxPrice < 89) {
            const priceBadge = document.createElement('div');
            priceBadge.className = 'filter-badge';
            priceBadge.innerHTML = `
                Price: $${minPrice} - $${maxPrice}
                <button type="button" class="remove-price-filter">
                    <i class="fas fa-times"></i>
                </button>
            `;

            priceBadge.querySelector('.remove-price-filter').addEventListener('click', () => {
                minPrice = 0;
                maxPrice = 89;
                if (priceMinInput) priceMinInput.value = minPrice;
                if (priceMaxInput) priceMaxInput.value = maxPrice;
                if (priceSliderThumbMin) priceSliderThumbMin.style.left = '0%';
                if (priceSliderThumbMax) priceSliderThumbMax.style.left = '100%';
                updateSliderFill();
                updateActiveFilters();
                applyFilters();
            });

            activeFiltersContainer.appendChild(priceBadge);
        }

        // Availability filter
        if (selectedAvailability !== 'all') {
            const availabilityBadge = document.createElement('div');
            availabilityBadge.className = 'filter-badge';
            const label = selectedAvailability === 'in' ? 'In Stock' : 'Out of Stock';
            availabilityBadge.innerHTML = `
                ${label}
                <button type="button" class="remove-availability-filter">
                    <i class="fas fa-times"></i>
                </button>
            `;

            availabilityBadge.querySelector('.remove-availability-filter').addEventListener('click', () => {
                selectedAvailability = 'all';
                if (availabilityFilters.length > 0) {
                    availabilityFilters.forEach(f => {
                        if (f.value === 'all') {
                            f.checked = true;
                        } else {
                            f.checked = false;
                        }
                    });
                }
                updateActiveFilters();
                applyFilters();
            });

            activeFiltersContainer.appendChild(availabilityBadge);
        }

        // Color filters
        selectedColors.forEach((color) => {
            const colorBadge = document.createElement('div');
            colorBadge.className = 'filter-badge';
            colorBadge.innerHTML = `
                ${color.charAt(0).toUpperCase() + color.slice(1)}
                <button type="button" class="remove-color-filter" data-color="${color}">
                    <i class="fas fa-times"></i>
                </button>
            `;

            colorBadge.querySelector('.remove-color-filter').addEventListener('click', (e) => {
                const colorValue = e.currentTarget.getAttribute('data-color');
                selectedColors = selectedColors.filter(c => c !== colorValue);
                colorOptions.forEach(option => {
                    if (option.getAttribute('data-color') === colorValue) {
                        option.classList.remove('selected');
                    }
                });
                updateActiveFilters();
                applyFilters();
            });

            activeFiltersContainer.appendChild(colorBadge);
        });

        // Brand filters
        const activeBrands = brandFilters ? 
            [...brandFilters].filter(cb => cb.checked).map(cb => cb.value) : [];
        
        activeBrands.forEach(brand => {
            if (brand) {
                const brandBadge = document.createElement('div');
                brandBadge.className = 'filter-badge';
                brandBadge.innerHTML = `
                    ${brand.charAt(0).toUpperCase() + brand.slice(1)}
                    <button type="button" class="remove-brand-filter" data-brand="${brand}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                brandBadge.querySelector('.remove-brand-filter').addEventListener('click', (e) => {
                    const brandValue = e.currentTarget.getAttribute('data-brand');
                    brandFilters.forEach(cb => {
                        if (cb.value === brandValue) {
                            cb.checked = false;
                        }
                    });
                    updateActiveFilters();
                    applyFilters();
                });

                activeFiltersContainer.appendChild(brandBadge);
            }
        });

        // Size filters
        const activeSizes = sizeFilters ? 
            [...sizeFilters].filter(cb => cb.checked).map(cb => cb.value) : [];
        
        activeSizes.forEach(size => {
            if (size) {
                const sizeBadge = document.createElement('div');
                sizeBadge.className = 'filter-badge';
                sizeBadge.innerHTML = `
                    Size: ${size.charAt(0).toUpperCase() + size.slice(1)}
                    <button type="button" class="remove-size-filter" data-size="${size}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                sizeBadge.querySelector('.remove-size-filter').addEventListener('click', (e) => {
                    const sizeValue = e.currentTarget.getAttribute('data-size');
                    sizeFilters.forEach(cb => {
                        if (cb.value === sizeValue) {
                            cb.checked = false;
                        }
                    });
                    updateActiveFilters();
                    applyFilters();
                });

                activeFiltersContainer.appendChild(sizeBadge);
            }
        });

        // Type filters
        const activeTypes = typeFilters ? 
            [...typeFilters].filter(cb => cb.checked).map(cb => cb.value) : [];
        
        activeTypes.forEach(type => {
            if (type) {
                const typeBadge = document.createElement('div');
                typeBadge.className = 'filter-badge';
                typeBadge.innerHTML = `
                    ${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    <button type="button" class="remove-type-filter" data-type="${type}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                typeBadge.querySelector('.remove-type-filter').addEventListener('click', (e) => {
                    const typeValue = e.currentTarget.getAttribute('data-type');
                    typeFilters.forEach(cb => {
                        if (cb.value === typeValue) {
                            cb.checked = false;
                        }
                    });
                    updateActiveFilters();
                    applyFilters();
                });

                activeFiltersContainer.appendChild(typeBadge);
            }
        });
    }

    // Clear all filters
    function clearAllFilters() {
        // Uncheck all checkboxes
        brandFilters.forEach(cb => cb.checked = false);
        sizeFilters.forEach(cb => cb.checked = false);
        typeFilters.forEach(cb => cb.checked = false);

        // Reset availability filter to 'all'
        selectedAvailability = 'all';
        if (availabilityFilters.length > 0) {
            availabilityFilters.forEach(f => {
                f.checked = f.value === 'all';
            });
        }

        // Reset color selection
        colorOptions.forEach(color => color.classList.remove('selected'));
        selectedColors = [];

        // Reset price filter
        minPrice = 0;
        maxPrice = 89;
        if (priceMinInput) priceMinInput.value = minPrice;
        if (priceMaxInput) priceMaxInput.value = maxPrice;
        if (priceSliderThumbMin) priceSliderThumbMin.style.left = '0%';
        if (priceSliderThumbMax) priceSliderThumbMax.style.left = '100%';
        updateSliderFill();

        // Reset sort
        if (sortSelect) sortSelect.selectedIndex = 0;

        // Clear active filters
        updateActiveFilters();
        applyFilters();
    }

    // Event listeners for clear buttons
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllFilters);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', clearAllFilters);
    }

    // Mobile filter toggle
    if (mobileFilterToggle && filterSidebar && overlay) {
        mobileFilterToggle.addEventListener('click', () => {
            filterSidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        overlay.addEventListener('click', () => {
            filterSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // View toggle functionality
    if (gridViewBtn && listViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            isListView = false;
            toggleView();
        });

        listViewBtn.addEventListener('click', () => {
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            isListView = true;
            toggleView();
        });
    }

    function toggleView() {
        const productGrid = document.getElementById('productGrid');
        if (!productGrid) return;

        if (isListView) {
            productGrid.classList.add('list-view');
            productGrid.classList.remove('row');
            
            // Apply list view styles to all product containers
            const productContainers = productGrid.querySelectorAll('.col-md-4, .col-sm-6');
            productContainers.forEach(container => {
                container.style.width = '100%';
                container.style.flex = '0 0 100%';
                container.style.maxWidth = '100%';
            });
        } else {
            productGrid.classList.remove('list-view');
            productGrid.classList.add('row');
            
            // Reset grid view styles
            const productContainers = productGrid.querySelectorAll('.col-md-4, .col-sm-6');
            productContainers.forEach(container => {
                container.style.width = '';
                container.style.flex = '';
                container.style.maxWidth = '';
            });
        }
    }

    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            applyFilters();
        });
    }

    // Main filter function
    function applyFilters() {
        if (products.length === 0) return;

        // Get active filters
        const activeBrands = brandFilters ? 
            [...brandFilters].filter(cb => cb.checked).map(cb => cb.value.toLowerCase()) : [];
        
        const activeSizes = sizeFilters ? 
            [...sizeFilters].filter(cb => cb.checked).map(cb => cb.value.toLowerCase()) : [];
        
        const activeTypes = typeFilters ? 
            [...typeFilters].filter(cb => cb.checked).map(cb => cb.value.toLowerCase()) : [];

        // Filter products
        let visibleCount = 0;

        products.forEach((card) => {
            const brand = card.dataset.brand ? card.dataset.brand.toLowerCase() : '';
            const price = parseInt(card.dataset.price) || 0;
            const stock = card.dataset.stock ? card.dataset.stock.toLowerCase() : 'in';
            const size = card.dataset.size ? card.dataset.size.toLowerCase() : '';
            const type = card.dataset.type ? card.dataset.type.toLowerCase() : '';
            const color = card.dataset.color ? card.dataset.color.toLowerCase() : '';

            // Check each filter condition
            const brandMatch = activeBrands.length === 0 || activeBrands.includes(brand);
            const sizeMatch = activeSizes.length === 0 || activeSizes.includes(size);
            const typeMatch = activeTypes.length === 0 || activeTypes.includes(type);
            
            // Availability filter logic
            let stockMatch = true;
            if (selectedAvailability === 'in') {
                stockMatch = stock === 'in';
            } else if (selectedAvailability === 'out') {
                stockMatch = stock === 'out';
            } // else 'all' - always true
            
            const colorMatch = selectedColors.length === 0 || selectedColors.includes(color);
            const priceMatch = price >= minPrice && price <= maxPrice;

            // Show/hide product based on all filters
            const shouldShow = brandMatch && sizeMatch && typeMatch && stockMatch && colorMatch && priceMatch;

            const productContainer = card.closest('.col-md-4, .col-sm-6');
            if (shouldShow) {
                productContainer.style.display = 'block';
                visibleCount++;
            } else {
                productContainer.style.display = 'none';
            }
        });

        // Update results count
        if (filterResults) {
            filterResults.textContent = `Showing ${visibleCount} product${visibleCount !== 1 ? 's' : ''}`;
        }

        // Show/hide no results message
        if (noResultsMessage) {
            noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        // Apply sorting
        applySorting();
    }

    // Sorting function
    function applySorting() {
        if (!sortSelect || products.length === 0) return;

        const sortValue = sortSelect.value;
        const productContainers = Array.from(
            document.querySelectorAll('.col-md-4, .col-sm-6')
        ).filter(container => container.style.display !== 'none');

        // Sort based on selected option
        productContainers.sort((a, b) => {
            const productA = a.querySelector('.product-card');
            const productB = b.querySelector('.product-card');

            if (!productA || !productB) return 0;

            const priceA = parseInt(productA.dataset.price) || 0;
            const priceB = parseInt(productB.dataset.price) || 0;

            if (sortValue.includes('Low to High')) {
                return priceA - priceB;
            } else if (sortValue.includes('High to Low')) {
                return priceB - priceA;
            } else {
                // Default/Featured - keep original order
                return 0;
            }
        });

        // Reorder products in the grid
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productContainers.forEach(container => {
                productGrid.appendChild(container);
            });
        }
    }

    // Add event listeners to all filters
    if (brandFilters.length > 0) {
        brandFilters.forEach(cb => cb.addEventListener('change', () => {
            updateActiveFilters();
            applyFilters();
        }));
    }
    
    if (sizeFilters.length > 0) {
        sizeFilters.forEach(cb => cb.addEventListener('change', () => {
            updateActiveFilters();
            applyFilters();
        }));
    }
    
    if (typeFilters.length > 0) {
        typeFilters.forEach(cb => cb.addEventListener('change', () => {
            updateActiveFilters();
            applyFilters();
        }));
    }
    
    if (availabilityFilters.length > 0) {
        availabilityFilters.forEach(cb => cb.addEventListener('change', () => {
            updateActiveFilters();
            applyFilters();
        }));
    }

    // Initialize
    initializePriceSlider();
    applyFilters();
    updateActiveFilters();
});



// animations.js
class ScrollAnimations {
    constructor() {
        this.sections = document.querySelectorAll('.reveal');
        // this.backToTop = document.querySelector('.back-to-top');
        // this.scrollProgress = document.querySelector('.scroll-progress');
        this.lastScrollTop = 0;
        this.scrollingDown = false;
        this.animationCount = 0;
        
        this.init();
    }
    
    init() {
        // Initial check for animations
        this.checkScroll();
        
        // Scroll event listener
        window.addEventListener('scroll', () => {
            this.checkScroll();
            this.updateScrollProgress();
            this.toggleBackToTop();
            this.animateOnScroll();
        });
        
        // Back to top button click
        if (this.backToTop) {
            this.backToTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
        // Initialize product card animations
        this.animateProductCards();
        
        // Initialize hover effects
        this.initHoverEffects();
    }
    
    checkScroll() {
        const scrollPosition = window.scrollY + window.innerHeight;
        const triggerBottom = window.innerHeight * 0.85;
        
        this.sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top + window.scrollY;
            
            if (scrollPosition > sectionTop + triggerBottom) {
                section.classList.add('active');
            }
        });
    }
    
    updateScrollProgress() {
        if (!this.scrollProgress) return;
        
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        this.scrollProgress.style.width = scrolled + "%";
    }
    
    toggleBackToTop() {
        if (!this.backToTop) return;
        
        if (window.scrollY > 300) {
            this.backToTop.classList.add('show');
        } else {
            this.backToTop.classList.remove('show');
        }
    }
    
    animateOnScroll() {
        const currentScroll = window.pageYOffset;
        
        // Detect scroll direction
        this.scrollingDown = currentScroll > this.lastScrollTop;
        this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        
        // Add/remove classes based on scroll
        const header = document.querySelector('.main-header');
        if (currentScroll > 50) {
            header.classList.add('with-shadow');
        } else {
            header.classList.remove('with-shadow');
        }
    }
    
    animateProductCards() {
        const productCards = document.querySelectorAll('.product-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.animation = `fadeInUp 0.6s ease forwards ${index * 0.1}s`;
                    }, 100);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        productCards.forEach(card => {
            observer.observe(card);
        });
    }
    
    initHoverEffects() {
        // Add hover class to product cards
        const cards = document.querySelectorAll('.product-card, .blog-card, .category-card');
        cards.forEach(card => {
            card.classList.add('hover-lift');
        });
        
        // Add scale effect to images
        const images = document.querySelectorAll('.category-card img, .product-card img');
        images.forEach(img => {
            img.parentElement.classList.add('hover-scale');
        });
    }
}

// Header Scroll Animation
class HeaderAnimation {
    constructor() {
        this.header = document.querySelector('.main-header');
        this.topBar = document.querySelector('.top-bar');
        this.lastScroll = 0;
        
        this.init();
    }
    
    init() {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Hide/show header on scroll
            if (currentScroll > 100) {
                if (currentScroll > this.lastScroll) {
                    // Scrolling down
                    this.header.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling up
                    this.header.style.transform = 'translateY(0)';
                }
                
                if (this.topBar) {
                    this.topBar.classList.add('hide');
                }
            } else {
                this.header.style.transform = 'translateY(0)';
                if (this.topBar) {
                    this.topBar.classList.remove('hide');
                }
            }
            
            this.lastScroll = currentScroll;
        });
    }
}

// Page Load Animations
class PageLoadAnimations {
    constructor() {
        this.init();
    }
    
    init() {
        // Add loading class to body
        document.body.classList.add('page-loading');
        
        // Remove loading class after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.classList.remove('page-loading');
                this.animateHeroSection();
            }, 500);
        });
    }
    
    animateHeroSection() {
        const heroContent = document.querySelector('.slide-content');
        if (heroContent) {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }
    }
}

// Counter Animation
class CounterAnimation {
    constructor() {
        this.counters = document.querySelectorAll('.counter');
        this.init();
    }
    
    init() {
        if (this.counters.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            this.counters.forEach(counter => observer.observe(counter));
        }
    }
    
    animateCounter(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    }
}

// Tab Switching Animation
class TabAnimation {
    constructor() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.productCards = document.querySelectorAll('.product-card[data-tab]');
        
        this.init();
    }
    
    init() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.textContent.trim().toLowerCase().replace(' ', '-');
                this.switchTab(tab);
                this.updateActiveButton(e.target);
            });
        });
    }
    
    switchTab(tabName) {
        this.productCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                if (card.getAttribute('data-tab') === tabName || tabName === 'new-arrival') {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            }, 300);
        });
    }
    
    updateActiveButton(activeButton) {
        this.tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }
}

// Initialize all animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    const scrollAnimations = new ScrollAnimations();
    const headerAnimation = new HeaderAnimation();
    const pageLoadAnimations = new PageLoadAnimations();
    const counterAnimation = new CounterAnimation();
    const tabAnimation = new TabAnimation();
    
    // Add scroll progress bar
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    document.body.appendChild(scrollProgress);
    
    // Add loading animation to product cards on page load
    setTimeout(() => {
        const cards = document.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
        });
    }, 1000);
});


      // ===== ENHANCED ANIMATIONS AND INTERACTIONS =====
      
      // Page Loader
      document.addEventListener('DOMContentLoaded', function() {
          const pageLoader = document.getElementById('pageLoader');
          
          // Simulate loading time
          setTimeout(() => {
              pageLoader.classList.add('fade-out');
              
              // Remove loader from DOM after animation
              setTimeout(() => {
                  pageLoader.style.display = 'none';
                  initEnhancedAnimations();
              }, 500);
          }, 2000);
      });

      // Custom Cursor
      function initCustomCursor() {
          const cursor = document.getElementById('customCursor');
          const cursorDot = document.getElementById('cursorDot');
          
          if (!cursor || !cursorDot) return;
          
          document.addEventListener('mousemove', (e) => {
              cursor.style.left = e.clientX + 'px';
              cursor.style.top = e.clientY + 'px';
              
              cursorDot.style.left = e.clientX + 'px';
              cursorDot.style.top = e.clientY + 'px';
          });
          
          // Add hover effects
          const hoverElements = document.querySelectorAll('a, button, .product-card, .category-card, .nav-link');
          
          hoverElements.forEach(element => {
              element.addEventListener('mouseenter', () => {
                  cursor.classList.add('cursor-hover');
                  cursorDot.classList.add('cursor-active');
              });
              
              element.addEventListener('mouseleave', () => {
                  cursor.classList.remove('cursor-hover');
                  cursorDot.classList.remove('cursor-active');
              });
          });
          
          // Click effect
          document.addEventListener('mousedown', () => {
              cursor.classList.add('cursor-active');
          });
          
          document.addEventListener('mouseup', () => {
              cursor.classList.remove('cursor-active');
          });
      }

      // Scroll to Top Button
      function initScrollIndicator() {
          const scrollIndicator = document.getElementById('scrollIndicator');
          const scrollToTopBtn = document.getElementById('scrollToTop');
          
          if (!scrollIndicator || !scrollToTopBtn) return;
          
          window.addEventListener('scroll', () => {
              if (window.pageYOffset > 300) {
                  scrollIndicator.classList.add('show');
              } else {
                  scrollIndicator.classList.remove('show');
              }
          });
          
          scrollToTopBtn.addEventListener('click', () => {
              window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
              });
          });
      }

      // Staggered Animation for Elements
      function initStaggeredAnimation() {
          const animatedElements = document.querySelectorAll('.stagger-animate');
          
          const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      setTimeout(() => {
                          entry.target.classList.add('show');
                      }, entry.target.dataset.delay || 0);
                      observer.unobserve(entry.target);
                  }
              });
          }, {
              threshold: 0.1,
              rootMargin: '0px 0px -50px 0px'
          });
          
          animatedElements.forEach((element, index) => {
              element.dataset.delay = index * 100;
              observer.observe(element);
          });
      }

      // Initialize all enhanced animations
      function initEnhancedAnimations() {
          initCustomCursor();
          initScrollIndicator();
          initStaggeredAnimation();
          
          // Add floating animation to feature boxes
          const featureBoxes = document.querySelectorAll('.feature-box');
          featureBoxes.forEach((box, index) => {
              box.style.animationDelay = `${index * 0.2}s`;
              box.classList.add('floating');
          });
      }

      // ===== EXISTING FUNCTIONS =====
      // Login/Register Tab Switching
      function showTab(tabName) {
          // Hide all tabs
          document.querySelectorAll('.auth-form').forEach(tab => {
              tab.classList.remove('active');
          });
          document.querySelectorAll('.auth-tab').forEach(btn => {
              btn.classList.remove('active');
          });
          
          // Show selected tab
          document.getElementById(tabName + 'Tab').classList.add('active');
          event.target.classList.add('active');
      }

      // Hero Slider
      function initHeroSlider() {
          const slides = document.querySelectorAll('.hero-slider .slide');
          const dots = document.querySelectorAll('.slider-dot');
          if (!slides.length) return;
          let currentSlide = 0;
          
          function showSlide(index) {
              slides.forEach(slide => slide.classList.remove('active'));
              dots.forEach(dot => dot.classList.remove('active'));
              
              slides[index]?.classList.add('active');
              dots[index]?.classList.add('active');
              currentSlide = index;
          }
          
          dots.forEach((dot, index) => {
              dot.addEventListener('click', () => {
                  showSlide(index);
              });
          });
          
          // Auto slide
          if (slides.length > 1) setInterval(() => {
              currentSlide = (currentSlide + 1) % slides.length;
              showSlide(currentSlide);
          }, 5000);
      }

      // Product Tabs
      function initProductTabs() {
          const tabBtns = document.querySelectorAll('.tab-btn');
          const productCards = document.querySelectorAll('.product-card[data-tab]');
          
          tabBtns.forEach(btn => {
              btn.addEventListener('click', () => {
                  // Remove active class from all buttons
                  tabBtns.forEach(b => b.classList.remove('active'));
                  // Add active class to clicked button
                  btn.classList.add('active');
                  
                  // Get tab name
                  const tabName = btn.textContent.toLowerCase().replace(' ', '');
                  
                  // Show/hide products
                  productCards.forEach(card => {
                      if (tabName === 'newarrival' && card.dataset.tab === 'new') {
                          card.style.display = 'block';
                      } else if (card.dataset.tab === tabName) {
                          card.style.display = 'block';
                      } else {
                          card.style.display = 'none';
                      }
                  });
              });
          });
      }

      // Testimonial Slider
      function initTestimonialSlider() {
          if (typeof window.Swiper !== 'function' || !document.querySelector('.testimonial-slider')) return;
          new window.Swiper('.testimonial-slider', {
              loop: true,
              pagination: {
                  el: '.swiper-pagination',
                  clickable: true,
              },
              autoplay: {
                  delay: 5000,
                  disableOnInteraction: false,
              },
          });
      }

      // Initialize all functions when DOM is loaded
      document.addEventListener('DOMContentLoaded', function() {
          initHeroSlider();
          initProductTabs();
          initTestimonialSlider();
          
          // Search functionality
          const searchBtn = document.getElementById('searchBtn');
          const searchInput = document.getElementById('searchInput');
          
          if (searchBtn && searchInput) {
              searchBtn.addEventListener('click', function() {
                  const searchTerm = searchInput.value.trim();
                  if (searchTerm) {
                      alert(`Searching for: ${searchTerm}`);
                      // In real implementation, you would redirect to search results page
                  }
              });
              
              searchInput.addEventListener('keypress', function(e) {
                  if (e.key === 'Enter') {
                      searchBtn.click();
                  }
              });
          }
      });
