import React, { useState, useEffect } from 'react';
import { MdClose, MdCloudUpload, MdVideoLibrary } from 'react-icons/md';
import toast from 'react-hot-toast';
import usePlayStore from '../../store/playStore';

const PlayForm = ({ reel, onClose }) => {
    const { addReel, updateReel } = usePlayStore();

    const [formData, setFormData] = useState({
        caption: '',
        videoUrl: '',
        thumbnailUrl: '', // In a real app, you'd generate this from video
        productId: '',
        productName: '',
        active: true,
        file: null
    });

    // Mock products for linking
    const productOptions = [
        { id: '101', name: 'Neon T-Shirt' },
        { id: '102', name: 'Floral Dress' },
        { id: '103', name: 'Nike Air Jordan' },
        { id: '104', name: 'Sony Headphones' },
        { id: '105', name: 'OnePlus 11R' },
    ];

    useEffect(() => {
        if (reel) {
            setFormData({ ...reel, file: null });
        }
    }, [reel]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.videoUrl && !formData.file) {
            toast.error('Please upload a video');
            return;
        }

        const data = new FormData();
        data.append('productLink', formData.productLink || '');
        data.append('active', formData.active);
        
        if (formData.file) {
            data.append('video', formData.file);
        } else {
            data.append('videoUrl', formData.videoUrl);
        }

        if (reel) {
            updateReel(reel.id, data);
        } else {
            addReel(data);
        }
        onClose();
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                videoUrl: url,
                file: file,
                thumbnailUrl: 'https://via.placeholder.com/150/000000/FFFFFF/?text=Video' // Placeholder for thumbnail
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">
                        {reel ? 'Edit Reel' : 'Upload New Reel'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
                        <MdClose size={24} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Video Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Video File</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative bg-gray-50">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept="video/*"
                                onChange={handleVideoChange}
                            />
                            {formData.videoUrl ? (
                                <div className="space-y-2">
                                    <video
                                        src={formData.videoUrl}
                                        className="h-32 w-full object-cover rounded-lg bg-black"
                                        controls
                                    />
                                    <p className="text-xs text-green-600 font-medium">Video selected successfully</p>
                                </div>
                            ) : (
                                <div className="py-4 text-gray-400">
                                    <MdVideoLibrary size={40} className="mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm font-medium">Click to upload video</p>
                                    <p className="text-xs mt-1">MP4, WebM (Max 30mb)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product URL */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Product/Page URL</label>
                        <input
                            type="text"
                            value={formData.productLink || ''}
                            onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-pink-500"
                            placeholder="e.g., /product/123 or https://..."
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Link where user will be redirected on clicking "View Product"
                        </p>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <input
                            type="checkbox"
                            id="active"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-5 h-5 text-pink-600 rounded focus:ring-offset-0"
                        />
                        <label htmlFor="active" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                            Make Reel Active Immediately
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition transform hover:-translate-y-0.5"
                    >
                        {reel ? 'Update Reel' : 'Upload Reel'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default PlayForm;
