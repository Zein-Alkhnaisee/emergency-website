// src/components/Shared/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'w-10 h-10' }) => {
    return (
        <div className="flex justify-center items-center">
            <div className={`${size} border-4 border-primary border-t-transparent rounded-full animate-spin`} />
        </div>
    );
};

export default LoadingSpinner;