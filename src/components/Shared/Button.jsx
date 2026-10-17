// src/components/Shared/Button.jsx
import React, { useState, useCallback, useRef } from 'react';

const Button = ({ 
  text, 
  bgColor, 
  textColor, 
  handler, 
  onClick, // ✅ إضافة onClick
  icon, 
  ariaLabel, 
  disabled, 
  type = 'button', 
  className = '',
  loading = false,
  magnetic = false,
  ripple = true,
}) => {
  const [rippleStyles, setRippleStyles] = useState({ opacity: 0, x: 0, y: 0 });
  const buttonRef = useRef(null);

  // ✅ استخدام onClick أو handler
  const handleClick = useCallback((e) => {
    if (ripple && !disabled && !loading) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setRippleStyles({ opacity: 1, x, y });
        setTimeout(() => setRippleStyles({ opacity: 0, x, y }), 400);
      }
    }
    // ✅ استدعاء onClick إذا كان موجوداً، وإلا handler
    if (onClick) onClick(e);
    else if (handler) handler(e);
  }, [ripple, disabled, loading, onClick, handler]);

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const hoverScale = prefersReducedMotion ? 'hover:scale-[1.01]' : 'hover:scale-[1.03]';
  const activeScale = prefersReducedMotion ? 'active:scale-[0.99]' : 'active:scale-[0.97]';
  const transitionDuration = prefersReducedMotion ? 'duration-100' : 'duration-200';

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      data-magnetic={magnetic ? 'true' : 'false'}
      className={`
        relative inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-xl overflow-hidden
        font-medium text-sm
        transition-all ${transitionDuration}
        ${bgColor || 'bg-[var(--color-primary)]'} 
        ${textColor || 'text-white'}
        ${hoverScale} 
        hover:shadow-lg hover:shadow-[var(--color-primary)]/30
        ${activeScale}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
        ${className}
      `}
      aria-label={ariaLabel || text}
    >
      {ripple && !disabled && !loading && (
        <span
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            width: '100px',
            height: '100px',
            left: rippleStyles.x - 50,
            top: rippleStyles.y - 50,
            opacity: rippleStyles.opacity,
            transform: `scale(${rippleStyles.opacity * 2 + 0.5})`,
            transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
          }}
        />
      )}

      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span aria-hidden="true" className="shrink-0">{icon}</span>}
          {text}
        </>
      )}
    </button>
  );
};

export default Button;