import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

const NotificationsBtn = () => {
  const [enabled, setEnabled] = useState(false);
  const [animate, setAnimate] = useState(false);

  const handleToggle = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    
    if (nextState) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 outline-none transition-transform active:scale-95 flex items-center justify-center"
      aria-label="Toggle Notifications"
    >
      {enabled ? (
        <Bell
          size={32}
          className={`
            text-yellow-500 fill-yellow-500 transition-colors duration-300
            [transform-origin:top_center]
            ${animate ? '[animation:bell-swing_0.5s_ease-in-out]' : ''}
          `}
        />
      ) : (
      
        <BellOff 
          size={32} 
          className="text-gray-400 transition-colors duration-300" 
        />
      )}
      <style>{`
        @keyframes bell-swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(10deg); }
          80% { transform: rotate(-10deg); }
        }
      `}</style>
    </button>
  );
};

export default NotificationsBtn;
