import React from "react";
import type { BuildStep } from "@/types/build";
import { getJobCount, getTotalJobCount } from "./helpers";
import TimelineSegment from "./TimelineSegment";

interface TimelineProps {
  buildSteps: BuildStep[];
}

const Timeline: React.FC<TimelineProps> = ({ buildSteps }) => {
  if (buildSteps.length === 0) return null;

  const totalJobs = getTotalJobCount(buildSteps);

  return (
    <nav aria-label="Pipeline timeline" className="mt-1.5">
      <ol className="flex h-6 gap-[1px] overflow-hidden rounded-full bg-zinc-100">
        {buildSteps.map((step) => (
          <li
            key={step.id}
            className="h-full flex-shrink-0"
            style={{
              width: `${(getJobCount(step) / totalJobs) * 100}%`,
            }}
          >
            <TimelineSegment step={step} />
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Timeline;
