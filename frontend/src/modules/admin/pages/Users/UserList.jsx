import React, { useState, useEffect } from 'react';
import { MdSearch, MdVisibility, MdBlock, MdCheckCircle, MdPhone } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import Pagination from '../../../../components/Pagination';
import API from '../../../../services/api';
import toast from 'react-hot-toast';
import AdminTable, { AdminTableHead, AdminTableHeaderCell, AdminTableHeaderRow } from '../../components/common/AdminTable';

const UserList = () => {
    const navigate = useNavigate();
    const { toggleUserStatus } = useUserStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Server-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const itemsPerPage = 20;

    const [localUsers, setLocalUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const fetchPaginatedUsers = async () => {
        setLoading(true);
        try {
            const params = {
                pageNumber: currentPage,
                limit: itemsPerPage
            };
            if (searchTerm) params.search = searchTerm;
            if (statusFilter !== 'All') params.status = statusFilter;

            const { data } = await API.get('/auth/users', { params });

            if (data.users) {
                setLocalUsers(data.users);
                setTotalPages(data.pages);
                setTotalUsers(data.total);
            } else {
                setLocalUsers(data);
                setTotalPages(1);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPaginatedUsers();
        }, 300);

        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, statusFilter]);

    const handleToggleStatus = async (user) => {
        const userId = user._id || user.id;
        if (!userId) return;
        const action = (user.status || 'active') === 'active' ? 'disable' : 'enable';

        if (!window.confirm(`Are you sure you want to ${action} account for ${user.name}?`)) {
            return;
        }

        setUpdatingUserId(String(userId));
        try {
            const result = await toggleUserStatus(userId);
            if (result?.status) {
                setLocalUsers((prev) =>
                    prev.map((u) =>
                        String(u._id || u.id) === String(userId)
                            ? { ...u, status: result.status }
                            : u
                    )
                );
            } else {
                await fetchPaginatedUsers();
            }
            toast.success(`User ${action}d successfully`);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update user status';
            toast.error(message);
        } finally {
            setUpdatingUserId(null);
        }
    };

    const paginatedUsers = localUsers;

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-5 md:space-y-7">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">User Directory</h1>
                    <p className="text-sm text-gray-500 font-medium">Monitor and manage registered customer accounts</p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Total Users</p>
                        <p className="mt-1 text-xl font-black text-gray-900">{totalUsers}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">Current Page</p>
                        <p className="mt-1 text-xl font-black text-blue-700">{currentPage}<span className="text-sm text-blue-400">/{totalPages}</span></p>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 md:p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-3 md:gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400 font-semibold"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
                    <select
                        className="flex-1 lg:flex-none px-4 py-3 md:px-5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 text-sm font-semibold text-gray-900 min-w-[130px] md:min-w-[170px]"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Disabled">Disabled</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="relative -mx-4 md:mx-0">
                <AdminTable shellClassName="md:rounded-3xl border-y md:border" tableClassName="w-full min-w-max text-left border-separate border-spacing-0">
                            <AdminTableHead>
                                <AdminTableHeaderRow>
                                    <AdminTableHeaderCell compact className="whitespace-nowrap tracking-[0.18em]">User Details</AdminTableHeaderCell>
                                    <AdminTableHeaderCell compact className="whitespace-nowrap tracking-[0.18em]">Contact Info</AdminTableHeaderCell>
                                    <AdminTableHeaderCell compact className="whitespace-nowrap tracking-[0.18em] text-center">Join Date</AdminTableHeaderCell>
                                    <AdminTableHeaderCell compact className="whitespace-nowrap tracking-[0.18em] text-center">Orders</AdminTableHeaderCell>
                                    <AdminTableHeaderCell compact className="whitespace-nowrap tracking-[0.18em] text-center">Status</AdminTableHeaderCell>
                                    <AdminTableHeaderCell compact className="whitespace-nowrap tracking-[0.18em] text-right">Actions</AdminTableHeaderCell>
                                </AdminTableHeaderRow>
                            </AdminTableHead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-12 md:px-6 text-center text-gray-500 font-medium text-sm">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map(user => (
                                        <tr key={user._id || user.id} className="group transition-colors hover:bg-blue-50/30">
                                            <td className="whitespace-nowrap px-3 py-3 md:px-5 md:py-4">
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-sm text-gray-900 group-hover:text-blue-700 transition-colors">{user.name || 'Unnamed User'}</h4>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 md:px-5 md:py-4 text-sm text-gray-600">
                                                <div className="space-y-2">
                                                    <p className="flex items-center gap-2 font-semibold text-gray-900">
                                                        <MdPhone className="text-gray-400" />
                                                        <span>{user.phone ? `+91 ${user.phone}` : 'N/A'}</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 md:px-5 md:py-4 text-center text-sm font-semibold text-gray-600">
                                                {new Date(user.joinedDate || user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 md:px-5 md:py-4 text-center">
                                                <span className="inline-flex min-w-[42px] items-center justify-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-black text-sm border border-blue-100">
                                                    {user.orderStats?.total || 0}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 md:px-5 md:py-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-[0.16em] border shadow-sm ${(user.status || 'active') === 'active'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 md:px-5 md:py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/users/${user._id || user.id}`)}
                                                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                                        title="View Profile"
                                                    >
                                                        <MdVisibility size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={updatingUserId === String(user._id || user.id)}
                                                        className={`p-2.5 rounded-xl transition-all border border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${(user.status || 'active') === 'active'
                                                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                                                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-100'
                                                            }`}
                                                        title={(user.status || 'active') === 'active' ? 'Disable Account' : 'Enable Account'}
                                                    >
                                                        {(user.status || 'active') === 'active' ? <MdBlock size={18} /> : <MdCheckCircle size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                </AdminTable>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination
                        page={currentPage}
                        pages={totalPages}
                        changePage={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
};

export default UserList;
