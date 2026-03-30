import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdFavorite,
    MdFavoriteBorder,
    MdShare,
    MdArrowBack,
    MdArrowForward,
    MdVolumeOff,
    MdVolumeUp,
} from 'react-icons/md';
import API from '../../../services/api';

const formatCount = (value) => {
    const count = Number(value || 0);
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}m`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
};

const resolveProductTarget = (productLink) => {
    if (!productLink) return null;
    if (/^https?:\/\//i.test(productLink)) return productLink;
    return productLink.startsWith('/') ? productLink : `/${productLink}`;
};

const VideoItem = ({ data, isActive, onLike }) => {
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false);
    const [isSubmittingLike, setIsSubmittingLike] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const productTarget = useMemo(() => resolveProductTarget(data.productLink), [data.productLink]);

    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            videoRef.current.currentTime = 0;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(() => setIsPlaying(false));
            }
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const togglePlay = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying((prev) => !prev);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted((prev) => !prev);
    };

    const handleProductClick = () => {
        if (!productTarget) return;

        if (/^https?:\/\//i.test(productTarget)) {
            window.open(productTarget, '_blank', 'noopener,noreferrer');
            return;
        }

        navigate(productTarget);
    };

    const handleShare = async () => {
        if (!navigator.share) return;
        try {
            await navigator.share({
                title: 'IndiaKart Play',
                url: window.location.href,
            });
        } catch {
            // User cancelled share sheet.
        }
    };

    const handleLike = async () => {
        if (isSubmittingLike || isLiked) return;

        setIsSubmittingLike(true);
        try {
            const updatedReel = await onLike(data._id);
            if (updatedReel) {
                setIsLiked(true);
            }
        } finally {
            setIsSubmittingLike(false);
        }
    };

    return (
        <div className="h-full w-full snap-start relative bg-black flex items-center justify-center">
            <video
                ref={videoRef}
                src={data.videoUrl}
                loop
                playsInline
                muted={isMuted}
                className="h-full w-full object-cover"
                onClick={togglePlay}
            />

            <button
                onClick={toggleMute}
                className="absolute top-20 right-4 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm z-20"
            >
                {isMuted ? <MdVolumeOff size={24} /> : <MdVolumeUp size={24} />}
            </button>

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>

            <div className="absolute right-4 bottom-28 flex flex-col items-center space-y-8 z-20">
                <div className="flex flex-col items-center">
                    <button onClick={handleLike} className="p-2 active:scale-90 transition-transform disabled:opacity-70" disabled={isSubmittingLike || isLiked}>
                        {isLiked ? (
                            <MdFavorite size={32} className="text-red-500 drop-shadow-md" />
                        ) : (
                            <MdFavoriteBorder size={32} className="text-white drop-shadow-md" />
                        )}
                    </button>
                    <span className="text-white text-xs font-medium drop-shadow-md">{formatCount(data.likes)}</span>
                </div>

                <div className="flex flex-col items-center">
                    <button className="p-2" onClick={handleShare}>
                        <MdShare size={30} className="text-white drop-shadow-md" />
                    </button>
                    <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
                </div>
            </div>

            <div className="absolute bottom-6 left-4 right-4 z-20">
                <div
                    onClick={productTarget ? handleProductClick : undefined}
                    className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center justify-between transition-all ${
                        productTarget ? 'cursor-pointer hover:bg-white/20' : 'cursor-default opacity-70'
                    }`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                            <span className="text-white font-bold text-sm">View Product</span>
                            <span className="text-gray-300 text-xs truncate">
                                {productTarget ? data.productLink : 'Link not added yet'}
                            </span>
                        </div>
                    </div>
                    <div className="bg-primary p-2 rounded-full text-white shadow-lg shadow-primary/30 animate-pulse">
                        <MdArrowForward size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Play = () => {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeVideoId, setActiveVideoId] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const loadReels = async () => {
            try {
                const { data } = await API.get('/reels');
                const activeReels = (Array.isArray(data) ? data : []).filter((item) => item?.active && item?.videoUrl);
                setReels(activeReels);
                setActiveVideoId(activeReels[0]?._id || null);
            } catch {
                setReels([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadReels();
    }, []);

    const handleLike = async (reelId) => {
        const { data } = await API.post(`/reels/${reelId}/like`);
        setReels((current) => current.map((item) => (item._id === reelId ? data : item)));
        return data;
    };

    useEffect(() => {
        if (!reels.length || !containerRef.current) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveVideoId(entry.target.getAttribute('data-id'));
                    }
                });
            },
            {
                root: containerRef.current,
                threshold: 0.6,
            }
        );

        const elements = containerRef.current.querySelectorAll('.reel-section');
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [reels]);

    if (isLoading) {
        return (
            <div className="h-screen w-full bg-black relative flex items-center justify-center">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm active:scale-95 transition-all"
                >
                    <MdArrowBack size={24} />
                </button>
                <div className="text-center text-white px-6">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <p className="text-sm font-medium text-white/80">Loading Play videos...</p>
                </div>
            </div>
        );
    }

    if (!reels.length) {
        return (
            <div className="h-screen w-full bg-black relative flex items-center justify-center">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm active:scale-95 transition-all"
                >
                    <MdArrowBack size={24} />
                </button>
                <div className="text-center text-white px-6">
                    <h1 className="text-2xl font-bold">Play</h1>
                    <p className="mt-2 text-sm text-white/70">No reels are live right now. Upload and publish one from the admin panel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-black relative">
            <button
                onClick={() => navigate('/')}
                className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm active:scale-95 transition-all"
            >
                <MdArrowBack size={24} />
            </button>
            <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
            >
                {reels.map((data) => (
                    <section
                        key={data._id}
                        data-id={data._id}
                        className="reel-section h-full w-full snap-start"
                    >
                        <VideoItem data={data} isActive={activeVideoId === data._id} onLike={handleLike} />
                    </section>
                ))}
            </div>
        </div>
    );
};

export default Play;
