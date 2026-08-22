import React, { useState } from 'react';
import type { Employee } from '../types';

interface SignUpProps {
  onNavigate: (view: string) => void;
  onRegister: (newEmp: Employee) => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onNavigate, onRegister }) => {
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredId, setRegisteredId] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Form validations
    if (!companyName.trim() || !name.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Auto-generate Login ID based on organization parameters:
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts[1] || 'Name';
    const firstPart = (firstName.substring(0, 2) + (lastName ? lastName.substring(0, 2) : 'XX')).toUpperCase();
    const generatedLoginId = `${firstPart}2026001`;

    const newEmp: Employee = {
      id: `e_reg_${Date.now()}`,
      loginId: generatedLoginId,
      password: password, // Store custom set password
      name: name.trim(),
      email: email.trim(),
      mobile: phone.trim(),
      company: companyName.trim(),
      department: 'Administration',
      manager: 'None (Board)',
      location: 'Gandhinagar, Gujarat',
      jobPosition: 'HR Generalist & Administrator',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}+${lastName}`,
      attendanceStatus: 'Absent',
      skills: [],
      certifications: [],
      interests: [],
      role: 'Admin', // Registers as Admin of the company
      privateInfo: {
        dateOfBirth: '1990-01-01',
        residingAddress: 'Gandhinagar',
        nationality: 'Indian',
        personalEmail: email.trim(),
        gender: 'Not Specified',
        maritalStatus: 'Single',
        dateOfJoining: '2026-08-22',
        bankDetails: {
          accountNumber: '9120100' + Math.floor(10000000 + Math.random() * 90000000),
          bankName: 'HDFC Bank Ltd',
          ifscCode: 'HDFC0000148',
          panNo: 'PAN' + Math.floor(10000 + Math.random() * 90000) + 'X',
          uanNo: '1004' + Math.floor(10000000 + Math.random() * 90000000),
          empCode: 'EMP001'
        }
      }
    };

    onRegister(newEmp);
    setRegisteredId(generatedLoginId);
    setSuccess(true);
    
    // Auto-navigate to Sign In page after 4.5 seconds to read credentials
    setTimeout(() => {
      onNavigate('SIGN_IN');
    }, 4500);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0e0f12] px-4 py-12">
      <div className="w-full max-w-lg bg-[#16181d] border border-[#242730] p-8 rounded-xl shadow-xl">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded bg-purple-600 flex items-center justify-center font-bold text-white text-2xl tracking-wider mx-auto mb-2 shadow-md">
            DF
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign Up Page</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Register Your Organization</p>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="mb-4 bg-rose-900/20 border border-rose-800 text-rose-300 px-4 py-2.5 rounded text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-900/20 border border-emerald-800 text-emerald-300 px-4 py-2.5 rounded text-sm font-medium space-y-1">
            <p>Account created successfully!</p>
            <p className="text-xs">Your Login ID is: <strong className="font-mono bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 text-emerald-400">{registeredId}</strong></p>
            <p className="text-[10px] text-emerald-400/70 pt-1">Redirecting to Sign In...</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Logo Upload Widget */}
          <div className="bg-[#0e0f12] border border-dashed border-[#242730] hover:border-purple-500 rounded-lg p-4 transition-all">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Company Logo Upload
            </label>
            <div className="flex flex-col items-center justify-center space-y-2">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-slate-400 text-center">
                {logoFile ? `Selected: ${logoFile.name}` : 'PNG, JPG or SVG up to 2MB'}
              </span>
              <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="companyName">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Odoo India"
                className="w-full bg-[#0e0f12] border border-[#242730] rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Harry Officer"
                className="w-full bg-[#0e0f12] border border-[#242730] rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@dayflow.com"
                className="w-full bg-[#0e0f12] border border-[#242730] rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-[#0e0f12] border border-[#242730] rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0e0f12] border border-[#242730] rounded-md pl-3 pr-9 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-2 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0e0f12] border border-[#242730] rounded-md pl-3 pr-9 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-2 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-sm font-bold uppercase tracking-wider py-3 rounded-md transition-colors shadow-md mt-4"
          >
            Sign Up
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="text-center mt-5">
          <button
            onClick={() => onNavigate('SIGN_IN')}
            className="text-xs text-slate-400 hover:text-purple-400 font-medium transition-colors focus:outline-none"
          >
            Already have an account? <span className="underline font-semibold text-slate-300 hover:text-purple-400">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
