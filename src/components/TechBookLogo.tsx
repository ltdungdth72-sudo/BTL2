import React from 'react';

interface TechBookLogoProps {
  className?: string;
  size?: number;
}

export const TechBookLogo: React.FC<TechBookLogoProps> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="48" height="48" rx="12" fill="#2563EB" fillOpacity="0.1" />
      {/* Book base & pages */}
      <path
        d="M8 35.5C13 33.5 19 33.5 24 37C29 33.5 35 33.5 40 35.5V14.5C35 12.5 29 12.5 24 16C19 12.5 13 12.5 8 14.5V35.5Z"
        fill="#FFFFFF"
        stroke="#1D4ED8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Spine divider */}
      <path
        d="M24 16V37"
        stroke="#1D4ED8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Tech Circuit Traces on Pages */}
      <path
        d="M13 20H18M13 25H16M13 30H19"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="18" cy="20" r="1.5" fill="#2563EB" />
      <circle cx="16" cy="25" r="1.5" fill="#2563EB" />
      <circle cx="19" cy="30" r="1.5" fill="#2563EB" />

      {/* Tech Nodes on Right Page */}
      <path
        d="M35 20H30M35 25H32M35 30H29"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="30" cy="20" r="1.5" fill="#2563EB" />
      <circle cx="32" cy="25" r="1.5" fill="#2563EB" />
      <circle cx="29" cy="30" r="1.5" fill="#2563EB" />

      {/* Digital Spark above Spine */}
      <path
        d="M24 8V12M22 10H26"
        stroke="#2563EB"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
