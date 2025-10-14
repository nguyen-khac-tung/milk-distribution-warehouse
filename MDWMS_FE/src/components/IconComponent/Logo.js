import React from 'react';

const Logo = ({ size = 24, collapsed = false }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Background circle with gradient */}
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="milkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f3f4f6" />
                </linearGradient>
            </defs>
            
            {/* Main background circle */}
            <circle 
                cx="12" 
                cy="12" 
                r="11" 
                fill="url(#logoGradient)" 
                stroke="#ffffff" 
                strokeWidth="1"
            />
            
            {/* Warehouse building */}
            <rect 
                x="6" 
                y="8" 
                width="12" 
                height="8" 
                fill="url(#milkGradient)" 
                stroke="#d97706" 
                strokeWidth="0.5"
                rx="1"
            />
            
            {/* Warehouse roof */}
            <polygon 
                points="5,8 12,4 19,8" 
                fill="url(#milkGradient)" 
                stroke="#d97706" 
                strokeWidth="0.5"
            />
            
            {/* Warehouse door */}
            <rect 
                x="10" 
                y="12" 
                width="4" 
                height="4" 
                fill="#d97706" 
                rx="0.5"
            />
            
            {/* Milk drop */}
            <path 
                d="M12 6 C10 6, 8 7, 8 9 C8 11, 10 12, 12 13 C14 12, 16 11, 16 9 C16 7, 14 6, 12 6 Z" 
                fill="url(#milkGradient)" 
                stroke="#d97706" 
                strokeWidth="0.5"
            />
            
            {/* Milk drop highlight */}
            <ellipse 
                cx="11" 
                cy="8" 
                rx="1.5" 
                ry="2" 
                fill="#ffffff" 
                opacity="0.6"
            />
            
            {/* Small decorative elements */}
            <circle cx="8" cy="10" r="0.5" fill="#d97706" />
            <circle cx="16" cy="10" r="0.5" fill="#d97706" />
        </svg>
    );
};

export default Logo;
