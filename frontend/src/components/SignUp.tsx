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
    <div className="flex-1 flex items-center justify-center bg-[#F8F9FA] px-4 py-16">
      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] p-10 rounded-2xl shadow-sm animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#111111] flex items-center justify-center font-bold text-white text-xl tracking-tight mx-auto mb-4">
            DF
          </div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">Create your account</h2>
          <p className="text-xs text-[#718096] mt-1">Register your organization on Dayflow</p>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="mb-5 bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] px-4 py-3 rounded-xl text-xs font-medium flex items-start space-x-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] px-4 py-3 rounded-xl text-xs font-medium space-y-1">
            <p className="font-bold">Account created successfully!</p>
            <p className="text-[11px]">Your Login ID is: <strong className="font-mono bg-green-100 px-1.5 py-0.5 rounded border border-[#BBF7D0] text-[#166534]">{employeeId}</strong></p>
            <p className="text-[10px] text-[#166534]/80 pt-1">Redirecting to Sign In...</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="border-b border-[#E2E8F0] pb-4 mb-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5">
              Company Logo (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] flex items-center justify-center overflow-hidden flex-shrink-0">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5 text-[#A0AEC0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="text-xs text-[#718096] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#E2E8F0] file:text-xs file:font-semibold file:bg-white file:text-[#111111] hover:file:bg-[#F8F9FA] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5" htmlFor="companyName">
              Registered Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5" htmlFor="employeeId">
                Employee ID / Login ID
              </label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g., JASM2026001"
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5" htmlFor="role">
                Account Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'Employee' | 'HR')}
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
              >
                <option value="Employee">Employee</option>
                <option value="HR">HR Officer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., jane.smith@dayflow.com"
              className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-[#718096] hover:text-[#111111]"
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

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-[#718096] hover:text-[#111111]"
                >
                  {showConfirmPassword ? (
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
          </div>

          <button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.99] mt-4"
          >
            Register Account
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="text-center mt-6 border-t border-[#E2E8F0] pt-6">
          <button
            onClick={() => onNavigate('SIGN_IN')}
            className="text-xs text-[#718096] hover:text-[#111111] font-medium transition-colors focus:outline-none"
          >
            Already have an account? <span className="underline font-bold text-[#111111]">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
