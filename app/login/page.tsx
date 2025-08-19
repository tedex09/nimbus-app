'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { DeviceCodeLogin } from '@/components/DeviceCodeLogin';
import { Eye, EyeOff, User, Lock, Server } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, session } = useAppStore();
  
  const [serverCode, setServerCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeField, setActiveField] = useState<'server' | 'username' | 'password'>('server');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'credentials' | 'device-code'>('credentials');

  // Main container focusable
  const { ref: containerRef } = useFocusable({
    focusKey: 'login-container',
    isFocusBoundary: true,
  });

  useEffect(() => {
    if (session) {
      router.push('/');
      return;
    }
  }, [session, router]);

  const handleModeSwitch = useCallback((mode: 'credentials' | 'device-code') => {
    setLoginMode(mode);
    setFocusedElement(null);
  }, []);

  const handleFieldFocus = useCallback((field: 'server' | 'username' | 'password') => {
    setActiveField(field);
  }, []);

  const handleKeyboardType = useCallback((char: string) => {
    if (activeField === 'server') {
      setServerCode(prev => prev + char);
    } else if (activeField === 'username') {
      setUsername(prev => prev + char);
    } else if (activeField === 'password') {
      setPassword(prev => prev + char);
    }
  }, [activeField]);

  const handleKeyboardBackspace = useCallback(() => {
    if (activeField === 'server') {
      setServerCode(prev => prev.slice(0, -1));
    } else if (activeField === 'username') {
      setUsername(prev => prev.slice(0, -1));
    } else if (activeField === 'password') {
      setPassword(prev => prev.slice(0, -1));
    }
  }, [activeField]);

  const handleSubmit = useCallback(async () => {
    if (!serverCode.trim() || !username.trim() || !password.trim()) {
      return;
    }

    try {
      await login(serverCode.trim(), username.trim(), password.trim());
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, [serverCode, username, password, login, router]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, action?: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (action === 'submit') {
        handleSubmit();
      } else if (action === 'toggle-password') {
        setShowPassword(!showPassword);
      }
    }
  }, [handleSubmit, showPassword]);

  const getFieldValue = (field: 'server' | 'username' | 'password') => {
    switch (field) {
      case 'server': return serverCode;
      case 'username': return username;
      case 'password': return showPassword ? password : '•'.repeat(password.length);
      default: return '';
    }
  };

  const getFieldPlaceholder = (field: 'server' | 'username' | 'password') => {
    switch (field) {
      case 'server': return 'Digite o código do servidor';
      case 'username': return 'Digite seu usuário';
      case 'password': return 'Digite sua senha';
      default: return '';
    }
  };

  const getFieldIcon = (field: 'server' | 'username' | 'password') => {
    switch (field) {
      case 'server': return <Server className="w-8 h-8" />;
      case 'username': return <User className="w-8 h-8" />;
      case 'password': return <Lock className="w-8 h-8" />;
      default: return null;
    }
  };

  // Show device code login screen
  if (loginMode === 'device-code') {
    return (
      <DeviceCodeLogin 
        onBack={() => handleModeSwitch('credentials')} 
      />
    );
  }

  return (
    <motion.div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left Column - Virtual Keyboard */}
      <div className="flex-1 flex items-center justify-center p-8">
        <VirtualKeyboard
          focusKey="login-keyboard"
          onType={handleKeyboardType}
          onBackspace={handleKeyboardBackspace}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Right Column - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          className="w-full max-w-lg"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-7xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Nimbus
            </motion.h1>
            <motion.p 
              className="text-2xl text-gray-300"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Smart TV Experience
            </motion.p>
          </div>

          {/* Login Form */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-700">
            {/* Login Mode Selector */}
            <div className="mb-8">
              <div className="flex rounded-2xl bg-gray-800/50 p-2 gap-2">
                <motion.button
                  data-focus-key="credentials-mode"
                  className={`
                    flex-1 py-4 px-6 rounded-xl text-xl font-medium transition-all duration-200
                    border-2 border-transparent focus:outline-none
                    ${loginMode === 'credentials' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}
                    ${focusedElement === 'credentials-mode' ? 'border-white' : ''}
                  `}
                  onClick={() => handleModeSwitch('credentials')}
                  onFocus={() => setFocusedElement('credentials-mode')}
                  onBlur={() => setFocusedElement(null)}
                  whileFocus={{ scale: 1.02 }}
                >
                  Usuário e Senha
                </motion.button>
                
                <motion.button
                  data-focus-key="device-code-mode"
                  className={`
                    flex-1 py-4 px-6 rounded-xl text-xl font-medium transition-all duration-200
                    border-2 border-transparent focus:outline-none
                    ${loginMode === 'device-code' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}
                    ${focusedElement === 'device-code-mode' ? 'border-white' : ''}
                  `}
                  onClick={() => handleModeSwitch('device-code')}
                  onFocus={() => setFocusedElement('device-code-mode')}
                  onBlur={() => setFocusedElement(null)}
                  whileFocus={{ scale: 1.02 }}
                >
                  Entrar com Código
                </motion.button>
              </div>
            </div>

            <div className="space-y-8">
              {/* Server Code Field */}
              <div>
                <label className="block text-xl font-medium text-gray-200 mb-4">
                  Código do Servidor
                </label>
                <ServerField 
                  value={serverCode}
                  isActive={activeField === 'server'}
                  onFocus={() => handleFieldFocus('server')}
                />
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-xl font-medium text-gray-200 mb-4">
                  Usuário
                </label>
                <UsernameField 
                  value={username}
                  isActive={activeField === 'username'}
                  onFocus={() => handleFieldFocus('username')}
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xl font-medium text-gray-200 mb-4">
                  Senha
                </label>
                <PasswordField 
                  value={password}
                  showPassword={showPassword}
                  isActive={activeField === 'password'}
                  onFocus={() => handleFieldFocus('password')}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
              </div>

              {/* Submit Button */}
              <SubmitButton 
                isEnabled={!!(serverCode && username && password)}
                isLoading={isLoading}
                onSubmit={handleSubmit}
              />

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="text-red-400 text-xl text-center p-6 bg-red-900/20 rounded-2xl border border-red-500/30"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Instructions */}
          <motion.div 
            className="text-center mt-8 text-gray-400 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <p>Use as setas para navegar • Enter para selecionar</p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
