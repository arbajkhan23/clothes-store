// ===== CART MANAGEMENT SYSTEM =====
class CartManager {
  constructor() {
    this.cartKey = "fashion_store_cart";
    this.wishlistKey = "fashion_store_wishlist";
    this.checkoutOpener = null;
    this.appliedCouponCode = "";

    this.cart = this.loadCart();
    this.wishlist = this.loadWishlist();
  }

  // Load cart from localStorage
  loadCart() {
    try {
      const cartData = localStorage.getItem(this.cartKey);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error("Error loading cart:", error);
      return [];
    }
  }

  // Save cart to localStorage
  saveCart() {
    try {
      localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  }

  loadWishlist() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.wishlistKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (_) {
      return [];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem(this.wishlistKey, JSON.stringify(this.wishlist));
    } catch (error) {
      this.showNotification(error.message || "Wishlist could not be saved.");
    }
  }

  toggleWishlist(button) {
    const card = button.closest(".product-card");
    if (!card) return;
    const productLink = card.closest("a");
    const productUrl = productLink?.href || "";
    const productId =
      card.dataset.id ||
      (productUrl ? new URL(productUrl).searchParams.get("id") : "") ||
      "";
    const item = {
      id: String(productId),
      name:
        card.querySelector(".product-title, h3, h6")?.textContent?.trim() ||
        "Product",
      price:
        parseFloat(
          card.dataset.price ||
            card
              .querySelector(".current-price, .product-price")
              ?.textContent?.replace(/[^0-9.-]+/g, ""),
        ) || 0,
      image: card.querySelector("img")?.src || "",
      stock: Number(card.dataset.stock),
      url: productUrl,
      size: card.dataset.size || "",
      color: card.dataset.color || "",
    };
    const key = item.id || item.url || item.name;
    const existingIndex = this.wishlist.findIndex(
      (saved) => (saved.id || saved.url || saved.name) === key,
    );
    const added = existingIndex < 0;
    if (added) this.wishlist.push(item);
    else this.wishlist.splice(existingIndex, 1);
    this.saveWishlist();
    this.updateWishlistUI();
    if (this.wishlistDialog?.open) this.renderWishlistDialog();
    this.showNotification(
      added ? "Added to wishlist" : "Removed from wishlist",
    );
  }

