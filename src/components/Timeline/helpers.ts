import type { BuildStep } from "@/types/build";

export const getJobCount = (step: BuildStep) => step.jobs?.length || 1;

export const getTotalJobCount = (steps: BuildStep[]): number => {
  let total = 0;
  for (const step of steps) {
    total += getJobCount(step);
  }
  return total;
};
