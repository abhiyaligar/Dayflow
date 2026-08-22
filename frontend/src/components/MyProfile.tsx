import React, { useState } from 'react';
import type { Employee, UserRole } from '../types';
import { calculateSalaryInfo } from '../mockData';

interface MyProfileProps {
  employee: Employee;
  currentRole: UserRole;
  onSaveProfile: (updatedEmp: Employee) => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({
  employee,
  currentRole,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary' | 'security'>('resume');
  
  // Local Profile Form States
  const [mobile, setMobile] = useState(employee.mobile);
  const [location, setLocation] = useState(employee.location);
  const [avatarUrl, setAvatarUrl] = useState(employee.avatarUrl || '');
  const [about, setAbout] = useState(employee.about || '');
  const [skills, setSkills] = useState(employee.skills.join(', '));
  const [certifications, setCertifications] = useState(employee.certifications.join(', '));
  const [interests, setInterests] = useState(employee.interests.join(', '));

  // Private Info Local States
  const [dob, setDob] = useState(employee.privateInfo?.dateOfBirth || '');
  const [address, setAddress] = useState(employee.privateInfo?.residingAddress || '');
  const [nationality, setNationality] = useState(employee.privateInfo?.nationality || '');
  const [personalEmail, setPersonalEmail] = useState(employee.privateInfo?.personalEmail || '');
  const [gender, setGender] = useState(employee.privateInfo?.gender || '');
  const [maritalStatus, setMaritalStatus] = useState(employee.privateInfo?.maritalStatus || '');
  
  // Banking States
  const [bankName, setBankName] = useState(employee.privateInfo?.bankDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(employee.privateInfo?.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(employee.privateInfo?.bankDetails?.ifscCode || '');
  const [panNo, setPanNo] = useState(employee.privateInfo?.bankDetails?.panNo || '');
  const [uanNo, setUanNo] = useState(employee.privateInfo?.bankDetails?.uanNo || '');

  // Salary Editing States (Only actionable if Admin)
  const [monthWage, setMonthWage] = useState(employee.salaryInfo?.monthWage || 80000);
  const [bonus, setBonus] = useState(employee.salaryInfo?.components?.performanceBonus?.amount || 0);

  // Security Toggles
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Feedback banners
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Edit Permissions:
  // - Employees can edit limited fields (address, mobile, avatarUrl).
  // - Admins and HR Officers have full edit permissions to modify all fields.
  const isReadOnly = currentRole === 'Employee';
  const showSalaryTab = currentRole === 'Admin';

  // Live calculated salary preview
  const liveSalaryInfo = calculateSalaryInfo(Number(monthWage), Number(bonus));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    // Construct updated employee details
    const updatedEmp: Employee = {
      ...employee,
      mobile: mobile,
      location: location,
      avatarUrl: avatarUrl,
      about: about,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      certifications: certifications.split(',').map(c => c.trim()).filter(Boolean),
      interests: interests.split(',').map(i => i.trim()).filter(Boolean),
      privateInfo: {
        dateOfBirth: dob,
        residingAddress: address,
        nationality: nationality,
        personalEmail: personalEmail,
        gender: gender,
        maritalStatus: maritalStatus,
        dateOfJoining: employee.privateInfo?.dateOfJoining || '2026-08-22',
        bankDetails: {
          accountNumber: accountNumber,
          bankName: bankName,
          ifscCode: ifscCode,
          panNo: panNo,
          uanNo: uanNo,
          empCode: employee.privateInfo?.bankDetails?.empCode || 'EMP001'
        }
      },
      // Save recalculated salary if Admin, else preserve existing
      salaryInfo: showSalaryTab ? liveSalaryInfo : employee.salaryInfo
    };

    onSaveProfile(updatedEmp);
    setFeedback({ type: 'success', message: 'Profile saved successfully!' });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setFeedback({ type: 'error', message: 'Please fill in all security fields.' });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    // Success
    setFeedback({ type: 'success', message: 'Password updated successfully!' });
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="flex-1 bg-[#F5F6FC] px-8 py-6 max-w-5xl mx-auto w-full">
      {/* Header Info Banner */}
      <div className="bg-white border border-[#E2E6F2] p-6 rounded-[24px] flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 relative shadow-premium">
        <img
          src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
          alt={employee.name}
          className="w-24 h-24 rounded-full border border-[#E2E6F2] object-cover shadow-sm"
        />
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-extrabold text-[#171A45] tracking-tight">{employee.name}</h2>
          <p className="text-[#6658F5] font-bold text-sm">{employee.jobPosition}</p>
          <span className="inline-block font-mono text-xs text-[#70738D] font-bold bg-[#F5F6FC] px-2.5 py-0.5 rounded-lg border border-[#E2E6F2] mt-1.5">
            {employee.loginId}
          </span>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
            <div>
              <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Department</span>
              <span className="text-[#171A45] font-semibold">{employee.department}</span>
            </div>
            <div>
              <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Manager</span>
              <span className="text-[#171A45] font-semibold">{employee.manager}</span>
            </div>
            <div>
              <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Company</span>
              <span className="text-[#171A45] font-semibold">{employee.company}</span>
            </div>
            <div>
              <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Joined Date</span>
              <span className="text-[#171A45] font-semibold">{employee.privateInfo?.dateOfJoining}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback.message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-xs font-bold border ${
            feedback.type === 'success'
              ? 'bg-[#43B77A]/10 border-[#43B77A]/20 text-[#43B77A]'
              : 'bg-[#E95D73]/10 border-[#E95D73]/20 text-[#E95D73]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-[#E2E6F2] mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('resume')}
          className={`px-4.5 py-2.5 text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
            activeTab === 'resume'
              ? 'border-[#6658F5] text-[#6658F5] bg-[#6658F5]/5'
              : 'border-transparent text-[#70738D] hover:text-[#171A45] hover:bg-[#F5F6FC]'
          }`}
        >
          Resume
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('private')}
          className={`px-4.5 py-2.5 text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
            activeTab === 'private'
              ? 'border-[#6658F5] text-[#6658F5] bg-[#6658F5]/5'
              : 'border-transparent text-[#70738D] hover:text-[#171A45] hover:bg-[#F5F6FC]'
          }`}
        >
          Private Info
        </button>
        {showSalaryTab && (
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className={`px-4.5 py-2.5 text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
              activeTab === 'salary'
                ? 'border-[#6658F5] text-[#6658F5] bg-[#6658F5]/5'
                : 'border-transparent text-[#70738D] hover:text-[#171A45] hover:bg-[#F5F6FC]'
            }`}
          >
            Salary Info
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4.5 py-2.5 text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-[#6658F5] text-[#6658F5] bg-[#6658F5]/5'
              : 'border-transparent text-[#70738D] hover:text-[#171A45] hover:bg-[#F5F6FC]'
          }`}
        >
          Security
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Tab 1: Resume Profile Info */}
        {activeTab === 'resume' && (
          <div className="bg-white border border-[#E2E6F2] p-6 rounded-[24px] space-y-5 shadow-premium">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5">Avatar URL (Profile Picture)</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5">About / Bio</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5">Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5">Certifications (comma separated)</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5">Interests (comma separated)</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Private Info (Bank details + personal items) */}
        {activeTab === 'private' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Column */}
            <div className="bg-white border border-[#E2E6F2] p-6 rounded-[24px] space-y-4 shadow-premium">
              <h3 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider border-b border-[#E2E6F2] pb-2">Personal Parameters</h3>
              
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Date of Birth</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Residing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Nationality</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Personal Email</label>
                <input
                  type="email"
                  disabled={isReadOnly}
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Gender</label>
                  <select
                    disabled={isReadOnly}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3 py-2 text-sm text-[#171A45] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Marital Status</label>
                  <select
                    disabled={isReadOnly}
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3 py-2 text-sm text-[#171A45] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Phone Number (Editable)</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Location (Editable)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
                />
              </div>
            </div>

            {/* Banking Column */}
            <div className="bg-white border border-[#E2E6F2] p-6 rounded-[24px] space-y-4 shadow-premium">
              <h3 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider border-b border-[#E2E6F2] pb-2">Banking Coordinates</h3>
              
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Bank Name</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Account Number</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">IFSC Code</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">PAN No</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={panNo}
                  onChange={(e) => setPanNo(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">UAN No</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={uanNo}
                  onChange={(e) => setUanNo(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Employee Code</label>
                <input
                  type="text"
                  disabled
                  value={employee.privateInfo?.bankDetails?.empCode || 'EMP001'}
                  className="w-full bg-[#F5F6FC]/60 border border-[#E2E6F2] rounded-xl px-4 py-2 text-sm text-[#70738D] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Salary Info (Only visible to Admin) */}
        {activeTab === 'salary' && showSalaryTab && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Editing settings */}
            <div className="bg-white border border-[#E2E6F2] p-6 rounded-[24px] shadow-premium">
              <h3 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider mb-4 border-b border-[#E2E6F2] pb-2">
                Configure Salary Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5">Define Monthly Wage (Gross ₹)</label>
                  <input
                    type="number"
                    value={monthWage}
                    onChange={(e) => setMonthWage(Number(e.target.value))}
                    className="w-full bg-[#F5F6FC] border border-[#6658F5]/30 focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] rounded-xl px-4 py-2.5 text-sm text-[#171A45] focus:bg-white focus:outline-none font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1.5">Define Fixed Performance Bonus (₹)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value))}
                    className="w-full bg-[#F5F6FC] border border-[#E2E6F2] focus:border-[#6658F5] focus:ring-1 focus:ring-[#6658F5] rounded-xl px-4 py-2.5 text-sm text-[#171A45] focus:bg-white focus:outline-none font-bold transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Calculations review */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings panel */}
              <div className="bg-white border border-[#E2E6F2] p-5 rounded-[24px] space-y-4 shadow-premium">
                <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider border-b border-[#E2E6F2] pb-2">
                  Earnings Breakdown (Auto-Calculated)
                </h4>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#171A45] font-bold block">Basic Salary</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">50% of monthly wage</span>
                    </div>
                    <span className="text-[#43B77A] font-extrabold">{formatCurrency(liveSalaryInfo.components.basic.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#171A45] font-bold block">House Rent Allowance (HRA)</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">50% of Basic Salary (25% of wage)</span>
                    </div>
                    <span className="text-[#43B77A] font-extrabold">{formatCurrency(liveSalaryInfo.components.hra.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#171A45] font-bold block">Standard Allowance</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">8.33% of monthly wage</span>
                    </div>
                    <span className="text-[#43B77A] font-extrabold">{formatCurrency(liveSalaryInfo.components.standard.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#171A45] font-bold block">Performance Bonus</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">Fixed amount allocated</span>
                    </div>
                    <span className="text-[#43B77A] font-extrabold">{formatCurrency(liveSalaryInfo.components.performanceBonus.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#171A45] font-bold block">Leave Travel Allowance (LTA)</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">8.33% of monthly wage</span>
                    </div>
                    <span className="text-[#43B77A] font-extrabold">{formatCurrency(liveSalaryInfo.components.lta.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-[#E2E6F2] pt-3.5">
                    <div>
                      <span className="text-[#171A45] font-bold block">Fixed Allowance (Remainder)</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">Wage - sum(all other components)</span>
                    </div>
                    <span className="text-[#43B77A] font-extrabold">{formatCurrency(liveSalaryInfo.components.fixedAllowance.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions panel */}
              <div className="bg-white border border-[#E2E6F2] p-5 rounded-[24px] space-y-4 shadow-premium">
                <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider border-b border-[#E2E6F2] pb-2">
                  Deductions & Company Cost
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#171A45] font-bold block">Employee PF</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">12% of Basic Salary</span>
                    </div>
                    <span className="text-[#E95D73] font-bold">{formatCurrency(liveSalaryInfo.deductions.employeePF.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#171A45] font-bold block">Employer PF</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">12% of Basic (Paid by Employer)</span>
                    </div>
                    <span className="text-[#70738D] font-bold">{formatCurrency(liveSalaryInfo.deductions.employerPF.amount)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-[#E2E6F2] pt-4">
                    <div>
                      <span className="text-[#171A45] font-bold block">Professional Tax (PT)</span>
                      <span className="text-[#70738D] text-[10px] font-semibold">Fixed PT Deduction</span>
                    </div>
                    <span className="text-[#E95D73] font-bold">{formatCurrency(liveSalaryInfo.deductions.professionalTax.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Row (Only rendered for Resume / Private Info / Salary tabs) */}
        {activeTab !== 'security' && (
          <div className="flex justify-end pt-4 border-t border-[#E2E6F2]">
            <button
              type="submit"
              className="bg-[#6658F5] hover:bg-[#5748E8] text-white font-bold text-xs tracking-wider px-6 py-3 rounded-xl transition-all shadow-md shadow-[#6658F5]/10"
            >
              Save Profile
            </button>
          </div>
        )}
      </form>

      {/* Tab 4: Security Password Change (Independent Form) */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="bg-white border border-[#E2E6F2] p-6 rounded-[24px] max-w-lg space-y-4 mx-auto shadow-premium animate-slide-up">
          <h3 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider mb-4 border-b border-[#E2E6F2] pb-2">
            Change Password
          </h3>
          
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1" htmlFor="oldPassword">Old Password</label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1" htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-4 py-2.5 text-sm text-[#171A45] placeholder-[#9A9DB5] focus:bg-white focus:outline-none focus:border-[#6658F5] transition-all"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-[#6658F5] hover:bg-[#5748E8] text-white font-bold text-xs tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md shadow-[#6658F5]/10"
            >
              Update Password
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
