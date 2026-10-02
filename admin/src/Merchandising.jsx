
import { useEffect, useState } from 'react';
import {
  Archive,
  Check,
  LoaderCircle,
  Megaphone,
  Pencil,
  Plus,
  TicketPercent,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { api, errorMessage, money, uploadCloudinaryImage } from './api';
import { useToast } from './App';

export function MerchandisingPage() {
  const [section, setSection] = useState('coupons');

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">PROMOTIONS</p>
          <h1>Merchandising</h1>
          <p className="heading-subtitle">
            Manage checkout offers and storefront campaigns.
          </p>
        </div>
      </section>

      <div className="catalog-toolbar" role="tablist" aria-label="Merchandising tools">
        <button
          className={`button ${section === 'coupons' ? 'button-dark' : 'button-quiet'}`}
          role="tab"
          aria-selected={section === 'coupons'}
          onClick={() => setSection('coupons')}
        >
          <TicketPercent size={16} />
          Coupons
        </button>

        <button
          className={`button ${section === 'banners' ? 'button-dark' : 'button-quiet'}`}
          role="tab"
          aria-selected={section === 'banners'}
          onClick={() => setSection('banners')}
        >
          <Megaphone size={16} />
          Banners
        </button>
      </div>

      {section === 'coupons' ? <CouponsPanel /> : <BannersPanel />}
    </div>
  );
}

/* =========================
   COUPONS
========================= */

