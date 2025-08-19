import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

const TooltipContent: React.FC<{
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  isVisible: boolean;
  triggerRef: React.RefObject<HTMLElement>;
}> = ({ content, side = 'top', className = '', isVisible, triggerRef }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;
      
      switch (side) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + 8;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - 8;
          break;
      }
      
      setPosition({ top, left });
    }
  }, [isVisible, side, triggerRef]);

  if (!isVisible) return null;

  return (
    <div 
      ref={tooltipRef}
      className={`fixed z-50 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md ${className}`}
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 150ms ease-in-out'
      }}
    >
      {content}
    </div>
  );
};

const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative inline-block">
      <div 
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      <TooltipContent 
        content={content} 
        side={side} 
        className={className} 
        isVisible={isVisible}
        triggerRef={triggerRef}
      />
    </div>
  );
};

// These are just placeholders to maintain API compatibility with the previous implementation
const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;
const TooltipTrigger: React.FC<{ asChild?: boolean; children: ReactNode }> = ({ children }) => <>{children}</>;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

