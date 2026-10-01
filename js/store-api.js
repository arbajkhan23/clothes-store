
(function () {
  'use strict';

  // API Configuration
  const API_URL = (
    window.STORE_API_URL || 'http://localhost:5000/api'
  ).replace(/\/+$/, '');

  const fallbackImage = 'images/photo-1539109136881-3be0616acf4b.avif';

  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  // Common API request handler
  async function request(path, options = {}) {
    let response;

    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          ...(options.body instanceof FormData
            ? {}
            : { 'Content-Type': 'application/json' }),
          ...options.headers
        }
      });
    } catch (error) {
      console.error('API connection failed:', error);
      throw new Error(
        `Cannot connect to backend at ${API_URL}. ` +
        'Check that the backend is running and CORS is configured.'
      );
    }

    const contentType = response.headers.get('content-type') || '';
    let result = {};

    if (contentType.includes('application/json')) {
      result = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => '');
      result = { message: text };
    }

    if (!response.ok) {
      throw new Error(
        result.message ||
        result.error ||
        `Request failed with status ${response.status}`
      );
    }

    return result;
  }

  // Safe image URL
  function imageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return fallbackImage;
    }

    const url = value.trim();

    if (/^(https?:\/\/|\/|images\/)/i.test(url)) {
      return url;
    }

    return fallbackImage;
  }

  // Image fallback on load error
  function setImageFallback(image) {
    image.addEventListener('error', () => {
      if (image.src.endsWith(fallbackImage)) return;
      image.src = fallbackImage;
    }, { once: true });
  }

  // Product card
  function makeProductCard(product) {
    const column = document.createElement('div');
    column.className = 'col-lg-3 col-md-4 col-sm-6 col-12';

    const card = document.createElement('div');
    card.className = 'product-card stagger-animate';
    card.dataset.id = product._id || '';
    card.dataset.price = product.price ?? 0;
    card.dataset.stock = product.stock ?? 0;

    const isFeatured = Boolean(product.featured);
    const isBestSeller = Boolean(
      product.bestSeller || product.isBestSeller
    );

    card.dataset.tab = isBestSeller
      ? 'best'
      : isFeatured
        ? 'featured'
        : 'new';

    if (isFeatured) {
      const badge = document.createElement('span');
      badge.className = 'product-badge';
      badge.textContent = 'FEATURED';
      card.append(badge);
    }

    // Product link (button is kept outside the anchor)
    const link = document.createElement('a');
    link.className = 'product-card-link';
    link.href = `./product-detail.html?id=${
      encodeURIComponent(product.slug || product._id || '')
    }`;

    const image = document.createElement('img');
    image.className = 'product-image';
    image.src = imageUrl(product.images?.[0]);
    image.alt = product.name || 'Clothing product';
    image.loading = 'lazy';
    setImageFallback(image);

    const info = document.createElement('div');
    info.className = 'product-info';

    const title = document.createElement('h6');
    title.className = 'product-title';
    title.textContent = product.name || 'Untitled product';

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = currency.format(Number(product.price) || 0);

    if (Number(product.compareAtPrice) > Number(product.price)) {
      const oldPrice = document.createElement('span');
      oldPrice.className = 'old-price';
      oldPrice.textContent = currency.format(
        Number(product.compareAtPrice)
      );
      price.append(' ', oldPrice);
    }

    info.append(title, price);
    link.append(image, info);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'add-to-cart-btn glow-on-hover';
    button.textContent = 'Add to Cart';

    const outOfStock = Number(product.stock) <= 0;

    if (outOfStock) {
      button.disabled = true;
      button.textContent = 'Out of Stock';
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!window.cartManager?.addToCart) {
        console.error('Cart manager is not initialized.');
        return;
      }

      window.cartManager.addToCart({
        id: product._id,
        stock: product.stock,
        name: product.name,
        price: Number(product.price) || 0,
        image: image.src,
        size: product.sizes?.[0] || '',
        color: product.colors?.[0] || ''
      });
    });

    card.append(link, button);
    column.append(card);

    return column;
  }

  // Display errors on the page
  function showStatus(element, message, isError = false) {
    if (!element) return;

    element.textContent = message;
    element.classList.toggle('text-danger', isError);
    element.setAttribute('role', isError ? 'alert' : 'status');
  }

  // Home page products
  async function hydrateHome() {
    const grid = document.getElementById('storeProductsGrid');
    if (!grid) return;

    try {
      const data = await request('/products?limit=8');
      const items = Array.isArray(data.items) ? data.items : [];

      if (!items.length) {
        showStatus(
          document.getElementById('storeHomeStatus'),
          'No products available.'
        );
        return;
      }

      grid.replaceChildren(...items.map(makeProductCard));

      const tabs = document.querySelectorAll(
        '.trending-section .tab-btn'
      );

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const label = tab.textContent.trim().toLowerCase();

          const key = label.includes('all')
            ? 'all'
            : label.includes('best')
              ? 'best'
              : label.includes('feature')
                ? 'featured'
                : 'new';

          tabs.forEach((item) => {
            item.classList.toggle('active', item === tab);
            item.setAttribute(
              'aria-pressed',
              String(item === tab)
            );
          });

          grid.querySelectorAll(':scope > div').forEach((column) => {
            const card = column.querySelector('.product-card');
            column.hidden = key !== 'all' &&
              card?.dataset.tab !== key;
          });
        });
      });
    } catch (error) {
      console.error('Home products error:', error);
      showStatus(
        document.getElementById('storeHomeStatus'),
        error.message,
        true
      );
    }
  }

  // Homepage banners
  async function hydrateBanners() {
    const hero = document.querySelector('.hero-slider');
    if (!hero) return;

    try {
      const data = await request('/banners');
      const banners = Array.isArray(data.banners)
        ? data.banners
        : [];

      if (!banners.length) return;

      hero.querySelectorAll('.slide').forEach((slide, index) => {
        const banner = banners[index % banners.length];

        const image = slide.querySelector('.slide-image');
        const title = slide.querySelector('.slide-title');
        const subtitle = slide.querySelector('.slide-subtitle');
        const button = slide.querySelector('.slide-btn');

        if (image) {
          image.src = imageUrl(banner.imageUrl);
          image.alt = banner.title || 'Store promotion';
          setImageFallback(image);
        }

        if (title) {
          title.textContent = banner.title || '';
        }

        if (subtitle) {
          subtitle.textContent = banner.subtitle || '';
        }

        if (button) {
          button.textContent = banner.buttonLabel || 'Shop now';
          button.href = banner.linkUrl || './products-list.html';
        }
      });
    } catch (error) {
      console.error('Banner loading error:', error);
    }
  }

  // Homepage categories
  async function hydrateCategories() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;

    try {
      const data = await request('/categories');
      const categories = Array.isArray(data.categories)
        ? data.categories
        : [];

      if (!categories.length) return;

      const fragment = document.createDocumentFragment();

      categories.forEach((category) => {
        const column = document.createElement('div');
        column.className = 'col-lg-3 col-md-4 col-sm-6 mb-3';

        const link = document.createElement('a');
        link.className = 'category-card stagger-animate';
        link.href =
          `./products-list.html?category=${
            encodeURIComponent(category.slug || '')
          }`;

        const image = document.createElement('img');
        image.src = imageUrl(category.image);
        image.alt = category.name || 'Category';
        image.loading = 'lazy';
        setImageFallback(image);

        const label = document.createElement('div');
        label.className = 'category-label';
        label.textContent = category.name || 'Category';

        link.append(image, label);
        column.append(link);
        fragment.append(column);
      });

      grid.replaceChildren(fragment);
    } catch (error) {
      console.error('Category loading error:', error);
      showStatus(
        document.getElementById('categoryStatus'),
        error.message,
        true
      );
    }
  }

  // Product listing page
  async function hydrateProductListing() {
    const grid = document.getElementById('storeProductGrid');
    if (!grid) return;

    const params = new URLSearchParams(window.location.search);

    const categorySlug = params.get('category') || '';
    const search = params.get('search') || '';

    const filter = document.getElementById('storeCategoryFilter');
    const sizeFilter = document.getElementById('storeSizeFilter');
    const colorFilter = document.getElementById('storeColorFilter');
    const sortFilter = document.getElementById('storeProductSort');
    const searchField = document.getElementById('storeProductSearch');
    const status = document.getElementById('storeCatalogStatus');

    if (searchField) searchField.value = search;

    try {
      const [categoryData, filterData] = await Promise.all([
        request('/categories'),
        request('/products/filters')
      ]);

      const categories = Array.isArray(categoryData.categories)
        ? categoryData.categories
        : [];

      if (filter) {
        filter.replaceChildren(new Option('All categories', ''));

        categories.forEach((category) => {
          filter.add(new Option(
            category.name,
            category.slug
          ));
        });

        filter.value = categorySlug;
      }

      if (sizeFilter) {
        sizeFilter.replaceChildren(new Option('All sizes', ''));

        (Array.isArray(filterData.sizes) ? filterData.sizes : [])
          .forEach((size) => {
            sizeFilter.add(new Option(size, size));
          });

        sizeFilter.value = params.get('size') || '';
      }

      if (colorFilter) {
        colorFilter.replaceChildren(new Option('All colors', ''));

        (Array.isArray(filterData.colors) ? filterData.colors : [])
          .forEach((color) => {
            colorFilter.add(new Option(color, color));
          });

        colorFilter.value = params.get('color') || '';
      }

      if (sortFilter) {
        sortFilter.value = params.get('sort') || 'newest';
      }

      const selectedCategory = categories.find(
        (item) => item.slug === categorySlug
      );

      const productParams = new URLSearchParams({
        limit: '24',
        page: String(
          Math.max(1, Number(params.get('page')) || 1)
        )
      });

      if (search) {
        productParams.set('search', search);
      }

      if (selectedCategory) {
        productParams.set('category', selectedCategory._id);
      }

      ['size', 'color', 'sort'].forEach((key) => {
        if (params.has(key)) {
          productParams.set(key, params.get(key));
        }
      });

      const productData = await request(
        `/products?${productParams.toString()}`
      );

      const products = Array.isArray(productData.items)
        ? productData.items
        : [];

      grid.replaceChildren(...products.map(makeProductCard));

      const pagination = productData.pagination || {
        page: 1,
        pages: 1,
        total: products.length
      };

      showStatus(
        status,
        products.length
          ? `${pagination.total ?? products.length} products`
          : 'No products found. Try another search or category.'
      );

      renderPagination(
        document.getElementById('storeCatalogPagination'),
        pagination,
        params
      );
    } catch (error) {
      console.error('Product listing error:', error);
      showStatus(status, error.message, true);
      grid.replaceChildren();
    }

    // Filters update the URL
    filter?.addEventListener('change', () => {
      if (filter.value) {
        params.set('category', filter.value);
      } else {
        params.delete('category');
      }

      params.delete('page');
      window.location.search = params.toString();
    });

    for (const [control, key] of [
      [sizeFilter, 'size'],
      [colorFilter, 'color'],
      [sortFilter, 'sort']
    ]) {
      control?.addEventListener('change', () => {
        if (control.value) {
          params.set(key, control.value);
        } else {
          params.delete(key);
        }

        params.delete('page');
        window.location.search = params.toString();
      });
    }

    searchField?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        submitStoreSearch(searchField.value);
      }
    });

    document
      .getElementById('storeProductSearchButton')
      ?.addEventListener('click', () => {
        submitStoreSearch(searchField?.value || '');
      });
  }

  // Pagination
  function renderPagination(container, pagination, params) {
    if (!container) return;

    container.replaceChildren();

    const pages = Math.max(1, Number(pagination.pages) || 1);
    const currentPage = Math.max(
      1,
      Number(pagination.page) || 1
    );

    if (pages < 2) return;

    for (let page = 1; page <= pages; page += 1) {
      const button = document.createElement('button');

      button.type = 'button';
      button.className =
        `store-page-button ${page === currentPage ? 'active' : ''}`;
      button.textContent = String(page);
      button.disabled = page === currentPage;
      button.setAttribute(
        'aria-current',
        page === currentPage ? 'page' : 'false'
      );

      button.addEventListener('click', () => {
        const nextParams = new URLSearchParams(params);
        nextParams.set('page', String(page));

        window.location.search = nextParams.toString();
      });

      container.append(button);
    }
  }

  // Header and listing search
  function submitStoreSearch(value) {
    const params = new URLSearchParams(window.location.search);
    const search = String(value || '').trim();

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    params.delete('page');

    window.location.href =
      `./products-list.html?${params.toString()}`;
  }

  function searchFromHeader() {
    submitStoreSearch(
      document.getElementById('searchInput')?.value || ''
    );
  }

  // Product detail page
  async function hydrateProductDetail() {
    const id = new URLSearchParams(
      window.location.search
    ).get('id');

    if (!id) return;

    try {
      const data = await request(
        `/products/${encodeURIComponent(id)}`
      );

      const product = data.product;

      if (!product) {
        throw new Error('Product not found.');
      }

      window.storeProduct = product;

      const title = document.querySelector(
        '.product-detail .product-info h1'
      );
      const currentPrice = document.querySelector(
        '.product-detail .current-price'
      );
      const originalPrice = document.querySelector(
        '.product-detail .original-price'
      );
      const discount = document.querySelector(
        '.product-detail .discount-badge'
      );
      const description = document.querySelector(
        '.product-detail .product-description'
      );

      const priceValue = Number(product.price) || 0;
      const compareValue = Number(product.compareAtPrice) || 0;
      const hasDiscount = compareValue > priceValue;

      if (title) {
        title.textContent = product.name || '';
      }

      if (currentPrice) {
        currentPrice.textContent = currency.format(priceValue);
      }

      if (originalPrice) {
        originalPrice.textContent = hasDiscount
          ? currency.format(compareValue)
          : '';

        originalPrice.hidden = !hasDiscount;
      }

      if (discount) {
        discount.textContent = hasDiscount
          ? `Save ${currency.format(compareValue - priceValue)}`
          : '';

        discount.hidden = !hasDiscount;
      }

      if (description) {
        description.textContent = product.description || '';
      }

      // Product images
      const images = Array.isArray(product.images) &&
        product.images.length
        ? product.images
        : [fallbackImage];

      document
        .querySelectorAll(
          '.product-slide img, .product-thumbnails img'
        )
        .forEach((image, index) => {
          image.src = imageUrl(images[index % images.length]);
          image.alt = product.name || 'Product image';
          setImageFallback(image);
        });

      // Color selection
      const colors = document.querySelector(
        '.product-detail .color-list'
      );

      if (colors) {
        colors.replaceChildren();

        (Array.isArray(product.colors) ? product.colors : [])
          .forEach((color, index) => {
            const option = document.createElement('button');

            option.type = 'button';
            option.className =
              `color-option ${index === 0 ? 'active' : ''}`;
            option.title = color;
            option.setAttribute('aria-label', color);
            option.setAttribute(
              'aria-pressed',
              String(index === 0)
            );

            option.style.backgroundColor = color;

            option.addEventListener('click', () => {
              window.selectedStoreColor = color;

              colors.querySelectorAll('.color-option')
                .forEach((item) => {
                  item.classList.remove('active');
                  item.setAttribute('aria-pressed', 'false');
                });

              option.classList.add('active');
              option.setAttribute('aria-pressed', 'true');
            });

            colors.append(option);
          });

        window.selectedStoreColor = product.colors?.[0] || '';
      }

      // Size selection
      const sizeTarget = document.getElementById(
        'storeSizeOptions'
      );

      if (sizeTarget) {
        sizeTarget.replaceChildren();

        if (Array.isArray(product.sizes) && product.sizes.length) {
          const label = document.createElement('h6');
          label.textContent = 'Size:';

          const choices = document.createElement('div');
          choices.className = 'store-size-list';

          product.sizes.forEach((size, index) => {
            const button = document.createElement('button');

            button.type = 'button';
            button.className =
              `store-size-option ${index === 0 ? 'active' : ''}`;
            button.textContent = size;
            button.setAttribute(
              'aria-pressed',
              String(index === 0)
            );

            button.addEventListener('click', () => {
              window.selectedStoreSize = size;

              choices.querySelectorAll('button')
                .forEach((item) => {
                  item.classList.remove('active');
                  item.setAttribute('aria-pressed', 'false');
                });

              button.classList.add('active');
              button.setAttribute('aria-pressed', 'true');
            });

            choices.append(button);
          });

          window.selectedStoreSize = product.sizes[0];
          sizeTarget.append(label, choices);
        } else {
          window.selectedStoreSize = '';
        }
      }
    } catch (error) {
      console.error('Product detail error:', error);

      showStatus(
        document.getElementById('storeProductStatus'),
        error.message,
        true
      );
    }
  }

  // Header search events
  document
    .getElementById('searchBtn')
    ?.addEventListener('click', searchFromHeader);

  document
    .getElementById('searchInput')
    ?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        searchFromHeader();
      }
    });

  // Initialize storefront
  function initializeStore() {
    hydrateHome();
    hydrateBanners();
    hydrateCategories();
    hydrateProductListing();
    hydrateProductDetail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initializeStore,
      { once: true }
    );
  } else {
    initializeStore();
  }
})();