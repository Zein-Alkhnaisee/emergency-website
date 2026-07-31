import React from 'react';

const Button = ({ text, bgColor, textColor, handler, icon, ariaLabel, disabled, type = 'button', className = '' }) => {
  return (
    <button
      type={type}
      onClick={handler}
      disabled={disabled}
      className={`
        ${bgColor} ${textColor}
        cursor-pointer hover:scale-105 active:scale-95
        duration-200 py-2 px-8 rounded-full
        relative z-10 inline-flex items-center gap-2
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100
        ${className}
      `}
      aria-label={ariaLabel || text}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {text}
    </button>
  );
};

export default Button;
