import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Mail, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { api, errorMessage, money, shortDate } from './api';
import { useToast } from './App';

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const notify = useToast();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/customers', { params: { page, limit: 25, search: search.trim() || undefined } });
      setCustomers(data.items);
      setPagination(data.pagination);
      setError('');
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [page, search]);
  useEffect(() => { setPage(1); }, [search]);

  async function openCustomer(customer) {
    setSelected({ ...customer, loading: true, orders: [] });
    try {
      const { data } = await api.get(`/admin/customers/${encodeURIComponent(customer.email)}/orders`, { params: { limit: 100 } });
      setSelected({ ...customer, orders: data.items, orderCount: data.pagination.total });
    } catch (requestError) {
      notify(errorMessage(requestError), 'error');
      setSelected(null);
    }
  }

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">PEOPLE</p><h1>Customers</h1><p className="heading-subtitle">Get to know the people behind your orders.</p></div><div className="heading-stat"><strong>{pagination.total.toLocaleString()}</strong><span>customer accounts</span></div></section>
    <div className="catalog-toolbar"><label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" aria-label="Search customers" /></label><span className="toolbar-count">{customers.length} on this page</span></div>
    <section className="panel data-panel">{error ? <div className="error-banner" role="alert">{error}</div> : loading ? <div className="table-loading"><span className="spinner" />Loading customers</div> : customers.length ? <><div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>ROLE</th><th>JOINED</th><th className="align-right">PROFILE</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer._id}><td><div className="customer-cell"><span className="customer-avatar">{customer.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><span className="product-cell-copy"><strong>{customer.name}</strong><small>{customer.email}</small></span></div></td><td><span className="status-badge status-customer">Customer</span></td><td>{shortDate(customer.createdAt)}</td><td className="align-right"><button className="button button-outline button-small" onClick={() => openCustomer(customer)}>View profile</button></td></tr>)}</tbody></table></div><Pagination pagination={pagination} onPage={setPage} /></> : <div className="empty-state"><UserRound size={22} /><strong>No customers found</strong><span>{search ? 'Try another name or email.' : 'Customer accounts will appear here.'}</span></div>}</section>
    {selected && <CustomerDetails customer={selected} onClose={() => setSelected(null)} />}
  </div>;
}

function CustomerDetails({ customer, onClose }) {
  const totalSpent = customer.paidTotal;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal customer-modal" role="dialog" aria-modal="true" aria-label={`Customer ${customer.name}`}>
    <header className="modal-header"><div><p className="eyebrow">CUSTOMER PROFILE</p><h2>{customer.name}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>
    {customer.loading ? <div className="table-loading"><span className="spinner" />Loading customer history</div> : <div className="customer-details-body">
      <div className="customer-profile-summary"><span className="customer-avatar customer-avatar-large">{customer.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><div><strong>{customer.name}</strong><a href={`mailto:${customer.email}`}><Mail size={14} />{customer.email}</a><small>Customer since {shortDate(customer.createdAt)}</small></div></div>
      <div className="customer-stats"><div><span>ORDERS</span><strong>{customer.orderCount}</strong></div><div><span>PAID SPEND</span><strong>{money(totalSpent)}</strong></div></div>
      <div className="customer-history-heading"><h3>Order history</h3><span>Matched by customer email</span></div>
      {customer.orders.length ? <div className="customer-order-list">{customer.orders.slice(0, 12).map((order) => <div className="customer-order-row" key={order._id}><span className="customer-order-icon"><ShoppingBag size={16} /></span><span><strong>{order.orderNumber}</strong><small>{shortDate(order.createdAt)} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}</small></span><span className="customer-order-total"><strong>{money(order.total)}</strong><small className={`status-text status-text-${order.status}`}>{order.status}</small></span></div>)}</div> : <div className="empty-history">No orders found for this customer email.</div>}
    </div>}
  </section></div>;
}

function Pagination({ pagination, onPage }) {
  if (pagination.pages <= 1) return null;
  return <div className="pagination"><span>Page {pagination.page} of {pagination.pages} <i>·</i> {pagination.total} customers</span><div><button className="icon-button" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><button className="icon-button" disabled={pagination.page >= pagination.pages} onClick={() => onPage(pagination.page + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div>;
}