import React, { useState, useEffect } from 'react';
import { MdSearch, MdFilterList, MdVisibility, MdBlock, MdCheckCircle, MdMoreVert, MdChevronLeft, MdChevronRight, MdMail, MdPhone, MdShoppingBag } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import Pagination from '../../../../components/Pagination';
import API from '../../../../services/api';

const UserList = () => {
    const navigate = useNavigate();
    const { users, toggleUserStatus } = useUserStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Server-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const itemsPerPage = 12;

    const [localUsers, setLocalUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
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

        const timer = setTimeout(() => {
            fetchPaginatedUsers();
        }, 300);

        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, statusFilter]);

    const paginatedUsers = localUsers;

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getStatusStyle = (status) => {
        return status === 'active'
            ? 'bg-green-500/10 text-green-500 border-green-500/20'
            : 'bg-red-500/10 text-red-500 border-red-500/20';
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">User Directory</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium italic">Monitor and manage registered customer accounts</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-3 md:gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-900 font-bold"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
                    <select
                        className="flex-1 lg:flex-none px-4 py-2 md:px-6 md:py-3 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl outline-none focus:bg-white focus:border-blue-500 text-sm font-black text-gray-900 min-w-[120px] md:min-w-[150px]"
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
                <div className="bg-white md:rounded-2xl border-y md:border border-gray-200 shadow-sm">
                    <div className="overflow-x-auto overflow-y-visible" style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100vw' }}>
                        <table className="w-full min-w-max text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">User Details</th>
                                    <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Contact Info</th>
                                    <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Join Date</th>
                                    <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Orders</th>
                                    <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Status</th>
                                    <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-2 py-6 md:px-6 md:py-12 text-center text-gray-500 font-medium text-xs md:text-base">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map(user => (
                                        <tr key={user._id || user.id} className="hover:bg-blue-50/10 transition-colors group">
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <img src={user.avatar || 'https://www.w3schools.com/howto/img_avatar.png'} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-200" alt="" />
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-xs md:text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</h4>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-xs md:text-sm text-gray-600">
                                                <p className="flex items-center gap-1 md:gap-1.5 font-bold"><MdMail className="text-gray-400" /> {user.email}</p>
                                                <p className="flex items-center gap-1 md:gap-1.5 mt-0.5 md:mt-1 font-bold text-gray-400"><MdPhone className="text-gray-400" /> +91 {user.phone || 'N/A'}</p>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center text-xs md:text-sm font-bold text-gray-600">
                                                {new Date(user.joinedDate || user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
                                                <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-xs md:text-sm">
                                                    {user.orderStats?.total || 0}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 md:px-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border shadow-sm ${(user.status || 'active') === 'active'
                                                    ? 'bg-green-50 text-green-600 border-green-100'
                                                    : 'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                    {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 md:gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/users/${user._id || user.id}`)}
                                                        className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="View Profile"
                                                    >
                                                        <MdVisibility size={16} className="md:w-5 md:h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/orders?user=${user.email}`)}
                                                        className="p-1.5 md:p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                                        title="View Orders"
                                                    >
                                                        <MdShoppingBag size={16} className="md:w-5 md:h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const action = (user.status || 'active') === 'active' ? 'Disable' : 'Enable';
                                                            if (window.confirm(`Are you sure you want to ${action.toLowerCase()} account for ${user.name}?`)) {
                                                                toggleUserStatus(user._id || user.id);
                                                            }
                                                        }}
                                                        className={`p-1.5 md:p-2 rounded-lg transition-all ${(user.status || 'active') === 'active'
                                                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                            }`}
                                                        title={(user.status || 'active') === 'active' ? 'Disable Account' : 'Enable Account'}
                                                    >
                                                        {(user.status || 'active') === 'active' ? <MdBlock size={16} className="md:w-5 md:h-5" /> : <MdCheckCircle size={16} className="md:w-5 md:h-5" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

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
