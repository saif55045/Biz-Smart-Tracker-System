import React from 'react';
import './Button.css';

export default function Button({
  label,
  onClick,
  action,
  type = 'button',
  secondary = false,
  disabled = false,
  className = '',
  children
}) {
  // Support both old 'action' prop and new 'onClick' prop
  const handleClick = onClick || action;
  
  // Support both label prop and children content
  const buttonContent = children || label;
  
  return (
    <button 
      className={`custom-button ${secondary ? 'secondary' : 'primary'} ${className}`}
      onClick={handleClick}
      type={type}
      disabled={disabled}
    >
      {buttonContent}
    </button>
  );
}