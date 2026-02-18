import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HelpCenter = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showContactForm, setShowContactForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
            setTimeout(() => {
                setIsSubmitted(false);
                setShowContactForm(false);
            }, 3000);
        }, 2000);
    };

    const categories = [
        { title: 'Orders', icon: 'local_shipping', desc: 'Tracking, cancellations & returns' },
        { title: 'Payments', icon: 'account_balance_wallet', desc: 'Refunds & failed transactions' },
        { title: 'Account', icon: 'person', desc: 'Login, security & profile' },
        { title: 'Flipkart Plus', icon: 'stars', desc: 'Benefits & coin management' }
    ];

    const [expandedFaq, setExpandedFaq] = useState(null);

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    const faqs = [
        {
            question: 'I want to track my order',
            answer: 'You can track your order by visiting the "My Orders" section. Select the specific order you want to track to see its current status and estimated delivery date.'
        },
        {
            question: 'How do I return my product?',
            answer: 'Go to "My Orders", select the item you wish to return, and click on the "Return" button. Follow the on-screen instructions to schedule a pickup.'
        },
        {
            question: 'I want to manage my address',
            answer: 'You can add, edit, or remove addresses from the "My Account" section under "Account Settings > Saved Addresses".'
        },
        {
            question: 'What is Flipkart Plus?',
            answer: 'Flipkart Plus is a loyalty program that offers benefits like free delivery, early access to sales, and the ability to earn SuperCoins on every purchase.'
        },
        {
            question: 'I want to change my phone number',
            answer: 'To change your phone number, go to "My Account" settings. Click on the edit icon next to your mobile number and verify via OTP.'
        }
    ];

    return (
        <div className="bg-[#f1f3f6] min-h-screen pb-10">
            {/* Mobile Header - Hidden on Desktop */}
            <div className="bg-blue-600 px-4 pt-4 pb-16 sticky top-0 z-10 md:hidden">
                <div className="flex items-center gap-4 text-white mb-6">
                    <button onClick={() => navigate(-1)} className="material-icons">arrow_back</button>
                    <h1 className="text-lg font-bold">Help Center</h1>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-md flex items-center px-4 py-3 shadow-lg">
                    <span className="material-icons text-gray-400 mr-3">search</span>
                    <input
                        type="text"
                        placeholder="Explain your problem here..."
                        className="flex-1 outline-none text-sm font-medium text-gray-900"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Desktop Header & Container */}
            <div className="md:max-w-4xl md:mx-auto md:pt-6 md:px-4">

                {/* Desktop Breadcrumbs */}
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 mb-6">
                    <span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-600">Home</span>
                    <span className="material-icons text-[10px]">chevron_right</span>
                    <span onClick={() => navigate('/account')} className="cursor-pointer hover:text-blue-600">My Account</span>
                    <span className="material-icons text-[10px]">chevron_right</span>
                    <span className="text-gray-800 font-bold">Help Center</span>
                </div>

                {/* Desktop Title & Search */}
                <div className="hidden md:flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Help Center</h1>
                        <p className="text-sm text-gray-500 mt-1">We are here to help you</p>
                    </div>
                    <div className="relative w-96">
                        <span className="material-icons absolute left-3 top-2.5 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Search for help topics..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-sm focus:border-blue-500 outline-none text-sm text-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="-mt-10 px-4 space-y-4 relative z-20 md:mt-0 md:px-0 md:space-y-6">
                    {/* Quick Help Grid */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-all cursor-pointer md:hover:shadow-md md:rounded-lg md:text-center md:py-6">
                                <span className="material-icons text-blue-600 mb-2 md:text-3xl md:mb-3">{cat.icon}</span>
                                <h3 className="font-bold text-sm text-gray-800 md:text-base">{cat.title}</h3>
                                <p className="text-[10px] text-gray-500 mt-1 leading-tight md:text-xs">{cat.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        {/* Popular Topics */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden md:col-span-2 md:rounded-lg">
                            <div className="p-4 border-b border-gray-50 md:p-5">
                                <h3 className="text-sm font-bold text-gray-800 md:text-base">Popular Topics</h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {faqs.map((faq, idx) => (
                                    <div key={idx} className="group border-b border-gray-50 last:border-0">
                                        <button
                                            onClick={() => toggleFaq(idx)}
                                            className="w-full text-left p-4 flex items-center justify-between active:bg-gray-50 md:hover:bg-gray-50 md:p-5 cursor-pointer outline-none"
                                        >
                                            <span className={`text-sm font-medium transition-colors md:text-sm ${expandedFaq === idx ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`}>
                                                {faq.question}
                                            </span>
                                            <span className={`material-icons text-gray-400 text-lg transition-transform duration-300 ${expandedFaq === idx ? 'rotate-180 text-blue-600' : ''}`}>
                                                expand_more
                                            </span>
                                        </button>

                                        {/* Accordion Content */}
                                        <div
                                            className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedFaq === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                            <div className="px-4 pb-4 md:px-5 md:pb-5 text-xs text-gray-500 leading-relaxed md:text-sm">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Banner */}
                        <div className="mt-4 md:mt-0">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white flex items-center justify-between shadow-blue-200 shadow-xl overflow-hidden relative md:flex-col md:items-start md:h-full md:justify-center md:rounded-lg md:text-left">
                                <div className="relative z-10">
                                    <h4 className="font-black text-lg md:text-xl">Still need help?</h4>
                                    <p className="text-blue-100 text-xs mt-1 md:text-sm md:mt-2">Chat with us or call our support team anytime.</p>
                                    <button
                                        onClick={() => setShowContactForm(true)}
                                        className="mt-4 bg-white text-blue-600 px-6 py-2 rounded-full font-bold text-xs uppercase shadow-lg shadow-black/10 active:scale-95 transition-all md:w-full md:mt-6 md:py-3"
                                    >
                                        Contact Support
                                    </button>
                                </div>
                                <span className="material-icons text-[80px] opacity-20 absolute -right-4 -bottom-4 z-0 md:text-[120px] md:-right-8 md:-bottom-8">support_agent</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Support Modal/Overlay */}
            {showContactForm && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setShowContactForm(false)}></div>

                    {/* Form Container */}
                    <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                        {isSubmitted ? (
                            <div className="p-10 text-center animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-icons text-4xl">check_circle</span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-800 mb-2">Request Received!</h2>
                                <p className="text-gray-500 text-sm">Our support team will contact you within 24 hours.</p>
                            </div>
                        ) : (
                            <>
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Support Request</h3>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Help ID: #RT{Math.floor(Math.random() * 9000) + 1000}</p>
                                    </div>
                                    <button onClick={() => setShowContactForm(false)} className="material-icons text-gray-400 hover:text-gray-600 transition-colors">close</button>
                                </div>

                                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Issue Category</label>
                                        <select required className="w-full border border-gray-200 p-3 rounded-lg text-sm bg-gray-50 focus:border-blue-500 outline-none appearance-none text-gray-900">
                                            <option value="">Select an option</option>
                                            <option>Order Delay</option>
                                            <option>Damaged Product</option>
                                            <option>Payment/Refund Issue</option>
                                            <option>Account Security</option>
                                            <option>Others</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                                            <input required type="text" placeholder="Your name" className="w-full border border-gray-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none shadow-sm text-gray-900" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mobile / Email</label>
                                            <input required type="text" placeholder="How should we reach you?" className="w-full border border-gray-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none shadow-sm text-gray-900" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Describe your problem</label>
                                        <textarea required rows="4" placeholder="Be as descriptive as possible..." className="w-full border border-gray-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none shadow-sm text-gray-900"></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full py-4 rounded-xl font-black uppercase text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#fb641b] text-white active:scale-95'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            'Submit Request'
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpCenter;
