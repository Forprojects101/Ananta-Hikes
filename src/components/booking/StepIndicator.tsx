"use client";

import { useEffect, useRef } from "react";

interface StepIndicatorProps {
  steps: Array<{ number: number; title: string }>;
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const activeStep = stepRefs.current[currentStep];

    if (!scroller || !activeStep) return;
    if (window.matchMedia("(min-width: 640px)").matches) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const activeRect = activeStep.getBoundingClientRect();
    const delta =
      activeRect.left -
      scrollerRect.left -
      scroller.clientWidth / 2 +
      activeRect.width / 2;

    scroller.scrollTo({
      left: scroller.scrollLeft + delta,
      behavior: "smooth",
    });
  }, [currentStep]);

  return (
    <div className="w-full">
      <div
        ref={scrollerRef}
        className="overflow-x-auto sm:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="min-w-[540px] sm:min-w-0 flex items-start sm:items-center">
          {steps.map((step, index) => (
            <div
              key={step.number}
              ref={(el) => {
                stepRefs.current[index] = el;
              }}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-1/2 top-4 hidden h-0.5 w-full sm:block ${
                    index < currentStep
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      : "bg-slate-200"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 sm:h-9 sm:w-9 sm:text-sm ${
                  index <= currentStep
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-400"
                } ${
                  index === currentStep
                    ? "scale-105 ring-2 ring-emerald-200/80"
                    : "scale-100"
                }`}
              >
                {index < currentStep ? (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>

              <span
                className={`mt-1 text-[10px] font-semibold leading-tight transition-colors sm:text-xs ${
                  index <= currentStep ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
