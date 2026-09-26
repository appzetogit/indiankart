import React, { useCallback, useEffect, useState } from 'react';
import { MdSearch, MdFilterList, MdCheckCircle, MdCancel, MdStar, MdRateReview, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import toast from 'react-hot-toast';
import API from '../../../../services/api';
import AdminTable, { AdminTableHead, AdminTableHeaderCell, AdminTableHeaderRow } from '../../components/common/AdminTable';
import { matchesNormalizedSearch } from '../../utils/search';

// Reviews of the overall store experience, from the one-time popup customers
// see on the home page. Product reviews live in the other tab.

const PLACEHOLDER_NAMES = new Set(['', 'new user', 'test user']);
const displayName = (review) => {
    const candidates = [review.user?.name, review.name];
    const real = candidates.find((n) => !PLACEHOLDER_NAMES.has(String(n || '').trim().toLowerCase()));
    return real ? String(real).trim() : 'Customer';
};

const statusStyle = (status) => {
    switch (status) {
        case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'approved': return 'bg-green-50 text-green-600 border-green-100';
        case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
        default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
};

const StatCard = ({ label, children, hint }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">{label}</p>
        <div className="mt-1">{children}</div>
        {hint ? <p className="mt-1 text-[11px] text-gray-400 font-medium">{hint}</p> : null}
    </div>
);

const StoreReviewsPanel = () => {
    const [data, setData] = useState({ reviews: [], stats: null, page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (ratingFilter !== 'all') params.rating = ratingFilter;
            const { data: response } = await API.get('/store-reviews', { params });
            setData(response);
        } catch (error) {
            console.error('Error fetching store reviews:', error);
            toast.error('Failed to load store reviews');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, ratingFilter]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const updateStatus = async (id, status) => {
        try {
            setUpdatingId(id);
            await API.patch(`/store-reviews/${id}/status`, { status });
            setData((prev) => ({
                ...prev,
                reviews: prev.reviews.map((r) => (r._id === id ? { ...r, status } : r)),
                stats: prev.stats && {
                    ...prev.stats,
                    pending: prev.stats.pending
                        + (status === 'pending' ? 1 : 0)
                        - (prev.reviews.find((r) => r._id === id)?.status === 'pending' ? 1 : 0)
                }
            }));
        } catch (error) {
            console.error('Error updating store review:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const stats = data.stats;
    const maxBucket = stats ? Math.max(1, ...Object.values(stats.distribution)) : 1;
    const visible = data.reviews.filter((r) =>
        !searchTerm
        || matchesNormalizedSearch(displayName(r), searchTerm)
        || matchesNormalizedSearch(r.phone || r.user?.phone, searchTerm)
        || matchesNormalizedSearch(r.comment, searchTerm));

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Average rating" hint={stats ? `${stats.count} review${stats.count === 1 ? '' : 's'}` : null}>
                    <div className="flex items-center gap-1.5">
                        <span className="text-3xl font-black text-gray-900">{stats?.count ? stats.average.toFixed(1) : '-'}</span>
                        <MdStar className="text-amber-400" size={26} />
                    </div>
                </StatCard>
                <StatCard label="Ratings">
                    <div className="space-y-1 mt-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const n = stats?.distribution?.[star] || 0;
                            return (
                                <div key={star} className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                                    <span className="w-3">{star}</span>
                                    <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${(n / maxBucket) * 100}%` }} />
                                    </div>
                                    <span className="w-6 text-right">{n}</span>
                                </div>
                            );
                        })}
                    </div>
                </StatCard>
                <StatCard label="Awaiting approval" hint="Pending until an admin approves or rejects">
                    <span className="text-3xl font-black text-amber-600">{stats?.pending ?? '-'}</span>
                </StatCard>
                <StatCard label="Declined to review" hint="Closed the popup - they won't be asked again">
                    <span className="text-3xl font-black text-gray-900">{stats?.dismissed ?? '-'}</span>
                </StatCard>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search customer, phone, or comment..."
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-900 font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <MdFilterList className="text-gray-400" size={20} />
                    <select
                        className="px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-blue-500 text-sm font-black text-gray-900 min-w-[130px] appearance-none"
                        value={ratingFilter}
                        onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
                    >
                        <option value="all">All Ratings</option>
                        {[5, 4, 3, 2, 1].map((star) => <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>)}
                    </select>
                    <select
                        className="px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-blue-500 text-sm font-black text-gray-900 min-w-[130px] appearance-none"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <AdminTable shellClassName="border-gray-100">
                <AdminTableHead>
                    <AdminTableHeaderRow>
                        <AdminTableHeaderCell>Customer</AdminTableHeaderCell>
                        <AdminTableHeaderCell>Rating</AdminTableHeaderCell>
                        <AdminTableHeaderCell>Comment</AdminTableHeaderCell>
                        <AdminTableHeaderCell>Status</AdminTableHeaderCell>
                        <AdminTableHeaderCell className="text-center">Actions</AdminTableHeaderCell>
                    </AdminTableHeaderRow>
                </AdminTableHead>
                <tbody className="divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading store reviews...</td>
                        </tr>
                    ) : visible.length > 0 ? (
                        visible.map((rev) => (
                            <tr key={rev._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3">
                                    <p className="text-sm font-bold text-gray-900">{displayName(rev)}</p>
                                    <p className="text-[11px] text-gray-500">{rev.phone || rev.user?.phone || rev.user?.email || '-'}</p>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg w-fit border border-amber-100">
                                        <span className="text-sm font-black">{rev.rating}</span>
                                        <MdStar size={16} />
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    {rev.comment
                                        ? <p className="text-sm text-gray-600 font-medium max-w-md line-clamp-3">{rev.comment}</p>
                                        : <p className="text-sm text-gray-300 italic">No comment</p>}
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(rev.createdAt).toLocaleString()}</p>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusStyle(rev.status)}`}>
                                        {rev.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        {rev.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(rev._id, 'approved')}
                                                    disabled={updatingId === rev._id}
                                                    className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100"
                                                    title="Approve"
                                                >
                                                    <MdCheckCircle size={20} />
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(rev._id, 'rejected')}
                                                    disabled={updatingId === rev._id}
                                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                                                    title="Reject"
                                                >
                                                    <MdCancel size={20} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => updateStatus(rev._id, 'pending')}
                                                disabled={updatingId === rev._id}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase hover:bg-gray-200 transition-all font-mono"
                                            >
                                                Reset to Pending
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <MdRateReview size={48} className="opacity-20" />
                                    <p className="font-medium italic">
                                        {stats?.count ? 'No store reviews match your filters' : 'No store reviews yet - they appear here as customers respond to the popup'}
                                    </p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </AdminTable>

            {data.pages > 1 && (
                <div className="flex items-center justify-end gap-3 text-sm font-bold text-gray-600">
                    <span>Page {data.page} of {data.pages}</span>
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={data.page <= 1 || loading}
                        className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm disabled:opacity-40"
                        aria-label="Previous page"
                    >
                        <MdChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                        disabled={data.page >= data.pages || loading}
                        className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm disabled:opacity-40"
                        aria-label="Next page"
                    >
                        <MdChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default StoreReviewsPanel;
