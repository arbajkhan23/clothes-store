import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, Boxes, ChevronDown, ChevronLeft, Command, LayoutDashboard, LogOut, Megaphone, Menu, Package, ShoppingCart, TicketPercent, Users, X } from 'lucide-react';

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard, end: true },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Categories', path: '/categories', icon: Boxes },
  { label: 'Orders', path: '/orders', icon: ShoppingCart },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Merchandising', path: '/merchandising', icon: Megaphone },
];
const titles = { '/': 'Overview', '/products': 'Products', '/categories': 'Categories', '/orders': 'Orders', '/customers': 'Customers', '/merchandising': 'Merchandising' };

export function Layout({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] || 'Overview';
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><span className="brand-mark"><Command size={18} /></span><span className="brand-copy"><strong>FASHION STORE</strong><small>STORE ADMIN</small></span><button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
        <div className="store-switcher"><span className="store-avatar">F</span><span className="store-copy"><strong>Fashion Store</strong><small>Online store</small></span><ChevronDown size={15} /></div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, icon: Icon, end }) => <NavLink key={path} to={path} end={end} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}
        </nav>
        <div className="sidebar-bottom"><div className="status-card"><span className="status-live"><Activity size={15} /></span><span><strong>Store is live</strong><small>All systems operational</small></span><span className="live-dot" /></div><button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronLeft size={16} /><span>Collapse menu</span></button></div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Store</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div>
          <div className="topbar-actions"><button className="account-button" onClick={onLogout} title="Sign out"><span className="user-avatar">{initials}</span><span className="account-copy"><strong>{user.name}</strong><small>Administrator</small></span><LogOut size={16} className="logout-icon" /></button></div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="app-footer"><span>FORME STORE OPERATIONS</span><span>ADMIN CONSOLE · 2026</span></footer>
      </div>
    </div>
  );
}