import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Search, ShoppingCart, X } from 'lucide-react';
import { api, errorMessage, money, shortDate } from './api';
import { useToast } from './App';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const payments = ['pending', 'paid', 'refunded', 'failed'];

export function OrdersPage() {
  const notify = useToast();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (status !== 'all') params.status = status;
      const { data } = await api.get('/orders', { params });
      setOrders(data.items);
      setPagination(data.pagination);
      setError('');
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [page, status]);
  useEffect(() => { setPage(1); }, [status]);

  const visibleOrders = orders.filter((order) => `${order.orderNumber} ${order.customer.name} ${order.customer.email}`.toLowerCase().includes(search.toLowerCase()));

  async function update(order, field, value) {
    try {
      const { data } = await api.patch(`/orders/${order._id}`, { [field]: value });
      setOrders((current) => current.map((item) => item._id === order._id ? data.order : item));
      setSelected((current) => current?._id === order._id ? data.order : current);
      notify(field === 'status' ? `Order marked ${value}.` : `Payment status changed to ${value}.`);
    } catch (requestError) { notify(errorMessage(requestError), 'error'); }
  }

  async function openOrder(order) {
    setSelected({ ...order, loading: true });
    try {
      const { data } = await api.get(`/orders/${order._id}`);
      setSelected(data.order);
    } catch (requestError) { notify(errorMessage(requestError), 'error'); setSelected(null); }
  }

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">FULFILLMENT</p><h1>Orders</h1><p className="heading-subtitle">Track every purchase from checkout to delivery.</p></div><div className="heading-stat"><strong>{pagination.total.toLocaleString()}</strong><span>orders in store</span></div></section>
    <div className="catalog-toolbar"><label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or customer" aria-label="Search orders" /></label><label className="select-field"><span className="sr-only">Order status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{capitalize(value)}</option>)}</select><ChevronDown size={14} /></label><span className="toolbar-count">{visibleOrders.length} shown</span></div>
    <section className="panel data-panel">{error ? <div className="error-banner" role="alert">{error}</div> : loading ? <div className="table-loading"><span className="spinner" />Loading orders</div> : visibleOrders.length ? <><div className="table-wrap"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>PAYMENT</th><th>STATUS</th><th className="align-right">TOTAL</th><th /></tr></thead><tbody>{visibleOrders.map((order) => <tr key={order._id}>
      <td><button className="order-link" onClick={() => openOrder(order)}>{order.orderNumber}</button></td><td><strong className="table-primary">{order.customer.name}</strong><small className="table-secondary">{order.customer.email}</small></td><td>{shortDate(order.createdAt)}</td><td><StatusBadge value={order.paymentStatus} /></td><td><label className="inline-status"><select aria-label={`Update status for ${order.orderNumber}`} value={order.status} disabled={order.status === 'cancelled'} onChange={(event) => update(order, 'status', event.target.value)}>{statuses.map((value) => <option value={value} key={value}>{capitalize(value)}</option>)}</select><ChevronDown size={12} /></label></td><td className="align-right table-primary">{money(order.total)}</td><td><button className="icon-button" aria-label={`View order ${order.orderNumber}`} onClick={() => openOrder(order)}><ArrowUpRight size={15} /></button></td>
    </tr>)}</tbody></table></div><Pagination pagination={pagination} onPage={setPage} /></> : <div className="empty-state"><ShoppingCart size={22} /><strong>No orders found</strong><span>{search ? 'Try another search.' : 'Orders placed in your store will appear here.'}</span></div>}</section>
    {selected && <OrderDetails order={selected} onClose={() => setSelected(null)} onUpdate={update} />}
  </div>;
}

function OrderDetails({ order, onClose, onUpdate }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal order-modal" role="dialog" aria-modal="true" aria-label={`Order ${order.orderNumber}`}>
    <header className="modal-header"><div><p className="eyebrow">ORDER DETAILS</p><h2>{order.orderNumber}</h2><p className="modal-subtitle">Placed {shortDate(order.createdAt)}</p></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>
    {order.loading ? <div className="table-loading"><span className="spinner" />Loading order details</div> : <div className="order-details-body">
      <div className="order-detail-controls"><label className="field"><span>Fulfillment status</span><select value={order.status} disabled={order.status === 'cancelled'} onChange={(event) => onUpdate(order, 'status', event.target.value)}>{statuses.map((value) => <option key={value} value={value}>{capitalize(value)}</option>)}</select></label><label className="field"><span>Payment status</span><select value={order.paymentStatus} onChange={(event) => onUpdate(order, 'paymentStatus', event.target.value)}>{payments.map((value) => <option key={value} value={value}>{capitalize(value)}</option>)}</select></label></div>
      <div className="detail-block"><h3>Customer</h3><strong>{order.customer.name}</strong><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></div>
      <div className="detail-block"><h3>Shipping address</h3><span>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</span><span>{order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}</span><span>{order.shippingAddress.country}</span></div>
      <div className="detail-block"><h3>Items <span>{order.items.length}</span></h3>{order.items.map((item) => <div className="order-item-row" key={item._id || item.product?._id || item.name}><span><strong>{item.name}</strong><small>Qty {item.quantity}</small></span><strong>{money(item.unitPrice * item.quantity)}</strong></div>)}<div className="order-total-row"><span>Total</span><strong>{money(order.total)}</strong></div></div>
      {order.notes && <div className="detail-block"><h3>Order notes</h3><p>{order.notes}</p></div>}
      <a className="subtle-link order-email" href={`mailto:${order.customer.email}`}><ExternalLink size={15} /> Contact customer</a>
    </div>}
  </section></div>;
}

function Pagination({ pagination, onPage }) {
  if (pagination.pages <= 1) return null;
  return <div className="pagination"><span>Page {pagination.page} of {pagination.pages} <i>·</i> {pagination.total} records</span><div><button className="icon-button" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><button className="icon-button" disabled={pagination.page >= pagination.pages} onClick={() => onPage(pagination.page + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div>;
}
function StatusBadge({ value }) { return <span className={`status-badge status-${value}`}>{capitalize(value)}</span>; }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }