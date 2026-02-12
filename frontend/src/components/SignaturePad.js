import { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePadLib from 'signature_pad';

function SignaturePad({ onSave, width = 500, height = 200 }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const containerRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const containerWidth = container.offsetWidth;
    const w = Math.min(containerWidth, width);
    const h = height;

    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.getContext('2d').scale(ratio, ratio);

    if (padRef.current) {
      padRef.current.clear();
      setIsEmpty(true);
    }
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
    });

    padRef.current.addEventListener('endStroke', () => {
      setIsEmpty(padRef.current.isEmpty());
    });

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (padRef.current) padRef.current.off();
    };
  }, [resizeCanvas]);

  const handleClear = () => {
    if (padRef.current) {
      padRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleConfirm = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      const base64 = padRef.current.toDataURL('image/png');
      onSave(base64);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{
        border: '2px dashed #D1D5DB',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#FFFFFF',
      }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            background: '#FFFFFF',
            color: '#6B7280',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancella
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isEmpty}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: isEmpty ? '#D1D5DB' : '#1A1A1A',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isEmpty ? 'not-allowed' : 'pointer',
          }}
        >
          Conferma Firma
        </button>
      </div>
    </div>
  );
}

export default SignaturePad;
