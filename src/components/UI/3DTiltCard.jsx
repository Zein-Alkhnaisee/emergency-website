import { useState, useCallback, memo } from 'react';

const TiltCard = memo(({ 
  children, 
  className = '',
  tiltMaxAngle = 8, // الدرجة القصوى للإمالة
  perspective = 800, // قيمة الـ perspective
  glare = false, // إضافة تأثير لمعان
}) => {
  const [styles, setStyles] = useState({
    transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
    transition: 'transform 0.1s ease-out',
    glareOpacity: 0,
  });

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -tiltMaxAngle;
    const rotateY = ((x - centerX) / centerX) * tiltMaxAngle;
    
    setStyles({
      transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.05s ease-out',
      glareOpacity: glare ? Math.min(Math.abs(rotateX) / tiltMaxAngle, 0.4) : 0,
    });
  }, [tiltMaxAngle, perspective, glare]);

  const handleMouseLeave = useCallback(() => {
    setStyles({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`,
      transition: 'transform 0.4s ease-out',
      glareOpacity: 0,
    });
  }, [perspective]);

  // إذا كان المستخدم يفضل تقليل الحركة، نعطّل التأثير
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative transition-all duration-300 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: styles.transform,
        transition: styles.transition,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {children}
      
      {glare && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
          style={{
            opacity: styles.glareOpacity,
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)',
            transition: 'opacity 0.2s ease-out',
            transform: 'translateZ(1px)',
          }}
        />
      )}
    </div>
  );
});

TiltCard.displayName = 'TiltCard';

export default TiltCard;