"use client";

import { useSyncExternalStore } from "react";

interface CountdownTimerProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string, nowMs: number): TimeLeft {
  const difference = new Date(targetDate).getTime() - nowMs;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl sm:text-4xl md:text-6xl font-black tabular-nums text-white">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const nowInSeconds = useSyncExternalStore(
    (onStoreChange) => {
      const timer = window.setInterval(onStoreChange, 1000);
      return () => window.clearInterval(timer);
    },
    () => Math.floor(Date.now() / 1000),
    () => null
  );

  if (nowInSeconds === null) {
    return <div className="h-24" />;
  }

  const timeLeft = calculateTimeLeft(targetDate, nowInSeconds * 1000);

  const isOver =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isOver) {
    return (
      <div className="text-center">
        <span className="text-2xl md:text-4xl font-black text-brand-green uppercase tracking-wider">
          En curso
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4 md:gap-8 justify-center">
      <TimeBlock value={timeLeft.days} label="Dias" />
      <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-brand-green/50">:</span>
      <TimeBlock value={timeLeft.hours} label="Horas" />
      <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-brand-green/50">:</span>
      <TimeBlock value={timeLeft.minutes} label="Min" />
      <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-brand-green/50">:</span>
      <TimeBlock value={timeLeft.seconds} label="Seg" />
    </div>
  );
}
