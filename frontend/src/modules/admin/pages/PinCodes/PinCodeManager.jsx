import React, { useState, useEffect } from 'react';
import { MdLocationOn, MdDelete, MdAdd, MdTimer, MdUpload, MdDownload } from 'react-icons/md';
import usePinCodeStore from '../../store/pinCodeStore';

const PinCodeManager = () => {
    const { pinCodes, fetchPinCodes, addPinCode, deletePinCode, bulkImportPinCodes, updatePinCode, isLoading } = usePinCodeStore();
    const [formData, setFormData] = useState({
        code: '',
        deliveryTime: '',
        unit: 'days',
        isCOD: false
    });
    const [importResults, setImportResults] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    // Toggle COD status for a pincode
    const toggleCOD = async (id, currentStatus) => {
        await updatePinCode(id, { isCOD: !currentStatus });
    };

    useEffect(() => {
        fetchPinCodes();
    }, [fetchPinCodes]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await addPinCode(formData);
        if (success) {
            setFormData({ code: '', deliveryTime: '', unit: 'days', isCOD: false });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setImportResults(null);

        const result = await bulkImportPinCodes(file);
        setImportResults(result);
        setIsImporting(false);

        // Reset file input
        e.target.value = '';
    };

    const downloadTemplate = () => {
        const csvContent = "Pincode,DeliveryTime,Unit\n110001,2,days\n400001,3,days\n560001,4,days";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pincode_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-2 md:space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-6">
                <div className="p-2 md:p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <MdLocationOn size={28} className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                    <h1 className="text-lg md:text-2xl font-bold text-gray-800">Delivery PIN Codes</h1>
                    <p className="text-gray-500 text-sm">Manage serviceable areas and delivery estimates</p>
                </div>
            </div>

            {/* Add PIN Code Form */}
            <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MdAdd className="text-blue-500" /> Add New Serviceable Area
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-end">
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">PIN Code</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            placeholder="e.g. 110001"
                            className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none font-bold text-gray-700"
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Time</label>
                        <input
                            type="number"
                            name="deliveryTime"
                            value={formData.deliveryTime}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="e.g. 2"
                            className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none font-bold text-gray-700"
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unit</label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none text-gray-700 font-medium"
                        >
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                            <option value="minutes">Minutes</option>
                        </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">COD Available</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isCOD"
                                checked={formData.isCOD}
                                onChange={(e) => setFormData(prev => ({ ...prev, isCOD: e.target.checked }))}
                                className="w-5 h-5 accent-blue-600 rounded"
                            />
                            <span className="text-sm font-bold text-gray-700">{formData.isCOD ? 'Yes' : 'No'}</span>
                        </label>
                    </div>
                    <div className="md:col-span-4 mt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2 md:py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Adding...' : 'Add PIN Code'}
                        </button>
                    </div>
                </form>

                {/* Import Results */}
                {importResults && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h3 className="font-bold text-blue-900 mb-2">Import Summary</h3>
                        <div className="text-sm space-y-1">
                            <p className="text-gray-700"><span className="font-bold">Total Rows:</span> {importResults.total}</p>
                            <p className="text-green-700"><span className="font-bold">Successful:</span> {importResults.successful}</p>
                            <p className="text-yellow-700"><span className="font-bold">Skipped (Duplicates):</span> {importResults.skipped}</p>
                            {importResults.errors && importResults.errors.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-red-700 font-bold">Errors:</p>
                                    <ul className="list-disc list-inside text-red-600 text-xs">
                                        {importResults.errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Import Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 md:p-6 rounded-2xl shadow-sm border border-purple-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MdUpload className="text-purple-500" /> Bulk Import from Excel
                </h2>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Upload an Excel file (.xlsx, .xls) with columns: <span className="font-mono font-bold">Pincode, DeliveryTime, Unit</span></p>
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 cursor-pointer">
                            <MdUpload size={20} />
                            {isImporting ? 'Importing...' : 'Choose Excel File'}
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                                disabled={isImporting}
                                className="hidden"
                            />
                        </label>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="px-4 py-2.5 bg-white text-purple-600 border border-purple-300 font-bold rounded-xl hover:bg-purple-50 transition flex items-center gap-2"
                    >
                        <MdDownload size={18} />
                        Download Template
                    </button>
                </div>
            </div>

            {/* List of PIN Codes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-2 md:p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Serviceable Locations ({pinCodes.length})</h3>
                </div>

                {pinCodes.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <MdLocationOn className="mx-auto mb-3 opacity-20" size={48} />
                        <p>No PIN codes added yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {pinCodes.map((pin) => (
                            <div key={pin._id} className="p-2 md:p-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors group">
                                <div className="flex items-center gap-2 md:gap-6">
                                    <span className="text-sm md:text-lg font-black text-gray-800 font-mono tracking-wider">{pin.code}</span>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-green-50 text-green-700 text-[10px] md:text-xs font-bold border border-green-100">
                                        <MdTimer className="text-green-500" />
                                        {pin.deliveryTime} {pin.unit}
                                    </div>
                                    <button
                                        onClick={() => toggleCOD(pin._id, pin.isCOD !== false)}
                                        className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full transition-all border shadow-sm active:scale-95 ${pin.isCOD !== false ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`}
                                        title="Click to Toggle COD"
                                    >
                                        <span className="material-icons text-[14px]">{pin.isCOD !== false ? 'payments' : 'money_off'}</span>
                                        <span className="text-xs font-bold">{pin.isCOD !== false ? 'COD ON' : 'COD OFF'}</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => deletePinCode(pin._id)}
                                    className="p-1 md:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remove PIN Code"
                                >
                                    <MdDelete size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PinCodeManager;
