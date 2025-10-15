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
      <ComponentIcon
        name="bell"
        size={size}
        color={color}
      />
    </div>
  );
};

export default AnimatedBell;
