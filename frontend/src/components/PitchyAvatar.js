import React from 'react';

const PitchyAvatar = ({ size = 60 }) => {
    const uid = React.useId().replace(/:/g, '');

    return (
        <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg
                viewBox="0 0 200 240"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
                <defs>
                    {/* Body gradient - sleek white/silver */}
                    <linearGradient id={`body-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f8f9fa" />
                        <stop offset="50%" stopColor="#e9ecef" />
                        <stop offset="100%" stopColor="#dee2e6" />
                    </linearGradient>
                    {/* Body shine */}
                    <linearGradient id={`shine-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                        <stop offset="40%" stopColor="#fff" stopOpacity="0.6" />
                        <stop offset="60%" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                    {/* Nose cone */}
                    <linearGradient id={`nose-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1a1a2e" />
                        <stop offset="100%" stopColor="#16213e" />
                    </linearGradient>
                    {/* Window ring */}
                    <linearGradient id={`ring-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#adb5bd" />
                        <stop offset="100%" stopColor="#6c757d" />
                    </linearGradient>
                    {/* Iris */}
                    <radialGradient id={`iris-${uid}`} cx="40%" cy="35%" r="55%">
                        <stop offset="0%" stopColor="#aaff44">
                            <animate attributeName="stopColor" values="#aaff44;#ccff88;#aaff44" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="60%" stopColor="#66cc00" />
                        <stop offset="100%" stopColor="#338800" />
                    </radialGradient>
                    {/* Flame core */}
                    <linearGradient id={`flame1-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#eeffbb" />
                        <stop offset="40%" stopColor="#85FF00" />
                        <stop offset="100%" stopColor="#33aa00" stopOpacity="0" />
                    </linearGradient>
                    {/* Flame outer */}
                    <linearGradient id={`flame2-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#85FF00" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#44bb00" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#228800" stopOpacity="0" />
                    </linearGradient>
                    {/* Flame glow */}
                    <radialGradient id={`flameglow-${uid}`} cx="50%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="#85FF00" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#85FF00" stopOpacity="0" />
                    </radialGradient>
                    {/* Fin gradient */}
                    <linearGradient id={`fin-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1a1a2e" />
                        <stop offset="100%" stopColor="#0a0a15" />
                    </linearGradient>
                    {/* Shadow */}
                    <filter id={`drop-${uid}`} x="-20%" y="-10%" width="140%" height="130%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="4" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.2" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {/* Green glow filter */}
                    <filter id={`gglow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                        <feColorMatrix in="blur" type="matrix"
                            values="0 0 0 0 0.3  0 0 0 0 0.8  0 0 0 0 0  0 0 0 0.6 0" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <style>
                    {`
                        @keyframes pr-hover {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-6px); }
                        }
                        @keyframes pr-tilt {
                            0%, 100% { transform: rotate(0deg); }
                            25% { transform: rotate(2deg); }
                            75% { transform: rotate(-1.5deg); }
                        }
                        @keyframes pr-blink {
                            0%, 90%, 100% { transform: scaleY(1); }
                            94% { transform: scaleY(0.05); }
                        }
                        @keyframes pr-wink {
                            0%, 85%, 90%, 100% { transform: scaleY(1); }
                            87% { transform: scaleY(0.05); }
                        }
                        @keyframes pr-look {
                            0%, 25% { transform: translate(0, 0); }
                            30% { transform: translate(2px, -0.8px); }
                            50% { transform: translate(2px, -0.8px); }
                            55% { transform: translate(-1.5px, 0.5px); }
                            72% { transform: translate(-1.5px, 0.5px); }
                            80%, 100% { transform: translate(0, 0); }
                        }
                        @keyframes pr-flame1 {
                            0% { d: path("M75 170 Q78 195 85 210 Q92 230 100 238 Q108 230 115 210 Q122 195 125 170"); opacity: 1; }
                            33% { d: path("M78 170 Q76 200 88 215 Q95 235 100 240 Q105 235 112 215 Q124 200 122 170"); opacity: 0.95; }
                            66% { d: path("M76 170 Q80 198 82 212 Q90 232 100 236 Q110 232 118 212 Q120 198 124 170"); opacity: 1; }
                            100% { d: path("M75 170 Q78 195 85 210 Q92 230 100 238 Q108 230 115 210 Q122 195 125 170"); opacity: 1; }
                        }
                        @keyframes pr-flame2 {
                            0% { d: path("M70 168 Q72 200 82 218 Q90 240 100 248 Q110 240 118 218 Q128 200 130 168"); }
                            25% { d: path("M73 168 Q68 205 85 222 Q93 245 100 250 Q107 245 115 222 Q132 205 127 168"); }
                            50% { d: path("M71 168 Q75 202 80 220 Q88 242 100 252 Q112 242 120 220 Q125 202 129 168"); }
                            75% { d: path("M72 168 Q70 198 86 216 Q94 238 100 246 Q106 238 114 216 Q130 198 128 168"); }
                            100% { d: path("M70 168 Q72 200 82 218 Q90 240 100 248 Q110 240 118 218 Q128 200 130 168"); }
                        }
                        @keyframes pr-flame3 {
                            0% { d: path("M82 170 Q84 188 90 200 Q95 215 100 222 Q105 215 110 200 Q116 188 118 170"); }
                            33% { d: path("M84 170 Q82 192 92 204 Q96 218 100 224 Q104 218 108 204 Q118 192 116 170"); }
                            66% { d: path("M83 170 Q86 190 88 202 Q94 216 100 220 Q106 216 112 202 Q114 190 117 170"); }
                            100% { d: path("M82 170 Q84 188 90 200 Q95 215 100 222 Q105 215 110 200 Q116 188 118 170"); }
                        }
                        @keyframes pr-sparkle {
                            0%, 100% { opacity: 0; transform: scale(0); }
                            50% { opacity: 1; transform: scale(1); }
                        }
                        @keyframes pr-star-spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(180deg); }
                        }
                        @keyframes pr-smile {
                            0%, 80%, 100% { transform: scaleX(1); }
                            88% { transform: scaleX(1.15); }
                        }
                        .pr-scene {
                            animation: pr-hover 4s ease-in-out infinite;
                        }
                        .pr-rocket {
                            transform-origin: 100px 110px;
                            animation: pr-tilt 6s ease-in-out infinite;
                        }
                        .pr-eye-l {
                            transform-origin: 82px 102px;
                            animation: pr-blink 3.8s infinite;
                        }
                        .pr-eye-r {
                            transform-origin: 118px 102px;
                            animation: pr-wink 5.5s infinite;
                        }
                        .pr-pupil {
                            animation: pr-look 7s ease-in-out infinite;
                        }
                        .pr-flame-outer {
                            animation: pr-flame2 0.4s ease-in-out infinite;
                        }
                        .pr-flame-mid {
                            animation: pr-flame1 0.35s ease-in-out infinite;
                        }
                        .pr-flame-core {
                            animation: pr-flame3 0.3s ease-in-out infinite;
                        }
                        .pr-sparkle-1 {
                            transform-origin: 45px 70px;
                            animation: pr-sparkle 2.5s ease-in-out infinite, pr-star-spin 3s linear infinite;
                        }
                        .pr-sparkle-2 {
                            transform-origin: 160px 55px;
                            animation: pr-sparkle 3s ease-in-out infinite 0.8s, pr-star-spin 4s linear infinite;
                        }
                        .pr-sparkle-3 {
                            transform-origin: 155px 135px;
                            animation: pr-sparkle 2.8s ease-in-out infinite 1.5s, pr-star-spin 3.5s linear infinite;
                        }
                        .pr-sparkle-4 {
                            transform-origin: 38px 130px;
                            animation: pr-sparkle 3.2s ease-in-out infinite 0.4s, pr-star-spin 4.2s linear infinite;
                        }
                        .pr-mouth {
                            transform-origin: 100px 120px;
                            animation: pr-smile 6s ease-in-out infinite;
                        }
                    `}
                </style>

                <g className="pr-scene">
                    {/* === SPARKLES === */}
                    <g className="pr-sparkle-1">
                        <path d="M45 65 L47 70 L45 75 L43 70 Z" fill="#85FF00" opacity="0.8" />
                        <path d="M40 70 L45 68 L50 70 L45 72 Z" fill="#85FF00" opacity="0.8" />
                    </g>
                    <g className="pr-sparkle-2">
                        <path d="M160 50 L162 55 L160 60 L158 55 Z" fill="#85FF00" opacity="0.7" />
                        <path d="M155 55 L160 53 L165 55 L160 57 Z" fill="#85FF00" opacity="0.7" />
                    </g>
                    <g className="pr-sparkle-3">
                        <path d="M155 130 L157 135 L155 140 L153 135 Z" fill="#aaff55" opacity="0.6" />
                        <path d="M150 135 L155 133 L160 135 L155 137 Z" fill="#aaff55" opacity="0.6" />
                    </g>
                    <g className="pr-sparkle-4">
                        <path d="M38 125 L40 130 L38 135 L36 130 Z" fill="#aaff55" opacity="0.6" />
                        <path d="M33 130 L38 128 L43 130 L38 132 Z" fill="#aaff55" opacity="0.6" />
                    </g>

                    <g className="pr-rocket" filter={`url(#drop-${uid})`}>
                        {/* === FLAME === */}
                        {/* Glow base */}
                        <ellipse cx="100" cy="185" rx="30" ry="25" fill={`url(#flameglow-${uid})`}>
                            <animate attributeName="rx" values="30;35;30" dur="0.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="0.4s" repeatCount="indefinite" />
                        </ellipse>

                        {/* Outer flame */}
                        <path className="pr-flame-outer"
                            d="M70 168 Q72 200 82 218 Q90 240 100 248 Q110 240 118 218 Q128 200 130 168"
                            fill={`url(#flame2-${uid})`} filter={`url(#gglow-${uid})`} />

                        {/* Mid flame */}
                        <path className="pr-flame-mid"
                            d="M75 170 Q78 195 85 210 Q92 230 100 238 Q108 230 115 210 Q122 195 125 170"
                            fill={`url(#flame1-${uid})`} />

                        {/* Core flame (brightest) */}
                        <path className="pr-flame-core"
                            d="M82 170 Q84 188 90 200 Q95 215 100 222 Q105 215 110 200 Q116 188 118 170"
                            fill="#eeffcc" opacity="0.9" />

                        {/* === FINS === */}
                        {/* Left fin */}
                        <path d="M68 145 L50 172 L55 175 L72 158 Z" fill={`url(#fin-${uid})`} />
                        <path d="M68 145 L55 170 L60 168 L72 152 Z" fill="#2a2a4e" opacity="0.3" />
                        {/* Right fin */}
                        <path d="M132 145 L150 172 L145 175 L128 158 Z" fill={`url(#fin-${uid})`} />
                        <path d="M132 145 L145 170 L140 168 L128 152 Z" fill="#2a2a4e" opacity="0.3" />
                        {/* Center fin (back) */}
                        <rect x="96" y="158" width="8" height="16" rx="2" fill={`url(#fin-${uid})`} />

                        {/* === BODY === */}
                        {/* Main body capsule */}
                        <path
                            d="M68 80 Q68 40 100 18 Q132 40 132 80 L132 165 Q132 172 125 172 L75 172 Q68 172 68 165 Z"
                            fill={`url(#body-${uid})`}
                            stroke="#ced4da"
                            strokeWidth="1"
                        />

                        {/* Body shine strip */}
                        <path
                            d="M78 40 Q78 80 78 165 Q78 170 80 170 L82 170 Q82 168 82 165 L82 40 Z"
                            fill="#fff"
                            opacity="0.4"
                        />

                        {/* Nose cone */}
                        <path
                            d="M75 78 Q75 45 100 22 Q125 45 125 78 Z"
                            fill={`url(#nose-${uid})`}
                        />
                        {/* Nose cone shine */}
                        <path
                            d="M84 60 Q88 40 100 26 Q90 42 86 62 Z"
                            fill="#fff"
                            opacity="0.12"
                        />

                        {/* Band/stripe */}
                        <rect x="68" y="78" width="64" height="6" rx="0" fill="#85FF00" opacity="0.9" />
                        <rect x="68" y="78" width="64" height="2" rx="0" fill="#aaff55" opacity="0.4" />

                        {/* Lower band */}
                        <rect x="68" y="155" width="64" height="5" rx="0" fill="#85FF00" opacity="0.7" />

                        {/* === FACE === */}
                        {/* Left eye */}
                        <g className="pr-eye-l">
                            {/* Eye socket/porthole */}
                            <circle cx="82" cy="102" r="15" fill={`url(#ring-${uid})`} />
                            <circle cx="82" cy="102" r="13" fill="#fff" />
                            <g className="pr-pupil">
                                <circle cx="82" cy="102" r="8" fill={`url(#iris-${uid})`} />
                                <circle cx="82" cy="102" r="4" fill="#111" />
                                {/* Catchlights */}
                                <circle cx="79" cy="99" r="2.5" fill="#fff" opacity="0.95" />
                                <circle cx="85" cy="104" r="1" fill="#fff" opacity="0.5" />
                            </g>
                        </g>

                        {/* Right eye */}
                        <g className="pr-eye-r">
                            <circle cx="118" cy="102" r="15" fill={`url(#ring-${uid})`} />
                            <circle cx="118" cy="102" r="13" fill="#fff" />
                            <g className="pr-pupil">
                                <circle cx="118" cy="102" r="8" fill={`url(#iris-${uid})`} />
                                <circle cx="118" cy="102" r="4" fill="#111" />
                                <circle cx="115" cy="99" r="2.5" fill="#fff" opacity="0.95" />
                                <circle cx="121" cy="104" r="1" fill="#fff" opacity="0.5" />
                            </g>
                        </g>

                        {/* Mouth */}
                        <g className="pr-mouth">
                            <path
                                d="M90 126 Q100 134 110 126"
                                fill="none"
                                stroke="#495057"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Blush spots */}
                        <ellipse cx="70" cy="115" rx="5" ry="3" fill="#ff9999" opacity="0.2">
                            <animate attributeName="opacity" values="0.15;0.3;0.15" dur="4s" repeatCount="indefinite" />
                        </ellipse>
                        <ellipse cx="130" cy="115" rx="5" ry="3" fill="#ff9999" opacity="0.2">
                            <animate attributeName="opacity" values="0.15;0.3;0.15" dur="4s" repeatCount="indefinite" />
                        </ellipse>
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default PitchyAvatar;
