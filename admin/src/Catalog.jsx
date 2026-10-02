import { useEffect, useState } from "react";
import {
  Archive,
  Boxes,
  Check,
  ChevronDown,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  X,
} from "lucide-react";
import {
  api,
  errorMessage,
  money,
  slugify,
  uploadCloudinaryImage,
} from "./api";
import { useToast } from "./App";

export function ProductsPage() {
  const notify = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/products", {
        params: {
          limit: 100,
          status,
          search: search.trim() || undefined,
          category: category || undefined,
        },
      });
      setProducts(data.items);
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api
      .get("/admin/categories")
      .then(({ data }) => setCategories(data.categories))
      .catch(() => {});
  }, []);
  useEffect(() => {
    loadProducts();
  }, [status, search, category]);

  async function saveProduct(payload) {
    setSaving(true);
    try {
      if (editing?._id) await api.patch(`/products/${editing._id}`, payload);
      else await api.post("/products", payload);
      setEditing(null);
      notify(
        editing?._id
          ? "Product updated."
          : "Product created and published to the store.",
      );
      await loadProducts();
    } catch (requestError) {
      notify(errorMessage(requestError), "error");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(product, isActive) {
    try {
      if (
        !isActive &&
        !window.confirm(
          `Archive “${product.name}”? It will no longer appear in the storefront.`,
        )
      )
        return;
      await api.patch(`/products/${product._id}`, { isActive });
      notify(
        isActive ? "Product restored to the storefront." : "Product archived.",
      );
      await loadProducts();
    } catch (requestError) {
      notify(errorMessage(requestError), "error");
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">YOUR ASSORTMENT</p>
          <h1>Products</h1>
          <p className="heading-subtitle">
            Keep your catalog current and in stock.
          </p>
        </div>
        <button className="button button-dark" onClick={() => setEditing({})}>
          <Plus size={17} /> Add product
        </button>
      </section>
      <div className="catalog-toolbar">
        <label className="search-field">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
          />
        </label>
        <label className="select-field">
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option value={item._id} key={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>
        <label className="select-field">
          <span className="sr-only">Product status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All products</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <span className="toolbar-count">{products.length} products</span>
      </div>
      <section className="panel data-panel">
        {error ? (
          <div className="error-banner" role="alert">
            {error}
          </div>
        ) : loading ? (
          <div className="table-loading">
            <span className="spinner" />
            Loading products
          </div>
        ) : products.length ? (
          <div className="table-wrap">
            <table className="product-table">
              <thead>
                <tr>
                  <th className="product-col">PRODUCT</th>
                  <th>STATUS</th>
                  <th>INVENTORY</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th className="align-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-thumb">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt=""
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Package size={19} />
                          )}
                        </div>
                        <span className="product-cell-copy">
                          <strong>
                            {product.name}
                            {product.featured && (
                              <Star
                                size={13}
                                className="featured-star"
                                fill="currentColor"
                              />
                            )}
                          </strong>
                          <small>{product.slug}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${product.isActive ? "status-active" : "status-archived"}`}
                      >
                        {product.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          product.stock <= 5 ? "stock-low" : "table-primary"
                        }
                      >
                        {product.stock} in stock
                      </span>
                    </td>
                    <td>{product.category?.name || "Uncategorized"}</td>
                    <td className="table-primary">{money(product.price)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                          onClick={() => setEditing(product)}
                        >
                          <Pencil size={15} />
                        </button>
                        {product.isActive ? (
                          <button
                            className="icon-button danger-action"
                            aria-label={`Archive ${product.name}`}
                            title="Archive product"
                            onClick={() => setActive(product, false)}
                          >
                            <Archive size={15} />
                          </button>
                        ) : (
                          <button
                            className="icon-button"
                            aria-label={`Restore ${product.name}`}
                            title="Restore product"
                            onClick={() => setActive(product, true)}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={Package}
            title="No products found"
            message="Try another search or add a product to your catalog."
          />
        )}
      </section>
      {editing && (
        <ProductModal
          product={editing}
          categories={categories.filter((item) => item.isActive)}
          busy={saving}
          onClose={() => setEditing(null)}
          onSave={saveProduct}
        />
      )}
    </div>
  );
}

function ProductModal({ product, categories, busy, onClose, onSave }) {
  const [name, setName] = useState(product.name || "");
  const [slug, setSlug] = useState(product.slug || "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product.slug));
  const [imageUrls, setImageUrls] = useState((product.images || []).join("\n"));
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function uploadImages(files) {
    if (!files.length) return;
    setUploadingImages(true);
    setUploadError("");
    try {
      const uploadedUrls = [];
      for (const file of files) {
        uploadedUrls.push(await uploadCloudinaryImage(file));
      }
      setImageUrls((current) =>
        [
          ...current
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean),
          ...uploadedUrls,
        ].join("\n"),
      );
    } catch (requestError) {
      setUploadError(errorMessage(requestError));
    } finally {
      setUploadingImages(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    onSave({
      name: name.trim(),
      slug: slugEdited ? slugify(slug) : slugify(name),
      description: values.description.trim(),
      price: Number(values.price),
      compareAtPrice: values.compareAtPrice
        ? Number(values.compareAtPrice)
        : null,
      category: values.category,
      images: values.images
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      sizes: values.sizes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      colors: values.colors
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      stock: Number(values.stock),
      isActive: form.has("isActive"),
      featured: form.has("featured"),
    });
  }

  return (
    <Modal
      title={product._id ? "Edit product" : "Add product"}
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={submit}>
        <div className="form-grid">
          <Field
            label="Product name"
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugEdited) setSlug(slugify(event.target.value));
            }}
            required
            maxLength={160}
          />
          <Field
            label="URL handle"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugEdited(true);
            }}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
        </div>
        <div className="form-grid">
          <Field
            label="Price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product.price ?? ""}
            required
          />
          <Field
            label="Compare-at price"
            name="compareAtPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product.compareAtPrice ?? ""}
          />
        </div>
        <label className="field">
          <span>Category</span>
          <select
            name="category"
            defaultValue={product.category?._id || product.category || ""}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((item) => (
              <option value={item._id} key={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            name="description"
            rows="3"
            maxLength={5000}
            defaultValue={product.description || ""}
          />
        </label>
        <label className="field">
          <span>
            Upload product images <small>Choose one or more image files</small>
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploadingImages}
            onChange={(event) => {
              const files = [...event.target.files];
              event.target.value = "";
              uploadImages(files);
            }}
          />
        </label>
        {uploadingImages && (
          <p className="muted-cell" role="status">
            Uploading images...
          </p>
        )}
        {uploadError && (
          <p className="text-danger small" role="alert">
            {uploadError}
          </p>
        )}
        <label className="field">
          <span>
            Image URLs <small>Uploaded links, one per line</small>
          </span>
          <textarea
            name="images"
            rows="3"
            placeholder="https://your-image.jpg"
            value={imageUrls}
            onChange={(event) => setImageUrls(event.target.value)}
          />
        </label>
        <div className="form-grid">
          <Field
            label="Sizes"
            name="sizes"
            placeholder="XS, S, M, L"
            defaultValue={(product.sizes || []).join(", ")}
          />
          <Field
            label="Colors"
            name="colors"
            placeholder="Black, Ecru"
            defaultValue={(product.colors || []).join(", ")}
          />
        </div>
        <Field
          label="Stock quantity"
          name="stock"
          type="number"
          min="0"
          step="1"
          defaultValue={product.stock ?? 0}
          required
        />
        <div className="toggle-row">
          <label>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product.isActive ?? true}
            />
            <span className="toggle-control" />
            <span>
              <strong>Active</strong>
              <small>Available in the storefront</small>
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product.featured ?? false}
            />
            <span className="toggle-control" />
            <span>
              <strong>Featured</strong>
              <small>Highlight this product</small>
            </span>
          </label>
        </div>
        <div className="modal-actions">
          <button
            className="button button-quiet"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="button button-dark"
            disabled={busy || uploadingImages}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            {product._id ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function CategoriesPage() {
  const notify = useToast();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/categories", {
        params: { status, search: search.trim() || undefined },
      });
      setCategories(data.categories);
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [status, search]);

  async function save(payload) {
    setSaving(true);
    try {
      if (editing?._id) await api.patch(`/categories/${editing._id}`, payload);
      else await api.post("/categories", payload);
      setEditing(null);
      notify(editing?._id ? "Category updated." : "Category created.");
      await load();
    } catch (requestError) {
      notify(errorMessage(requestError), "error");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(item, isActive) {
    try {
      if (!isActive && !window.confirm(`Archive “${item.name}”?`)) return;
      await api.patch(`/categories/${item._id}`, { isActive });
      notify(isActive ? "Category restored." : "Category archived.");
      await load();
    } catch (requestError) {
      notify(errorMessage(requestError), "error");
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">MERCHANDISING</p>
          <h1>Categories</h1>
          <p className="heading-subtitle">
            Organize products into collections customers can browse.
          </p>
        </div>
        <button className="button button-dark" onClick={() => setEditing({})}>
          <Plus size={17} /> Add category
        </button>
      </section>
      <div className="catalog-toolbar">
        <label className="search-field">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
          />
        </label>
        <label className="select-field">
          <span className="sr-only">Category status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All categories</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <span className="toolbar-count">{categories.length} categories</span>
      </div>
      <section className="panel data-panel">
        {error ? (
          <div className="error-banner" role="alert">
            {error}
          </div>
        ) : loading ? (
          <div className="table-loading">
            <span className="spinner" />
            Loading categories
          </div>
        ) : categories.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CATEGORY</th>
                  <th>URL HANDLE</th>
                  <th>STATUS</th>
                  <th>DESCRIPTION</th>
                  <th className="align-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="product-cell">
                        <div className="category-thumb">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Boxes size={18} />
                          )}
                        </div>
                        <span className="product-cell-copy">
                          <strong>{item.name}</strong>
                          <small>
                            Added{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td className="muted-cell">/{item.slug}</td>
                    <td>
                      <span
                        className={`status-badge ${item.isActive ? "status-active" : "status-archived"}`}
                      >
                        {item.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="description-cell">
                      {item.description || "—"}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${item.name}`}
                          title="Edit category"
                          onClick={() => setEditing(item)}
                        >
                          <Pencil size={15} />
                        </button>
                        {item.isActive ? (
                          <button
                            className="icon-button danger-action"
                            aria-label={`Archive ${item.name}`}
                            title="Archive category"
                            onClick={() => setActive(item, false)}
                          >
                            <Archive size={15} />
                          </button>
                        ) : (
                          <button
                            className="icon-button"
                            aria-label={`Restore ${item.name}`}
                            title="Restore category"
                            onClick={() => setActive(item, true)}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={Boxes}
            title="No categories found"
            message="Create a category to organize your products."
          />
        )}
      </section>
      {editing && (
        <CategoryModal
          category={editing}
          busy={saving}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, busy, onClose, onSave }) {
  const [name, setName] = useState(category.name || "");
  const [slug, setSlug] = useState(category.slug || "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category.slug));
  const [imageUrl, setImageUrl] = useState(category.image || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  function submit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const description = String(formData.get("description") || "").trim();

    if (!name.trim()) {
      setUploadError("Please enter a category name.");
      return;
    }

    if (!slugify(slugEdited ? slug : name)) {
      setUploadError("Please enter a valid category URL handle.");
      return;
    }

    setUploadError("");
    onSave({
      name: name.trim(),
      slug: slugEdited ? slugify(slug) : slugify(name),
      description,
      image: imageUrl.trim(),
      isActive: formData.has("isActive"),
    });
  }
  return (
    <Modal
      title={category._id ? "Edit category" : "Add category"}
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={submit}>
        <Field
          label="Category name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
          required
          minLength={2}
          maxLength={80}
        />
        <Field
          label="URL handle"
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugEdited(true);
          }}
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        />
        <label className="field">
          <span>Description</span>
          <textarea
            name="description"
            rows="3"
            maxLength={1000}
            defaultValue={category.description || ""}
          />
        </label>
        <label className="field">
          <span>Upload category image</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploadingImage}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setUploadingImage(true);
              setUploadError("");
              try {
                setImageUrl(await uploadCloudinaryImage(file));
              } catch (error) {
                setUploadError(errorMessage(error));
              } finally {
                setUploadingImage(false);
              }
            }}
          />
        </label>
        {uploadError && (
          <p className="text-danger small" role="alert">
            {uploadError}
          </p>
        )}
        {imageUrl.trim() && (
          <div className="category-image-preview">
            <img
              src={imageUrl.trim()}
              alt="Category preview"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span>Image preview</span>
          </div>
        )}
        <Field
          label="Image URL"
          name="image"
          type="url"
          placeholder="https://your-image.jpg"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
        />
        <div className="toggle-row">
          <label>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={category.isActive ?? true}
            />
            <span className="toggle-control" />
            <span>
              <strong>Active</strong>
              <small>Visible in the storefront</small>
            </span>
          </label>
        </div>
        <div className="modal-actions">
          <button
            className="button button-quiet"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="button button-dark"
            disabled={busy || uploadingImage}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            {category._id ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "relative",
          width: "min(680px, 100%)",
          maxWidth: "680px",
          maxHeight: "calc(100dvh - 40px)",
          minHeight: 0,
          margin: "auto",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overscrollBehavior: "contain",
          boxSizing: "border-box",
        }}
      >
        <header className="modal-header" style={{ position: "sticky", top: 0, zIndex: 2, flexShrink: 0 }}>
          <div>
            <p className="eyebrow">STORE CATALOG</p>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
function Empty({ icon: Icon, title, message }) {
  return (
    <div className="empty-state">
      <Icon size={22} />
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}
