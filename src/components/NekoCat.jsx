import React, { useEffect, useState } from 'react';

export default function NekoCat() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [state, setState] = useState('idle'); // idle, run, sleep
  const [flip, setFlip] = useState(false);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setTarget({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Movement loop
  useEffect(() => {
    const interval = setInterval(() => {
      setPos(currentPos => {
        const dx = target.x - currentPos.x;
        const dy = target.y - currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 40) {
          setState('run');
          setFlip(dx < 0);
          return {
            x: currentPos.x + (dx / dist) * 10,
            y: currentPos.y + (dy / dist) * 10
          };
        } else {
          setState(Math.random() > 0.95 ? 'sleep' : 'idle');
          return currentPos;
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, [target]);

  const catEmoji = state === 'sleep' ? '💤🐱' : state === 'run' ? '🐈' : '🐈‍⬛';

  return (
    <div 
      className="fixed pointer-events-none z-[99999] text-3xl transition-transform"
      style={{
        left: pos.x - 20,
        top: pos.y - 20,
        transform: `scaleX(${flip ? -1 : 1})`,
        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))'
      }}
    >
      {catEmoji}
    </div>
  );
}
