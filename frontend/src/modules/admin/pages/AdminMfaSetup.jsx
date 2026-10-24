import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import API from '../../../services/api';
import useAdminAuthStore from '../store/adminAuthStore';
import { requestForToken } from '../../../services/firebase';

// Set up two-step login: confirm password -> scan QR -> enter a code ->
// save the recovery codes.
const AdminMfaSetup = () => {
    const navigate = useNavigate();
    const adminUser = useAdminAuthStore((state) => state.adminUser);
    const applyMfaEnabled = useAdminAuthStore((state) => state.applyMfaEnabled);
    const logout = useAdminAuthStore((state) => state.logout);

    const [step, setStep] = useState(adminUser?.mfaEnabled ? 'done' : 'password');
    const [password, setPassword] = useState('');
    const [secret, setSecret] = useState('');
    const [qr, setQr] = useState('');
    const [code, setCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (step === 'done' && !recoveryCodes.length) {
            navigate('/admin', { replace: true });
        }
    }, [step, recoveryCodes.length, navigate]);

    const startSetup = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await API.post('/admin/mfa/setup', { password });
            setSecret(data.secret);
            setQr(await QRCode.toDataURL(data.otpauthUrl, { margin: 1, width: 220 }));
            setPassword('');
            setStep('scan');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not start setup');
        } finally {
            setBusy(false);
        }
    };

    const confirmCode = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await API.post('/admin/mfa/enable', { code: code.trim() });
            const { recoveryCodes: codes, ...admin } = data;
            applyMfaEnabled(admin);
            setRecoveryCodes(codes || []);
            setStep('codes');
        } catch (error) {
            toast.error(error.response?.data?.message || 'That code is not correct');
        } finally {
            setBusy(false);
        }
    };

    const codesText = () => [
        'Indiankart admin recovery codes',
        `Account: ${adminUser?.email || adminUser?.username || ''}`,
        'Each code works once. Keep them somewhere safe and offline.',
        '',
        ...recoveryCodes
    ].join('\n');

    const copyCodes = async () => {
        try {
            await navigator.clipboard.writeText(codesText());
            toast.success('Copied');
            setSaved(true);
        } catch {
            toast.error('Could not copy. Download them instead.');
        }
    };

    const downloadCodes = () => {
        const url = URL.createObjectURL(new Blob([codesText()], { type: 'text/plain' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'indiankart-admin-recovery-codes.txt';
        link.click();
        URL.revokeObjectURL(url);
        setSaved(true);
    };

    const finish = async () => {
        try { await requestForToken(); } catch { /* notifications are optional */ }
        toast.success('Two-step login is on');
        navigate('/admin', { replace: true });
    };

    const input = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white';
    const primary = `w-full py-3 rounded-lg font-semibold text-white shadow ${busy ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Set up two-step login</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Admin accounts need a code from an authenticator app (Google Authenticator,
                        Microsoft Authenticator, Authy, 1Password) every time they sign in.
                    </p>
                </div>

                {step === 'password' && (
                    <form onSubmit={startSetup} className="space-y-4" autoComplete="off">
                        <label htmlFor="mfa-password" className="block text-sm font-medium text-gray-700">
                            Confirm your password
                        </label>
                        <input id="mfa-password" type="password" autoComplete="current-password" autoFocus
                            value={password} onChange={(e) => setPassword(e.target.value)} className={input} required />
                        <button type="submit" disabled={busy} className={primary}>{busy ? 'Checking...' : 'Continue'}</button>
                    </form>
                )}

                {step === 'scan' && (
                    <form onSubmit={confirmCode} className="space-y-4" autoComplete="off">
                        <p className="text-sm text-gray-700">1. Scan this with your authenticator app.</p>
                        {qr && <img src={qr} alt="QR code for your authenticator app" className="mx-auto border rounded-lg" width={220} height={220} />}
                        <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer">Can't scan? Enter this key instead</summary>
                            <code className="block mt-2 p-2 bg-gray-100 rounded break-all select-all text-gray-800">{secret}</code>
                        </details>
                        <label htmlFor="mfa-code" className="block text-sm text-gray-700">2. Enter the 6-digit code it shows.</label>
                        <input id="mfa-code" type="text" inputMode="numeric" autoComplete="one-time-code"
                            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className={`${input} text-center text-2xl tracking-[0.4em] font-mono`} placeholder="000000" required />
                        <button type="submit" disabled={busy || code.length !== 6} className={primary}>{busy ? 'Checking...' : 'Turn on two-step login'}</button>
                    </form>
                )}

                {step === 'codes' && (
                    <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
                            Save these recovery codes now. If you lose your phone, each one lets you sign in once.
                            They will not be shown again.
                        </div>
                        <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-gray-800 bg-gray-50 p-4 rounded-lg select-all">
                            {recoveryCodes.map((c) => <li key={c}>{c}</li>)}
                        </ul>
                        <div className="flex gap-2">
                            <button type="button" onClick={copyCodes} className="flex-1 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50">Copy</button>
                            <button type="button" onClick={downloadCodes} className="flex-1 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50">Download</button>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
                            I have saved my recovery codes
                        </label>
                        <button type="button" onClick={finish} disabled={!saved} className={`w-full py-3 rounded-lg font-semibold text-white ${saved ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                            Go to the admin panel
                        </button>
                    </div>
                )}

                {step !== 'codes' && (
                    <button type="button" onClick={async () => { await logout(); navigate('/admin/login'); }} className="w-full text-sm text-gray-500 hover:underline">
                        Sign out
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminMfaSetup;
