'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';

interface VirtualKeyboardProps {
  onType: (char: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  focusKey: string;
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
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  useEffect(() => {
    // Set initial focus to first key
    setTimeout(() => {
      setFocus(`${focusKey}-0-0`);
    }, 100);
  }, [focusKey]);

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'DEL') {
      onBackspace();
    } else if (key === 'OK') {
      onSubmit();
    } else {
      onType(key);
    }
  }, [onType, onBackspace, onSubmit]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, key: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleKeyPress(key);
    }
  }, [handleKeyPress]);

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-700">
        <div className="space-y-3">
          {KEYBOARD_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-3">
              {row.map((key, keyIndex) => {
                const keyId = `${focusKey}-${rowIndex}-${keyIndex}`;
                const isSpecial = ['DEL', 'OK'].includes(key);
                const isDelete = key === 'DEL';
                const isOk = key === 'OK';
                
                return (
                  <motion.button
                    key={keyId}
                    data-focus-key={keyId}
                    className={`
                      relative h-16 min-w-16 rounded-xl font-bold text-xl
                      border-3 border-transparent transition-all duration-200
                      focus:outline-none focus:ring-0
                      ${isDelete ? 'bg-red-600 hover:bg-red-500 text-white min-w-20' : 
                        isOk ? 'bg-green-600 hover:bg-green-500 text-white min-w-20' :
                        'bg-gray-700 hover:bg-gray-600 text-white'}
                      ${focusedKey === keyId ? 'border-white shadow-lg shadow-white/30' : ''}
                    `}
                    onClick={() => handleKeyPress(key)}
                    onKeyDown={(e) => handleKeyDown(e, key)}
                    onFocus={() => setFocusedKey(keyId)}
                    onBlur={() => setFocusedKey(null)}
                    whileFocus={{ scale: 1.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relative z-10">
                      {isDelete ? '⌫' : isOk ? '✓' : key}
                    </span>
                    
                    {/* Focus ring animation */}
                    {focusedKey === keyId && (
                      <motion.div
                        className="absolute inset-0 rounded-xl border-3 border-white"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
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