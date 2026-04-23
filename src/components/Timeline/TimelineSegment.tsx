import React from "react";
import { Check, Clock, Loader2, X, type LucideIcon } from "lucide-react";
import type { BuildStep, StepStatus } from "@/types/build";
import { getStatusLabel } from "@/lib/buildStatus";
import { cn } from "@/lib/utils";

const TIMELINE_STATUS_STYLE: Record<
  StepStatus,
  { classes: string; Icon: LucideIcon }
> = {
  complete: {
    classes: "bg-green-600 text-white hover:bg-green-700",
    Icon: Check,
  },
  "in-progress": {
    classes: "bg-amber-500 text-white hover:bg-amber-600",
    Icon: Loader2,
  },
  failed: {
    classes: "bg-red-700 text-white hover:bg-red-800",
    Icon: X,
  },
  pending: {
    classes: "bg-zinc-200 text-zinc-700 hover:bg-zinc-300",
    Icon: Clock,
  },
};

interface TimelineSegmentProps {
  step: BuildStep;
}

const TimelineSegment: React.FC<TimelineSegmentProps> = ({ step }) => {
  const { classes, Icon } = TIMELINE_STATUS_STYLE[step.status];
  const statusLabel = getStatusLabel(step.status);

  return (
    <a
      href="#pipeline-steps"
      className={cn(
        "relative flex h-full w-full items-center gap-1 overflow-hidden px-2 text-[10px] font-bold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
        classes,
      )}
      title={`${step.name} — ${statusLabel}`}
    >
      {step.status === "in-progress" && (
        <div className="animate-barber absolute inset-0" />
      )}
      <Icon
        size={12}
        aria-hidden="true"
        className={cn(
          "relative z-10 flex-shrink-0",
          step.status === "in-progress" && "animate-spin",
        )}
      />
      <span className="relative z-10 truncate">{step.name}</span>
      <span className="sr-only">, {statusLabel}</span>
    </a>
  );
};

export default TimelineSegment;
