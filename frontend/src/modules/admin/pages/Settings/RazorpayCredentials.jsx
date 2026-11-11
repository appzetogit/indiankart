import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import useSettingsStore from '../../store/settingsStore';

const DEFAULT_FORM = {
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayWebhookSecret: '',
    deliveryApi: '',
    delhiveryClientName: '',
    delhiveryPickupLocation: '',
    delhiveryToken: '',
    ekartBaseUrl: '',
    ekartTrackingBaseUrl: '',
    ekartClientId: '',
    ekartClientName: '',
    ekartPickupLocation: '',
    ekartUsername: '',
    ekartPassword: '',
    ekartApiKey: '',
    ekartCreateShipmentPath: '/api/v1/package/create',
    ekartTrackingPath: '/api/v1/track/{id}',
    ekartCancelPath: '/api/v1/package/cancel'
};

const SECTION_STYLES = {
    razorpay: {
        accent: 'from-slate-900 via-slate-800 to-slate-700',
        pill: 'bg-slate-100 text-slate-700',
        border: 'border-slate-200',
        focus: 'focus:ring-slate-500/20 focus:border-slate-500',
        soft: 'bg-slate-50'
    },
    delhivery: {
        accent: 'from-blue-700 via-blue-600 to-cyan-500',
        pill: 'bg-blue-100 text-blue-700',
        border: 'border-blue-200',
        focus: 'focus:ring-blue-500/20 focus:border-blue-500',
        soft: 'bg-blue-50'
    },
    ekart: {
        accent: 'from-emerald-700 via-emerald-600 to-lime-500',
        pill: 'bg-emerald-100 text-emerald-700',
        border: 'border-emerald-200',
        focus: 'focus:ring-emerald-500/20 focus:border-emerald-500',
        soft: 'bg-emerald-50'
    }
};

