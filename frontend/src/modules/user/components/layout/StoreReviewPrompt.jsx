import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import API from '../../../../services/api';

// One-time "How's your IndianKart experience?" popup.
//
// Shown to logged-in customers on the home page a few seconds after they
// arrive. The server decides eligibility and records the outcome - submitting
// OR declining uses up the account's single prompt - so it appears once per
// account across every device, not once per browser.

const SHOW_AFTER_MS = 5000;
const MAX_COMMENT = 1000;
const RATING_LABELS = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
const PLACEHOLDER_NAMES = new Set(['new user', 'test user']);

// Per-tab memo so returning to the home page within a session does not ask
// the server again once this account is known to be done.
const sessionKey = (userId) => `ik-store-review-done:${userId}`;
const isDoneThisSession = (userId) => {
    try { return sessionStorage.getItem(sessionKey(userId)) === '1'; } catch { return false; }
};
const markDoneThisSession = (userId) => {
    try { sessionStorage.setItem(sessionKey(userId), '1'); } catch { /* storage unavailable */ }
};

const firstNameOf = (name) => {
    const text = String(name || '').trim();
    if (!text || PLACEHOLDER_NAMES.has(text.toLowerCase())) return '';
    return text.split(/\s+/)[0];
};

const Star = ({ filled }) => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-11 md:h-11" aria-hidden="true">
        <path
            d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
            className={filled ? 'fill-amber-400 stroke-amber-500' : 'fill-gray-100 stroke-gray-300'}
            strokeWidth="1.2"
            strokeLinejoin="round"
        />
    </svg>
);

const StoreReviewPrompt = () => {
    const location = useLocation();
    const { isAuthenticated, user } = useAuthStore();
    const userId = user?._id || user?.id || '';
    const isHome = location.pathname === '/';

    const [open, setOpen] = useState(false);
    const [phase, setPhase] = useState('form'); // 'form' | 'thanks'
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const dialogRef = useRef(null);

    // Ask the server whether to show, then wait a few seconds on the home page.
    useEffect(() => {
        if (!isAuthenticated || !userId || !isHome || open) return undefined;
        if (isDoneThisSession(userId)) return undefined;

        let cancelled = false;
        let timer;
        API.get('/store-reviews/me/prompt')
            .then(({ data }) => {
                if (cancelled) return;
                if (!data?.show) {
                    markDoneThisSession(userId);
                    return;
                }
                timer = setTimeout(() => {
                    if (!cancelled) setOpen(true);
                }, SHOW_AFTER_MS);
            })
            .catch(() => { /* never block the page over a review prompt */ });

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [isAuthenticated, userId, isHome, open]);

    const close = useCallback(() => {
        setOpen(false);
        setTimeout(() => {
            setPhase('form');
            setRating(0);
            setHovered(0);
            setComment('');
        }, 300);
    }, []);

    const decline = useCallback(() => {
        markDoneThisSession(userId);
        close();
        // Uses up the account's one prompt. If this request fails the server
        // will simply offer it once more on a later visit.
        API.post('/store-reviews/dismiss').catch(() => {});
    }, [userId, close]);

    const submit = async () => {
        if (!rating || submitting) return;
        setSubmitting(true);
        try {
            await API.post('/store-reviews', { rating, comment: comment.trim() });
            markDoneThisSession(userId);
            setPhase('thanks');
            setTimeout(close, 2400);
        } catch (error) {
            if (error?.response?.status === 409) {
                markDoneThisSession(userId);
                toast.success(error.response.data?.message || 'Thanks, we already have your feedback!');
                close();
            } else {
                toast.error(error?.response?.data?.message || 'Could not send your review. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Esc declines (an explicit choice); lock page scroll while open.
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => {
            if (event.key !== 'Escape') return;
            if (phase === 'thanks') close(); else decline();
        };
        document.addEventListener('keydown', onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, phase, close, decline]);

    const shown = hovered || rating;
    const firstName = firstNameOf(user?.name);
    const commentPlaceholder = !rating
        ? 'Tell us more (optional)'
        : rating <= 3
            ? 'What could we do better? (optional)'
            : 'What did you like? (optional)';

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/45 md:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="store-review-title"
                        tabIndex={-1}
                        className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl outline-none pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    >
                        <div className="md:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-200" />

                        <button
                            type="button"
                            onClick={phase === 'thanks' ? close : decline}
                            aria-label="Close"
                            className="absolute right-3 top-3 md:right-4 md:top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            <span className="material-icons text-[22px]">close</span>
                        </button>

                        {phase === 'thanks' ? (
                            <div className="px-6 pt-10 pb-6 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                                    <span className="material-icons text-[40px] text-green-600">check_circle</span>
                                </div>
                                <h2 id="store-review-title" className="text-xl font-bold text-gray-900">Thank you!</h2>
                                <p className="mt-1.5 text-sm text-gray-500">Your feedback helps us serve you better.</p>
                            </div>
                        ) : (
                            <div className="px-6 pt-8 md:pt-9 pb-2">
                                <div className="text-center">
                                    <h2 id="store-review-title" className="text-xl font-bold text-gray-900 px-6">
                                        {firstName ? `Hi ${firstName}, how's` : "How's"} your IndianKart experience?
                                    </h2>
                                    <p className="mt-1.5 text-sm text-gray-500">It takes 10 seconds and helps us improve.</p>
                                </div>

                                <div
                                    role="radiogroup"
                                    aria-label="Rating"
                                    className="mt-6 flex items-center justify-center gap-1.5"
                                    onMouseLeave={() => setHovered(0)}
                                >
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            role="radio"
                                            aria-checked={rating === value}
                                            aria-label={`${value} star${value > 1 ? 's' : ''} - ${RATING_LABELS[value - 1]}`}
                                            onClick={() => setRating(value)}
                                            onMouseEnter={() => setHovered(value)}
                                            className="rounded-lg p-0.5 transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                                        >
                                            <Star filled={value <= shown} />
                                        </button>
                                    ))}
                                </div>
                                <p className={`mt-2 h-5 text-center text-sm font-semibold ${shown ? 'text-amber-600' : 'text-transparent'}`}>
                                    {shown ? RATING_LABELS[shown - 1] : '.'}
                                </p>

                                <div className="mt-4">
                                    <textarea
                                        value={comment}
                                        onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT))}
                                        placeholder={commentPlaceholder}
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#2874f0] focus:bg-white"
                                    />
                                    {comment.length > MAX_COMMENT - 100 && (
                                        <p className="mt-1 text-right text-[11px] text-gray-400">{comment.length}/{MAX_COMMENT}</p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={!rating || submitting}
                                    className="mt-4 w-full rounded-xl bg-[#fb641b] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                                >
                                    {submitting ? 'Sending...' : 'Submit review'}
                                </button>
                                <button
                                    type="button"
                                    onClick={decline}
                                    className="mt-2 w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    No thanks
                                </button>
                                <p className="pb-2 text-center text-[11px] text-gray-400">We'll only ask once.</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StoreReviewPrompt;
