import React, { useState } from 'react';
import type { Employee, UserRole } from '../types';

interface EmployeeDetailModalProps {
  employee: Employee;
  currentRole: UserRole;
  onClose: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  currentRole,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary'>('resume');

  // Salary information is restricted STRICTLY to Admin role
  const showSalaryTab = currentRole === 'Admin';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#16181d] border border-[#242730] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col relative shadow-2xl animate-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 z-10 p-1.5 hover:bg-slate-800 rounded-md transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Scrollable Container */}
        <div className="overflow-y-auto p-6 sm:p-8">
          
          {/* View-Only Badge */}
          <div className="flex justify-end mb-4">
            <span className="bg-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded border border-slate-700">
              View-Only Mode
            </span>
          </div>

          {/* Profile Header Block */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-[#242730] mb-6">
            <img
              src={employee.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={employee.name}
              className="w-24 h-24 rounded-full border border-slate-700 object-cover shadow-inner"
            />
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{employee.name}</h2>
                <p className="text-purple-400 font-semibold text-sm">{employee.jobPosition}</p>
                <span className="inline-block font-mono text-xs text-slate-400 font-bold bg-[#0e0f12] px-2 py-0.5 rounded border border-[#242730] mt-1">
                  {employee.loginId}
                </span>
              </div>

              {/* Header Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-xs text-slate-300 bg-[#0e0f12]/50 p-4 rounded-lg border border-[#242730]">
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Email</span>
                  <span className="truncate block font-medium">{employee.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Mobile</span>
                  <span className="block font-medium">{employee.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Company</span>
                  <span className="block font-medium">{employee.company}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Department</span>
                  <span className="block font-medium">{employee.department}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Manager</span>
                  <span className="block font-medium">{employee.manager}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Location</span>
                  <span className="block font-medium">{employee.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs Navigation */}
          <div className="flex border-b border-[#242730] mb-6">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'resume'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Resume / Profile
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'private'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Private Info
            </button>
            {showSalaryTab && (
              <button
                onClick={() => setActiveTab('salary')}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'salary'
                    ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Salary Info
              </button>
            )}
          </div>

          {/* Tab Content Areas */}
          <div className="space-y-6">
            
            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div className="space-y-6">
                
                {/* About Section */}
                <div className="bg-[#0e0f12]/30 p-5 rounded-lg border border-[#242730]">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">About</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {employee.about || 'No description provided by the employee.'}
                  </p>
                </div>

                {/* Skills & Certs Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skills */}
                  <div className="bg-[#0e0f12]/30 p-5 rounded-lg border border-[#242730]">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {employee.skills.length === 0 && <span className="text-slate-500 text-sm">No skills added.</span>}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="bg-[#0e0f12]/30 p-5 rounded-lg border border-[#242730]">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Certifications</h4>
                    <ul className="space-y-2">
                      {employee.certifications.map((cert, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start space-x-2">
                          <span className="text-purple-500">🏆</span>
                          <span>{cert}</span>
                        </li>
                      ))}
                      {employee.certifications.length === 0 && (
                        <span className="text-slate-500 text-sm">No certifications listed.</span>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Interests & Hobbies */}
                <div className="bg-[#0e0f12]/30 p-5 rounded-lg border border-[#242730]">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Interests & Hobbies</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {employee.interests.join(', ') || 'No interests listed.'}
                  </p>
                </div>

                {/* CV File Attachment indicator */}
                <div className="flex items-center justify-between bg-[#0e0f12]/50 p-4 rounded-lg border border-[#242730]">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-white">Attached Resume</p>
                      <p className="text-xs text-slate-500">{employee.resumeName || 'cv_file.pdf'}</p>
                    </div>
                  </div>
                  <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
                    Download CV
                  </button>
                </div>

              </div>
            )}

            {/* Private Info Tab */}
            {activeTab === 'private' && employee.privateInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="bg-[#0e0f12]/30 p-5 rounded-lg border border-[#242730] space-y-3.5">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-[#242730] pb-2">
                    Personal Details
                  </h4>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Date of Birth</span>
                    <span className="text-slate-200 font-medium">{employee.privateInfo.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Residing Address</span>
                    <span className="text-slate-200 font-medium text-right max-w-[200px]">{employee.privateInfo.residingAddress}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Nationality</span>
                    <span className="text-slate-200 font-medium">{employee.privateInfo.nationality}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Personal Email</span>
                    <span className="text-slate-200 font-medium truncate max-w-[180px]">{employee.privateInfo.personalEmail}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Gender</span>
                    <span className="text-slate-200 font-medium">{employee.privateInfo.gender}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Marital Status</span>
                    <span className="text-slate-200 font-medium">{employee.privateInfo.maritalStatus}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Date of Joining</span>
                    <span className="text-slate-200 font-medium">{employee.privateInfo.dateOfJoining}</span>
                  </div>
                </div>

                {/* Banking & Identity Details */}
                <div className="bg-[#0e0f12]/30 p-5 rounded-lg border border-[#242730] space-y-3.5">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-[#242730] pb-2">
                    Banking & Identification
                  </h4>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Bank Name</span>
                    <span className="text-slate-200 font-medium">{employee.privateInfo.bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Account Number</span>
                    <span className="text-slate-200 font-mono font-medium">{employee.privateInfo.bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">IFSC Code</span>
                    <span className="text-slate-200 font-mono font-medium">{employee.privateInfo.bankDetails.ifscCode}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">PAN No</span>
                    <span className="text-slate-200 font-mono font-medium">{employee.privateInfo.bankDetails.panNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">UAN No</span>
                    <span className="text-slate-200 font-mono font-medium">{employee.privateInfo.bankDetails.uanNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Employee Code</span>
                    <span className="text-slate-200 font-medium">{employee.privateInfo.bankDetails.empCode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Salary Info Tab */}
            {activeTab === 'salary' && showSalaryTab && employee.salaryInfo && (
              <div className="space-y-6">
                
                {/* Wages overview card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0e0f12]/30 p-4 rounded-lg border border-[#242730] text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Wage Type</span>
                    <span className="text-white text-base font-semibold mt-1 block">{employee.salaryInfo.wageType} Wage</span>
                  </div>
                  <div className="bg-[#0e0f12]/30 p-4 rounded-lg border border-[#242730] text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Month Wage</span>
                    <span className="text-purple-400 text-lg font-bold mt-1 block">{formatCurrency(employee.salaryInfo.monthWage)}</span>
                  </div>
                  <div className="bg-[#0e0f12]/30 p-4 rounded-lg border border-[#242730] text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Yearly Wage</span>
                    <span className="text-purple-400 text-lg font-bold mt-1 block">{formatCurrency(employee.salaryInfo.yearlyWage)}</span>
                  </div>
                  <div className="bg-[#0e0f12]/30 p-4 rounded-lg border border-[#242730] text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Work Days / Week</span>
                    <span className="text-white text-base font-semibold mt-1 block">{employee.salaryInfo.workingDaysPerWeek} Days</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings Components list */}
                  <div className="bg-[#0e0f12]/30 p-5 rounded-lg border border-[#242730] space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#242730] pb-2">
                      Earnings Components
                    </h4>
                    
                    <div className="space-y-3.5">
                      {Object.values(employee.salaryInfo.components).map((comp, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-300 font-medium block">{comp.name}</span>
                            <span className="text-slate-500 text-[10px]">
                              {comp.calculationType === 'Percentage' ? `${comp.value}% of basic/wage` : 'Fixed Amount'}
                            </span>
                          </div>
                          <span className="text-emerald-400 font-semibold">{formatCurrency(comp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deductions list */}
                  <div className="bg-[#0e0f12]/30 p-5 rounded-lg border border-[#242730] space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#242730] pb-2">
                      Deductions & Benefits
                    </h4>
                    
                    <div className="space-y-4">
                      {/* PF details */}
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-300 font-medium block">Employee PF Contribution</span>
                          <span className="text-slate-500 text-[10px]">12% of Basic Salary</span>
                        </div>
                        <span className="text-rose-400 font-semibold">{formatCurrency(employee.salaryInfo.deductions.employeePF.amount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-300 font-medium block">Employer PF Contribution</span>
                          <span className="text-slate-500 text-[10px]">12% of Basic Salary (Company cost)</span>
                        </div>
                        <span className="text-slate-400 font-semibold">{formatCurrency(employee.salaryInfo.deductions.employerPF.amount)}</span>
                      </div>

                      {/* Professional tax */}
                      <div className="flex justify-between items-center text-xs border-t border-[#242730] pt-4">
                        <div>
                          <span className="text-slate-300 font-medium block">Professional Tax (PT)</span>
                          <span className="text-slate-500 text-[10px]">Fixed Deduction</span>
                        </div>
                        <span className="text-rose-400 font-semibold">{formatCurrency(employee.salaryInfo.deductions.professionalTax.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