const InputField = ({ label, hint, section, ...props }) => {
    const styles = SECTION_STYLES[section];

    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                {label}
            </span>
            <input
                {...props}
                className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 ${styles.border} ${styles.focus}`}
            />
            {hint ? (
                <span className="mt-2 block text-xs leading-relaxed text-gray-500">{hint}</span>
            ) : null}
        </label>
    );
};

const SectionCard = ({ id, eyebrow, title, description, activeSection, setActiveSection, children }) => {
    const styles = SECTION_STYLES[id];
    const isActive = activeSection === id;

    return (
        <section
            id={id}
            className={`overflow-hidden rounded-[28px] border bg-white shadow-sm transition-all ${isActive ? `${styles.border} shadow-lg shadow-black/5` : 'border-gray-200'}`}
        >
            <button
                type="button"
                onClick={() => setActiveSection(id)}
                className={`w-full bg-gradient-to-r px-6 py-6 text-left text-white md:px-8 ${styles.accent}`}
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">{eyebrow}</div>
                        <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
                        <p className="mt-2 max-w-2xl text-sm font-medium text-white/80">{description}</p>
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
                        {isActive ? 'Editing now' : 'Open section'}
                    </div>
                </div>
            </button>
            <div className="p-6 md:p-8">
                {children}
            </div>
        </section>
    );
};

const EMPTY_EKART_WAREHOUSE = { name: '', address: '', city: '', state: '', pin: '', phone: '', gst: '' };
const toEkartWarehouses = (list) => (Array.isArray(list) ? list : []).map((warehouse) => ({
    name: warehouse?.name || '',
    address: warehouse?.address || '',
    city: warehouse?.city || '',
    state: warehouse?.state || '',
    pin: warehouse?.pin || '',
    phone: warehouse?.phone || '',
    gst: warehouse?.gst || ''
}));

const RazorpayCredentials = () => {
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('razorpay');
    const [form, setForm] = useState(DEFAULT_FORM);
    // Delhivery has no API to list registered warehouses, so they are kept here
    // and offered when a shipment is assigned. `name` must match Delhivery exactly.
    const [warehouses, setWarehouses] = useState([]);
    // Ekart pickup addresses, offered every time an order is shipped with Ekart.
    const [ekartWarehouses, setEkartWarehouses] = useState([]);
    const [codePrompt, setCodePrompt] = useState(null); // { mode: 'code' | 'setup', error }
    const [actionCode, setActionCode] = useState('');
    const settings = useSettingsStore((state) => state.settings);
    const loading = useSettingsStore((state) => state.isLoading);
    const fetchSettings = useSettingsStore((state) => state.fetchSettings);
    const updateSettings = useSettingsStore((state) => state.updateSettings);

    useEffect(() => {
        fetchSettings().catch((error) => {
            console.error('Failed to fetch API credentials:', error);
            toast.error('Failed to load API credentials');
        });
    }, [fetchSettings]);

    useEffect(() => {
        if (!settings) return;
        setForm({
            razorpayKeyId: settings?.razorpayKeyId || '',
            razorpayKeySecret: '',
            razorpayWebhookSecret: '',
            deliveryApi: settings?.deliveryApi || 'https://track.delhivery.com',
            delhiveryClientName: settings?.delhiveryClientName || '',
            delhiveryPickupLocation: settings?.delhiveryPickupLocation || '',
            delhiveryToken: '',
            ekartBaseUrl: settings?.ekartBaseUrl || '',
            ekartTrackingBaseUrl: settings?.ekartTrackingBaseUrl || '',
            ekartClientId: settings?.ekartClientId || '',
            ekartClientName: settings?.ekartClientName || '',
            ekartPickupLocation: settings?.ekartPickupLocation || '',
            ekartUsername: settings?.ekartUsername || '',
            ekartPassword: '',
            ekartApiKey: '',
            ekartCreateShipmentPath: settings?.ekartCreateShipmentPath || '/api/v1/package/create',
            ekartTrackingPath: settings?.ekartTrackingPath || '/api/v1/track/{id}',
            ekartCancelPath: settings?.ekartCancelPath || '/api/v1/package/cancel'
        });
        setWarehouses(
            Array.isArray(settings?.delhiveryWarehouses)
                ? settings.delhiveryWarehouses.map((warehouse) => ({
                    name: warehouse?.name || '',
                    address: warehouse?.address || '',
                    city: warehouse?.city || '',
                    state: warehouse?.state || '',
                    pin: warehouse?.pin || '',
                    phone: warehouse?.phone || ''
                }))
                : []
        );
        setEkartWarehouses(toEkartWarehouses(settings?.ekartWarehouses));
    }, [settings]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const updateWarehouse = (index, field, value) => {
        setWarehouses((prev) => prev.map((warehouse, i) => (
            i === index ? { ...warehouse, [field]: value } : warehouse
        )));
    };

    const addWarehouse = () => {
        setWarehouses((prev) => [...prev, { name: '', address: '', city: '', state: '', pin: '', phone: '' }]);
    };

    const removeWarehouse = (index) => {
        setWarehouses((prev) => prev.filter((_, i) => i !== index));
    };

    const updateEkartWarehouse = (index, field, value) => {
        setEkartWarehouses((prev) => prev.map((warehouse, i) => (
            i === index ? { ...warehouse, [field]: value } : warehouse
        )));
    };

    // Changing a payment or courier credential needs a fresh code from the
    // admin's authenticator app; the server asks for it (ACTION_CODE_REQUIRED)
    // and this prompt sends the save again with the code.
    const closeCodePrompt = () => {
        setCodePrompt(null);
        setActionCode('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveCredentials();
    };

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(actionCode.replace(/\s/g, ''))) {
            setCodePrompt({ mode: 'code', error: 'Enter the 6-digit code from your authenticator app.' });
            return;
        }
        saveCredentials(actionCode.replace(/\s/g, ''));
    };

    const saveCredentials = async (code) => {
        setSaving(true);

        try {
            const data = new FormData();
            data.append('razorpayKeyId', form.razorpayKeyId.trim());
            data.append('razorpayKeySecret', form.razorpayKeySecret);
            data.append('razorpayWebhookSecret', form.razorpayWebhookSecret);
            data.append('deliveryApi', form.deliveryApi.trim());
            data.append('delhiveryClientName', form.delhiveryClientName.trim());
            data.append('delhiveryPickupLocation', form.delhiveryPickupLocation.trim());
            data.append('delhiveryToken', form.delhiveryToken);
            data.append('delhiveryWarehouses', JSON.stringify(
                warehouses
                    .map((warehouse) => ({
                        name: String(warehouse.name || '').trim(),
                        address: String(warehouse.address || '').trim(),
                        city: String(warehouse.city || '').trim(),
                        state: String(warehouse.state || '').trim(),
                        pin: String(warehouse.pin || '').trim(),
                        phone: String(warehouse.phone || '').trim()
                    }))
                    .filter((warehouse) => warehouse.name)
            ));
            data.append('ekartBaseUrl', form.ekartBaseUrl.trim());
            data.append('ekartTrackingBaseUrl', form.ekartTrackingBaseUrl.trim());
            data.append('ekartClientId', form.ekartClientId.trim());
            data.append('ekartClientName', form.ekartClientName.trim());
            data.append('ekartPickupLocation', form.ekartPickupLocation.trim());
            data.append('ekartWarehouses', JSON.stringify(
                ekartWarehouses
                    .map((warehouse) => Object.fromEntries(
                        Object.keys(EMPTY_EKART_WAREHOUSE).map((key) => [key, String(warehouse[key] || '').trim()])
                    ))
                    .filter((warehouse) => warehouse.name)
            ));
            data.append('ekartUsername', form.ekartUsername.trim());
            data.append('ekartPassword', form.ekartPassword);
            data.append('ekartApiKey', form.ekartApiKey);
            data.append('ekartCreateShipmentPath', form.ekartCreateShipmentPath.trim());
            data.append('ekartTrackingPath', form.ekartTrackingPath.trim());
            data.append('ekartCancelPath', form.ekartCancelPath.trim());

            const res = await updateSettings(data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(code ? { 'X-Admin-Action-Code': code } : {})
                }
            });
            closeCodePrompt();

            setForm({
                razorpayKeyId: res?.razorpayKeyId || '',
                razorpayKeySecret: '',
                razorpayWebhookSecret: '',
                deliveryApi: res?.deliveryApi || 'https://track.delhivery.com',
                delhiveryClientName: res?.delhiveryClientName || '',
                delhiveryPickupLocation: res?.delhiveryPickupLocation || '',
                delhiveryToken: '',
                ekartBaseUrl: res?.ekartBaseUrl || '',
                ekartTrackingBaseUrl: res?.ekartTrackingBaseUrl || '',
                ekartClientId: res?.ekartClientId || '',
                ekartClientName: res?.ekartClientName || '',
                ekartPickupLocation: res?.ekartPickupLocation || '',
                ekartUsername: res?.ekartUsername || '',
                ekartPassword: '',
                ekartApiKey: '',
                ekartCreateShipmentPath: res?.ekartCreateShipmentPath || '/api/v1/package/create',
                ekartTrackingPath: res?.ekartTrackingPath || '/api/v1/track/{id}',
                ekartCancelPath: res?.ekartCancelPath || '/api/v1/package/cancel'
            });
            if (Array.isArray(res?.delhiveryWarehouses)) {
                setWarehouses(res.delhiveryWarehouses.map((warehouse) => ({
                    name: warehouse?.name || '',
                    address: warehouse?.address || '',
                    city: warehouse?.city || '',
                    state: warehouse?.state || '',
                    pin: warehouse?.pin || '',
                    phone: warehouse?.phone || ''
                })));
            }
            if (Array.isArray(res?.ekartWarehouses)) {
                setEkartWarehouses(toEkartWarehouses(res.ekartWarehouses));
            }
            toast.success('API credentials updated');
        } catch (error) {
            const errorCode = error.response?.data?.code;
            if (errorCode === 'ACTION_CODE_REQUIRED' || errorCode === 'ACTION_CODE_INVALID') {
                setActionCode('');
                setCodePrompt({ mode: 'code', error: errorCode === 'ACTION_CODE_INVALID' ? error.response.data.message : '' });
                return;
            }
            if (errorCode === 'ACTION_MFA_NOT_ENABLED') {
                setCodePrompt({ mode: 'setup', error: error.response.data.message });
                return;
            }
            closeCodePrompt();
            console.error('Failed to update API credentials:', error);
            toast.error(error.response?.data?.message || 'Failed to update API credentials');
        } finally {
            setSaving(false);
        }
    };

    const sectionStats = useMemo(() => ([
        {
            id: 'razorpay',
            title: 'Razorpay',
            subtitle: 'Payments',
            blurb: 'Checkout keys for online payment collection.'
        },
        {
            id: 'delhivery',
            title: 'Delhivery',
            subtitle: 'Courier API',
            blurb: 'Live shipment creation and tracking for Delhivery.'
        },
        {
            id: 'ekart',
            title: 'Ekart',
            subtitle: 'Courier API',
            blurb: 'Separate Ekart account endpoints and auth settings.'
        }
    ]), []);

    if (loading && !settings) {
        return <div className="p-8 text-center text-gray-500 font-medium">Loading API credentials...</div>;
    }

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#f6f8fb_0%,#eef4f7_100%)] p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-200/40 backdrop-blur md:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600">
                                Admin Settings
                            </div>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
                                API Credentials
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 md:text-base">
                                Keep each provider in its own lane. Payment keys, Delhivery config, and Ekart config are now split into separate, cleaner sections.
                            </p>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                                Save State
                            </div>
                            <div className="mt-2 text-lg font-black text-slate-900">
                                {saving ? 'Saving changes...' : 'Ready to update'}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                                Secrets stay hidden unless you re-enter them.
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        {sectionStats.map((section) => {
                            const styles = SECTION_STYLES[section.id];
                            const isActive = activeSection === section.id;

                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setActiveSection(section.id)}
                                    className={`rounded-[26px] border p-5 text-left transition-all ${isActive ? `${styles.border} ${styles.soft} shadow-lg shadow-black/5` : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
                                >
                                    <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${styles.pill}`}>
                                        {section.subtitle}
                                    </div>
                                    <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{section.title}</h2>
                                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{section.blurb}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
                    <SectionCard
                        id="razorpay"
                        eyebrow="Payments"
                        title="Razorpay Credentials"
                        description="This section stays focused on checkout and payment authentication only."
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            <InputField
                                section="razorpay"
                                label="Razorpay Key ID"
                                name="razorpayKeyId"
                                value={form.razorpayKeyId}
                                onChange={handleChange}
                                placeholder="rzp_live_xxxxx or rzp_test_xxxxx"
                            />
                            <InputField
                                section="razorpay"
                                label="Razorpay Key Secret"
                                type="password"
                                name="razorpayKeySecret"
                                value={form.razorpayKeySecret}
                                onChange={handleChange}
                                placeholder="Leave blank to keep existing secret"
                                hint="For security, the stored secret is never returned by the API."
                            />
                            <InputField
                                section="razorpay"
                                label="Razorpay Webhook Secret"
                                type="password"
                                name="razorpayWebhookSecret"
                                value={form.razorpayWebhookSecret}
                                onChange={handleChange}
                                placeholder="Leave blank to keep existing secret"
                                hint="The secret you set on the webhook in Razorpay Dashboard > Webhooks (URL: https://backend.indiankart.in/api/payments/webhook)."
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        id="delhivery"
                        eyebrow="Courier Partner"
                        title="Delhivery Settings"
                        description="Shipment creation and live tracking details for orders assigned to Delhivery."
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            <InputField
                                section="delhivery"
                                label="API Base URL"
                                name="deliveryApi"
                                value={form.deliveryApi}
                                onChange={handleChange}
                                placeholder="https://track.delhivery.com"
                            />
                            <InputField
                                section="delhivery"
                                label="Client Name"
                                name="delhiveryClientName"
                                value={form.delhiveryClientName}
                                onChange={handleChange}
                                placeholder="Your Delhivery client or seller name"
                            />
                            <InputField
                                section="delhivery"
                                label="Pickup Location"
                                name="delhiveryPickupLocation"
                                value={form.delhiveryPickupLocation}
                                onChange={handleChange}
                                placeholder="Exact pickup location from Delhivery"
                            />
                            <InputField
                                section="delhivery"
                                label="Token"
                                type="password"
                                name="delhiveryToken"
                                value={form.delhiveryToken}
                                onChange={handleChange}
                                placeholder="Leave blank to keep existing token"
                                hint="Only enter this when you want to replace the current token."
                            />
                        </div>

                        <div className="mt-8 border-t border-blue-100 pt-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-sm font-black text-gray-900">Pickup Warehouses</h4>
                                    <p className="mt-1 text-xs text-gray-500 font-medium max-w-xl">
                                        Added here so they can be chosen per order when assigning Delhivery. The name must match
                                        your warehouse in Delhivery exactly - copy it from Settings &gt; Pickup Locations rather
                                        than retyping, or shipments fail with &quot;ClientWarehouse matching query does not exist&quot;.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addWarehouse}
                                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700"
                                >
                                    Add warehouse
                                </button>
                            </div>

                            {warehouses.length === 0 ? (
                                <p className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4 text-xs font-semibold text-gray-500">
                                    No warehouses saved. Without these, every shipment uses the single Pickup Location above.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    {warehouses.map((warehouse, index) => (
                                        <div key={index} className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                                    Warehouse {index + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeWarehouse(index)}
                                                    className="rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {[
                                                    { field: 'name', label: 'Warehouse Name (must match Delhivery)', span: true },
                                                    { field: 'address', label: 'Address', span: true },
                                                    { field: 'city', label: 'City' },
                                                    { field: 'state', label: 'State' },
                                                    { field: 'pin', label: 'PIN Code' },
                                                    { field: 'phone', label: 'Phone' }
                                                ].map(({ field, label, span }) => (
                                                    <label key={field} className={span ? 'md:col-span-2' : ''}>
                                                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                            {label}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={warehouse[field]}
                                                            onChange={(e) => updateWarehouse(index, field, e.target.value)}
                                                            className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        id="ekart"
                        eyebrow="Courier Partner"
                        title="Ekart Settings"
                        description="Keep Ekart credentials, paths, and endpoint configuration in their own dedicated block."
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            <InputField
                                section="ekart"
                                label="Base URL"
                                name="ekartBaseUrl"
                                value={form.ekartBaseUrl}
                                onChange={handleChange}
                                placeholder="https://app.elite.ekartlogistics.in"
                            />
                            <InputField
                                section="ekart"
                                label="Tracking Base URL"
                                name="ekartTrackingBaseUrl"
                                value={form.ekartTrackingBaseUrl}
                                onChange={handleChange}
                                placeholder="Leave blank to reuse Base URL"
                                hint="Use the eKart API host here, not the dashboard shippingHealth page."
                            />
                            <InputField
                                section="ekart"
                                label="Client ID"
                                name="ekartClientId"
                                value={form.ekartClientId}
                                onChange={handleChange}
                                placeholder="EKART_xxxxxxxxx"
                                hint="This is the client_id used to fetch the temporary access token."
                            />
                            <InputField
                                section="ekart"
                                label="Client Name"
                                name="ekartClientName"
                                value={form.ekartClientName}
                                onChange={handleChange}
                                placeholder="Seller or client name used by Ekart"
                            />
                            <InputField
                                section="ekart"
                                label="Pickup Location"
                                name="ekartPickupLocation"
                                value={form.ekartPickupLocation}
                                onChange={handleChange}
                                placeholder="Registered location alias or leave blank"
                                hint="If your eKart account has only one registered pickup location, leave this blank and eKart will autofill it."
                            />
                            <InputField
                                section="ekart"
                                label="Username"
                                name="ekartUsername"
                                value={form.ekartUsername}
                                onChange={handleChange}
                                placeholder="Leave blank if API key is enough"
                            />
                            <InputField
                                section="ekart"
                                label="Password"
                                type="password"
                                name="ekartPassword"
                                value={form.ekartPassword}
                                onChange={handleChange}
                                placeholder="Leave blank to keep existing password"
                            />
                        </div>

                        <div className="mt-6">
                            <InputField
                                section="ekart"
                                label="Static Access Token"
                                type="password"
                                name="ekartApiKey"
                                value={form.ekartApiKey}
                                onChange={handleChange}
                                placeholder="Optional fallback bearer token"
                                hint="Optional. Leave empty if you want the app to fetch `access_token` automatically using Client ID + Username + Password."
                            />
                        </div>

                        <div className="mt-6 grid gap-6 md:grid-cols-3">
                            <InputField
                                section="ekart"
                                label="Create Path"
                                name="ekartCreateShipmentPath"
                                value={form.ekartCreateShipmentPath}
                                onChange={handleChange}
                                placeholder="/api/v1/package/create"
                            />
                            <InputField
                                section="ekart"
                                label="Tracking Path"
                                name="ekartTrackingPath"
                                value={form.ekartTrackingPath}
                                onChange={handleChange}
                                placeholder="/api/v1/track/{id}"
                            />
                            <InputField
                                section="ekart"
                                label="Cancel Path"
                                name="ekartCancelPath"
                                value={form.ekartCancelPath}
                                onChange={handleChange}
                                placeholder="/api/v1/package/cancel"
                            />
                        </div>

                        <div className="mt-8 border-t border-blue-100 pt-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-sm font-black text-gray-900">Pickup Addresses</h4>
                                    <p className="mt-1 text-xs text-gray-500 font-medium max-w-xl">
                                        Every Ekart shipment asks which of these to pick up from; the Pickup Location above is
                                        pre-selected. The name must match Ekart &gt; Settings &gt; Addresses exactly. The GST
                                        number is sent to Ekart for parcels from that address.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEkartWarehouses((prev) => [...prev, { ...EMPTY_EKART_WAREHOUSE }])}
                                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700"
                                >
                                    Add address
                                </button>
                            </div>

                            {ekartWarehouses.length === 0 ? (
                                <p className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4 text-xs font-semibold text-gray-500">
                                    No pickup addresses saved. Shipments use the single Pickup Location above.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    {ekartWarehouses.map((warehouse, index) => (
                                        <div key={index} className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                                    Address {index + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setEkartWarehouses((prev) => prev.filter((_, i) => i !== index))}
                                                    className="rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {[
                                                    { field: 'name', label: 'Address Name (must match Ekart)', span: true },
                                                    { field: 'address', label: 'Address', span: true },
                                                    { field: 'city', label: 'City' },
                                                    { field: 'state', label: 'State' },
                                                    { field: 'pin', label: 'PIN Code' },
                                                    { field: 'phone', label: 'Phone' },
                                                    { field: 'gst', label: 'GST Number', span: true }
                                                ].map(({ field, label, span }) => (
                                                    <label key={field} className={span ? 'md:col-span-2' : ''}>
                                                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                            {label}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={warehouse[field]}
                                                            onChange={(e) => updateEkartWarehouse(index, field, e.target.value)}
                                                            className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <div className="sticky bottom-4 z-20 flex justify-end">
                        <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur">
                            <div className="hidden text-right md:block">
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                                    Final Step
                                </div>
                                <div className="text-sm font-bold text-slate-900">
                                    Save all credential changes
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className={`rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.22em] transition-all ${saving ? 'cursor-not-allowed bg-slate-300 text-slate-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                                {saving ? 'Saving...' : 'Save Credentials'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {codePrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        {codePrompt.mode === 'setup' ? (
                            <>
                                <h2 className="text-lg font-black text-slate-900">Two-step login needed</h2>
                                <p className="mt-2 text-sm text-slate-600">{codePrompt.error}</p>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={closeCodePrompt} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
                                        Cancel
                                    </button>
                                    <a href="/admin/mfa-setup" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800">
                                        Set it up
                                    </a>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleCodeSubmit}>
                                <h2 className="text-lg font-black text-slate-900">Confirm with your authenticator</h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Changing payment or courier credentials needs the 6-digit code from your authenticator app.
                                </p>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    autoFocus
                                    maxLength={7}
                                    value={actionCode}
                                    onChange={(e) => setActionCode(e.target.value.replace(/[^\d\s]/g, ''))}
                                    placeholder="123456"
                                    aria-label="Authenticator code"
                                    className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-slate-900"
                                />
                                {codePrompt.error && (
                                    <p className="mt-2 text-sm font-semibold text-red-600">{codePrompt.error}</p>
                                )}
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={closeCodePrompt} disabled={saving} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving} className={`rounded-full px-5 py-2 text-sm font-bold text-white ${saving ? 'cursor-not-allowed bg-slate-300' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                        {saving ? 'Saving...' : 'Confirm & Save'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RazorpayCredentials;
