import React from 'react';
import { ComponentIcon } from '../IconComponent/Icon';

// CSS Animation for gentle bell swing
const bellSwingAnimation = `
@keyframes gentleSwing {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = bellSwingAnimation;
  document.head.appendChild(style);
}

const AnimatedBell = ({ 
  size = 35, 
  color = "#6b7280", 
  duration = "3s", 
  delay = "2s",
  style = {},
  title = "Thông báo",
  onClick,
  ...props 
}) => {
  // Fallback icon nếu ComponentIcon không hoạt động
  const BellIcon = () => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );

  return (
    <div
      style={{
        cursor: "pointer",
        display: "inline-block",
        transformOrigin: "top center",
        animation: `gentleSwing ${duration} ease-in-out ${delay} infinite`,
        ...style
      }}
      title={title}
      onClick={onClick}
      {...props}
    >
      {ComponentIcon ? (
        <ComponentIcon
          name="bell"
          size={size}
          color={color}
        />
      ) : (
        <BellIcon />
      )}
    </div>
  );
};

export default AnimatedBell;
