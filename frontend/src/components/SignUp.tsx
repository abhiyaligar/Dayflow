import React, { useState } from 'react';
import { authApi } from '../api';

interface SignUpProps {
  onNavigate: (view: string) => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onNavigate }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Employee' | 'HR'>('Employee');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Form validations
    if (!employeeId.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !companyName.trim()) {
      setError('Please fill in all fields (including Company Name).');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Call backend signup API
      await authApi.signup({
        employee_id: employeeId.trim(),
        email: email.trim(),
        password: password.trim(),
        role: role,
      });

      // Save company logo and company name locally to map multi-company environments dynamically
      if (companyLogo) {
        localStorage.setItem('df_company_logo', companyLogo);
      }
      localStorage.setItem('df_company_name', companyName.trim());

      setSuccess(true);
      
      // Auto-navigate to Sign In page after 3 seconds
      setTimeout(() => {
        onNavigate('SIGN_IN');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#F5F6FC] px-4 py-12">
      <div className="w-full max-w-lg bg-white border border-[#E2E6F2] p-8 rounded-[20px] shadow-premium animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#6658F5] flex items-center justify-center font-bold text-white text-2xl tracking-wider mx-auto mb-2 shadow-md shadow-[#6658F5]/10">
            DF
          </div>
          <h2 className="text-2xl font-extrabold text-[#171A45] tracking-tight">Sign Up Page</h2>
          <p className="text-xs text-[#70738D] mt-1.5 uppercase tracking-widest font-bold">Register Your Organization</p>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="mb-4 bg-[#E95D73]/10 border border-[#E95D73]/20 text-[#E95D73] px-4 py-2.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-[#43B77A]/10 border border-[#43B77A]/20 text-[#43B77A] px-4 py-2.5 rounded-xl text-xs font-semibold space-y-1">
            <p>Account created successfully!</p>
            <p className="text-[11px]">Your Login ID is: <strong className="font-mono bg-emerald-100/50 px-1.5 py-0.5 rounded border border-[#43B77A]/30 text-[#43B77A]">{employeeId}</strong></p>
            <p className="text-[10px] text-[#43B77A]/80 pt-1">Redirecting to Sign In...</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="border-b border-[#E2E6F2] pb-4 mb-4">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5">
              Company Logo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl border border-[#E2E6F2] bg-[#F5F6FC] flex items-center justify-center overflow-hidden">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-[#9A9DB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="text-xs text-[#70738D] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#6658F5]/10 file:text-[#6658F5] hover:file:bg-[#6658F5]/20 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5" htmlFor="companyName">
              Registered Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5" htmlFor="employeeId">
                Employee ID / Login ID
              </label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. JASM2026001"
                className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5" htmlFor="role">
                Account Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'Employee' | 'HR')}
                className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] focus:bg-white focus:outline-none focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] transition-all"
              >
                <option value="Employee">Employee</option>
                <option value="HR">HR Officer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane.smith@dayflow.com"
              className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-[#70738D] hover:text-[#171A45]"
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
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-[#70738D] hover:text-[#171A45]"
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
            className="w-full bg-[#6658F5] hover:bg-[#5748E8] active:bg-[#5243EF] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md shadow-[#6658F5]/10 mt-4"
          >
            Register Account
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="text-center mt-5">
          <button
            onClick={() => onNavigate('SIGN_IN')}
            className="text-xs text-[#70738D] hover:text-[#6658F5] font-semibold transition-colors focus:outline-none"
          >
            Already have an account? <span className="underline font-bold text-[#171A45] hover:text-[#6658F5]">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
