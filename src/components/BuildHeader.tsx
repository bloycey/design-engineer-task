import React, { useId, useState } from "react";
import { Clock, X, Check, Loader2, type LucideIcon } from "lucide-react";
import BuildActionsComboButton from "./BuildActionsComboButton";
import { HeaderBreadcrumbStubs } from "./HeaderBreadcrumbStubs";
import DetailsToggle from "./DetailsToggle";
import FailedStatusIcon from "./FailedStatusIcon";
import FailureCard from "./FailureCard";
import Timeline from "./Timeline";
import type { BuildStatus, BuildStep, StepStatus } from "@/types/build";
import { cn } from "@/lib/utils";
import {
  getStatusColors,
  computeBuildStats,
  collectFailures,
  buildShortFailureSummary,
  getOtherJobsByStep,
  type BuildFailure,
} from "@/lib/buildStatus";

const OTHER_JOB_STATUS_STYLE: Record<
  StepStatus,
  { Icon: LucideIcon; iconClass: string; phrase: string }
> = {
  complete: { Icon: Check, iconClass: "text-green-600", phrase: "passed" },
  failed: { Icon: X, iconClass: "text-red-600", phrase: "failed" },
  "in-progress": {
    Icon: Loader2,
    iconClass: "animate-spin text-amber-500",
    phrase: "running",
  },
  pending: { Icon: Clock, iconClass: "text-zinc-400", phrase: "didn't run" },
};

const BADGE_STYLE = {
  running: {
    bg: "bg-amber-500",
    Icon: Loader2,
    iconClass: "text-white animate-spin",
    strokeWidth: 2,
  },
  complete: {
    bg: "bg-green-500",
    Icon: Check,
    iconClass: "text-white",
    strokeWidth: 3,
  },
  canceled: {
    bg: "bg-gray-400",
    Icon: X,
    iconClass: "text-white",
    strokeWidth: 2,
  },
  pending: {
    bg: "bg-gray-300",
    Icon: Clock,
    iconClass: "text-gray-600",
    strokeWidth: 2,
  },
} as const satisfies Record<
  Exclude<BuildStatus, "failed" | "passed">,
  { bg: string; Icon: LucideIcon; iconClass: string; strokeWidth: number }
>;

const StatusBadge: React.FC<{ status: BuildStatus }> = ({ status }) => {
  if (status === "failed") {
    return <FailedStatusIcon className="text-red-500" />;
  }
  const key = status === "passed" ? "complete" : status;
  const { bg, Icon, iconClass, strokeWidth } = BADGE_STYLE[key];
  return (
    <div className={`rounded-full p-1 ${bg}`}>
      <Icon
        size={16}
        aria-hidden="true"
        className={iconClass}
        strokeWidth={strokeWidth}
      />
    </div>
  );
};

interface BuildHeaderProps {
  /** Pipeline / project name shown in the breadcrumb. */
  pipelineName: string;
  /** Build number (e.g. "#17532"). */
  buildNumber: string;
  branch: string;
  pullRequest?: {
    number: number;
    title: string;
    author: { name: string; avatar?: string };
    triggeredAt: string;
  };
  buildSteps?: BuildStep[];
  status: BuildStatus;
  onCancelBuild?: () => void;
  onRestartBuild?: () => void;
  onRetryFailedJobs?: () => void;
  onRetryJob?: (failure: BuildFailure) => void;
  className?: string;
}

