import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DetailsToggleProps {
  isExpanded: boolean;
  onClick: () => void;
  controls: string;
}

const DetailsToggle: React.FC<DetailsToggleProps> = ({
  isExpanded,
  onClick,
  controls,
}) => (
  <button
    type="button"
    aria-expanded={isExpanded}
    aria-controls={controls}
    onClick={onClick}
    className="inline-flex flex-shrink-0 items-center gap-1 rounded text-xs font-medium text-red-700/70 transition-colors hover:text-red-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
  >
    <span>{isExpanded ? "Hide details" : "View details"}</span>
    {isExpanded ? (
      <ChevronUp size={14} aria-hidden="true" />
    ) : (
      <ChevronDown size={14} aria-hidden="true" />
    )}
  </button>
);

export default DetailsToggle;
