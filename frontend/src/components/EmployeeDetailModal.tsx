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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E6F2] rounded-[24px] max-w-4xl w-full max-h-[90vh] flex flex-col relative shadow-premium animate-scale-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#70738D] hover:text-[#171A45] z-10 p-1.5 hover:bg-[#F5F6FC] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Scrollable Container */}
        <div className="overflow-y-auto p-6 sm:p-8">
          
          {/* View-Only Badge */}
          <div className="flex justify-end mb-4">
            <span className="bg-[#F5F6FC] text-[#70738D] text-[10px] uppercase font-bold tracking-widest px-2.5 py-1.2 rounded-lg border border-[#E2E6F2]">
              View-Only Mode
            </span>
          </div>

          {/* Profile Header Block */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-[#E2E6F2] mb-6">
            <img
              src={employee.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={employee.name}
              className="w-24 h-24 rounded-full border border-[#E2E6F2] object-cover shadow-sm"
            />
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#171A45] tracking-tight">{employee.name}</h2>
                <p className="text-[#6658F5] font-semibold text-sm">{employee.jobPosition}</p>
                <span className="inline-block font-mono text-xs text-[#70738D] font-bold bg-[#F5F6FC] px-2.5 py-0.5 rounded-lg border border-[#E2E6F2] mt-1.5">
                  {employee.loginId}
                </span>
              </div>

              {/* Header Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-xs text-[#171A45] bg-[#F5F6FC] p-4 rounded-xl border border-[#E2E6F2]">
                <div>
                  <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Email</span>
                  <span className="truncate block font-semibold">{employee.email}</span>
                </div>
                <div>
                  <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Mobile</span>
                  <span className="block font-semibold">{employee.mobile}</span>
                </div>
                <div>
                  <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Company</span>
                  <span className="block font-semibold">{employee.company}</span>
                </div>
                <div className="mt-1">
                  <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Department</span>
                  <span className="block font-semibold">{employee.department}</span>
                </div>
                <div className="mt-1">
                  <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Manager</span>
                  <span className="block font-semibold">{employee.manager}</span>
                </div>
                <div className="mt-1">
                  <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider block mb-0.5">Location</span>
                  <span className="block font-semibold">{employee.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs Navigation */}
          <div className="flex border-b border-[#E2E6F2] mb-6">
            <button
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
          </div>

          {/* Tab Content Areas */}
          <div className="space-y-6">
            
            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div className="space-y-6">
                
                {/* About Section */}
                <div className="bg-[#F5F6FC] p-5 rounded-[16px] border border-[#E2E6F2]">
                  <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider mb-2">About</h4>
                  <p className="text-[#70738D] text-sm leading-relaxed font-medium">
                    {employee.about || 'No description provided by the employee.'}
                  </p>
                </div>

                {/* Skills & Certs Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skills */}
                  <div className="bg-[#F5F6FC] p-5 rounded-[16px] border border-[#E2E6F2]">
                    <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="bg-[#EEEAFE] text-[#6658F5] text-xs px-2.5 py-1 rounded-lg border border-[#6658F5]/10 font-bold"
                        >
                          {skill}
                        </span>
                      ))}
                      {employee.skills.length === 0 && <span className="text-[#9A9DB5] text-xs font-bold">No skills added.</span>}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="bg-[#F5F6FC] p-5 rounded-[16px] border border-[#E2E6F2]">
                    <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider mb-3">Certifications</h4>
                    <ul className="space-y-2">
                      {employee.certifications.map((cert, i) => (
                        <li key={i} className="text-[#171A45] text-xs flex items-start space-x-2 font-semibold">
                          <span className="text-[#6658F5]">🏆</span>
                          <span>{cert}</span>
                        </li>
                      ))}
                      {employee.certifications.length === 0 && (
                        <span className="text-[#9A9DB5] text-xs font-bold">No certifications listed.</span>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Interests & Hobbies */}
                <div className="bg-[#F5F6FC] p-5 rounded-[16px] border border-[#E2E6F2]">
                  <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider mb-2">Interests & Hobbies</h4>
                  <p className="text-[#70738D] text-sm leading-relaxed font-medium">
                    {employee.interests.join(', ') || 'No interests listed.'}
                  </p>
                </div>

                {/* CV File Attachment indicator */}
                <div className="flex items-center justify-between bg-[#F5F6FC]/60 p-4 rounded-[16px] border border-[#E2E6F2]">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-[#6658F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-extrabold text-[#171A45]">Attached Resume</p>
                      <p className="text-[10px] text-[#70738D] font-medium font-mono mt-0.5">{employee.resumeName || 'cv_file.pdf'}</p>
                    </div>
                  </div>
                  <button className="bg-white hover:bg-[#EEF0FA] text-[#171A45] border border-[#E2E6F2] px-3.5 py-1.8 rounded-xl text-xs font-bold transition-all shadow-sm">
                    Download CV
                  </button>
                </div>

              </div>
            )}

            {/* Private Info Tab */}
            {activeTab === 'private' && employee.privateInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="bg-[#F5F6FC] p-5 rounded-[16px] border border-[#E2E6F2] space-y-3.5">
                  <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider mb-4 border-b border-[#E2E6F2] pb-2">
                    Personal Details
                  </h4>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Date of Birth</span>
                    <span className="text-[#171A45] font-semibold">{employee.privateInfo.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Residing Address</span>
                    <span className="text-[#171A45] font-semibold text-right max-w-[200px]">{employee.privateInfo.residingAddress}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Nationality</span>
                    <span className="text-[#171A45] font-semibold">{employee.privateInfo.nationality}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Personal Email</span>
                    <span className="text-[#171A45] font-semibold truncate max-w-[180px]">{employee.privateInfo.personalEmail}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Gender</span>
                    <span className="text-[#171A45] font-semibold">{employee.privateInfo.gender}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Marital Status</span>
                    <span className="text-[#171A45] font-semibold">{employee.privateInfo.maritalStatus}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Date of Joining</span>
                    <span className="text-[#171A45] font-semibold">{employee.privateInfo.dateOfJoining}</span>
                  </div>
                </div>

                {/* Banking & Identity Details */}
                <div className="bg-[#F5F6FC] p-5 rounded-[16px] border border-[#E2E6F2] space-y-3.5">
                  <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider mb-4 border-b border-[#E2E6F2] pb-2">
                    Banking & Identification
                  </h4>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Bank Name</span>
                    <span className="text-[#171A45] font-semibold">{employee.privateInfo.bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Account Number</span>
                    <span className="text-[#171A45] font-semibold font-mono">{employee.privateInfo.bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">IFSC Code</span>
                    <span className="text-[#171A45] font-semibold font-mono">{employee.privateInfo.bankDetails.ifscCode}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">PAN No</span>
                    <span className="text-[#171A45] font-semibold font-mono">{employee.privateInfo.bankDetails.panNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">UAN No</span>
                    <span className="text-[#171A45] font-semibold font-mono">{employee.privateInfo.bankDetails.uanNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DB5] font-extrabold uppercase tracking-wider">Employee Code</span>
                    <span className="text-[#171A45] font-semibold">{employee.privateInfo.bankDetails.empCode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Salary Info Tab */}
            {activeTab === 'salary' && showSalaryTab && employee.salaryInfo && (
              <div className="space-y-6">
                
                {/* Wages overview card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#F5F6FC] p-4 rounded-[16px] border border-[#E2E6F2] text-center">
                    <span className="text-[#9A9DB5] text-[10px] uppercase font-bold tracking-wider block">Wage Type</span>
                    <span className="text-[#171A45] text-sm font-bold mt-1 block">{employee.salaryInfo.wageType} Wage</span>
                  </div>
                  <div className="bg-[#F5F6FC] p-4 rounded-[16px] border border-[#E2E6F2] text-center">
                    <span className="text-[#9A9DB5] text-[10px] uppercase font-bold tracking-wider block">Month Wage</span>
                    <span className="text-[#6658F5] text-base font-extrabold mt-1 block">{formatCurrency(employee.salaryInfo.monthWage)}</span>
                  </div>
                  <div className="bg-[#F5F6FC] p-4 rounded-[16px] border border-[#E2E6F2] text-center">
                    <span className="text-[#9A9DB5] text-[10px] uppercase font-bold tracking-wider block">Yearly Wage</span>
                    <span className="text-[#6658F5] text-base font-extrabold mt-1 block">{formatCurrency(employee.salaryInfo.yearlyWage)}</span>
                  </div>
                  <div className="bg-[#F5F6FC] p-4 rounded-[16px] border border-[#E2E6F2] text-center">
                    <span className="text-[#9A9DB5] text-[10px] uppercase font-bold tracking-wider block">Work Days / Week</span>
                    <span className="text-[#171A45] text-sm font-bold mt-1 block">{employee.salaryInfo.workingDaysPerWeek} Days</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings Components list */}
                  <div className="bg-[#F5F6FC] p-5 rounded-[16px] border border-[#E2E6F2] space-y-4">
                    <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider border-b border-[#E2E6F2] pb-2">
                      Earnings Components
                    </h4>
                    
                    <div className="space-y-3.5">
                      {Object.values(employee.salaryInfo.components).map((comp, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[#171A45] font-bold block">{comp.name}</span>
                            <span className="text-[#70738D] text-[10px] font-semibold">
                              {comp.calculationType === 'Percentage' ? `${comp.value}% of basic/wage` : 'Fixed Amount'}
                            </span>
                          </div>
                          <span className="text-[#43B77A] font-bold">{formatCurrency(comp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deductions list */}
                  <div className="bg-[#F5F6FC] p-5 rounded-[16px] border border-[#E2E6F2] space-y-4">
                    <h4 className="text-xs font-extrabold text-[#171A45] uppercase tracking-wider border-b border-[#E2E6F2] pb-2">
                      Deductions & Benefits
                    </h4>
                    
                    <div className="space-y-4">
                      {/* PF details */}
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[#171A45] font-bold block">Employee PF Contribution</span>
                          <span className="text-[#70738D] text-[10px] font-semibold">12% of Basic Salary</span>
                        </div>
                        <span className="text-[#E95D73] font-bold">{formatCurrency(employee.salaryInfo.deductions.employeePF.amount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[#171A45] font-bold block">Employer PF Contribution</span>
                          <span className="text-[#70738D] text-[10px] font-semibold">12% of Basic Salary (Company cost)</span>
                        </div>
                        <span className="text-[#70738D] font-bold">{formatCurrency(employee.salaryInfo.deductions.employerPF.amount)}</span>
                      </div>

                      {/* Professional tax */}
                      <div className="flex justify-between items-center text-xs border-t border-[#E2E6F2] pt-4">
                        <div>
                          <span className="text-[#171A45] font-bold block">Professional Tax (PT)</span>
                          <span className="text-[#70738D] text-[10px] font-semibold">Fixed Deduction</span>
                        </div>
                        <span className="text-[#E95D73] font-bold">{formatCurrency(employee.salaryInfo.deductions.professionalTax.amount)}</span>
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