const BuildHeader: React.FC<BuildHeaderProps> = ({
  pipelineName,
  buildNumber,
  branch,
  pullRequest,
  status,
  onCancelBuild,
  onRestartBuild,
  onRetryFailedJobs,
  onRetryJob = (f) => console.log("retry job", f.label),
  className = "",
  buildSteps = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(status === "failed");
  const prTitleId = useId();
  const detailsRegionId = useId();

  const statusColors = getStatusColors(status);
  const buildNumberLabel = `#${buildNumber.replace(/^#/, "")}`;
  const buildStats = computeBuildStats(buildSteps);
  const failures = collectFailures(buildSteps);
  const otherJobGroups = getOtherJobsByStep(buildSteps);
  const shortFailureLine = buildShortFailureSummary(failures);

  const statusPrefix =
    status === "running"
      ? "Running for"
      : status === "failed"
        ? "Failed in"
        : status === "passed" || status === "complete"
          ? "Passed in"
          : status === "canceled"
            ? "Canceled after"
            : "Pending for";

  return (
    <div className={cn("bg-white", className)}>
      <div
        className={`group relative mx-2 lg:mx-3 mt-2 flex flex-col rounded-md border ${statusColors.bgColor} shadow transition-all duration-200`}
        style={{ borderColor: statusColors.topBorderColorHex }}
      >
        {/* Breadcrumb row */}
        <div className="m-3 rounded-md border border-zinc-200/60 bg-white/50 px-2 py-0.5 shadow-sm">
          <HeaderBreadcrumbStubs
            pipelineName={pipelineName}
            branch={branch}
            buildNumberLabel={buildNumberLabel}
          />
        </div>

        {/* PR row + expand/collapse + progress bar */}
        {pullRequest && (
          <section
            aria-labelledby={prTitleId}
            className="group/pr relative rounded-b-md px-3 pb-2 transition-all duration-50 ease-in-out"
          >
            <div className="pt-1 pb-0.5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex flex-none items-center gap-2">
                    <StatusBadge status={status} />

                    <div className="flex flex-col">
                      {shortFailureLine ? (
                        <>
                          <div
                            role="alert"
                            className="text-sm/tight font-semibold text-zinc-900"
                          >
                            {shortFailureLine}
                          </div>
                          <div className="mt-0.5 text-xs/4 text-zinc-600">
                            Ran for {buildStats.duration}
                            {buildStats.blockedCount > 0 &&
                              ` · ${buildStats.blockedCount} blocked`}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 text-sm/4 font-semibold text-zinc-900">
                            <span className="hidden sm:inline">
                              {statusPrefix}
                            </span>
                            <span>{buildStats.duration}</span>
                          </div>
                          <div className="text-xs/4 text-zinc-600">
                            {buildStats.summaryText}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="h-8 w-px flex-shrink-0 bg-zinc-300" />

                  <div className="min-w-0 flex-1">
                    <h3
                      id={prTitleId}
                      className="mb-0 truncate text-sm/4 font-medium text-zinc-800"
                    >
                      <span className="hidden sm:inline">
                        Pull Request #{pullRequest.number}:{" "}
                      </span>
                      <span className="sm:hidden">
                        PR #{pullRequest.number}:{" "}
                      </span>
                      {pullRequest.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs/4 text-zinc-600">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">
                          {pullRequest.author.name}
                        </span>
                        <span className="hidden sm:inline">triggered on</span>
                        <span className="sm:hidden">•</span>
                        <time className="truncate">
                          {pullRequest.triggeredAt}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1 text-sm text-gray-600">
                  <BuildActionsComboButton
                    status={status}
                    onCancelBuild={onCancelBuild}
                    onRestartBuild={onRestartBuild}
                    onRetryFailedJobs={onRetryFailedJobs}
                  />
                </div>
              </div>
            </div>

            <Timeline buildSteps={buildSteps} />

            {!isExpanded && buildSteps.length > 0 && (
              <div className="mt-3 flex justify-end">
                <DetailsToggle
                  isExpanded={false}
                  onClick={() => setIsExpanded(true)}
                  controls={detailsRegionId}
                />
              </div>
            )}

            <div
              id={detailsRegionId}
              className={`grid transition-[grid-template-rows,opacity] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isExpanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="flex flex-col gap-4 pt-3">
                  {failures.length > 0 && (
                    <section>
                      <h4 className="mb-2 text-sm font-semibold text-zinc-900">
                        Failures
                      </h4>
                      <ul className="flex flex-col gap-3">
                        {failures.map((failure) => (
                          <li key={failure.id}>
                            <FailureCard
                              failure={failure}
                              onRetryJob={onRetryJob}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {otherJobGroups.length > 0 && (
                    <section>
                      <h4 className="mb-2 text-sm font-semibold text-zinc-900">
                        Other jobs
                      </h4>
                      <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 text-xs shadow-sm">
                        {otherJobGroups.map((group) => (
                          <div key={group.parentStepId}>
                            <h5 className="font-medium text-zinc-500">
                              In {group.parentStepName}
                            </h5>
                            <ul className="mt-1 flex flex-col gap-1">
                              {group.otherJobs.map((job) => {
                                const { Icon, iconClass, phrase } =
                                  OTHER_JOB_STATUS_STYLE[job.status];
                                const showDuration =
                                  (job.status === "complete" ||
                                    job.status === "failed") &&
                                  job.duration &&
                                  job.duration !== "--";
                                return (
                                  <li
                                    key={job.id}
                                    className="flex items-center gap-1.5"
                                  >
                                    <Icon
                                      size={12}
                                      aria-hidden="true"
                                      className={cn(
                                        "flex-shrink-0",
                                        iconClass,
                                      )}
                                    />
                                    <span className="text-zinc-800">
                                      {job.name}
                                    </span>
                                    <span className="text-zinc-500">
                                      {phrase}
                                      {showDuration && ` · ${job.duration}`}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="flex justify-end pb-1 pt-2">
                  <DetailsToggle
                    isExpanded={true}
                    onClick={() => setIsExpanded(false)}
                    controls={detailsRegionId}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BuildHeader;
