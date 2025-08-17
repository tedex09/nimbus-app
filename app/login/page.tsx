'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
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

  useEffect(() => {
    if (session) {
      router.push('/');
      return;
    }

    if (typeof window !== 'undefined') {
      init({
        debug: false,
        visualDebug: false,
      });
      
      setTimeout(() => {
        setFocus('server-field');
      }, 200);
    }
  }, [session, router]);

  const handleModeSwitch = useCallback((mode: 'credentials' | 'device-code') => {
    setLoginMode(mode);
    setFocusedElement(null);
    
    // Reset form state when switching modes
    if (mode === 'credentials') {
      setTimeout(() => {
        setFocus('server-field');
      }, 200);
    }
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
                <motion.div
                  data-focus-key="server-field"
                  className={`
                    w-full h-20 px-6 bg-gray-800/80 rounded-2xl text-2xl
                    border-3 border-transparent transition-all duration-200
                    focus:border-blue-500 focus:outline-none cursor-pointer
                    flex items-center gap-4
                    ${activeField === 'server' ? 'border-blue-500 bg-gray-700/80' : ''}
                    ${focusedElement === 'server-field' ? 'border-white shadow-lg shadow-white/20' : ''}
                  `}
                  tabIndex={0}
                  onClick={() => handleFieldFocus('server')}
                  onFocus={() => {
                    handleFieldFocus('server');
                    setFocusedElement('server-field');
                  }}
                  onBlur={() => setFocusedElement(null)}
                  onKeyDown={handleKeyDown}
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="text-gray-400">
                    {getFieldIcon('server')}
                  </div>
                  <div className="flex-1">
                    {serverCode || <span className="text-gray-500">{getFieldPlaceholder('server')}</span>}
                  </div>
                  {activeField === 'server' && (
                    <motion.div
                      className="w-1 h-8 bg-blue-500 rounded-full"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-xl font-medium text-gray-200 mb-4">
                  Usuário
                </label>
                <motion.div
                  data-focus-key="username-field"
                  className={`
                    w-full h-20 px-6 bg-gray-800/80 rounded-2xl text-2xl
                    border-3 border-transparent transition-all duration-200
                    focus:border-blue-500 focus:outline-none cursor-pointer
                    flex items-center gap-4
                    ${activeField === 'username' ? 'border-blue-500 bg-gray-700/80' : ''}
                    ${focusedElement === 'username-field' ? 'border-white shadow-lg shadow-white/20' : ''}
                  `}
                  tabIndex={0}
                  onClick={() => handleFieldFocus('username')}
                  onFocus={() => {
                    handleFieldFocus('username');
                    setFocusedElement('username-field');
                  }}
                  onBlur={() => setFocusedElement(null)}
                  onKeyDown={handleKeyDown}
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="text-gray-400">
                    {getFieldIcon('username')}
                  </div>
                  <div className="flex-1">
                    {username || <span className="text-gray-500">{getFieldPlaceholder('username')}</span>}
                  </div>
                  {activeField === 'username' && (
                    <motion.div
                      className="w-1 h-8 bg-blue-500 rounded-full"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xl font-medium text-gray-200 mb-4">
                  Senha
                </label>
                <motion.div
                  data-focus-key="password-field"
                  className={`
                    w-full h-20 px-6 bg-gray-800/80 rounded-2xl text-2xl
                    border-3 border-transparent transition-all duration-200
                    focus:border-blue-500 focus:outline-none cursor-pointer
                    flex items-center gap-4
                    ${activeField === 'password' ? 'border-blue-500 bg-gray-700/80' : ''}
                    ${focusedElement === 'password-field' ? 'border-white shadow-lg shadow-white/20' : ''}
                  `}
                  tabIndex={0}
                  onClick={() => handleFieldFocus('password')}
                  onFocus={() => {
                    handleFieldFocus('password');
                    setFocusedElement('password-field');
                  }}
                  onBlur={() => setFocusedElement(null)}
                  onKeyDown={handleKeyDown}
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="text-gray-400">
                    {getFieldIcon('password')}
                  </div>
                  <div className="flex-1">
                    {getFieldValue('password') || <span className="text-gray-500">{getFieldPlaceholder('password')}</span>}
                  </div>
                  {password && (
                    <motion.button
                      data-focus-key="toggle-password"
                      className="text-gray-400 hover:text-white focus:text-white focus:outline-none p-2 rounded-lg border-2 border-transparent focus:border-white"
                      onClick={() => setShowPassword(!showPassword)}
                      onKeyDown={(e) => handleKeyDown(e, 'toggle-password')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </motion.button>
                  )}
                  {activeField === 'password' && (
                    <motion.div
                      className="w-1 h-8 bg-blue-500 rounded-full"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.button
                data-focus-key="submit-button"
                className={`
                  w-full h-20 rounded-2xl text-2xl font-bold
                  border-3 border-transparent transition-all duration-200
                  focus:outline-none focus:border-white focus:shadow-lg focus:shadow-white/20
                  ${serverCode && username && password 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
                  ${isLoading ? 'opacity-50' : ''}
                `}
                onClick={handleSubmit}
                onKeyDown={(e) => handleKeyDown(e, 'submit')}
                disabled={!serverCode || !username || !password || isLoading}
                whileFocus={{ scale: 1.02 }}
                whileHover={{ scale: serverCode && username && password ? 1.02 : 1 }}
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