import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdToggleOn,
    MdToggleOff,
    MdFilterList,
    MdSearch,
    MdLabel
} from 'react-icons/md';
import toast from 'react-hot-toast';
import useOfferStore from '../../store/offerStore';
import { confirmToast } from '../../../../utils/toastUtils.jsx';

const OfferList = () => {
    const navigate = useNavigate();
    const { offers, fetchOffers, deleteOffer, toggleOfferStatus, isLoading } = useOfferStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [applicableToFilter, setApplicableToFilter] = useState('all');

    useEffect(() => {
        fetchOffers();
    }, []);

    const filteredOffers = offers.filter((offer) => {
        const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && offer.isActive) ||
            (statusFilter === 'inactive' && !offer.isActive);
        const matchesType = applicableToFilter === 'all' || offer.applicableTo === applicableToFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const handleDelete = async (id) => {
        confirmToast({
            message: 'Are you sure you want to delete this offer?',
            type: 'danger',
            icon: 'delete_forever',
            confirmText: 'Delete Offer',
            onConfirm: async () => {
                try {
                    await deleteOffer(id);
                } catch (error) {
                    toast.error('Failed to delete offer');
                }
            }
        });
    };

    const handleToggleStatus = async (id) => {
        try {
            await toggleOfferStatus(id);
        } catch (error) {
            toast.error('Failed to toggle offer status');
        }
    };

    const getDiscountDisplay = (offer) => {
        if (offer.discountType === 'percentage') {
            return `${offer.discountValue}% OFF`;
        }
        return `₹${offer.discountValue} OFF`;
    };

    const getStatusBadge = (isActive) => {
        return isActive ? (
            <span className="px-3 py-1 text-xs font-bold  bg-green-100 text-green-700  rounded-full">
                Active
            </span>
        ) : (
            <span className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-full">
                Inactive
            </span>
        );
    };

    const getApplicableToBadge = (type) => {
        const colors = {
            product: 'bg-blue-100 text-blue-700',
            category: 'bg-purple-100 text-purple-700',
            subcategory: 'bg-orange-100 text-orange-700'
        };

        return (
            <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${colors[type]}`}>
                {type}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Offers Management</h1>
                    <p className="text-sm text-gray-500 font-medium italic">
                        Create and manage promotional offers ({filteredOffers.length} offers)
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/offers/add')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                    <MdAdd size={20} />
                    Add New Offer
                </button>
            </div>

            {/* Filters */}
            {/* Filters */}
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search offers by title..."
                        className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 caret-blue-600 shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                    <MdFilterList className="text-gray-400" size={20} />
                    <select
                        className="px-4 py-2 md:px-6 md:py-3 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl outline-none focus:bg-white focus:border-blue-500 text-sm font-bold text-gray-900 min-w-[140px] appearance-none shadow-sm cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <select
                        className="px-4 py-2 md:px-6 md:py-3 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl outline-none focus:bg-white focus:border-blue-500 text-sm font-bold text-gray-900 min-w-[160px] appearance-none shadow-sm cursor-pointer"
                        value={applicableToFilter}
                        onChange={(e) => setApplicableToFilter(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="product">Product</option>
                        <option value="category">Category</option>
                        <option value="subcategory">Subcategory</option>
                    </select>
                </div>
            </div>

            {/* Offers Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredOffers.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <MdLabel size={32} />
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                        No offers found
                    </p>
                </div>
            ) : (
                <div className="relative md:mx-0">
                    <div className="bg-white md:rounded-2xl border-y md:border border-gray-200 shadow-sm">
                        <div className="overflow-x-auto overflow-y-visible" style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100vw' }}>
                            <table className="w-full min-w-max text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Title</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Discount</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Type</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Duration</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Status</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredOffers.map((offer) => (
                                        <tr key={offer._id} className="hover:bg-blue-50/10 transition-colors group">
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {offer.title}
                                                    </span>
                                                    {offer.description && (
                                                        <span className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                                                            {offer.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
                                                <span className="text-xs font-black text-green-600">
                                                    {getDiscountDisplay(offer)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
                                                {getApplicableToBadge(offer.applicableTo)}
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
                                                <div className="flex flex-col text-[10px] text-gray-600">
                                                    <span className="font-bold">
                                                        {new Date(offer.startDate).toLocaleDateString('en-IN')}
                                                    </span>
                                                    <span className="text-gray-400">to</span>
                                                    <span className="font-bold">
                                                        {new Date(offer.endDate).toLocaleDateString('en-IN')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
                                                {getStatusBadge(offer.isActive)}
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 md:gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(offer._id)}
                                                        className={`p-1.5 md:p-2 rounded-lg border transition-all ${offer.isActive
                                                            ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                                            }`}
                                                        title={offer.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {offer.isActive ? <MdToggleOn size={16} className="md:w-[20px] md:h-[20px]" /> : <MdToggleOff size={16} className="md:w-[20px] md:h-[20px]" />}
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/offers/edit/${offer._id}`)}
                                                        className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all"
                                                        title="Edit"
                                                    >
                                                        <MdEdit size={16} className="md:w-[20px] md:h-[20px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(offer._id)}
                                                        className="p-1.5 md:p-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-all"
                                                        title="Delete"
                                                    >
                                                        <MdDelete size={16} className="md:w-[20px] md:h-[20px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferList;
