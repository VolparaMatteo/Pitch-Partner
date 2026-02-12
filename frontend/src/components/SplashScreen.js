import React, { useEffect, useState, useRef } from 'react';
import logoWhite from '../static/logo/bianco.png';
import '../styles/splash.css';

const words = ['Your', 'Sponsorship', 'Game Changer.'];

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('dark');
  const [animClass, setAnimClass] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const timers = [];
    const t = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

    // Phase 1: Logo appears (spring via CSS)
    t(() => setAnimClass('logo-visible'), 100);

    // Phase 2: Shimmer sweep
    t(() => setAnimClass(prev => prev + ' shimmer-active'), 700);

    // Phase 3: Pulse rings
    t(() => setAnimClass(prev => prev + ' pulse-active'), 1200);

    // Phase 4: Separator line
    t(() => setAnimClass(prev => prev + ' line-active'), 1800);

    // Phase 5: Words appear one by one
    t(() => setAnimClass(prev => prev + ' word-0-active'), 2100);
    t(() => setAnimClass(prev => prev + ' word-1-active'), 2280);
    t(() => setAnimClass(prev => prev + ' word-2-active'), 2460);

    // Phase 6: Hold, then exit
    t(() => {
      setPhase('light');
      setAnimClass(prev => prev + ' exit-active');
    }, 3000);

    t(() => {
      if (onFinish) onFinish();
    }, 3450);

    return () => timers.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <div
      ref={containerRef}
      className={`splash-container ${phase === 'light' ? 'splash-light' : ''} ${animClass}`}
    >
      <div className="splash-content">
        {/* Triple pulse rings */}
        <div className="splash-pulse-ring splash-pulse-ring-0" />
        <div className="splash-pulse-ring splash-pulse-ring-1" />
        <div className="splash-pulse-ring splash-pulse-ring-2" />

        {/* Logo with shimmer */}
        <div className="splash-logo-wrapper">
          <img src={logoWhite} alt="Pitch Partner" className="splash-logo" />
          <div className="splash-shimmer" />
        </div>

        {/* Separator line */}
        <div className="splash-separator" />

        {/* Tagline words */}
        <div className="splash-tagline">
          {words.map((word, i) => (
            <span key={i} className={`splash-word splash-word-${i}`}>
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
