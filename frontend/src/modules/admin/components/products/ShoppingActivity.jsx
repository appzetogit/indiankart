import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MdShoppingCart, MdClose, MdPhone, MdRefresh, MdFlashOn, MdFavorite, MdRemoveShoppingCart, MdPayment, MdVisibility, MdCheckCircle, MdEdit } from 'react-icons/md';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import toast from 'react-hot-toast';
import API from '../../../../services/api';

const EVENT_META = {
    view: { label: 'Viewed', icon: MdVisibility, tone: 'text-slate-600 bg-slate-100' },
    add_to_cart: { label: 'Added to cart', icon: MdShoppingCart, tone: 'text-blue-700 bg-blue-50' },
    remove_from_cart: { label: 'Removed from cart', icon: MdRemoveShoppingCart, tone: 'text-rose-700 bg-rose-50' },
    quantity_change: { label: 'Changed quantity', icon: MdEdit, tone: 'text-slate-700 bg-slate-100' },
    wishlist_add: { label: 'Wishlisted', icon: MdFavorite, tone: 'text-pink-700 bg-pink-50' },
    buy_now: { label: 'Clicked Buy Now', icon: MdFlashOn, tone: 'text-amber-700 bg-amber-50' },
    checkout_start: { label: 'Started checkout', icon: MdPayment, tone: 'text-indigo-700 bg-indigo-50' },
    order: { label: 'Ordered', icon: MdCheckCircle, tone: 'text-emerald-700 bg-emerald-50' }
};
const FUNNEL_LABELS = { view: 'Product views', add_to_cart: 'Added to cart', checkout_start: 'Started checkout', order: 'Ordered' };
const SORTS = [
    { key: 'view', label: 'Views' },
    { key: 'add_to_cart', label: 'Cart adds' },
    { key: 'order', label: 'Orders' },
    { key: 'cartRate', label: 'Cart rate' },
    { key: 'orderRate', label: 'Order rate' },
    { key: 'leaky', label: 'Carted, not ordered' }
];

const rupees = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
const timeAgo = (value) => {
    const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
    return `${Math.round(seconds / 86400)} d ago`;
};
const dateParams = (startDate, endDate) => ({
    ...(startDate ? { start: startDate } : {}),
    ...(endDate ? { end: endDate } : {})
});

