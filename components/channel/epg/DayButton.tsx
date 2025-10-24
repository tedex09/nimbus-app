import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";

export function DayButton({
  option,
  isSelected,
  onSelect
}: {
  option: { value: number; label: string; date: Date };
  isSelected: boolean;
  onSelect: () => void;
}) {

  const { ref, focused } = useFocusable({
    focusKey: `day-${option.value}`,
    onEnterPress: onSelect,
  });

  return (
    <div
      ref={ref}
      className={`
        flex-shrink-0 px-[1.2vw] py-[0.5vw] rounded-[2vw] text-[1.2vw]
        min-w-fit whitespace-nowrap
        ${isSelected ? 'bg-white/40 text-black font-bold' : 'text-white font-light'}
        ${focused ? '!bg-white !text-black' : ''}
      `}
    >
      {option.label}
    </div>
  );
}