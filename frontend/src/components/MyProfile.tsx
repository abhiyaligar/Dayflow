import React, { useState } from 'react';
import type { Employee, UserRole } from '../types';
import { calculateSalaryInfo } from '../utils/salary';
import { employeesApi, authApi, payrollApi } from '../api';

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
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary' | 'security' | 'documents'>('resume');
  
  // Documents Management Local States
  const [documents, setDocuments] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const loadDocuments = async () => {
    setDocLoading(true);
    setDocError('');
    try {
      const docs = await employeesApi.listDocs(employee.loginId);
      setDocuments(docs);
    } catch (err: any) {
      setDocError(err.message || 'Failed to load documents.');
    } finally {
      setDocLoading(false);
    }
  };

  React.useEffect(() => {
    loadDocuments();
  }, [employee.loginId]);

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    setDocError('');
    try {
      await employeesApi.uploadDoc(employee.loginId, file);
      await loadDocuments();
    } catch (err: any) {
      setDocError(err.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setDocError('');
    try {
      await employeesApi.deleteDoc(employee.loginId, docId);
      await loadDocuments();
    } catch (err: any) {
      setDocError(err.message || 'Failed to delete document.');
    }
  };
  
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        phone: mobile,
        address: address,
        profile_picture_url: avatarUrl,
        designation: employee.jobPosition,
        department: employee.department,
        joining_date: employee.privateInfo?.dateOfJoining || '2026-08-22',
      };

      await employeesApi.updateProfile(employee.loginId, payload);

      if (showSalaryTab) {
        try {
          await payrollApi.defineSalary(employee.loginId, {
            defined_wage: liveSalaryInfo.monthWage,
            wage_type: 'Monthly',
            performance_bonus: liveSalaryInfo.components.performanceBonus.amount,
          });
        } catch (payErr: any) {
          console.error("Failed to update salary structure:", payErr);
        }
      }

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
        salaryInfo: showSalaryTab ? liveSalaryInfo : employee.salaryInfo
      };

      onSaveProfile(updatedEmp);
      setFeedback({ type: 'success', message: 'Profile saved successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save profile. Please try again.' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setFeedback({ type: 'error', message: 'Please fill in all security fields.' });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    try {
      await authApi.changePassword(oldPassword, newPassword);
      setFeedback({ type: 'success', message: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update password.' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] px-8 py-8 w-full overflow-y-auto max-h-[calc(100vh-64px)] animate-fade-in space-y-6">
      
      {/* Header Info Banner */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
        <img
          src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
          alt={employee.name}
          className="w-20 h-20 rounded-full border border-[#E2E8F0] object-cover"
        />
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-lg font-bold text-[#111111] tracking-tight">{employee.name}</h2>
          <p className="text-[#718096] text-xs font-semibold mt-0.5">{employee.jobPosition}</p>
          <span className="inline-block font-mono text-[10px] text-[#4A5568] font-bold bg-[#F8F9FA] px-2.5 py-0.5 rounded border border-[#E2E8F0] mt-2">
            {employee.loginId}
          </span>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-xs">
            <div>
              <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Department</span>
              <span className="text-[#111111] font-semibold">{employee.department}</span>
            </div>
            <div>
              <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Manager</span>
              <span className="text-[#111111] font-semibold">{employee.manager}</span>
            </div>
            <div>
              <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Company</span>
              <span className="text-[#111111] font-semibold">{employee.company}</span>
            </div>
            <div>
              <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Joined Date</span>
              <span className="text-[#111111] font-semibold">{employee.privateInfo?.dateOfJoining}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback.message && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-bold border ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#2F855A]'
              : 'bg-[#FFF5F5] border-[#FED7D7] text-[#C53030]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-[#E2E8F0] space-x-1">
        {(['resume', 'private', 'salary', 'security', 'documents'] as const).map((tab) => {
          if (tab === 'salary' && !showSalaryTab) return null;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setFeedback({ type: '', message: '' });
              }}
              className={`px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#718096] hover:text-[#111111]'
              }`}
            >
              {tab === 'private' ? 'Private Info' : tab === 'salary' ? 'Salary Info' : tab}
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Tab 1: Resume Profile Info */}
        {activeTab === 'resume' && (
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl space-y-5 shadow-sm">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5">Avatar URL (Profile Picture)</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5">About / Bio</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5">Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5">Certifications (comma separated)</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5">Interests (comma separated)</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Private Info (Bank details + personal items) */}
        {activeTab === 'private' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Column */}
            <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">Personal Details</h3>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Date of Birth</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Residing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Nationality</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Personal Email</label>
                <input
                  type="email"
                  disabled={isReadOnly}
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Gender</label>
                  <select
                    disabled={isReadOnly}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Marital Status</label>
                  <select
                    disabled={isReadOnly}
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Phone Number (Editable)</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Location (Editable)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>
            </div>

            {/* Banking Column */}
            <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">Banking Coordinates</h3>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Bank Name</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Account Number</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">IFSC Code</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">PAN No</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={panNo}
                  onChange={(e) => setPanNo(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">UAN No</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={uanNo}
                  onChange={(e) => setUanNo(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Employee Code</label>
                <input
                  type="text"
                  disabled
                  value={employee.privateInfo?.bankDetails?.empCode || 'EMP001'}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#718096] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Salary Info (Only visible to Admin) */}
        {activeTab === 'salary' && showSalaryTab && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Editing settings */}
            <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl shadow-sm">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">
                Configure Salary Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5">Define Monthly Wage (Gross ₹)</label>
                  <input
                    type="number"
                    value={monthWage}
                    onChange={(e) => setMonthWage(Number(e.target.value))}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] focus:border-[#111111] rounded-xl px-4 py-2.5 text-xs text-[#111111] focus:bg-white focus:outline-none font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1.5">Define Fixed Performance Bonus (₹)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value))}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] focus:border-[#111111] rounded-xl px-4 py-2.5 text-xs text-[#111111] focus:bg-white focus:outline-none font-bold transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Calculations review */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings panel */}
              <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                  Earnings Breakdown (Auto-Calculated)
                </h4>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#111111] font-bold block">Basic Salary</span>
                      <span className="text-[#718096] text-[10px] font-medium">50% of monthly wage</span>
                    </div>
                    <span className="text-[#2F855A] font-bold">{formatCurrency(liveSalaryInfo.components.basic.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#111111] font-bold block">House Rent Allowance (HRA)</span>
                      <span className="text-[#718096] text-[10px] font-medium">50% of Basic Salary (25% of wage)</span>
                    </div>
                    <span className="text-[#2F855A] font-bold">{formatCurrency(liveSalaryInfo.components.hra.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#111111] font-bold block">Standard Allowance</span>
                      <span className="text-[#718096] text-[10px] font-medium">8.33% of monthly wage</span>
                    </div>
                    <span className="text-[#2F855A] font-bold">{formatCurrency(liveSalaryInfo.components.standard.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#111111] font-bold block">Performance Bonus</span>
                      <span className="text-[#718096] text-[10px] font-medium">Fixed amount allocated</span>
                    </div>
                    <span className="text-[#2F855A] font-bold">{formatCurrency(liveSalaryInfo.components.performanceBonus.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#111111] font-bold block">Leave Travel Allowance (LTA)</span>
                      <span className="text-[#718096] text-[10px] font-medium">8.33% of monthly wage</span>
                    </div>
                    <span className="text-[#2F855A] font-bold">{formatCurrency(liveSalaryInfo.components.lta.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-[#E2E8F0] pt-3.5">
                    <div>
                      <span className="text-[#111111] font-bold block">Fixed Allowance (Remainder)</span>
                      <span className="text-[#718096] text-[10px] font-medium">Wage - sum(all other components)</span>
                    </div>
                    <span className="text-[#2F855A] font-bold">{formatCurrency(liveSalaryInfo.components.fixedAllowance.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions panel */}
              <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                  Deductions & Company Cost
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#111111] font-bold block">Employee PF</span>
                      <span className="text-[#718096] text-[10px] font-medium">12% of Basic Salary</span>
                    </div>
                    <span className="text-[#C53030] font-bold">{formatCurrency(liveSalaryInfo.deductions.employeePF.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#111111] font-bold block">Employer PF</span>
                      <span className="text-[#718096] text-[10px] font-medium">12% of Basic (Paid by Employer)</span>
                    </div>
                    <span className="text-[#718096] font-bold">{formatCurrency(liveSalaryInfo.deductions.employerPF.amount)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-[#E2E8F0] pt-4">
                    <div>
                      <span className="text-[#111111] font-bold block">Professional Tax (PT)</span>
                      <span className="text-[#718096] text-[10px] font-medium">Fixed PT Deduction</span>
                    </div>
                    <span className="text-[#C53030] font-bold">{formatCurrency(liveSalaryInfo.deductions.professionalTax.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Row (Only rendered for Resume / Private Info / Salary tabs) */}
        {activeTab !== 'security' && activeTab !== 'documents' && (
          <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
            <button
              type="submit"
              className="bg-[#111111] hover:bg-[#222222] text-white font-bold text-xs tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Save Profile
            </button>
          </div>
        )}
      </form>

      {/* Tab 5: Documents list & upload (Independent) */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl space-y-6 shadow-sm mt-6 w-full">
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">Employee Documents</h3>
          
          {docError && (
            <div className="bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] px-4 py-2.5 rounded-xl text-xs font-semibold">
              {docError}
            </div>
          )}

          {/* Document Uploader Area */}
          <div className="border-2 border-dashed border-[#E2E8F0] hover:border-[#111111]/30 p-6 rounded-xl flex flex-col items-center justify-center transition-all bg-[#F8F9FA]">
            <svg className="w-8 h-8 text-[#A0AEC0] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xs font-bold text-[#111111] mb-1">Upload New Document</p>
            <p className="text-[10px] text-[#718096] mb-4">PDF, PNG, JPG, or DOCX (Max 10MB)</p>
            
            <label className="relative cursor-pointer bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
              <span>{uploadingDoc ? 'Uploading...' : 'Select File'}</span>
              <input
                type="file"
                onChange={handleUploadDoc}
                disabled={uploadingDoc}
                className="hidden"
              />
            </label>
          </div>

          {/* Documents List */}
          {docLoading ? (
            <div className="text-center py-6 text-xs text-[#718096] font-bold">Loading employee documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 border border-[#E2E8F0] rounded-xl text-xs text-[#718096] bg-white">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] hover:border-[#111111]/20 rounded-xl transition-all shadow-xs">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0] flex items-center justify-center text-[#111111] flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111111] truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-[9px] text-[#A0AEC0] font-semibold uppercase mt-0.5">
                        Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-[#F8F9FA] rounded-lg text-[#718096] hover:text-[#111111] transition-colors"
                      title="Download Document"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-[#718096] hover:text-red-500 transition-colors"
                      title="Delete Document"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Security Password Change (Independent Form) */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="bg-white border border-[#E2E8F0] p-6 rounded-xl max-w-xl space-y-4 shadow-sm animate-slide-up mt-6">
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">
            Change Password
          </h3>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1" htmlFor="oldPassword">Old Password</label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1" htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-[#111111] hover:bg-[#222222] text-white font-bold text-xs tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Update Password
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
