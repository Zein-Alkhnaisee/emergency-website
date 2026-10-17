import React from 'react';

const Heading = ({ title, subtitle, className = '' }) => {
  return (
    <div 
      className={`text-center mb-10 max-w-2xl mx-auto space-y-2 ${className}`}
      data-aos="fade-up"
    >
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default Heading;