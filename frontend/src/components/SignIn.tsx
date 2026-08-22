import React, { useState } from 'react';
import type { Employee } from '../types';

interface SignInProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: (user: Employee) => void;
  employees: Employee[];
}

export const SignIn: React.FC<SignInProps> = ({ onNavigate, onLoginSuccess, employees }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginId.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    // Authenticate client-side against mock employees list
    // Allow login via generated loginId (e.g. JADO2026001) OR standard email
    const user = employees.find(
      (emp) =>
        (emp.loginId.toLowerCase() === loginId.trim().toLowerCase() ||
          emp.email.toLowerCase() === loginId.trim().toLowerCase())
    );

    if (!user) {
      setError('Invalid Login ID or Email.');
      return;
    }

    // In a mock environment, we verify the password
    // If the user has a custom password (registered or onboarded), check that.
    // Otherwise, check against the default mock password "TemporaryPassword123!".
    const expectedPassword = user.password || 'TemporaryPassword123!';
    if (password !== expectedPassword) {
      setError('Incorrect password.');
      return;
    }

    // Success -> Log the user in and transition to Employees dashboard
    onLoginSuccess(user);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0e0f12] px-4 py-12">
      <div className="w-full max-w-md bg-[#16181d] border border-[#242730] p-8 rounded-xl shadow-xl">
        
        {/* Company Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded bg-purple-600 flex items-center justify-center font-bold text-white text-3xl tracking-wider mx-auto mb-3 shadow-md">
            DF
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in Page</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Human Resource Management System</p>
        </div>

        {/* Validation Errors */}
        {error && (
          <div className="mb-4 bg-rose-900/20 border border-rose-800 text-rose-300 px-4 py-2.5 rounded text-sm font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="loginId">
              Login ID / Email
            </label>
            <input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. JADO2026001 or email"
              className="w-full bg-[#0e0f12] border border-[#242730] rounded-md px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0e0f12] border border-[#242730] rounded-md pl-4 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-sm font-bold uppercase tracking-wider py-3 rounded-md transition-colors shadow-md mt-2"
          >
            SIGN IN
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('SIGN_UP')}
            className="text-xs text-slate-400 hover:text-purple-400 font-medium transition-colors focus:outline-none"
          >
            Don't have an Account? <span className="underline font-semibold text-slate-300 hover:text-purple-400">Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
};
