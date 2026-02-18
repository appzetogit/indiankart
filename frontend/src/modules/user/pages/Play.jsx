import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFavorite, MdFavoriteBorder, MdShare, MdArrowBack, MdArrowForward, MdVolumeOff, MdVolumeUp } from 'react-icons/md';

const VIDEO_SRC = "/video.mp4";

const reelsData = [
    {
        id: 1,
        video: VIDEO_SRC,
        user: "Nike Official",
        avatar: "https://ui-avatars.com/api/?name=Nike&background=0D8ABC&color=fff",
        description: "New Air Max Request. Feel the air.",
        likes: "12.5k",
        comments: "845",
        productId: 101, // Mock Product ID
        productName: "Nike Air Max 90",
        price: "₹7,999"
    },
    {
        id: 2,
        video: VIDEO_SRC,
        user: "Adidas Originals",
        avatar: "https://ui-avatars.com/api/?name=Adidas&background=000&color=fff",
        description: "Street style redefined. #adidas #originals",
        likes: "8.2k",
        comments: "320",
        productId: 102,
        productName: "Adidas Superstar",
        price: "₹6,599"
    },
    {
        id: 3,
        video: VIDEO_SRC,
        user: "Puma India",
        avatar: "https://ui-avatars.com/api/?name=Puma&background=D12323&color=fff",
        description: "Run fast, run free. Forever Faster.",
        likes: "15k",
        comments: "1.2k",
        productId: 103,
        productName: "Puma Nitro",
        price: "₹9,999"
    },
];

const VideoItem = ({ data, isActive }) => {
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Default muted for autoplay
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (isActive) {
            videoRef.current.currentTime = 0;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch((error) => {
                    console.log("Autoplay prevented:", error);
                    setIsPlaying(false);
                });
            }
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        videoRef.current.muted = !isMuted;
    };

    const handleProductClick = () => {
        // Redirect to product details
        navigate(`/product/${data.productId}`);
    };

    return (
        <div className="h-full w-full snap-start relative bg-black flex items-center justify-center">
            {/* Video Player */}
            <video
                ref={videoRef}
                src={data.video}
                loop
                playsInline
                muted={true}
                className="h-full w-full object-cover"
                onClick={togglePlay}
            />

            {/* Mute Toggle Overlay */}
            <button
                onClick={toggleMute}
                className="absolute top-20 right-4 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm z-20"
            >
                {isMuted ? <MdVolumeOff size={24} /> : <MdVolumeUp size={24} />}
            </button>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-28 flex flex-col items-center space-y-8 z-20">
                <div className="flex flex-col items-center">
                    <button onClick={() => setIsLiked(!isLiked)} className="p-2 active:scale-90 transition-transform">
                        {isLiked ? (
                            <MdFavorite size={32} className="text-red-500 drop-shadow-md" />
                        ) : (
                            <MdFavoriteBorder size={32} className="text-white drop-shadow-md" />
                        )}
                    </button>
                    <span className="text-white text-xs font-medium drop-shadow-md">{data.likes}</span>
                </div>

                <div className="flex flex-col items-center">
                    <button className="p-2">
                        <MdShare size={30} className="text-white drop-shadow-md" />
                    </button>
                    <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
                </div>
            </div>

            {/* Bottom Product CTA */}
            <div className="absolute bottom-6 left-4 right-4 z-20">
                <div
                    onClick={handleProductClick}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/20 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">View Product</span>
                            <span className="text-gray-300 text-xs">Tap to see details</span>
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
    const [activeVideoId, setActiveVideoId] = useState(1);
    const containerRef = useRef(null);

    useEffect(() => {
        const options = {
            root: containerRef.current,
            threshold: 0.6,
        };

        const handleIntersection = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = Number(entry.target.getAttribute('data-id'));
                    setActiveVideoId(id);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, options);

        const elements = document.querySelectorAll('.reel-section');
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

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
                {reelsData.map((data) => (
                    <section
                        key={data.id}
                        data-id={data.id}
                        className="reel-section h-full w-full snap-start"
                    >
                        <VideoItem data={data} isActive={activeVideoId === data.id} />
                    </section>
                ))}
            </div>
        </div>
    );
};

export default Play;

