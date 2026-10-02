
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Bar,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { api, errorMessage, money, shortDate } from './api';

const metrics = [
  {
    key: 'paidRevenue',
    label: 'Paid revenue',
    icon: CircleDollarSign,
    format: money,
    tint: 'mint',
  },
  {
    key: 'orders',
    label: 'Total orders',
    icon: ShoppingCart,
    tint: 'blue',
  },
  {
    key: 'products',
    label: 'Active products',
    icon: Package,
    tint: 'amber',
  },
  {
    key: 'customers',
    label: 'Customers',
    icon: Users,
    tint: 'rose',
  },
];

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get('/admin/dashboard')
      .then(({ data: result }) => {
        if (mounted) {
          setData(result);
          setError('');
        }
      })
      .catch((requestError) => {
        if (mounted) {
          setError(errorMessage(requestError));
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading store performance
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner" role="alert">
        {error}
        <button
          className="text-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data || !data.stats) {
    return (
      <div className="error-banner" role="alert">
        Dashboard data is missing. Please check the admin API.
        <button
          className="text-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  const stats = data.stats;
  const activity = Array.isArray(data.activity)
    ? data.activity
    : [];
  const recentOrders = Array.isArray(data.recentOrders)
    ? data.recentOrders
    : [];
  // Optional dashboard collections; the page remains usable if the API
  // does not yet return these fields.
  const categorySales = Array.isArray(data.salesByCategory)
    ? data.salesByCategory
    : Array.isArray(data.categorySales)
      ? data.categorySales
      : [];
  const topProducts = Array.isArray(data.topProducts)
    ? data.topProducts
    : Array.isArray(data.topSellingProducts)
      ? data.topSellingProducts
      : [];
  const trendingProducts = Array.isArray(data.trendingProducts)
    ? data.trendingProducts
    : [];

  const categoryColors = ['#467763', '#e5b767', '#8aa99a', '#c58b74', '#9aa5a1', '#6b8790'];
  const categoryChartData = categorySales.map((item) => ({
    ...item,
    name: item.name || item.category || 'Category',
    revenue: Number(item.revenue || item.sales || 0),
  }));
  const values = activity.map((entry) => ({
    ...entry,
    revenue: Number(entry.revenue || 0),
    orders: Number(entry.orders || 0),
    label: entry.date
      ? new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
        }).format(new Date(`${entry.date}T12:00:00Z`))
      : '',
  }));

  const pendingOrders = Number(stats.pendingOrders || 0);
  const totalOrders = Number(stats.orders || 0);
  const paidRevenue = Number(stats.paidRevenue || 0);
  const products = Number(stats.products || 0);
  const customers = Number(stats.customers || 0);

  return (
    <div className="page-stack">
      {/* Page heading */}
      <section className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">
            {new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
              .format(new Date())
              .toUpperCase()}
          </p>

          <h1>
            Good morning,{' '}
            {new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
            })
              .format(new Date())
              .includes('PM')
              ? 'team'
              : 'there'}{' '}
            <Sparkles size={17} className="heading-spark" />
          </h1>

          <p className="heading-subtitle">
            Here’s what’s happening with your store today.
          </p>
        </div>

        <Link className="button button-dark" to="/products">
          <Package size={16} />
          Add a product
        </Link>
      </section>

      {/* Store statistics */}
      <section className="metric-grid" aria-label="Store statistics">
        {metrics.map(
          ({ key, label, icon: Icon, format, tint }, index) => {
            const value = Number(stats[key] || 0);

            return (
              <article
                className="metric-card"
                key={key}
                style={{ animationDelay: `${index * 65}ms` }}
              >
                <div className="metric-top">
                  <span className={`metric-icon metric-${tint}`}>
                    <Icon size={17} />
                  </span>
                  <span className="metric-period">ALL TIME</span>
                </div>

                <p className="metric-label">{label}</p>

                <div className="metric-value">
                  {format ? format(value) : value.toLocaleString()}
                </div>

                <div className="metric-foot">
                  <span className="metric-foot-icon">
                    <ArrowUpRight size={14} />
                  </span>
                  <span>
                    {key === 'paidRevenue'
                      ? 'Confirmed payments'
                      : key === 'orders'
                        ? `${pendingOrders} need attention`
                        : 'Live in your store'}
                  </span>
                </div>
              </article>
            );
          }
        )}
      </section>

      {/* Charts and snapshot */}
      <section className="overview-grid">
        {/* Store activity chart */}
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LAST 7 DAYS</p>
              <h2>Store activity</h2>
            </div>

            <div className="chart-legend">
              <span>
                <i className="legend-revenue" />
                Revenue
              </span>
              <span>
                <i className="legend-orders" />
                Orders
              </span>
            </div>
          </div>

          <div className="chart-summary">
            <strong>
              {money(
                values.reduce(
                  (sum, item) => sum + item.revenue,
                  0
                )
              )}
            </strong>
            <span>paid revenue this week</span>
          </div>

          <div className="chart-area">
            {values.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={values}
                  margin={{
                    top: 14,
                    right: 8,
                    left: -14,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="revenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#467763"
                        stopOpacity={0.19}
                      />
                      <stop
                        offset="100%"
                        stopColor="#467763"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="#edf0ed"
                    strokeDasharray="3 5"
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9a9e9a', fontSize: 11 }}
                    dy={10}
                  />

                  <YAxis
                    yAxisId="revenue"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9a9e9a', fontSize: 10 }}
                    tickFormatter={(value) =>
                      value ? `$${value}` : '$0'
                    }
                    width={45}
                  />

                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    hide
                    domain={[0, 'dataMax + 2']}
                  />

                  <Tooltip content={<ChartTooltip />} />

                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#467763"
                    strokeWidth={2.4}
                    fill="url(#revenueFill)"
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />

                  <Bar
                    yAxisId="orders"
                    dataKey="orders"
                    fill="#e5b767"
                    radius={[3, 3, 0, 0]}
                    barSize={9}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <ShoppingCart size={22} />
                <strong>No activity yet</strong>
                <span>Store activity will appear here.</span>
              </div>
            )}
          </div>
        </article>

        {/* Store snapshot */}
        <article className="panel snapshot-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AT A GLANCE</p>
              <h2>Store snapshot</h2>
            </div>

            <span className="snapshot-icon">
              <ShoppingBag size={17} />
            </span>
          </div>

          <div className="snapshot-rows">
            <Snapshot
              icon={Boxes}
              label="Categories"
              value={stats.categories}
              detail="Active collections"
            />

            <Snapshot
              icon={ShoppingCart}
              label="Pending orders"
              value={pendingOrders}
              detail="Ready for review"
              highlight={pendingOrders > 0}
            />

            <Snapshot
              icon={CircleDollarSign}
              label="Total orders"
              value={totalOrders}
              detail="All order statuses"
            />
          </div>

          <Link className="panel-link" to="/orders">
            Review orders
            <ArrowRight size={15} />
          </Link>
        </article>
      </section>

      {/* Category sales, top sellers and trending products */}
      <section className="overview-grid dashboard-detail-grid">
        <article className="panel chart-panel category-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PRODUCT MIX</p>
              <h2>Sales by category</h2>
            </div>
          </div>
          {categorySales.length ? (
            <div className="category-chart-layout">
              <div className="category-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={3}
                    >
                      {categorySales.map((item, index) => (
                        <Cell
                          key={`${item.name || 'category'}-${index}`}
                          fill={categoryColors[index % categoryColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => money(Number(value || 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="category-legend">
                {categorySales.map((item, index) => (
                  <div className="category-legend-row" key={`${item.name || 'category'}-${index}`}>
                    <span
                      className="category-legend-dot"
                      style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                    />
                    <span className="category-legend-name">{item.name}</span>
                    <strong>{money(Number(item.revenue || 0))}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Boxes size={22} />
              <strong>No category sales data</strong>
              <span>Category breakdown will appear when the API provides salesByCategory.</span>
            </div>
          )}
        </article>

        <article className="panel recent-panel top-products-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">BEST PERFORMERS</p>
              <h2>Top selling products</h2>
            </div>
            <Link className="subtle-link" to="/products">
              View products <ArrowRight size={15} />
            </Link>
          </div>
          {topProducts.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>UNITS SOLD</th>
                    <th className="align-right">REVENUE</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.slice(0, 5).map((product, index) => (
                    <tr key={product._id || product.id || product.name || index}>
                      <td>
                        <strong className="table-primary">
                          {product.name || product.title || 'Product'}
                        </strong>
                        {product.sku ? <small className="table-secondary">{product.sku}</small> : null}
                      </td>
                      <td>{Number(product.unitsSold || product.quantitySold || product.sold || 0).toLocaleString()}</td>
                      <td className="align-right table-primary">
                        {money(Number(product.revenue || product.totalRevenue || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingBag size={22} />
              <strong>No product sales data</strong>
              <span>Top sellers will appear when the API provides topProducts.</span>
            </div>
          )}
        </article>
      </section>

      <section className="panel trending-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">STORE PICKS</p>
            <h2>Trending now</h2>
          </div>
          <Link className="subtle-link" to="/products">
            Manage products <ArrowRight size={15} />
          </Link>
        </div>
        {trendingProducts.length ? (
          <div className="trending-products-grid">
            {trendingProducts.slice(0, 4).map((product, index) => (
              <article className="trending-product" key={product._id || product.id || product.name || index}>
                {product.image || product.imageUrl || product.thumbnail ? (
                  <img
                    className="trending-product-image"
                    src={product.image || product.imageUrl || product.thumbnail}
                    alt={product.name || product.title || 'Product'}
                    loading="lazy"
                  />
                ) : (
                  <div className="trending-product-placeholder">
                    <Package size={24} />
                  </div>
                )}
                <div className="trending-product-info">
                  <strong>{product.name || product.title || 'Product'}</strong>
                  <span>{money(Number(product.price || product.salePrice || 0))}</span>
                  {product.category?.name || product.category ? (
                    <small>{product.category?.name || product.category}</small>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Sparkles size={22} />
            <strong>No trending products yet</strong>
            <span>Trending products will appear when the API provides trendingProducts.</span>
          </div>
        )}
      </section>

      {/* Recent orders */}
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">THE LATEST</p>
            <h2>Recent orders</h2>
          </div>

          <Link className="subtle-link" to="/orders">
            View all
            <ArrowRight size={15} />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th className="align-right">TOTAL</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link className="order-link" to="/orders">
                        {order.orderNumber || 'Order'}
                      </Link>
                    </td>

                    <td>
                      <strong className="table-primary">
                        {order.customer?.name || 'Guest customer'}
                      </strong>
                      <small className="table-secondary">
                        {order.customer?.email || 'No email'}
                      </small>
                    </td>

                    <td>
                      {order.createdAt
                        ? shortDate(order.createdAt)
                        : '—'}
                    </td>

                    <td>
                      <StatusBadge value={order.status || 'pending'} />
                    </td>

                    <td className="align-right table-primary">
                      {money(Number(order.total || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ShoppingCart size={22} />
            <strong>No orders yet</strong>
            <span>New orders will appear here.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function Snapshot({
  icon: Icon,
  label,
  value,
  detail,
  highlight = false,
}) {
  return (
    <div className="snapshot-row">
      <span
        className={`snapshot-row-icon ${
          highlight ? 'snapshot-attention' : ''
        }`}
      >
        <Icon size={16} />
      </span>

      <span className="snapshot-row-copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>

      <b>{Number(value || 0).toLocaleString()}</b>
    </div>
  );
}

function StatusBadge({ value }) {
  const status = String(value || 'pending').toLowerCase();

  return (
    <span className={`status-badge status-${status}`}>
      {status}
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <span>{money(Number(point.revenue || 0))} revenue</span>
      <span>{Number(point.orders || 0)} orders</span>
    </div>
  );
}