import React, { useState } from "react";
import { ArrowDown, Check, Copy, RotateCcw, XCircle } from "lucide-react";
import { type BuildFailure } from "@/lib/buildStatus";

interface FailureCardProps {
  failure: BuildFailure;
  onRetryJob: (failure: BuildFailure) => void;
}

const FailureCard: React.FC<FailureCardProps> = ({ failure, onRetryJob }) => {
  const [copied, setCopied] = useState(false);

  const hasMeta =
    !!failure.command ||
    !!failure.duration ||
    !!failure.agent ||
    !!failure.queue;

  const handleCopy = () => {
    const lines = [
      failure.errorMessage,
      failure.testFile
        ? `${failure.testFile}${failure.line != null ? `:${failure.line}` : ""}`
        : null,
    ].filter((l): l is string => Boolean(l));
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <XCircle
            className="h-4 w-4 flex-shrink-0 text-red-600"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold leading-tight text-zinc-900">
              {failure.parentStepName && (
                <>
                  <span className="font-medium text-zinc-500">
                    {failure.parentStepName}
                  </span>
                  <span aria-hidden="true" className="mx-1.5 text-zinc-400">
                    /
                  </span>
                </>
              )}
              {failure.label}
            </h4>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
          <a
            href="#pipeline-steps"
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            Jump to job
            <ArrowDown size={14} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => onRetryJob(failure)}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Retry job
          </button>
        </div>
      </header>

      {failure.errorMessage && (
        <div className="relative mt-3 rounded border border-zinc-700 bg-zinc-900 p-2.5 font-mono text-xs">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy error message"}
            className="absolute right-1.5 top-1.5 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {copied ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
          </button>
          <pre className="m-0 whitespace-pre-wrap pr-7 text-zinc-100">
            {failure.errorMessage}
          </pre>
          {failure.testFile && (
            <p className="mt-1 pr-7 text-zinc-400">
              {failure.testFile}
              {failure.line != null ? `:${failure.line}` : ""}
            </p>
          )}
        </div>
      )}

      {hasMeta && (
        <dl className="mt-3 grid grid-cols-[max-content] gap-x-4 gap-y-1 text-xs">
          {failure.command && (
            <>
              <dt className="font-medium text-zinc-500">Command</dt>
              <dd className="col-start-2 m-0 text-zinc-800">
                <code className="rounded bg-zinc-200 px-1 py-0.5 text-[11px]">
                  {failure.command}
                </code>
              </dd>
            </>
          )}
          {failure.duration && (
            <>
              <dt className="font-medium text-zinc-500">Duration</dt>
              <dd className="col-start-2 m-0 text-zinc-800">
                {failure.duration}
              </dd>
            </>
          )}
          {failure.agent && (
            <>
              <dt className="font-medium text-zinc-500">Agent</dt>
              <dd className="col-start-2 m-0 text-zinc-800">{failure.agent}</dd>
            </>
          )}
          {failure.queue && (
            <>
              <dt className="font-medium text-zinc-500">Queue</dt>
              <dd className="col-start-2 m-0 text-zinc-800">{failure.queue}</dd>
            </>
          )}
        </dl>
      )}
    </article>
  );
};

export default FailureCard;
