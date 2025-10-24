'use client';

import { memo } from 'react';
import { DayButton } from './DayButton';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';

interface DayOption {
  value: number;
  label: string;
  date: Date;
}

interface DaySelectorProps {
  options: DayOption[];
  selectedDay: number;
  onSelectDay: (value: number) => void;
  className?: string;
}

function DaySelectorComponent({
  options,
  selectedDay,
  onSelectDay,
  className = '',
}: DaySelectorProps) {

  const { ref, focusKey } = useFocusable({
    focusKey: 'day-selector',
    saveLastFocusedChild: true,
  })

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className={`flex justify-center items-center bg-black/40 w-[45vw] p-[0.6vw] rounded-[2vw] gap-[0.5vw] ${className}`}
      >
        {options.map(opt => (
          <DayButton
            key={opt.value}
            option={opt}
            isSelected={selectedDay === opt.value}
            onSelect={() => onSelectDay(opt.value)}
          />
        ))}
      </div>
    </FocusContext.Provider>
  );
}

export const DaySelector = memo(DaySelectorComponent);