const Card = ({ title, subtitle, actions, children }) => (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm min-w-0">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h3 className="text-lg font-black text-gray-900">{title}</h3>
                {subtitle ? <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-gray-400">{subtitle}</p> : null}
            </div>
            {actions}
        </div>
        {children}
    </div>
);

const ProductDrilldown = ({ productId, startDate, endDate, onClose }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        API.get(`/shop-events/product/${productId}`, { params: dateParams(startDate, endDate) })
            .then(({ data: result }) => { if (active) setData(result); })
            .catch(() => { if (active) setError('Could not load this product.'); });
        return () => { active = false; };
    }, [productId, startDate, endDate]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 p-3 backdrop-blur-sm" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-4 md:p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        {data?.image ? <img src={data.image} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-gray-100 object-contain" /> : null}
                        <div className="min-w-0">
                            <h3 className="text-base font-black text-gray-900 break-words">{data?.name || 'Loading…'}</h3>
                            <p className="text-xs font-semibold text-gray-400">Daily views, cart adds and orders</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><MdClose size={22} /></button>
                </div>
                {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                {data ? (
                    <div className="space-y-6">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => value.slice(5)} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Line type="monotone" dataKey="view" name="Views" stroke="#64748b" dot={false} strokeWidth={2} />
                                    <Line type="monotone" dataKey="add_to_cart" name="Cart adds" stroke="#2563eb" dot={false} strokeWidth={2} />
                                    <Line type="monotone" dataKey="order" name="Orders" stroke="#059669" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="min-w-0">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Top states</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead><tr className="text-left text-gray-400"><th className="py-1">State</th><th className="text-right">Views</th><th className="text-right">Cart</th><th className="text-right">Orders</th></tr></thead>
                                        <tbody>
                                            {data.states.length ? data.states.map((row) => (
                                                <tr key={row.state} className="border-t border-gray-50"><td className="py-1.5 font-bold text-gray-800">{row.state}</td><td className="text-right">{row.view}</td><td className="text-right">{row.add_to_cart}</td><td className="text-right">{row.order}</td></tr>
                                            )) : <tr><td colSpan="4" className="py-3 text-gray-400">No data yet</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Most chosen variants</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead><tr className="text-left text-gray-400"><th className="py-1">Variant</th><th className="text-right">Cart</th><th className="text-right">Buy Now</th><th className="text-right">Orders</th></tr></thead>
                                        <tbody>
                                            {data.variants.length ? data.variants.map((row) => (
                                                <tr key={row.variant} className="border-t border-gray-50"><td className="py-1.5 font-bold text-gray-800 break-words">{row.variant}</td><td className="text-right">{row.add_to_cart}</td><td className="text-right">{row.buy_now}</td><td className="text-right">{row.order}</td></tr>
                                            )) : <tr><td colSpan="4" className="py-3 text-gray-400">No data yet</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                {data.devices.length ? (
                                    <p className="mt-3 text-xs font-semibold text-gray-500">
                                        Views by device: {data.devices.map((entry) => `${entry.device} ${entry.count}`).join(' · ')}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const ShoppingActivity = ({ startDate, endDate }) => {
    const [insights, setInsights] = useState(null);
    const [abandoned, setAbandoned] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sortKey, setSortKey] = useState('view');
    const [productSearch, setProductSearch] = useState('');
    const [activityType, setActivityType] = useState('all');
    const [activityState, setActivityState] = useState('all');
    const [drilldownId, setDrilldownId] = useState(null);
    const [revealed, setRevealed] = useState({});
    const [expandedCart, setExpandedCart] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [insightsResponse, abandonedResponse] = await Promise.all([
                API.get('/shop-events/insights', { params: dateParams(startDate, endDate) }),
                API.get('/shop-events/abandoned-carts')
            ]);
            setInsights(insightsResponse.data);
            setAbandoned(abandonedResponse.data);
        } catch {
            setError('Could not load shopping activity.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => { load(); }, [load]);

    const productRows = useMemo(() => {
        const rows = (insights?.products || []).filter((row) => (
            !productSearch || String(row.name).toLowerCase().includes(productSearch.toLowerCase())
        ));
        const value = (row) => (sortKey === 'leaky' ? row.add_to_cart - row.order : row[sortKey] || 0);
        return [...rows].sort((a, b) => value(b) - value(a)).slice(0, 100);
    }, [insights, productSearch, sortKey]);

    const activityStates = useMemo(() => (
        [...new Set((insights?.activity || []).map((event) => event.state).filter(Boolean))].sort()
    ), [insights]);
    const activity = useMemo(() => (insights?.activity || []).filter((event) => (
        (activityType === 'all' || event.type === activityType)
        && (activityState === 'all' || event.state === activityState)
    )), [insights, activityType, activityState]);

    const revealPhone = async (userId) => {
        try {
            const { data } = await API.get(`/shop-events/abandoned-carts/${userId}/phone`);
            setRevealed((prev) => ({ ...prev, [userId]: data.phone }));
        } catch (requestError) {
            toast.error(requestError?.response?.data?.message || 'Could not load phone number');
        }
    };

    const trackingSince = insights?.trackingSince ? new Date(insights.trackingSince) : null;
    const funnelMax = Math.max(1, ...(insights?.funnel || []).map((step) => step.count));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 rounded-3xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-base font-black text-gray-900">Shopping Activity</h2>
                    <p className="text-xs font-semibold text-gray-600">
                        What visitors do with each product: views, cart, Buy Now, checkout and orders.
                        {trackingSince ? ` Recorded since ${trackingSince.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}; kept ${insights.retentionDays} days.` : ' Recording starts now.'}
                    </p>
                </div>
                <button type="button" onClick={load} disabled={loading} className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-blue-700 shadow-sm disabled:opacity-50">
                    <MdRefresh size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>
            {error ? <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

            <Card title="Shopping Funnel" subtitle="Real actions in the selected dates, from product view to order">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {(insights?.funnel || []).map((step, index) => (
                        <div key={step.type} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Step {index + 1}</p>
                            <p className="mt-1 text-sm font-black text-gray-700">{FUNNEL_LABELS[step.type]}</p>
                            <p className="mt-1 text-2xl font-black text-gray-900">{step.count.toLocaleString('en-IN')}</p>
                            <div className="mt-2 h-1.5 rounded-full bg-gray-200"><div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(step.count / funnelMax) * 100}%` }} /></div>
                            {index > 0 ? <p className="mt-2 text-xs font-bold text-gray-500">{step.fromPrevious}% of previous step · {step.fromViews}% of views</p> : null}
                        </div>
                    ))}
                </div>
                {insights ? (
                    <p className="mt-3 text-xs font-semibold text-gray-500">
                        Also: {insights.totals?.buy_now?.events || 0} Buy Now clicks · {insights.totals?.wishlist_add?.events || 0} wishlist adds · {insights.totals?.remove_from_cart?.events || 0} removed from cart
                    </p>
                ) : null}
            </Card>

            <Card
                title="Products: Views to Orders"
                subtitle="Click a product for its daily trend, states and variants"
                actions={(
                    <div className="flex flex-wrap gap-2">
                        <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search product" className="w-40 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400" />
                        <select value={sortKey} onChange={(event) => setSortKey(event.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold outline-none">
                            {SORTS.map((sort) => <option key={sort.key} value={sort.key}>Sort: {sort.label}</option>)}
                        </select>
                    </div>
                )}
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="py-2 pr-2">Product</th>
                                <th className="px-2 text-right">Views</th>
                                <th className="px-2 text-right">Cart adds</th>
                                <th className="px-2 text-right">Buy Now</th>
                                <th className="px-2 text-right">Checkout</th>
                                <th className="px-2 text-right">Orders</th>
                                <th className="px-2 text-right">Cart rate</th>
                                <th className="px-2 text-right">Order rate</th>
                                <th className="pl-2 text-right">Order value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productRows.length ? productRows.map((row) => (
                                <tr key={row.productId} onClick={() => setDrilldownId(row.productId)} className="cursor-pointer border-b border-gray-50 hover:bg-blue-50/40">
                                    <td className="py-2 pr-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            {row.image ? <img src={row.image} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-gray-100 object-contain" /> : <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-100" />}
                                            <span className="line-clamp-2 text-xs font-bold text-gray-800">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 text-right font-bold">{row.view}</td>
                                    <td className="px-2 text-right font-bold text-blue-700">{row.add_to_cart}</td>
                                    <td className="px-2 text-right">{row.buy_now}</td>
                                    <td className="px-2 text-right">{row.checkout_start}</td>
                                    <td className="px-2 text-right font-bold text-emerald-700">{row.order}</td>
                                    <td className="px-2 text-right">{row.cartRate}%</td>
                                    <td className="px-2 text-right">{row.orderRate}%</td>
                                    <td className="pl-2 text-right font-bold">{rupees(row.orderValue)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="9" className="py-8 text-center text-sm text-gray-400">{loading ? 'Loading…' : 'No shopping activity in these dates yet.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card
                    title="Live Activity"
                    subtitle="Latest 150 shopping actions"
                    actions={(
                        <div className="flex flex-wrap gap-2">
                            <select value={activityType} onChange={(event) => setActivityType(event.target.value)} className="rounded-xl border border-gray-200 px-2 py-2 text-xs font-bold outline-none">
                                <option value="all">All actions</option>
                                {Object.entries(EVENT_META).filter(([key]) => key !== 'view').map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                            </select>
                            <select value={activityState} onChange={(event) => setActivityState(event.target.value)} className="rounded-xl border border-gray-200 px-2 py-2 text-xs font-bold outline-none">
                                <option value="all">All states</option>
                                {activityStates.map((state) => <option key={state} value={state}>{state}</option>)}
                            </select>
                        </div>
                    )}
                >
                    <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                        {activity.length ? activity.map((event) => {
                            const meta = EVENT_META[event.type] || EVENT_META.view;
                            const Icon = meta.icon;
                            return (
                                <button type="button" key={event.id} onClick={() => setDrilldownId(event.productId)} className="flex w-full items-start gap-3 rounded-2xl border border-gray-100 p-3 text-left hover:bg-gray-50">
                                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}><Icon size={16} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-bold text-gray-900 break-words">
                                            {event.isGuest ? 'Guest' : event.customer || 'Customer'} · {meta.label}
                                            {event.quantity > 1 ? ` ×${event.quantity}` : ''}
                                        </span>
                                        <span className="block text-xs font-semibold text-gray-600 break-words">{event.productName}{event.variant ? ` (${event.variant})` : ''}{event.price ? ` · ${rupees(event.price)}` : ''}</span>
                                        <span className="block text-[11px] font-semibold text-gray-400">{event.state} · {event.device} · {timeAgo(event.createdAt)}</span>
                                    </span>
                                </button>
                            );
                        }) : <p className="py-8 text-center text-sm text-gray-400">{loading ? 'Loading…' : 'No activity yet.'}</p>}
                    </div>
                </Card>

                <Card
                    title="Abandoned Carts"
                    subtitle={`Logged-in customers with items in the cart ${abandoned?.abandonedAfterHours || 24}h+ and no order since`}
                >
                    <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                        {(abandoned?.carts || []).length ? abandoned.carts.map((cart) => (
                            <div key={cart.userId} className="rounded-2xl border border-gray-100 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900">{cart.customer}</p>
                                        <p className="text-xs font-semibold text-gray-500">
                                            {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'} · {rupees(cart.value)} · last activity {timeAgo(cart.lastActivityAt)}
                                        </p>
                                    </div>
                                    {cart.hasPhone ? (
                                        revealed[cart.userId] ? (
                                            <span className="select-all rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">{revealed[cart.userId]}</span>
                                        ) : (
                                            <button type="button" onClick={() => revealPhone(cart.userId)} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">
                                                <MdPhone size={14} /> {cart.phone} · Show
                                            </button>
                                        )
                                    ) : null}
                                </div>
                                <button type="button" onClick={() => setExpandedCart(expandedCart === cart.userId ? null : cart.userId)} className="mt-2 text-[11px] font-black uppercase tracking-widest text-blue-600">
                                    {expandedCart === cart.userId ? 'Hide items' : 'Show items'}
                                </button>
                                {expandedCart === cart.userId ? (
                                    <div className="mt-2 space-y-2">
                                        {cart.items.map((item, index) => (
                                            <div key={`${item.productId}-${index}`} className="flex items-center gap-2">
                                                {item.image ? <img src={item.image} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-gray-100 object-contain" /> : <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-100" />}
                                                <span className="min-w-0 flex-1 text-xs font-semibold text-gray-700 break-words">
                                                    {item.name}{item.variant ? ` (${item.variant})` : ''} ×{item.quantity}
                                                    {item.addedAt ? <span className="text-gray-400"> · added {timeAgo(item.addedAt)}</span> : null}
                                                </span>
                                                <span className="text-xs font-bold text-gray-900">{rupees(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        )) : <p className="py-8 text-center text-sm text-gray-400">{loading ? 'Loading…' : 'No abandoned carts.'}</p>}
                    </div>
                </Card>
            </div>

            {drilldownId !== null ? (
                <ProductDrilldown productId={drilldownId} startDate={startDate} endDate={endDate} onClose={() => setDrilldownId(null)} />
            ) : null}
        </div>
    );
};

export default ShoppingActivity;
