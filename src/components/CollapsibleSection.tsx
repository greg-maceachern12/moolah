import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  color?: string;
  icon?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultExpanded = false, color = "bg-white", icon }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className={`${color} bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl transition shadow-s duration-300 ease-in-out`}>
      <button
        onClick={toggleExpanded}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors duration-200"      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-xl font-bold">{title}</span>
        </div>
        {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
      </button>
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;