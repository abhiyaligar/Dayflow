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
    <div className="flex-1 flex items-center justify-center bg-[#F5F6FC] px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#E2E6F2] p-8 rounded-[20px] shadow-premium animate-fade-in">
        
        {/* Company Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#171717] flex items-center justify-center font-bold text-white text-2xl tracking-wider mx-auto mb-3.5 shadow-md shadow-[#171717]/10">
            DF
          </div>
          <h2 className="text-2xl font-extrabold text-[#171A45] tracking-tight">Sign in Page</h2>
          <p className="text-xs text-[#70738D] mt-1.5 uppercase tracking-widest font-bold">Human Resource Management System</p>
        </div>

        {/* Validation Errors */}
        {error && (
          <div className="mb-4 bg-[#E95D73]/10 border border-[#E95D73]/20 text-[#E95D73] px-4 py-2.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5" htmlFor="loginId">
              Login ID / Email
            </label>
            <input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. JADO2026001 or email"
              className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-3 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D]" htmlFor="password">
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
                className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl pl-4 pr-10 py-3 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-[#70738D] hover:text-[#171A45]"
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
            className="w-full bg-[#171717] hover:bg-[#262626] active:bg-[#111111] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md shadow-[#171717]/10 mt-2"
          >
            SIGN IN
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('SIGN_UP')}
            className="text-xs text-[#70738D] hover:text-[#171717] font-semibold transition-colors focus:outline-none"
          >
            Don't have an Account? <span className="underline font-bold text-[#171A45] hover:text-[#171717]">Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
};
