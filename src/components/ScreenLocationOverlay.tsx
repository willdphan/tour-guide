import React, { useEffect, useState } from 'react';

const ScreenLocationOverlay: React.FC = () => {
  const [adjustedLeft, setAdjustedLeft] = useState('1432px');
  const [adjustedTop, setAdjustedTop] = useState('160px');

  useEffect(() => {
    const adjustCoordinates = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const left = Math.min(1432, viewportWidth - 448);
      const top = Math.min(160, viewportHeight - 540);
      
      setAdjustedLeft(`${left}px`);
      setAdjustedTop(`${top}px`);
    };

    adjustCoordinates();
    window.addEventListener('resize', adjustCoordinates);

    return () => window.removeEventListener('resize', adjustCoordinates);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: adjustedLeft,
        top: adjustedTop,
        width: '448px',
        height: '540px',
        border: '2px solid red',
        pointerEvents: 'none',
        zIndex: 9999,
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
      }}
    />
  );
};

export default ScreenLocationOverlay;