import React, { useId, useState } from "react";
import { Clock, X, Check, Loader2 } from "lucide-react";
import BuildActionsComboButton from "./BuildActionsComboButton";
import { HeaderBreadcrumbStubs } from "./HeaderBreadcrumbStubs";
import DetailsToggle from "./DetailsToggle";
import FailedStatusIcon from "./FailedStatusIcon";
import FailureCard from "./FailureCard";
import Timeline from "./Timeline";
import type { BuildStep } from "@/types/build";
import { cn } from "@/lib/utils";
import {
	getStatusColors,
	computeBuildStats,
	collectFailures,
	buildShortFailureSummary,
	type BuildFailure
} from "@/lib/buildStatus";

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
	status:
		| "pending"
		| "running"
		| "passed"
		| "failed"
		| "canceled"
		| "complete";
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
	onRetryJob = f => console.log("retry job", f.label),
	className = "",
	buildSteps = []
}) => {
	const [isExpanded, setIsExpanded] = useState(status === "failed");
	const prTitleId = useId();
	const detailsRegionId = useId();

	const statusColors = getStatusColors(status);
	const buildNumberLabel = `#${buildNumber.replace(/^#/, "")}`;
	const buildStats = computeBuildStats(buildSteps);
	const failures = collectFailures(buildSteps);
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
						className="group/pr px-3 pb-2 rounded-b-md transition-all duration-50 ease-in-out relative"
					>
						<div className="pt-1 pb-0.5">
							<div className="flex flex-col sm:flex-row sm:items-center gap-1">
								<div className="flex items-center gap-3 min-w-0 flex-1">
									<div className="flex items-center gap-2 flex-0">
										{status === "failed" && (
											<FailedStatusIcon className="text-red-500" />
										)}
										{status === "running" && (
											<div className="rounded-full bg-amber-500 p-1">
												<Loader2
													size={16}
													className="text-white animate-spin"
												/>
											</div>
										)}
										{(status === "passed" ||
											status === "complete") && (
											<div className="rounded-full bg-green-500 p-1">
												<Check
													size={16}
													className="text-white"
													strokeWidth={3}
												/>
											</div>
										)}
										{status === "canceled" && (
											<div className="rounded-full bg-gray-400 p-1">
												<X
													size={16}
													className="text-white"
												/>
											</div>
										)}
										{status === "pending" && (
											<div className="rounded-full bg-gray-300 p-1">
												<Clock
													size={16}
													className="text-gray-600"
												/>
											</div>
										)}

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
														Ran for{" "}
														{buildStats.duration}
														{buildStats.blockedCount >
															0 &&
															` · ${buildStats.blockedCount} blocked`}
													</div>
												</>
											) : (
												<>
													<div className="flex items-center gap-1 text-sm/4 font-semibold text-zinc-900">
														<span className="hidden sm:inline">
															{statusPrefix}
														</span>
														<span>
															{
																buildStats.duration
															}
														</span>
													</div>
													<div className="text-xs/4 text-zinc-600">
														{buildStats.summaryText}
													</div>
												</>
											)}
										</div>
									</div>

									<div className="h-8 w-px bg-zinc-300 flex-shrink-0" />

									<div className="flex-1 min-w-0">
										<h3
											id={prTitleId}
											className="text-sm/4 font-medium text-zinc-800 truncate mb-0"
										>
											<span className="hidden sm:inline">
												Pull Request #
												{pullRequest.number}:{" "}
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
												<span className="hidden sm:inline">
													triggered on
												</span>
												<span className="sm:hidden">
													•
												</span>
												<time className="truncate">
													{pullRequest.triggeredAt}
												</time>
											</div>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-1 text-sm text-gray-600 flex-shrink-0">
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
										<ul className="flex flex-col gap-3">
											{failures.map(failure => (
												<li key={failure.id}>
													<FailureCard
														failure={failure}
														onRetryJob={onRetryJob}
													/>
												</li>
											))}
										</ul>
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