  updateWishlistUI() {
    document.querySelectorAll(".header-icons .icon-btn").forEach((button) => {
      if (button.querySelector(".fa-heart")) {
        const badge = button.querySelector(".cart-badge");
        if (badge) badge.textContent = String(this.wishlist.length);
      }
    });
    document.querySelectorAll(".wishlist-icon").forEach((button) => {
      const card = button.closest(".product-card");
      const link = card?.closest("a");
      const id =
        card?.dataset.id ||
        (link?.href ? new URL(link.href).searchParams.get("id") : "") ||
        "";
      const saved = this.wishlist.some(
        (item) => item.id === String(id) || item.url === (link?.href || ""),
      );
      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.toggle("fas", saved);
        icon.classList.toggle("far", !saved);
        icon.style.color = saved ? "#c34d58" : "";
      }
      button.setAttribute("aria-pressed", String(saved));
    });
  }

  createWishlistDialog() {
    if (document.getElementById("wishlistDialog")) {
      this.wishlistDialog = document.getElementById("wishlistDialog");
      return;
    }
    const dialog = document.createElement("dialog");
    dialog.id = "wishlistDialog";
    dialog.className = "wishlist-dialog";
    dialog.setAttribute("aria-labelledby", "wishlistTitle");
    dialog.innerHTML =
      '<header class="wishlist-dialog-header"><div><p class="checkout-eyebrow">SAVED FOR LATER</p><h2 id="wishlistTitle">Your wishlist</h2></div><button type="button" class="checkout-close" data-wishlist-close aria-label="Close wishlist">&times;</button></header><div class="wishlist-dialog-items" data-wishlist-items></div>';
    document.body.append(dialog);
    this.wishlistDialog = dialog;
    dialog
      .querySelector("[data-wishlist-close]")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-wishlist-remove]");
      if (removeButton) {
        this.wishlist.splice(Number(removeButton.dataset.wishlistRemove), 1);
        this.saveWishlist();
        this.updateWishlistUI();
        this.renderWishlistDialog();
        return;
      }
      const addButton = event.target.closest("[data-wishlist-add]");
      if (addButton) {
        const item = this.wishlist[Number(addButton.dataset.wishlistAdd)];
        if (item) this.addToCart(item);
        return;
      }
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          dialog.close();
      }
    });
  }

  renderWishlistDialog() {
    const list = this.wishlistDialog?.querySelector("[data-wishlist-items]");
    if (!list) return;
    if (!this.wishlist.length) {
      list.textContent = "Your wishlist is empty.";
      return;
    }
    list.replaceChildren(
      ...this.wishlist.map((item, index) => {
        const row = document.createElement("article");
        row.className = "wishlist-item";
        if (item.image) {
          const image = document.createElement("img");
          image.src = item.image;
          image.alt = item.name;
          row.append(image);
        }
        const details = document.createElement("div");
        details.className = "wishlist-item-details";
        const link = document.createElement("a");
        link.href = item.url || "#";
        link.textContent = item.name;
        const price = document.createElement("strong");
        price.textContent = `$${Number(item.price).toFixed(2)}`;
        details.append(link, price);
        const actions = document.createElement("div");
        actions.className = "wishlist-item-actions";
        if (/^[a-f\d]{24}$/i.test(item.id)) {
          const addButton = document.createElement("button");
          addButton.type = "button";
          addButton.textContent = "Add to cart";
          addButton.dataset.wishlistAdd = String(index);
          actions.append(addButton);
        }
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.dataset.wishlistRemove = String(index);
        actions.append(removeButton);
        row.append(details, actions);
        return row;
      }),
    );
  }

  openWishlist() {
    if (!this.wishlistDialog) this.createWishlistDialog();
    this.renderWishlistDialog();
    this.wishlistDialog.showModal();
  }

  // Add item to cart
  addToCart(product) {
    if (!/^[a-f\d]{24}$/i.test(String(product.id || ""))) {
      this.showNotification(
        "This product is not connected to the store catalog yet.",
      );
      return false;
    }
    if (Number.isInteger(Number(product.stock)) && Number(product.stock) < 1) {
      this.showNotification("This product is currently out of stock.");
      return false;
    }

    // Check if product already exists in cart
    const existingIndex = this.cart.findIndex(
      (item) =>
        item.id === product.id &&
        item.size === product.size &&
        item.color === product.color,
    );

    if (existingIndex > -1) {
      // Update quantity if item exists
      this.cart[existingIndex].quantity += product.quantity || 1;
    } else {
      // Add new item
      this.cart.push({
        id: product.id,
        name: product.name || "Product",
        price: parseFloat(product.price) || 0,
        image: product.image || "https://via.placeholder.com/100",
        size: product.size || "",
        color: product.color || "",
        quantity: product.quantity || 1,
      });
    }

    this.saveCart();
    this.updateCartUI();
    this.showNotification(`${product.name} added to cart!`);

    return this.cart;
  }

  // Remove item from cart
  removeFromCart(index) {
    if (index >= 0 && index < this.cart.length) {
      this.cart.splice(index, 1);
      this.saveCart();
      this.updateCartUI();
    }
    return this.cart;
  }

  // Update item quantity
  updateQuantity(index, newQuantity) {
    if (index >= 0 && index < this.cart.length) {
      if (newQuantity > 0) {
        this.cart[index].quantity = newQuantity;
      } else {
        this.cart.splice(index, 1);
      }
      this.saveCart();
      this.updateCartUI();
    }
    return this.cart;
  }

  // Clear cart
  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartUI();
  }

  // Get total items count
  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Get cart total price
  getCartTotal() {
    return this.cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }

  // Update cart UI
  updateCartUI() {
    // Update cart count badges
    const totalItems = this.getTotalItems();
    document.querySelectorAll(".cart-count, .cart-badge").forEach((el) => {
      if (el.closest(".icon-btn")) {
        el.textContent = totalItems;
      }
    });

    // Update cart sidebar if exists
    this.updateCartSidebar();

    // Update view cart page if we're on that page
    if (window.location.pathname.includes("view-cart.html")) {
      this.updateViewCartPage();
    }
  }

  // Update cart sidebar
  updateCartSidebar() {
    const cartItemsContainer = document.getElementById("cartItems");
    const emptyCart = document.getElementById("emptyCart");
    const cartFooter = document.getElementById("cartFooter");
    const cartTotalPrice = document.getElementById("cartTotalPrice");

    if (!cartItemsContainer) return;

    if (this.cart.length === 0) {
      // Show empty cart
      if (emptyCart) emptyCart.style.display = "block";
      if (cartFooter) cartFooter.style.display = "none";
      cartItemsContainer.innerHTML = `
                <div class="empty-cart" id="emptyCart">
                    <i class="fas fa-shopping-bag fa-3x mb-3"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
    } else {
      // Show cart items
      if (emptyCart) emptyCart.style.display = "none";
      if (cartFooter) cartFooter.style.display = "block";

      let cartHTML = "";
      this.cart.forEach((item, index) => {
        cartHTML += `
                    <div class="cart-item" data-index="${index}">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                        <div class="cart-item-details">
                            <h5 class="cart-item-title">${item.name}</h5>
                            ${item.size ? `<p class="mb-1">Size: ${item.size}</p>` : ""}
                            ${item.color ? `<p class="mb-1">Color: ${item.color}</p>` : ""}
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                                <div class="cart-item-quantity d-flex align-items-center">
                                    <button class="quantity-btn" onclick="cartManager.updateQuantity(${index}, ${item.quantity - 1})">-</button>
                                    <span class="quantity mx-1">${item.quantity}</span>
                                    <button class="quantity-btn" onclick="cartManager.updateQuantity(${index}, ${item.quantity + 1})">+</button>
                                    <button class="cart-item-remove ms-3" onclick="cartManager.removeFromCart(${index})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      });

      cartItemsContainer.innerHTML = cartHTML;

      // Update total price
      if (cartTotalPrice) {
        cartTotalPrice.textContent = `$${this.getCartTotal().toFixed(2)}`;
      }
    }
  }

  // Update view cart page
  updateViewCartPage() {
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartSummary = document.querySelector(".cart-summary");
    const cartTitle = document.querySelector(".cart-title");
    const cartCountElement = document.querySelector(".cart-count");

    if (!cartItemsContainer) return;

    if (this.cart.length === 0) {
      // Show empty cart message
      cartItemsContainer.innerHTML = `
                <h2 class="cart-title">Your Shopping Cart (0 items)</h2>
                <div class="text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h4 class="mb-3">Your cart is empty</h4>
                    <p class="text-muted mb-4">Looks like you haven't added any items to your cart yet.</p>
                    <a href="index.html" class="btn btn-dark">Continue Shopping</a>
                </div>
            `;

      if (cartSummary) cartSummary.style.display = "none";
    } else {
      // Show cart items
      let cartHTML = `<h2 class="cart-title">Your Shopping Cart (${this.getTotalItems()} items)</h2>`;

      this.cart.forEach((item, index) => {
        cartHTML += `
                    <div class="cart-item">
                        <div class="item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="item-details">
                            <h3>${item.name}</h3>
                            ${item.size ? `<p>Size: ${item.size}</p>` : ""}
                            ${item.color ? `<p>Color: ${item.color}</p>` : ""}
                            <div class="item-price">$${item.price.toFixed(2)}</div>
                            <div class="item-quantity">
                                <span class="quantity-btn minus" onclick="cartManager.updateQuantity(${index}, ${item.quantity - 1}); location.reload();">-</span>
                                <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                                <span class="quantity-btn plus" onclick="cartManager.updateQuantity(${index}, ${item.quantity + 1}); location.reload();">+</span>
                            </div>
                        </div>
                        <button class="item-remove" onclick="cartManager.removeFromCart(${index}); location.reload();">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                `;
      });
      cartItemsContainer.innerHTML = cartHTML;

      // Show cart summary
      if (cartSummary) cartSummary.style.display = "block";

      // Update cart total
      this.updateCartTotal();
    }

    // Update cart count in title
    if (cartCountElement) {
      cartCountElement.textContent = this.getTotalItems();
    }
  }

  // Update cart total on view cart page
  updateCartTotal() {
    const subtotal = this.getCartTotal();
    const subtotalElement = document.querySelector(".subtotal");
    const totalElement = document.querySelector(".total-price");

    if (subtotalElement) {
      subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }

    if (totalElement) {
      totalElement.textContent = `$${subtotal.toFixed(2)} USD`;
    }
  }

  // Show notification
  showNotification(message) {
    // Remove existing notifications
    document.querySelectorAll(".toast-notification").forEach((n) => n.remove());

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

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  openCheckout() {
    if (!this.cart || this.cart.length === 0) {
      this.showNotification("Your cart is empty.");
      return;
    }

    window.location.href = "./checkout.html";
  }

  closeCheckout() {
    const dialog = document.getElementById("checkoutDialog");
    if (!dialog) return;

    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    this.checkoutOpener?.focus({ preventScroll: true });
    this.checkoutOpener = null;
  }

  async validateCheckoutCoupon() {
    const codeField = document.getElementById("checkoutCouponCode");
    const feedback = document.getElementById("checkoutCouponFeedback");
    const button = document.getElementById("applyCouponButton");
    const code = codeField?.value.trim() || "";
    if (!code || !feedback || !button) return;

    this.appliedCouponCode = "";
    feedback.textContent = "";
    button.disabled = true;
    try {
      const apiBase = (
        window.STORE_API_URL || "http://localhost:5000/api"
      ).replace(/\/$/, "");
      const subtotal = this.cart.reduce(
        (total, item) =>
          total + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      );
      const response = await fetch(`${apiBase}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          result.error || "This discount code could not be applied.",
        );
      this.appliedCouponCode = result.code;
      feedback.textContent = `${result.code} applied. You save $${Number(result.discountAmount).toFixed(2)}.`;
    } catch (error) {
      feedback.textContent =
        error.message || "This discount code could not be applied.";
    } finally {
      button.disabled = false;
    }
  }

  async resolveCartProducts() {
    const apiBase = (
      window.STORE_API_URL || "http://localhost:5000/api"
    ).replace(/\/$/, "");
    if (this.cart.length > 50)
      throw new Error("An order can contain no more than 50 cart items.");

    const resolved = [];
    for (const item of this.cart) {
      let product;
      if (/^[a-f\d]{24}$/i.test(String(item.id || ""))) {
        const response = await fetch(
          `${apiBase}/products/${encodeURIComponent(item.id)}`,
        );
        const result = await response.json().catch(() => ({}));
        if (response.ok) product = result.product;
      } else {
        const params = new URLSearchParams({ search: item.name, limit: "100" });
        const response = await fetch(
          `${apiBase}/products?${params.toString()}`,
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            result.error ||
              "The store catalog could not be checked. Please try again.",
          );
        const normalizedName = String(item.name || "")
          .trim()
          .toLowerCase();
        const matches = (result.items || []).filter(
          (entry) => entry.name.trim().toLowerCase() === normalizedName,
        );
        if (matches.length === 1) product = matches[0];
        if (matches.length > 1)
          throw new Error(
            `“${item.name}” matches multiple catalog products. Remove it and add the correct product from the catalog.`,
          );
      }

      if (!product?._id) {
        throw new Error(
          `“${item.name}” is not in the backend catalog. Sync or create the product, then add it again from the storefront.`,
        );
      }
      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        Number(item.quantity) > 99
      ) {
        throw new Error(
          `The quantity for “${product.name}” is invalid. Update it in your cart and try again.`,
        );
      }
      resolved.push({ item, product });
    }

    const quantities = new Map();
    for (const { item, product } of resolved) {
      const productId = String(product._id);
      quantities.set(
        productId,
        (quantities.get(productId) || 0) + Number(item.quantity),
      );
    }
    for (const { product } of resolved) {
      const requested = quantities.get(String(product._id));
      if (product.stock < requested) {
        throw new Error(
          product.stock > 0
            ? `Only ${product.stock} of “${product.name}” are currently in stock.`
            : `“${product.name}” is currently out of stock.`,
        );
      }
    }

    this.cart = resolved.map(({ item, product }) => ({
      ...item,
      id: String(product._id),
      name: product.name,
      price: product.price,
      image: product.images?.[0] || item.image,
    }));
    this.saveCart();
    this.updateCartUI();
    return this.cart.map((item) => ({
      product: item.id,
      quantity: Number(item.quantity),
    }));
  }

  async submitCheckout(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const errorMessage = document.getElementById("checkoutError");
    const submitButton = document.getElementById("placeOrderButton");
    const submitLabel = submitButton.textContent;
    errorMessage.hidden = true;
    const fields = new FormData(form);
    const payload = {
      customer: {
        name: fields.get("customerName").trim(),
        email: fields.get("customerEmail").trim(),
        phone: fields.get("customerPhone").trim(),
      },
      shippingAddress: {
        line1: fields.get("line1").trim(),
        line2: fields.get("line2").trim(),
        city: fields.get("city").trim(),
        region: fields.get("region").trim(),
        postalCode: fields.get("postalCode").trim(),
        country: fields.get("country").trim(),
      },
      couponCode: this.appliedCouponCode,
      items: [],
    };

    submitButton.disabled = true;
    submitButton.textContent = "Placing order...";
    submitButton.setAttribute("aria-busy", "true");
    try {
      payload.items = await this.resolveCartProducts();
      const apiBase = (
        window.STORE_API_URL || "http://localhost:5000/api"
      ).replace(/\/$/, "");
      const token = localStorage.getItem("fashion_store_token");
      const response = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          result.error || "We could not place your order. Please try again.",
        );
      if (!result.order?.orderNumber)
        throw new Error(
          "The order response was incomplete. Your cart has not been cleared.",
        );

      this.clearCart();
      form.hidden = true;
      document.getElementById("checkoutConfirmation").hidden = false;
      document.getElementById("checkoutOrderNumber").textContent =
        result.order.orderNumber;
      document.getElementById("checkoutOrderTotal").textContent =
        new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(Number(result.order.total) || 0);
    } catch (error) {
      errorMessage.textContent =
        error.message || "We could not place your order. Please try again.";
      errorMessage.hidden = false;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
      submitButton.removeAttribute("aria-busy");
    }
  }

  // Initialize cart system
  init() {
    this.createWishlistDialog();
    this.updateWishlistUI();

    document.addEventListener("click", (event) => {
      const wishlistButton = event.target.closest(".wishlist-icon");
      if (wishlistButton) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleWishlist(wishlistButton);
        return;
      }
      const headerButton = event.target.closest(".header-icons .icon-btn");
      if (headerButton?.querySelector(".fa-heart")) {
        event.preventDefault();
        this.openWishlist();
      }
    });

    // Add to cart buttons
    document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const productCard = button.closest(".product-card");

        const product = {
          id: productCard.dataset.id,
          stock: Number(productCard.dataset.stock),
          name:
            productCard
              .querySelector(".product-title, h3, h6")
              ?.textContent?.trim() || "Product",
          price:
            parseFloat(productCard.dataset.price) ||
            parseFloat(
              productCard
                .querySelector(".current-price, .product-price, .price .new")
                ?.textContent?.replace(/[^0-9.-]+/g, ""),
            ) ||
            0,
          image:
            productCard.querySelector("img")?.src ||
            "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80",
          size: productCard.dataset.size || "",
          color: productCard.dataset.color || "",
        };

        this.addToCart(product);
      });
    });

    // Cart icon click
    document
      .querySelectorAll(".icon-btn .fa-shopping-bag, .cart-icon")
      .forEach((icon) => {
        const iconBtn = icon.closest(".icon-btn");
        if (iconBtn && !iconBtn.querySelector(".fa-user, .fa-heart")) {
          iconBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const cartSidebar = document.getElementById("cartSidebar");
            const overlay = document.getElementById("cartOverlay");

            if (cartSidebar && overlay) {
              cartSidebar.classList.add("active");
              overlay.classList.add("active");
              document.body.style.overflow = "hidden";
              this.updateCartSidebar();
            }
          });
        }
      });

    // Close cart sidebar
    document.getElementById("closeCart")?.addEventListener("click", () => {
      document.getElementById("cartSidebar")?.classList.remove("active");
      document.getElementById("cartOverlay")?.classList.remove("active");
      document.body.style.overflow = "auto";
    });

    document.getElementById("cartOverlay")?.addEventListener("click", () => {
      document.getElementById("cartSidebar")?.classList.remove("active");
      document.getElementById("cartOverlay")?.classList.remove("active");
      document.body.style.overflow = "auto";
    });

    // View Cart page button
    document.querySelector(".btn-view-cart")?.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "./view-cart.html";
    });

    // Checkout button in sidebar
    document.querySelector(".btn-checkout")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.openCheckout();
    });

    // Checkout button on view cart page
    document.querySelector(".checkout-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.openCheckout();
    });

    document
      .getElementById("checkoutForm")
      ?.addEventListener("submit", (event) => this.submitCheckout(event));
    document
      .getElementById("applyCouponButton")
      ?.addEventListener("click", () => this.validateCheckoutCoupon());
    document
      .getElementById("checkoutCouponCode")
      ?.addEventListener("input", () => {
        this.appliedCouponCode = "";
        const feedback = document.getElementById("checkoutCouponFeedback");
        if (feedback) feedback.textContent = "";
      });
    document.querySelectorAll("[data-checkout-close]").forEach((button) => {
      button.addEventListener("click", () => this.closeCheckout());
    });

    document
      .getElementById("checkoutConfirmationClose")
      ?.addEventListener("click", () => {
        this.closeCheckout();
      });

    const checkoutDialog = document.getElementById("checkoutDialog");
    checkoutDialog?.addEventListener("click", (event) => {
      if (event.target !== checkoutDialog) return;
      const bounds = checkoutDialog.getBoundingClientRect();
      const clickedOutside =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;
      if (clickedOutside) this.closeCheckout();
    });
    checkoutDialog?.addEventListener("close", () => {
      this.checkoutOpener?.focus({ preventScroll: true });
      this.checkoutOpener = null;
    });
    checkoutDialog?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeCheckout();
      }
    });

    // Continue shopping button
    document
      .querySelector(".continue-shopping")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "products-list.html";
      });

    // Initialize UI
    this.updateCartUI();
  }
}

// ===== PRODUCT IMAGE SLIDER FUNCTIONALITY =====
const productSlides = document.querySelectorAll(".product-slide");
const productDots = document.querySelectorAll(".product-slider-dot");
const productPrevBtn = document.querySelector(".product-slider-prev");
const productNextBtn = document.querySelector(".product-slider-next");
const productThumbnails = document.querySelectorAll(".thumbnail");
let currentProductSlide = 0;
const productSlideInterval = 5000;

function showProductSlide(index) {
  if (!productSlides.length) return;
  if (index < 0) index = 0;
  if (index >= productSlides.length) index = productSlides.length - 1;

  // Hide all slides
  productSlides.forEach((slide) => slide.classList.remove("active"));
  productDots.forEach((dot) => dot.classList.remove("active"));
  productThumbnails.forEach((thumb) => thumb.classList.remove("active"));

  // Show current slide
  productSlides[index].classList.add("active");
  productDots[index].classList.add("active");
  productThumbnails[index].classList.add("active");
  currentProductSlide = index;
}

function nextProductSlide() {
  let nextIndex = (currentProductSlide + 1) % productSlides.length;
  showProductSlide(nextIndex);
}

let productSlideTimer = setInterval(nextProductSlide, productSlideInterval);

// Event listeners for dots
if (productDots.length && productDots.length === productSlides.length) {
  productDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      clearInterval(productSlideTimer);
      showProductSlide(index);
      productSlideTimer = setInterval(nextProductSlide, productSlideInterval);
    });
  });
}

// Event listeners for thumbnails
if (
  productThumbnails.length &&
  productThumbnails.length === productSlides.length
) {
  productThumbnails.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      clearInterval(productSlideTimer);
      showProductSlide(index);
      productSlideTimer = setInterval(nextProductSlide, productSlideInterval);
    });
  });
}

// Event listeners for navigation buttons
if (productPrevBtn) {
  productPrevBtn.addEventListener("click", () => {
    clearInterval(productSlideTimer);
    let prevIndex = currentProductSlide - 1;
    if (prevIndex < 0) prevIndex = productSlides.length - 1;
    showProductSlide(prevIndex);
    productSlideTimer = setInterval(nextProductSlide, productSlideInterval);
  });
}

if (productNextBtn) {
  productNextBtn.addEventListener("click", () => {
    clearInterval(productSlideTimer);
    nextProductSlide();
    productSlideTimer = setInterval(nextProductSlide, productSlideInterval);
  });
}

// Pause slider on hover
const productSlider = document.querySelector(".product-slider");
if (productSlider) {
  productSlider.addEventListener("mouseenter", () => {
    clearInterval(productSlideTimer);
  });

  productSlider.addEventListener("mouseleave", () => {
    productSlideTimer = setInterval(nextProductSlide, productSlideInterval);
  });
}

// Initialize first slide
showProductSlide(0);

// ===== PRODUCT DETAIL PAGE FUNCTIONALITY =====
// Function to select color option
function selectColor(element) {
  const colors = document.querySelectorAll(".color-option");
  colors.forEach((color) => {
    color.classList.remove("active");
  });
  element.classList.add("active");
}

// Function to increase quantity
function increaseQuantity() {
  const quantityInput = document.getElementById("quantity");
  let currentValue = parseInt(quantityInput.value);
  quantityInput.value = currentValue + 1;
}

// Function to decrease quantity
function decreaseQuantity() {
  const quantityInput = document.getElementById("quantity");
  let currentValue = parseInt(quantityInput.value);
  if (currentValue > 1) {
    quantityInput.value = currentValue - 1;
  }
}

// Function to add current product to cart
function addCurrentProductToCart() {
  if (!window.storeProduct?._id) {
    showNotification(
      "This product is not available in the backend catalog yet.",
    );
    return;
  }

  const quantity = document.getElementById("quantity").value;
  const color =
    document.querySelector(".color-option.active")?.getAttribute("title") ||
    "Black";
  const productName =
    document.querySelector(".product-info h1")?.textContent?.trim() ||
    "DL Woman Regular Fit Shirt";
  const price =
    parseFloat(
      document
        .querySelector(".current-price")
        ?.textContent?.replace(/[^0-9.-]+/g, ""),
    ) || 50.0;
  const image =
    document.querySelector(".product-slide.active img")?.src ||
    "images/02_1990382d-0957-4f77-8dce-c875a4bdb6b4.webp";

  const product = {
    id: window.storeProduct?._id,
    stock: window.storeProduct?.stock,
    name: productName,
    price: price,
    image: image,
    color: color,
    size: window.selectedStoreSize || "",
    quantity: parseInt(quantity) || 1,
  };

  // Use the cartManager instance
  if (window.cartManager) {
    window.cartManager.addToCart(product);
  } else {
    // Fallback if cartManager is not available
    showNotification(`${product.name} added to cart!`);

    // Update cart badge
    const cartBadge = document.querySelector(
      ".header-icons .cart-badge:last-child",
    );
    if (cartBadge) {
      let currentCount = parseInt(cartBadge.textContent);
      cartBadge.textContent = currentCount + parseInt(quantity);
    }
  }
}

// Add to cart button click handler
document
  .querySelector(".slide-btn[onclick*='addToCart']")
  ?.addEventListener("click", function (e) {
    e.preventDefault();
    addCurrentProductToCart();
  });

// Buy now functionality
document.querySelector(".tab-btn")?.addEventListener("click", function () {
  addCurrentProductToCart();
  showNotification("Proceeding to checkout...");
  // You can redirect to checkout page here
  // window.location.href = "./checkout.html";
});

// ===== "You May Also Like" PRODUCTS FUNCTIONALITY =====
// Add to cart for product cards
document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
  if (!button.hasAttribute("onclick")) {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const productCard = this.closest(".product-card");
      const productTitle =
        productCard.querySelector(".product-title").textContent;
      const productPrice =
        parseFloat(
          productCard
            .querySelector(".product-price")
            .textContent.replace(/[^0-9.-]+/g, ""),
        ) || 0;
      const productImage = productCard.querySelector(".product-image").src;

      const product = {
        id: productCard.dataset.id,
        name: productTitle,
        price: productPrice,
        image: productImage,
        color: "",
        size: "",
        quantity: 1,
      };

      if (window.cartManager) {
        window.cartManager.addToCart(product);
      } else {
        showNotification(`Added to cart: ${productTitle}`);

        // Update cart badge
        const cartBadge = document.querySelector(
          ".header-icons .cart-badge:last-child",
        );
        if (cartBadge) {
          let currentCount = parseInt(cartBadge.textContent);
          cartBadge.textContent = currentCount + 1;
        }
      }
    });
  }
});

// Wishlist toggle for product cards
document.querySelectorAll(".side-button.wishlist-icon").forEach((button) => {
  button.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const icon = this.querySelector("i");
    if (icon.classList.contains("far")) {
      icon.classList.remove("far");
      icon.classList.add("fas");
      icon.style.color = "#ff3366";

      const wishlistBadge = document.querySelectorAll(".cart-badge")[1];
      if (wishlistBadge) {
        let currentCount = parseInt(wishlistBadge.textContent);
        wishlistBadge.textContent = currentCount + 1;
      }

      showNotification("Added to wishlist");
    } else {
      icon.classList.remove("fas");
      icon.classList.add("far");
      icon.style.color = "";

      const wishlistBadge = document.querySelectorAll(".cart-badge")[1];
      if (wishlistBadge) {
        let currentCount = parseInt(wishlistBadge.textContent);
        wishlistBadge.textContent = currentCount - 1;
      }

      showNotification("Removed from wishlist");
    }
  });
});

// ===== NOTIFICATION FUNCTION =====
function showNotification(message) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(
    ".toast-notification",
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

// ===== SEARCH FUNCTIONALITY =====
document
  .querySelector(".search-box button")
  ?.addEventListener("click", function () {
    const searchInput = this.previousElementSibling;
    if (searchInput.value.trim()) {
      showNotification(`Searching for: ${searchInput.value}`);
    }
  });

// ===== NEWSLETTER SUBSCRIPTION =====
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

// ===== LOGIN MODAL TABS =====
window.showTab = function (tabName) {
  // Hide all tabs
  document
    .querySelectorAll(".auth-tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".auth-form")
    .forEach((form) => form.classList.remove("active"));

  // Show selected tab
  document
    .querySelector(`.auth-tab[onclick*="${tabName}"]`)
    ?.classList.add("active");
  document.getElementById(`${tabName}Tab`)?.classList.add("active");
};

// ===== CREATE GLOBAL CART MANAGER INSTANCE =====
const cartManager = new CartManager();
window.cartManager = cartManager;

// ===== INITIALIZE WHEN DOM IS LOADED =====
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    cartManager.init();
  });
} else {
  cartManager.init();
}
