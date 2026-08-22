import React, { useState, useEffect } from 'react';
import type { Employee, UserRole } from '../types';
import { employeesApi, payrollApi } from '../api';
import { calculateSalaryInfo } from '../utils/salary';

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
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary' | 'documents'>('resume');

  // Documents Management States
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

  useEffect(() => {
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

  // Local Salary editing states
  const [monthWage, setMonthWage] = useState(employee.salaryInfo?.monthWage || 80000);
  const [bonus, setBonus] = useState(employee.salaryInfo?.components?.performanceBonus?.amount || 0);
  
  // Real-time calculated live salary info based on inputs
  const liveSalaryInfo = calculateSalaryInfo(monthWage, bonus);
  const [salaryFeedback, setSalaryFeedback] = useState({ type: '', message: '' });
  const [savingSalary, setSavingSalary] = useState(false);

  // Payslip generation states
  const [generatedPayslip, setGeneratedPayslip] = useState<any | null>(null);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [payslipError, setPayslipError] = useState('');
  const [uploadingPayslip, setUploadingPayslip] = useState(false);

  const handleSaveSalary = async () => {
    setSavingSalary(true);
    setSalaryFeedback({ type: '', message: '' });
    try {
      await payrollApi.defineSalary(employee.loginId, {
        defined_wage: monthWage,
        wage_type: 'Fixed',
        performance_bonus: bonus
      });
      setSalaryFeedback({ type: 'success', message: 'Salary structure updated successfully!' });
      // Mutate employee salaryInfo in-place in local render so it displays instantly
      employee.salaryInfo = {
        ...employee.salaryInfo,
        wageType: 'Fixed',
        monthWage,
        yearlyWage: liveSalaryInfo.yearlyWage,
        workingDaysPerWeek: liveSalaryInfo.workingDaysPerWeek,
        breakTime: employee.salaryInfo?.breakTime ?? 1,
        components: liveSalaryInfo.components as any,
        deductions: liveSalaryInfo.deductions as any
      };
    } catch (err: any) {
      setSalaryFeedback({ type: 'error', message: err.message || 'Failed to update salary structure.' });
    } finally {
      setSavingSalary(false);
    }
  };

  const handleGeneratePayslip = async () => {
    setPayslipLoading(true);
    setPayslipError('');
    try {
      const data = await payrollApi.getPayslip(employee.loginId);
      setGeneratedPayslip(data);
    } catch (err: any) {
      setPayslipError(err.message || 'Failed to generate payslip from backend.');
    } finally {
      setPayslipLoading(false);
    }
  };

  const handleUploadPayslip = async () => {
    if (!generatedPayslip) return;
    setUploadingPayslip(true);
    setPayslipError('');
    try {
      // Build a simple text Payslip
      const payslipText = `
========================================
       DAYFLOW HRMS - PAYSLIP
========================================
Employee ID:   ${generatedPayslip.employee_id}
Employee Name: ${generatedPayslip.first_name} ${generatedPayslip.last_name}
Month/Year:    ${generatedPayslip.month}
----------------------------------------
Total Days:    ${generatedPayslip.total_days_in_month}
Payable Days:  ${generatedPayslip.payable_days}
----------------------------------------
Base Wage:     INR ${generatedPayslip.base_wage}
Gross Pay:     INR ${generatedPayslip.gross_pay}
PF Deduction:  INR ${generatedPayslip.pf_deduction}
PT Deduction:  INR ${generatedPayslip.pt_deduction}
Absence Ded:   INR ${generatedPayslip.unpaid_leave_deduction}
----------------------------------------
NET PAYABLE:   INR ${generatedPayslip.net_pay}
========================================
Generated dynamically by Dayflow Admin/HR.
`;
      const file = new File([payslipText], `payslip_${generatedPayslip.month.replace(' ', '_')}.txt`, { type: 'text/plain' });
      await employeesApi.uploadDoc(employee.loginId, file);
      // Reload documents tab list
      await loadDocuments();
      alert('Payslip generated and uploaded to Employee Documents successfully!');
    } catch (err: any) {
      setPayslipError(err.message || 'Failed to upload payslip as document.');
    } finally {
      setUploadingPayslip(false);
    }
  };

  // Salary information is restricted to Admin & HR Officer roles
  const showSalaryTab = currentRole === 'Admin' || currentRole === 'HR Officer';

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
                <p className="text-[#171717] font-semibold text-sm">{employee.jobPosition}</p>
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
                  ? 'border-[#171717] text-[#171717] bg-[#171717]/5'
                  : 'border-transparent text-[#70738D] hover:text-[#171A45] hover:bg-[#F5F6FC]'
              }`}
            >
              Resume
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`px-4.5 py-2.5 text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
                activeTab === 'private'
                  ? 'border-[#171717] text-[#171717] bg-[#171717]/5'
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
                    ? 'border-[#171717] text-[#171717] bg-[#171717]/5'
                    : 'border-transparent text-[#70738D] hover:text-[#171A45] hover:bg-[#F5F6FC]'
                }`}
              >
                Salary Info
              </button>
            )}
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4.5 py-2.5 text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
                activeTab === 'documents'
                  ? 'border-[#171717] text-[#171717] bg-[#171717]/5'
                  : 'border-transparent text-[#70738D] hover:text-[#171A45] hover:bg-[#F5F6FC]'
              }`}
            >
              Documents
            </button>
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
                          className="bg-[#EAEAEA] text-[#171717] text-xs px-2.5 py-1 rounded-lg border border-[#171717]/10 font-bold"
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
                          <span className="text-[#171717]">🏆</span>
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
                    <svg className="w-8 h-8 text-[#171717]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <div className="space-y-6 animate-fade-in">
                
                {/* Editable Salary Structure Inputs */}
                <div className="bg-[#171717]/5 border border-[#171717]/20 p-5 rounded-[24px] space-y-4">
                  <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-2.5">
                    <h4 className="text-xs font-extrabold text-[#171717] uppercase tracking-wider">
                      Define Salary Structure & Breakdown (HR/Admin)
                    </h4>
                    <span className="text-[10px] text-[#70738D] font-bold">Configure components in real-time</span>
                  </div>

                  {salaryFeedback.message && (
                    <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold border ${
                      salaryFeedback.type === 'success'
                        ? 'bg-[#43B77A]/10 border-[#43B77A]/20 text-[#43B77A]'
                        : 'bg-[#E95D73]/10 border-[#E95D73]/20 text-[#E95D73]'
                    }`}>
                      {salaryFeedback.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Defined Monthly Wage</label>
                      <input
                        type="number"
                        value={monthWage}
                        onChange={(e) => setMonthWage(Number(e.target.value))}
                        className="w-full bg-white border border-[#E2E6F2] rounded-xl px-3.5 py-2 text-sm text-[#171A45] font-bold focus:outline-none focus:border-[#171717]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Wage Type</label>
                      <div className="w-full bg-[#F5F6FC] border border-[#E2E6F2] rounded-xl px-3.5 py-2.5 text-sm text-[#70738D] font-bold select-none">
                        Fixed Corporate Wage
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#70738D] mb-1">Performance Bonus</label>
                      <input
                        type="number"
                        value={bonus}
                        onChange={(e) => setBonus(Number(e.target.value))}
                        className="w-full bg-white border border-[#E2E6F2] rounded-xl px-3.5 py-2 text-sm text-[#171A45] font-bold focus:outline-none focus:border-[#171717]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSalary}
                      disabled={savingSalary}
                      className="bg-[#171717] hover:bg-[#111111] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                      {savingSalary ? 'Saving...' : 'Save Structure & Recalculate'}
                    </button>
                  </div>
                </div>

                {/* Wages overview card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#F5F6FC] p-4 rounded-[16px] border border-[#E2E6F2] text-center">
                    <span className="text-[#9A9DB5] text-[10px] uppercase font-bold tracking-wider block">Wage Type</span>
                    <span className="text-[#171A45] text-sm font-bold mt-1 block">{employee.salaryInfo.wageType} Wage</span>
                  </div>
                  <div className="bg-[#F5F6FC] p-4 rounded-[16px] border border-[#E2E6F2] text-center">
                    <span className="text-[#9A9DB5] text-[10px] uppercase font-bold tracking-wider block">Month Wage</span>
                    <span className="text-[#171717] text-base font-extrabold mt-1 block">{formatCurrency(employee.salaryInfo.monthWage)}</span>
                  </div>
                  <div className="bg-[#F5F6FC] p-4 rounded-[16px] border border-[#E2E6F2] text-center">
                    <span className="text-[#9A9DB5] text-[10px] uppercase font-bold tracking-wider block">Yearly Wage</span>
                    <span className="text-[#171717] text-base font-extrabold mt-1 block">{formatCurrency(employee.salaryInfo.yearlyWage)}</span>
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
                      {Object.values(employee.salaryInfo.components).map((comp: any, idx) => (
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

                {/* Salary Slip Generation Block */}
                <div className="bg-[#171A45] text-white p-6 rounded-[24px] space-y-4 shadow-lg">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#171717]">Salary Slip Center</h4>
                      <p className="text-[10px] text-white/60">Generate and automatically store employee payslips</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePayslip}
                      disabled={payslipLoading}
                      className="bg-[#171717] hover:bg-[#111111] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
                    >
                      {payslipLoading ? 'Calculating...' : 'Generate Live Payslip'}
                    </button>
                  </div>

                  {payslipError && (
                    <div className="bg-[#E95D73]/10 border border-[#E95D73]/20 text-[#E95D73] px-4 py-2.5 rounded-xl text-xs font-semibold">
                      {payslipError}
                    </div>
                  )}

                  {/* Generated Payslip Card Preview */}
                  {generatedPayslip && (
                    <div className="bg-white text-[#171A45] border border-[#E2E6F2] p-5 rounded-2xl space-y-4 animate-scale-in">
                      <div className="flex justify-between items-start border-b border-[#E2E6F2] pb-3">
                        <div>
                          <h5 className="font-extrabold text-sm uppercase tracking-tight text-[#171A45]">DAYFLOW PAYSLIP</h5>
                          <p className="text-[10px] text-[#70738D] font-bold uppercase mt-0.5">{generatedPayslip.month}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-[#43B77A]/10 border border-[#43B77A]/20 text-[#43B77A] text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
                            Calculated
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#9A9DB5] text-[9px] uppercase font-extrabold block">Employee ID</span>
                          <span className="font-semibold font-mono">{generatedPayslip.employee_id}</span>
                        </div>
                        <div>
                          <span className="text-[#9A9DB5] text-[9px] uppercase font-extrabold block">Name</span>
                          <span className="font-bold">{generatedPayslip.first_name} {generatedPayslip.last_name}</span>
                        </div>
                        <div>
                          <span className="text-[#9A9DB5] text-[9px] uppercase font-extrabold block">Total Days in Month</span>
                          <span className="font-semibold">{generatedPayslip.total_days_in_month} Days</span>
                        </div>
                        <div>
                          <span className="text-[#9A9DB5] text-[9px] uppercase font-extrabold block">Payable Days</span>
                          <span className="font-bold text-[#43B77A]">{generatedPayslip.payable_days} Days</span>
                        </div>
                      </div>

                      <div className="border-t border-b border-[#E2E6F2] py-3.5 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#70738D] font-bold">Base Monthly Wage:</span>
                          <span className="font-bold">{formatCurrency(generatedPayslip.base_wage)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#70738D] font-bold">Absence Deductions:</span>
                          <span className="font-bold text-[#E95D73]">{formatCurrency(generatedPayslip.unpaid_leave_deduction)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#70738D] font-bold">Gross Earned Pay:</span>
                          <span className="font-bold text-[#43B77A]">{formatCurrency(generatedPayslip.gross_pay)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#70738D] font-bold">PF Deduction:</span>
                          <span className="font-bold text-[#E95D73]">{formatCurrency(generatedPayslip.pf_deduction)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#70738D] font-bold">Professional Tax:</span>
                          <span className="font-bold text-[#E95D73]">{formatCurrency(generatedPayslip.pt_deduction)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-[#F5F6FC] p-3 rounded-xl border border-[#E2E6F2]">
                        <span className="text-xs font-extrabold uppercase text-[#171A45]">Net Payable Amount:</span>
                        <span className="text-base font-black text-[#171717]">{formatCurrency(generatedPayslip.net_pay)}</span>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleUploadPayslip}
                          disabled={uploadingPayslip}
                          className="bg-[#43B77A] hover:bg-[#39a068] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>{uploadingPayslip ? 'Uploading...' : 'Generate & Upload to Employee Docs'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6 animate-fade-in pb-4">
                <div className="flex justify-between items-center border-b border-[#E2E6F2] pb-3.5">
                  <h3 className="text-sm font-bold text-[#171A45] uppercase tracking-wider">Employee Documents</h3>
                  {(currentRole === 'HR Officer' || currentRole === 'Admin') && (
                    <span className="bg-[#171717]/10 border border-[#171717]/20 text-[#171717] text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg">
                      HR Management Access
                    </span>
                  )}
                </div>

                {docError && (
                  <div className="bg-[#E95D73]/10 border border-[#E95D73]/20 text-[#E95D73] px-4 py-2.5 rounded-xl text-xs font-semibold">
                    {docError}
                  </div>
                )}

                {/* Document Uploader Dropzone for HR/Admin */}
                {(currentRole === 'HR Officer' || currentRole === 'Admin') && (
                  <div className="border-2 border-dashed border-[#E2E6F2] hover:border-[#171717]/30 p-6 rounded-2xl flex flex-col items-center justify-center transition-all bg-[#F5F6FC]">
                    <svg className="w-8 h-8 text-[#9A9DB5] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs font-bold text-[#171A45] mb-1">Upload Document for {employee.name}</p>
                    <p className="text-[10px] text-[#70738D] mb-4">PDF, PNG, JPG, or DOCX (Max 10MB)</p>
                    
                    <label className="relative cursor-pointer bg-[#171717] hover:bg-[#111111] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
                      <span>{uploadingDoc ? 'Uploading...' : 'Select File'}</span>
                      <input
                        type="file"
                        onChange={handleUploadDoc}
                        disabled={uploadingDoc}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Documents List */}
                {docLoading ? (
                  <div className="text-center py-6 text-xs text-[#70738D] font-bold">Loading employee documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-10 border border-[#E2E6F2] rounded-2xl text-xs text-[#70738D] bg-[#F5F6FC]">
                    No documents uploaded for this employee yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3.5 bg-white border border-[#E2E6F2] hover:border-[#171717]/20 rounded-xl transition-all shadow-xs">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#171717]/10 flex items-center justify-center text-[#171717] flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#171A45] truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="text-[9px] text-[#9A9DB5] font-semibold uppercase mt-0.5">
                              Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-[#F5F6FC] rounded-lg text-[#70738D] hover:text-[#171717] transition-colors"
                            title="Download Document"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                          {(currentRole === 'HR Officer' || currentRole === 'Admin') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1.5 hover:bg-[#E95D73]/10 rounded-lg text-[#70738D] hover:text-[#E95D73] transition-colors"
                              title="Delete Document"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
