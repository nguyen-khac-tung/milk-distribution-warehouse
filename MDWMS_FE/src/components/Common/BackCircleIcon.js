import React from "react";

const BackCircleIcon = ({ size = 18, color = "currentColor", className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke={color}
        className={`${className}`}
        width={size}
        height={size}
    >
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8l-4 4 4 4m-4-4h8"
        />
    </svg>
);

export default BackCircleIcon;