function CouponsPanel() {
  const notify = useToast();
  const [coupons, setCoupons] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);

    try {
      const { data } = await api.get('/coupons');
      setCoupons(data.coupons || []);
      setError('');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(payload) {
    setSaving(true);

    try {
      if (editing?._id) {
        await api.patch(`/coupons/${editing._id}`, payload);
      } else {
        await api.post('/coupons', payload);
      }

      setEditing(null);
      notify(editing?._id ? 'Coupon updated.' : 'Coupon created.');
      await load();
    } catch (requestError) {
      notify(errorMessage(requestError), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function archive(coupon) {
    if (!window.confirm(`Deactivate coupon ${coupon.code}?`)) return;

    try {
      await api.delete(`/coupons/${coupon._id}`);
      notify('Coupon deactivated.');
      await load();
    } catch (requestError) {
      notify(errorMessage(requestError), 'error');
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">CHECKOUT INCENTIVES</p>
          <h2>Discount codes</h2>
        </div>

        <button className="button button-dark" onClick={() => setEditing({})}>
          <Plus size={16} />
          Add coupon
        </button>
      </section>

      <section className="panel data-panel">
        {error ? (
          <div className="error-banner" role="alert">{error}</div>
        ) : loading ? (
          <div className="table-loading">
            <span className="spinner" />
            Loading coupons
          </div>
        ) : coupons.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>OFFER</th>
                  <th>MINIMUM</th>
                  <th>REDEMPTIONS</th>
                  <th>STATUS</th>
                  <th className="align-right">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td className="table-primary">{coupon.code}</td>

                    <td>
                      {coupon.discountType === 'percent'
                        ? `${coupon.discountValue}% off`
                        : `${money(coupon.discountValue)} off`}
                    </td>

                    <td>{money(coupon.minimumSubtotal)}</td>

                    <td>
                      {coupon.redemptions}
                      {coupon.maxRedemptions
                        ? ` / ${coupon.maxRedemptions}`
                        : ''}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          coupon.isActive ? 'status-active' : 'status-archived'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${coupon.code}`}
                          title="Edit coupon"
                          onClick={() => setEditing(coupon)}
                        >
                          <Pencil size={15} />
                        </button>

                        {coupon.isActive && (
                          <button
                            className="icon-button danger-action"
                            aria-label={`Deactivate ${coupon.code}`}
                            title="Deactivate coupon"
                            onClick={() => archive(coupon)}
                          >
                            <Archive size={15} />
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
            title="No coupons yet"
            message="Create a code customers can apply at checkout."
          />
        )}
      </section>

      {editing && (
        <CouponEditor
          coupon={editing}
          busy={saving}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function CouponEditor({ coupon, busy, onClose, onSave }) {
  function submit(event) {
    event.preventDefault();

    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries()
    );

    onSave({
      code: values.code.trim().toUpperCase(),
      discountType: values.discountType,
      discountValue: Number(values.discountValue),
      minimumSubtotal: Number(values.minimumSubtotal || 0),
      maxRedemptions: values.maxRedemptions
        ? Number(values.maxRedemptions)
        : null,
      startsAt: values.startsAt
        ? new Date(values.startsAt).toISOString()
        : new Date().toISOString(),
      expiresAt: values.expiresAt
        ? new Date(values.expiresAt).toISOString()
        : null,
      isActive: new FormData(event.currentTarget).has('isActive')
    });
  }

  return (
    <Modal
      title={coupon._id ? 'Edit coupon' : 'Create coupon'}
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={submit}>
        <Field
          label="Code"
          name="code"
          defaultValue={coupon.code || ''}
          required
          minLength="3"
          maxLength="40"
          pattern="[A-Za-z0-9_-]+"
        />

        <div className="form-grid">
          <label className="field">
            <span>Discount type</span>
            <select
              name="discountType"
              defaultValue={coupon.discountType || 'percent'}
            >
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>

          <Field
            label="Discount value"
            name="discountValue"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={coupon.discountValue ?? ''}
            required
          />
        </div>

        <div className="form-grid">
          <Field
            label="Minimum subtotal"
            name="minimumSubtotal"
            type="number"
            min="0"
            step="0.01"
            defaultValue={coupon.minimumSubtotal ?? 0}
          />

          <Field
            label="Maximum redemptions"
            name="maxRedemptions"
            type="number"
            min="1"
            step="1"
            placeholder="Unlimited"
            defaultValue={coupon.maxRedemptions ?? ''}
          />
        </div>

        <div className="form-grid">
          <Field
            label="Starts at"
            name="startsAt"
            type="datetime-local"
            defaultValue={dateInput(coupon.startsAt)}
          />

          <Field
            label="Expires at"
            name="expiresAt"
            type="datetime-local"
            defaultValue={dateInput(coupon.expiresAt)}
          />
        </div>

        <div className="toggle-row">
          <label>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={coupon.isActive ?? true}
            />
            <span className="toggle-control" />
            <span>
              <strong>Active</strong>
              <small>Customers can redeem this code</small>
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

          <button className="button button-dark" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            {coupon._id ? 'Save changes' : 'Create coupon'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================
   BANNERS
========================= */

function BannersPanel() {
  const notify = useToast();
  const [banners, setBanners] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusChanging, setStatusChanging] = useState('');

  async function load() {
    setLoading(true);

    try {
      const { data } = await api.get('/banners/admin');
      setBanners(data.banners || []);
      setError('');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(payload) {
    setSaving(true);

    try {
      if (editing?._id) {
        await api.patch(`/banners/${editing._id}`, payload);
      } else {
        await api.post('/banners', payload);
      }

      setEditing(null);
      notify(editing?._id ? 'Banner updated.' : 'Banner created.');
      await load();
    } catch (requestError) {
      notify(errorMessage(requestError), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleBannerStatus(banner) {
    const nextActive = !banner.isActive;
    const action = nextActive ? 'activate' : 'deactivate';

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${banner.title}"?`
      )
    ) {
      return;
    }

    setStatusChanging(banner._id);

    try {
      await api.patch(`/banners/${banner._id}`, {
        isActive: nextActive
      });

      notify(nextActive ? 'Banner activated.' : 'Banner deactivated.');
      await load();
    } catch (requestError) {
      notify(errorMessage(requestError), 'error');
    } finally {
      setStatusChanging('');
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">STOREFRONT CAMPAIGNS</p>
          <h2>Promotional banners</h2>
        </div>

        <button
          className="button button-dark"
          onClick={() => setEditing({})}
        >
          <Plus size={16} />
          Add banner
        </button>
      </section>

      <section className="panel data-panel">
        {error ? (
          <div className="error-banner" role="alert">{error}</div>
        ) : loading ? (
          <div className="table-loading">
            <span className="spinner" />
            Loading banners
          </div>
        ) : banners.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CAMPAIGN</th>
                  <th>ORDER</th>
                  <th>STATUS</th>
                  <th className="align-right">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {banners.map((banner) => (
                  <tr key={banner._id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-thumb">
                          {banner.imageUrl && (
                            <img
                              src={banner.imageUrl}
                              alt=""
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>

                        <span className="product-cell-copy">
                          <strong>{banner.title}</strong>
                          <small>
                            {banner.subtitle || banner.imageUrl}
                          </small>
                        </span>
                      </div>
                    </td>

                    <td>{banner.sortOrder}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          banner.isActive
                            ? 'status-active'
                            : 'status-archived'
                        }`}
                      >
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${banner.title}`}
                          title="Edit banner"
                          onClick={() => setEditing(banner)}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          className={`icon-button ${
                            banner.isActive ? 'danger-action' : ''
                          }`}
                          aria-label={`${
                            banner.isActive ? 'Deactivate' : 'Activate'
                          } ${banner.title}`}
                          title={
                            banner.isActive
                              ? 'Deactivate banner'
                              : 'Activate banner'
                          }
                          disabled={statusChanging === banner._id}
                          onClick={() => toggleBannerStatus(banner)}
                        >
                          {statusChanging === banner._id ? (
                            <LoaderCircle className="spin" size={15} />
                          ) : banner.isActive ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No banners yet"
            message="Create a campaign to feature on the storefront."
          />
        )}
      </section>

      {editing && (
        <BannerEditor
          banner={editing}
          busy={saving}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function BannerEditor({ banner, busy, onClose, onSave }) {
  const [imageUrl, setImageUrl] = useState(banner.imageUrl || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setUploadingImage(true);
    setUploadError('');

    try {
      const uploadedUrl = await uploadCloudinaryImage(file);
      setImageUrl(uploadedUrl);
    } catch (uploadRequestError) {
      setUploadError(errorMessage(uploadRequestError));
    } finally {
      setUploadingImage(false);
    }
  }

  function submit(event) {
    event.preventDefault();

    if (uploadingImage) {
      setUploadError('Please wait until the image upload finishes.');
      return;
    }

    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries()
    );

    onSave({
      title: values.title.trim(),
      subtitle: (values.subtitle || '').trim(),
      imageUrl: imageUrl.trim(),
      linkUrl: (values.linkUrl || '').trim(),
      buttonLabel: (values.buttonLabel || '').trim(),
      sortOrder: Number(values.sortOrder || 0),
      isActive: new FormData(event.currentTarget).has('isActive')
    });
  }

  return (
    <Modal
      title={banner._id ? 'Edit banner' : 'Create banner'}
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={submit}>
        <Field
          label="Headline"
          name="title"
          defaultValue={banner.title || ''}
          required
          minLength="2"
          maxLength="120"
        />

        <label className="field">
          <span>Supporting text</span>
          <textarea
            name="subtitle"
            rows="2"
            maxLength="240"
            defaultValue={banner.subtitle || ''}
          />
        </label>

        <label className="field">
          <span>Upload campaign image</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploadingImage}
            onChange={handleImageUpload}
          />
        </label>

        {uploadingImage && (
          <p className="small">
            <LoaderCircle className="spin" size={14} /> Uploading image...
          </p>
        )}

        {uploadError && (
          <p className="text-danger small" role="alert">
            {uploadError}
          </p>
        )}

        {imageUrl && (
          <div className="banner-preview">
            <span className="small">Image preview</span>
            <img
              src={imageUrl}
              alt="Banner preview"
              style={{
                display: 'block',
                width: '100%',
                maxHeight: '180px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginTop: '8px'
              }}
            />
          </div>
        )}

        <label className="field">
          <span>Image URL</span>
          <input
            name="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://your-image.jpg"
            required
          />
        </label>

        <Field
          label="Destination URL"
          name="linkUrl"
          type="url"
          placeholder="https://..."
          defaultValue={banner.linkUrl || ''}
        />

        <div className="form-grid">
          <Field
            label="Button label"
            name="buttonLabel"
            defaultValue={banner.buttonLabel || 'Shop now'}
            maxLength="40"
          />

          <Field
            label="Display order"
            name="sortOrder"
            type="number"
            min="0"
            step="1"
            defaultValue={banner.sortOrder ?? 0}
          />
        </div>

        <div className="toggle-row">
          <label>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={banner.isActive ?? true}
            />
            <span className="toggle-control" />
            <span>
              <strong>Active</strong>
              <small>Visible on the storefront</small>
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
            {banner._id ? 'Save changes' : 'Create banner'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================
   SHARED COMPONENTS
========================= */

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">STORE MERCHANDISING</p>
            <h2>{title}</h2>
          </div>

          <button
            className="icon-button"
            type="button"
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

function Empty({ title, message }) {
  return (
    <div className="empty-state">
      <Megaphone size={22} />
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}

function dateInput(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
} 