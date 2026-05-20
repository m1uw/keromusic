import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';

export default function GraphicEQ() {
  const { eqEnabled, eqGains, updateEqGain } = usePlayerStore();
  const { activeTheme } = useThemeStore();
  
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 200 });
  const [draggingIdx, setDraggingIdx] = useState(null);

  const bands = [60, 150, 400, 1000, 3000, 8000, 15000];
  const bandKeys = ['60', '150', '400', '1000', '3000', '8000', '15000'];

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
      
      const handleResize = () => {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const getPoints = () => {
    const marginX = 20;
    const paddingY = 20;
    const innerWidth = dimensions.width - marginX * 2;
    const innerHeight = dimensions.height - paddingY * 2;
    const stepX = innerWidth / (bands.length - 1);
    
    return bands.map((band, idx) => {
      const gain = eqGains[bandKeys[idx]] || 0;
      // Gain is -12 to 12. Normalize to 0-1
      const normalizedGain = (gain + 12) / 24; // 1 is +12dB (top), 0 is -12dB (bottom)
      
      return {
        x: marginX + (idx * stepX),
        y: paddingY + (innerHeight * (1 - normalizedGain)),
        gain: gain,
        idx: idx
      };
    });
  };

  const createSplinePath = (points) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const x0 = points[i].x;
      const y0 = points[i].y;
      const x1 = points[i + 1].x;
      const y1 = points[i + 1].y;
      
      const cpX1 = x0 + (x1 - x0) / 2;
      const cpX2 = cpX1;
      
      d += ` C ${cpX1},${y0} ${cpX2},${y1} ${x1},${y1}`;
    }
    return d;
  };

  const handlePointerDown = (e, idx) => {
    if (!eqEnabled) return;
    setDraggingIdx(idx);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!eqEnabled || draggingIdx === null || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const paddingY = 20;
    const innerHeight = rect.height - paddingY * 2;
    
    let y = e.clientY - rect.top;
    // Clamp to bounds
    y = Math.max(paddingY, Math.min(rect.height - paddingY, y));
    
    // Convert back to gain value
    const normalizedGain = 1 - ((y - paddingY) / innerHeight);
    let newGain = Math.round((normalizedGain * 24) - 12);
    // Clamp exactly between -12 and 12
    newGain = Math.max(-12, Math.min(12, newGain));
    
    updateEqGain(bandKeys[draggingIdx], newGain);
  };

  const handlePointerUp = () => {
    setDraggingIdx(null);
  };

  const points = getPoints();
  const pathData = createSplinePath(points);

  // For the gradient fill
  const fillPathData = points.length > 0 
    ? `${pathData} L ${points[points.length - 1].x},${dimensions.height} L ${points[0].x},${dimensions.height} Z` 
    : '';

  const formatHz = (hz) => {
    if (hz >= 1000) {
      // 1000 -> 1KHz, 3000 -> 3KHz, 15000 -> 15KHz
      const k = hz / 1000;
      return `${Number.isInteger(k) ? k : k.toFixed(1)}KHz`;
    }
    return `${hz}Hz`;
  };

  return (
    <div className="w-full flex flex-col gap-2 relative select-none">
      <div 
        ref={containerRef}
        className="w-full h-[200px] relative rounded-xl bg-black/10 overflow-hidden cursor-crosshair touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
          <defs>
            <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeTheme.accent} stopOpacity={eqEnabled ? 0.4 : 0.1} />
              <stop offset="100%" stopColor={activeTheme.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Zero line (0 dB) */}
          <line 
            x1="0" 
            y1={dimensions.height / 2} 
            x2={dimensions.width} 
            y2={dimensions.height / 2} 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1" 
          />
          
          {/* Fill under the curve */}
          {fillPathData && (
            <path 
              d={fillPathData} 
              fill="url(#eqGradient)" 
              className="transition-all duration-75"
            />
          )}
          
          {/* The Spline Curve */}
          <path 
            d={pathData} 
            fill="none" 
            stroke={eqEnabled ? activeTheme.accent : 'rgba(255,255,255,0.2)'} 
            strokeWidth="3" 
            strokeLinecap="round"
            className="transition-all duration-75"
          />
          
          {/* Grid vertical lines */}
          {points.map((pt, i) => (
            <line key={`grid-${i}`}
              x1={pt.x} y1="0" x2={pt.x} y2={dimensions.height}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Draggable Dots */}
        {points.map((pt, i) => (
          <div
            key={`dot-${i}`}
            onPointerDown={(e) => handlePointerDown(e, i)}
            className="absolute w-4 h-4 rounded-full bg-white shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 touch-none"
            style={{
              left: pt.x,
              top: pt.y,
              opacity: eqEnabled ? 1 : 0.5,
              cursor: eqEnabled ? (draggingIdx === i ? 'grabbing' : 'grab') : 'not-allowed',
              scale: draggingIdx === i ? '1.5' : '1'
            }}
          />
        ))}

        {/* Floating Tooltip during drag */}
        {draggingIdx !== null && points[draggingIdx] && (
          <div 
            className="absolute px-2 py-1 bg-black/80 rounded-md text-[10px] font-bold text-white border border-white/10 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-[150%]"
            style={{ left: points[draggingIdx].x, top: points[draggingIdx].y }}
          >
            {points[draggingIdx].gain > 0 ? `+${points[draggingIdx].gain}` : points[draggingIdx].gain} dB
          </div>
        )}

        {/* Left axis labels */}
        <div className="absolute left-2 top-2 text-[10px] text-white/40 font-bold pointer-events-none">+12dB</div>
        <div className="absolute left-2 bottom-6 text-[10px] text-white/40 font-bold pointer-events-none">-12dB</div>
      </div>

      {/* X axis frequency labels */}
      <div className="flex justify-between px-5">
        {bands.map((hz) => (
          <span key={hz} className="text-[10px] font-bold text-white/50">{formatHz(hz)}</span>
        ))}
      </div>
    </div>
  );
}
