import React, { useState } from 'react';
import type { Employee } from '../types';
import { authApi, employeesApi, mapBackendProfileToEmployee } from '../api';

interface SignInProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: (user: Employee) => void;
}

export const SignIn: React.FC<SignInProps> = ({ onNavigate, onLoginSuccess }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginId.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // 1. Authenticate with backend
      const authData = await authApi.login(loginId.trim(), password.trim());

      // 2. Determine Employee ID
      let empId = loginId.trim();
      if (empId.includes('@')) {
        // If logged in with email, HR/Admin can query the directory
        if (authData.role === 'Admin' || authData.role === 'HR') {
          const list = await employeesApi.list();
          const matched = list.find((emp: any) => emp.email?.toLowerCase() === empId.toLowerCase());
          if (matched) {
            empId = matched.employee_id;
          } else {
            setError('Could not find Employee ID associated with this email. Please log in using your Employee ID instead.');
            return;
          }
        } else {
          setError('Please sign in using your unique Employee ID (e.g., JODO2026003) instead of your email address.');
          return;
        }
      }

      // 3. Retrieve detailed profile
      const profile = await employeesApi.getProfile(empId);
      const mappedUser = mapBackendProfileToEmployee(profile);

      // Save user details to localStorage
      localStorage.setItem('df_user', JSON.stringify(mappedUser));

      // 4. Trigger success callback
      onLoginSuccess(mappedUser);
    } catch (err: any) {
      setError(err.message || 'Incorrect Login ID or password.');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#F8F9FA] px-4 py-16">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] p-10 rounded-2xl shadow-sm animate-fade-in">
        
        {/* Company Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">Sign in to Dayflow</h2>
          <p className="text-xs text-[#718096] mt-1">Human Resource Management System</p>
        </div>

        {/* Validation Errors */}
        {error && (
          <div className="mb-6 bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] px-4 py-3 rounded-xl text-xs font-medium flex items-start space-x-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5" htmlFor="loginId">
              Employee ID or Email
            </label>
            <div className="relative">
              <input
                id="loginId"
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g., JADO2026001"
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
              />
              <svg className="w-4 h-4 text-[#A0AEC0] absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568]" htmlFor="password">
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
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-3 text-sm text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
              />
              <svg className="w-4 h-4 text-[#A0AEC0] absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-[#718096] hover:text-[#111111]"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943-9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.99] mt-2"
          >
            SIGN IN
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="text-center mt-6 border-t border-[#E2E8F0] pt-6">
          <button
            onClick={() => onNavigate('SIGN_UP')}
            className="text-xs text-[#718096] hover:text-[#111111] font-medium transition-colors focus:outline-none"
          >
            Don't have an account? <span className="underline font-bold text-[#111111]">Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
};
