import React from 'react';

const PitchyAvatar = ({ size = 60 }) => {
    return (
        <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
                <defs>
                    {/* Skin Gradient */}
                    <radialGradient id="skinGradient" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#ffe0bd" />
                        <stop offset="100%" stopColor="#ffcd94" />
                    </radialGradient>
                    <linearGradient id="suitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2a2a2a" />
                        <stop offset="100%" stopColor="#111111" />
                    </linearGradient>
                    <linearGradient id="tieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#9FFF33" />
                        <stop offset="100%" stopColor="#66CC00" />
                    </linearGradient>

                    {/* Eye Gradient */}
                    <radialGradient id="eyeGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="60%" stopColor="#7FFF00" />
                        <stop offset="100%" stopColor="#5cb800" />
                    </radialGradient>

                    {/* Shadows */}
                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="2" dy="4" result="offsetblur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <style>
                    {`
            @keyframes blink {
              0%, 96%, 100% { transform: scaleY(1); }
              98% { transform: scaleY(0.1); }
            }
            @keyframes lookAround {
              0%, 40%, 100% { transform: translateX(0); }
              50% { transform: translateX(1.5px); }
              60% { transform: translateX(-1.5px); }
            }
            .pitchy-eyes {
              transform-origin: center;
              animation: blink 4s infinite;
            }
            .pitchy-pupils {
              animation: lookAround 6s ease-in-out infinite;
            }
          `}
                </style>

                <g className="pitchy-container" filter="url(#dropShadow)">

                    {/* --- BODY (SUIT) --- */}
                    <g transform="translate(0, 10)">
                        {/* Shoulders/Jacket */}
                        <path
                            d="M50 140 Q50 115 75 105 L125 105 Q150 115 150 140 L150 190 Q150 200 140 200 L60 200 Q50 200 50 190 Z"
                            fill="url(#suitGradient)"
                        />

                        {/* Shirt Collar (White) */}
                        <path
                            d="M85 105 L100 135 L115 105 L100 112 Z"
                            fill="#FFFFFF"
                            stroke="#E0E0E0"
                            strokeWidth="0.5"
                        />

                        {/* Lapels */}
                        <path
                            d="M75 105 L100 150 L85 190"
                            fill="none"
                            stroke="#000000"
                            strokeWidth="1"
                            opacity="0.3"
                        />
                        <path
                            d="M125 105 L100 150 L115 190"
                            fill="none"
                            stroke="#000000"
                            strokeWidth="1"
                            opacity="0.3"
                        />

                        {/* Tie */}
                        <g transform="translate(0, -2)">
                            <path d="M92 112 L108 112 L105 125 L95 125 Z" fill="url(#tieGradient)" />
                            <path d="M95 125 L105 125 L102 165 L100 170 L98 165 Z" fill="url(#tieGradient)" />
                        </g>

                        {/* Pocket Square */}
                        <path d="M128 135 L142 135 L142 138 L130 140 Z" fill="#7FFF00" />
                    </g>

                    {/* --- HEAD (HUMAN) --- */}
                    <g transform="translate(100, 75)">
                        {/* Head Shape */}
                        <circle cx="0" cy="0" r="45" fill="url(#skinGradient)" />

                        {/* Ears */}
                        <path d="M-45 0 Q-50 0 -50 10 Q-50 20 -42 15" fill="url(#skinGradient)" />
                        <path d="M45 0 Q50 0 50 10 Q50 20 42 15" fill="url(#skinGradient)" />

                        {/* --- HAIR (Black) --- */}
                        <g fill="#1a1a1a">
                            {/* Main Hair Shape */}
                            <path d="M-45 -5 C-50 -30 -30 -55 0 -55 C30 -55 50 -30 45 -5 C45 5 40 0 35 -20 C10 -10 -10 -10 -45 -5 Z" />
                            {/* Sideburns / Side detail */}
                            <path d="M-45 -5 L-45 10 L-40 0 Z" />
                            <path d="M45 -5 L45 10 L40 0 Z" />
                            {/* Top detail/shine (optional, keeping it simple black for now) */}
                        </g>

                        {/* --- FACE --- */}
                        <g className="pitchy-eyes">
                            {/* Left Eye */}
                            <g transform="translate(-14, 5)">
                                <ellipse cx="0" cy="0" rx="7" ry="9" fill="#FFFFFF" stroke="#e0c0a0" strokeWidth="0.5" />
                                <g className="pitchy-pupils">
                                    <circle cx="0" cy="0" r="4.5" fill="url(#eyeGradient)" />
                                    <circle cx="0" cy="0" r="2" fill="#1a1a1a" />
                                    <circle cx="-1.5" cy="-1.5" r="1.2" fill="#FFFFFF" opacity="0.9" />
                                </g>
                                {/* Eyebrow (Black) */}
                                <path d="M-7 -11 Q0 -14 7 -11" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
                            </g>

                            {/* Right Eye */}
                            <g transform="translate(14, 5)">
                                <ellipse cx="0" cy="0" rx="7" ry="9" fill="#FFFFFF" stroke="#e0c0a0" strokeWidth="0.5" />
                                <g className="pitchy-pupils">
                                    <circle cx="0" cy="0" r="4.5" fill="url(#eyeGradient)" />
                                    <circle cx="0" cy="0" r="2" fill="#1a1a1a" />
                                    <circle cx="-1.5" cy="-1.5" r="1.2" fill="#FFFFFF" opacity="0.9" />
                                </g>
                                {/* Eyebrow (Black) */}
                                <path d="M-7 -11 Q0 -14 7 -11" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
                            </g>
                        </g>

                        {/* Nose (Subtle) */}
                        <path d="M-2 12 Q0 15 2 12" fill="none" stroke="#dcb090" strokeWidth="2" strokeLinecap="round" />

                        {/* Smile */}
                        <path
                            d="M-10 22 Q0 28 10 22"
                            fill="none"
                            stroke="#333"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />

                        {/* Cheeks */}
                        <ellipse cx="-22" cy="20" rx="5" ry="3" fill="#ff8888" opacity="0.3" />
                        <ellipse cx="22" cy="20" rx="5" ry="3" fill="#ff8888" opacity="0.3" />
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default PitchyAvatar;