// Componentes focáveis separados
function ServerField({ value, isActive, onFocus }: { value: string; isActive: boolean; onFocus: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: 'server-field',
    onEnterPress: onFocus,
  });

  return (
    <motion.div
      ref={ref}
      className={`
        w-full h-20 px-6 bg-gray-800/80 rounded-2xl text-2xl
        border-3 transition-all duration-200 cursor-pointer
        flex items-center gap-4
        ${isActive ? 'border-blue-500 bg-gray-700/80' : 'border-transparent'}
        ${focused ? 'border-white shadow-lg shadow-white/20' : ''}
      `}
      onClick={onFocus}
      whileFocus={{ scale: 1.02 }}
    >
      <div className="text-gray-400">
        <Server className="w-8 h-8" />
      </div>
      <div className="flex-1">
        {value || <span className="text-gray-500">Digite o código do servidor</span>}
      </div>
      {isActive && (
        <motion.div
          className="w-1 h-8 bg-blue-500 rounded-full"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function UsernameField({ value, isActive, onFocus }: { value: string; isActive: boolean; onFocus: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: 'username-field',
    onEnterPress: onFocus,
  });

  return (
    <motion.div
      ref={ref}
      className={`
        w-full h-20 px-6 bg-gray-800/80 rounded-2xl text-2xl
        border-3 transition-all duration-200 cursor-pointer
        flex items-center gap-4
        ${isActive ? 'border-blue-500 bg-gray-700/80' : 'border-transparent'}
        ${focused ? 'border-white shadow-lg shadow-white/20' : ''}
      `}
      onClick={onFocus}
      whileFocus={{ scale: 1.02 }}
    >
      <div className="text-gray-400">
        <User className="w-8 h-8" />
      </div>
      <div className="flex-1">
        {value || <span className="text-gray-500">Digite seu usuário</span>}
      </div>
      {isActive && (
        <motion.div
          className="w-1 h-8 bg-blue-500 rounded-full"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function PasswordField({ value, showPassword, isActive, onFocus, onTogglePassword }: { 
  value: string; 
  showPassword: boolean; 
  isActive: boolean; 
  onFocus: () => void; 
  onTogglePassword: () => void; 
}) {
  const { ref, focused } = useFocusable({
    focusKey: 'password-field',
    onEnterPress: onFocus,
  });

  const { ref: toggleRef, focused: toggleFocused } = useFocusable({
    focusKey: 'toggle-password',
    onEnterPress: onTogglePassword,
  });

  const displayValue = showPassword ? value : '•'.repeat(value.length);

  return (
    <motion.div
      ref={ref}
      className={`
        w-full h-20 px-6 bg-gray-800/80 rounded-2xl text-2xl
        border-3 transition-all duration-200 cursor-pointer
        flex items-center gap-4
        ${isActive ? 'border-blue-500 bg-gray-700/80' : 'border-transparent'}
        ${focused ? 'border-white shadow-lg shadow-white/20' : ''}
      `}
      onClick={onFocus}
      whileFocus={{ scale: 1.02 }}
    >
      <div className="text-gray-400">
        <Lock className="w-8 h-8" />
      </div>
      <div className="flex-1">
        {displayValue || <span className="text-gray-500">Digite sua senha</span>}
      </div>
      {value && (
        <motion.button
          ref={toggleRef}
          className={`
            text-gray-400 hover:text-white p-2 rounded-lg 
            border-2 transition-all duration-200
            ${toggleFocused ? 'border-white text-white' : 'border-transparent'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePassword();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
        </motion.button>
      )}
      {isActive && (
        <motion.div
          className="w-1 h-8 bg-blue-500 rounded-full"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function SubmitButton({ isEnabled, isLoading, onSubmit }: { 
  isEnabled: boolean; 
  isLoading: boolean; 
  onSubmit: () => void; 
}) {
  const { ref, focused } = useFocusable({
    focusKey: 'submit-button',
    onEnterPress: isEnabled ? onSubmit : undefined,
  });

  return (
    <motion.button
      ref={ref}
      className={`
        w-full h-20 rounded-2xl text-2xl font-bold
        border-3 transition-all duration-200
        ${focused ? 'border-white shadow-lg shadow-white/20' : 'border-transparent'}
        ${isEnabled 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' 
          : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
        ${isLoading ? 'opacity-50' : ''}
      `}
      onClick={onSubmit}
      disabled={!isEnabled || isLoading}
      whileFocus={{ scale: isEnabled ? 1.02 : 1 }}
      whileHover={{ scale: isEnabled ? 1.02 : 1 }}
      whileTap={{ scale: 0.98 }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-3">
          <motion.div
            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          Conectando...
        </div>
      ) : (
        'ENTRAR'
      )}
    </motion.button>
  );
}