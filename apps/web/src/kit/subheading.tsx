import React from 'react';

type SubheadingProps = {
    children: React.ReactNode;
    className?: string;
};

const Subheading: React.FC<SubheadingProps> = ({ children, className = '' }) => (
    <h2 className={`text-lg font-semibold text-800 ${className}`}>
        {children}
    </h2>
);

export default Subheading;