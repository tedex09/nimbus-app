'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

interface VirtualKeyboardProps {
  onType: (char: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  focusKey: string;
}

interface KeyboardKeyProps {
  keyValue: string;
  focusKey: string;
  onPress: (key: string) => void;
}

function KeyboardKey({ keyValue, focusKey, onPress }: KeyboardKeyProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => onPress(keyValue),
  });

  const isDelete = keyValue === 'DEL';
  const isOk = keyValue === 'OK';

  return (
    <motion.button
      ref={ref}
      className={`
        relative h-16 min-w-16 rounded-xl font-bold text-xl
        border-3 transition-all duration-200
        ${isDelete ? 'bg-red-600 hover:bg-red-500 text-white min-w-20' : 
          isOk ? 'bg-green-600 hover:bg-green-500 text-white min-w-20' :
          'bg-gray-700 hover:bg-gray-600 text-white'}
        ${focused ? 'border-white shadow-lg shadow-white/30' : 'border-transparent'}
      `}
      onClick={() => onPress(keyValue)}
      whileFocus={{ scale: 1.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="relative z-10">
        {isDelete ? '⌫' : isOk ? '✓' : keyValue}
      </span>
      
      {/* Focus ring animation */}
      {focused && (
        <motion.div
          className="absolute inset-0 rounded-xl border-3 border-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
}
const KEYBOARD_LAYOUT = [
  ['a', 'B', 'C', 'D', 'e', 'F', 'G'],
  ['H', 'I', 'j', 'K', 'L', 'm', 'N'],
  ['o', 'P', 'Q', 'r', 's', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', '0', '1'],
  ['2', '3', '4', '5', '6', '7', '8'],
  ['9', '@', '.', '_', '-', 'DEL', 'OK']
];

export function VirtualKeyboard({ onType, onBackspace, onSubmit, focusKey }: VirtualKeyboardProps) {
  // Container focusable
  const { ref: containerRef } = useFocusable({
    focusKey: `${focusKey}-container`,
    isFocusBoundary: true,
  });

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'DEL') {
      onBackspace();
    } else if (key === 'OK') {
      onSubmit();
    } else {
      onType(key);
    }
  }, [onType, onBackspace, onSubmit]);

  return (
    <div ref={containerRef} className="w-full max-w-2xl">
      <div className="bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-700">
        <div className="space-y-3">
          {KEYBOARD_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-3">
              {row.map((key, keyIndex) => {
                return (
                  <KeyboardKey
                    key={`${focusKey}-${rowIndex}-${keyIndex}`}
                    keyValue={key}
                    focusKey={`${focusKey}-${rowIndex}-${keyIndex}`}
                    onPress={handleKeyPress}
                  />
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center text-gray-400 text-lg">
          Use as setas para navegar • Enter para selecionar
        </div>
      </div>
    </div>
  );
}