'use client';

import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

export interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export function CategoryItem({
  category,
  index,
  focusedIndex,
  setFocusedIndex,
  isSelected,
  onSelect,
}: {
  category: Category;
  index: number;
  focusedIndex: number;
  setFocusedIndex: (i: number) => void;
  isSelected: boolean;
  onSelect: (id: string, name: string) => void;
}) {
  const { ref, focused } = useFocusable({
    focusKey: `category-${index}`,
    onEnterPress: () => onSelect(category.category_id, category.category_name),
    onFocus: () => setFocusedIndex(index),
  });

  return (
    <div
      ref={ref}
      className={`
        relative w-full h-[6vw] flex items-center px-[1vw] transition-all duration-200 rounded-[1vw]
        ${focused
          ? 'scale-[1.08] z-10 shadow-[0_20px_40px_rgba(0,0,0,0.9)] bg-white'
          : 'opacity-70 bg-black/70'}
      `}
    >
      <span
        className={`text-[1.8vw] font-medium transition-colors ${
          focused ? 'text-black' : 'text-white/70'}`}
      >
        {category.category_name}
      </span>
    </div>
  );
}