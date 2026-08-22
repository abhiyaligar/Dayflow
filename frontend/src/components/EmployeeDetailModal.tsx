import React, { useState, useEffect } from 'react';
import type { Employee, UserRole } from '../types';
import { employeesApi, payrollApi, attendanceApi } from '../api';
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
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary' | 'documents' | 'calendar'>('resume');

  // Documents Management States
  const [documents, setDocuments] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Attendance Logs Management States
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

  const loadLogs = async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const data = await attendanceApi.getEmployeeLogs(employee.loginId);
      setLogs(data);
    } catch (err: any) {
      setLogsError(err.message || 'Failed to load attendance logs.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadLogs();
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
      <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col relative shadow-sm animate-scale-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#718096] hover:text-[#111111] z-10 p-1.5 hover:bg-[#F8F9FA] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Scrollable Container */}
        <div className="overflow-y-auto p-6 sm:p-8">
          
          {/* View-Only Badge */}
          <div className="flex justify-end mb-4">
            <span className="bg-[#F8F9FA] text-[#718096] text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded border border-[#E2E8F0]">
              View-Only Mode
            </span>
          </div>

          {/* Profile Header Block */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-[#E2E8F0] mb-6">
            <img
              src={employee.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={employee.name}
              className="w-20 h-20 rounded-full border border-[#E2E8F0] object-cover"
            />
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111111] tracking-tight">{employee.name}</h2>
                <p className="text-[#718096] text-xs font-semibold">{employee.jobPosition}</p>
                <span className="inline-block font-mono text-[10px] text-[#4A5568] font-bold bg-[#F8F9FA] px-2.5 py-0.5 rounded border border-[#E2E8F0] mt-1.5">
                  {employee.loginId}
                </span>
              </div>

              {/* Header Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-xs text-[#111111] bg-[#F8F9FA] p-4 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Email</span>
                  <span className="truncate block font-semibold">{employee.email}</span>
                </div>
                <div>
                  <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Mobile</span>
                  <span className="block font-semibold">{employee.mobile}</span>
                </div>
                <div>
                  <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Company</span>
                  <span className="block font-semibold">{employee.company}</span>
                </div>
                <div>
                  <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Department</span>
                  <span className="block font-semibold">{employee.department}</span>
                </div>
                <div>
                  <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Manager</span>
                  <span className="block font-semibold">{employee.manager}</span>
                </div>
                <div>
                  <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Location</span>
                  <span className="block font-semibold">{employee.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs Navigation - Improved spacing with gap/margin utilities */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-[#E2E8F0] mb-6">
            <button
              onClick={() => setActiveTab('resume')}
              className={`pb-2.5 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all ${
                activeTab === 'resume'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#718096] hover:text-[#111111]'
              }`}
            >
              Resume
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`pb-2.5 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all ${
                activeTab === 'private'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#718096] hover:text-[#111111]'
              }`}
            >
              Private Info
            </button>
            {showSalaryTab && (
              <button
                onClick={() => setActiveTab('salary')}
                className={`pb-2.5 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all ${
                  activeTab === 'salary'
                    ? 'border-[#111111] text-[#111111]'
                    : 'border-transparent text-[#718096] hover:text-[#111111]'
                }`}
              >
                Salary Info
              </button>
            )}
             <button
              onClick={() => setActiveTab('documents')}
              className={`pb-2.5 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all ${
                activeTab === 'documents'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#718096] hover:text-[#111111]'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`pb-2.5 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all ${
                activeTab === 'calendar'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#718096] hover:text-[#111111]'
              }`}
            >
              Attendance Calendar
            </button>
          </div>

          {/* Tab Content Areas */}
          <div className="space-y-6">
            
            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div className="space-y-6">
                
                {/* About Section */}
                <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0]">
                  <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider mb-2">About</h4>
                  <p className="text-[#718096] text-xs leading-relaxed font-medium">
                    {employee.about || 'No description provided by the employee.'}
                  </p>
                </div>

                {/* Skills & Certs Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skills */}
                  <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0]">
                    <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="bg-white text-[#111111] text-[10px] px-2.5 py-1 rounded border border-[#E2E8F0] font-bold"
                        >
                          {skill}
                        </span>
                      ))}
                      {employee.skills.length === 0 && <span className="text-[#A0AEC0] text-xs font-bold">No skills added.</span>}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0]">
                    <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider mb-3">Certifications</h4>
                    <ul className="space-y-2">
                      {employee.certifications.map((cert, i) => (
                        <li key={i} className="text-[#111111] text-xs flex items-start space-x-2 font-semibold">
                          <span className="text-[#718096]">🏆</span>
                          <span>{cert}</span>
                        </li>
                      ))}
                      {employee.certifications.length === 0 && (
                        <span className="text-[#A0AEC0] text-xs font-bold">No certifications listed.</span>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Interests & Hobbies */}
                <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0]">
                  <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider mb-2">Interests & Hobbies</h4>
                  <p className="text-[#718096] text-xs leading-relaxed font-medium">
                    {employee.interests.join(', ') || 'No interests listed.'}
                  </p>
                </div>

                {/* CV File Attachment indicator */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Attached Resume</p>
                      <p className="text-[10px] text-[#718096] font-medium font-mono mt-0.5">{employee.resumeName || 'cv_file.pdf'}</p>
                    </div>
                  </div>
                  <button className="bg-white hover:bg-[#F8F9FA] text-[#111111] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm">
                    Download CV
                  </button>
                </div>

              </div>
            )}

            {/* Private Info Tab */}
            {activeTab === 'private' && employee.privateInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0] space-y-3.5">
                  <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">
                    Personal Details
                  </h4>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Date of Birth</span>
                    <span className="text-[#111111] font-semibold">{employee.privateInfo.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Residing Address</span>
                    <span className="text-[#111111] font-semibold text-right max-w-[200px]">{employee.privateInfo.residingAddress}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Nationality</span>
                    <span className="text-[#111111] font-semibold">{employee.privateInfo.nationality}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Personal Email</span>
                    <span className="text-[#111111] font-semibold truncate max-w-[180px]">{employee.privateInfo.personalEmail}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Gender</span>
                    <span className="text-[#111111] font-semibold">{employee.privateInfo.gender}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Marital Status</span>
                    <span className="text-[#111111] font-semibold">{employee.privateInfo.maritalStatus}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Date of Joining</span>
                    <span className="text-[#111111] font-semibold">{employee.privateInfo.dateOfJoining}</span>
                  </div>
                </div>

                {/* Banking & Identity Details */}
                <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0] space-y-3.5">
                  <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">
                    Banking & Identification
                  </h4>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Bank Name</span>
                    <span className="text-[#111111] font-semibold">{employee.privateInfo.bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Account Number</span>
                    <span className="text-[#111111] font-semibold font-mono">{employee.privateInfo.bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">IFSC Code</span>
                    <span className="text-[#111111] font-semibold font-mono">{employee.privateInfo.bankDetails.ifscCode}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">PAN No</span>
                    <span className="text-[#111111] font-semibold font-mono">{employee.privateInfo.bankDetails.panNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">UAN No</span>
                    <span className="text-[#111111] font-semibold font-mono">{employee.privateInfo.bankDetails.uanNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[9px]">Employee Code</span>
                    <span className="text-[#111111] font-semibold">{employee.privateInfo.bankDetails.empCode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Salary Info Tab */}
            {activeTab === 'salary' && showSalaryTab && employee.salaryInfo && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Editable Salary Structure Inputs */}
                <div className="bg-[#F8F9FA] border border-[#E2E8F0] p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2.5">
                    <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">
                      Define Salary Structure & Breakdown (HR/Admin)
                    </h4>
                    <span className="text-[10px] text-[#718096] font-bold">Configure components in real-time</span>
                  </div>

                  {salaryFeedback.message && (
                    <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold border ${
                      salaryFeedback.type === 'success'
                        ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#2F855A]'
                        : 'bg-[#FFF5F5] border-[#FED7D7] text-[#C53030]'
                    }`}>
                      {salaryFeedback.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#718096] mb-1">Defined Monthly Wage</label>
                      <input
                        type="number"
                        value={monthWage}
                        onChange={(e) => setMonthWage(Number(e.target.value))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#111111] font-bold focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#718096] mb-1">Wage Type</label>
                      <div className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#718096] font-bold select-none">
                        Fixed Corporate Wage
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#718096] mb-1">Performance Bonus</label>
                      <input
                        type="number"
                        value={bonus}
                        onChange={(e) => setBonus(Number(e.target.value))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#111111] font-bold focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSalary}
                      disabled={savingSalary}
                      className="bg-[#111111] hover:bg-[#222222] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                      {savingSalary ? 'Saving...' : 'Save Structure & Recalculate'}
                    </button>
                  </div>
                </div>

                {/* Wages overview card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E2E8F0] text-center">
                    <span className="text-[#A0AEC0] text-[10px] uppercase font-bold tracking-wider block">Wage Type</span>
                    <span className="text-[#111111] text-xs font-bold mt-1 block">{employee.salaryInfo.wageType} Wage</span>
                  </div>
                  <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E2E8F0] text-center">
                    <span className="text-[#A0AEC0] text-[10px] uppercase font-bold tracking-wider block">Month Wage</span>
                    <span className="text-[#111111] text-sm font-bold mt-1 block">{formatCurrency(employee.salaryInfo.monthWage)}</span>
                  </div>
                  <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E2E8F0] text-center">
                    <span className="text-[#A0AEC0] text-[10px] uppercase font-bold tracking-wider block">Yearly Wage</span>
                    <span className="text-[#111111] text-sm font-bold mt-1 block">{formatCurrency(employee.salaryInfo.yearlyWage)}</span>
                  </div>
                  <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E2E8F0] text-center">
                    <span className="text-[#A0AEC0] text-[10px] uppercase font-bold tracking-wider block">Work Days / Week</span>
                    <span className="text-[#111111] text-xs font-bold mt-1 block">{employee.salaryInfo.workingDaysPerWeek} Days</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings Components list */}
                  <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0] space-y-4">
                    <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                      Earnings Components
                    </h4>
                    
                    <div className="space-y-3.5">
                      {Object.values(employee.salaryInfo.components).map((comp: any, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[#111111] font-bold block">{comp.name}</span>
                            <span className="text-[#718096] text-[10px] font-semibold">
                              {comp.calculationType === 'Percentage' ? `${comp.value}% of basic/wage` : 'Fixed Amount'}
                            </span>
                          </div>
                          <span className="text-[#2F855A] font-bold">{formatCurrency(comp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deductions list */}
                  <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0] space-y-4">
                    <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                      Deductions & Benefits
                    </h4>
                    
                    <div className="space-y-4">
                      {/* PF details */}
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[#111111] font-bold block">Employee PF Contribution</span>
                          <span className="text-[#718096] text-[10px] font-semibold">12% of Basic Salary</span>
                        </div>
                        <span className="text-[#C53030] font-bold">{formatCurrency(employee.salaryInfo.deductions.employeePF.amount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[#111111] font-bold block">Employer PF Contribution</span>
                          <span className="text-[#718096] text-[10px] font-semibold">12% of Basic Salary (Company cost)</span>
                        </div>
                        <span className="text-[#718096] font-bold">{formatCurrency(employee.salaryInfo.deductions.employerPF.amount)}</span>
                      </div>

                      {/* Professional tax */}
                      <div className="flex justify-between items-center text-xs border-t border-[#E2E8F0] pt-4">
                        <div>
                          <span className="text-[#111111] font-bold block">Professional Tax (PT)</span>
                          <span className="text-[#718096] text-[10px] font-semibold">Fixed Deduction</span>
                        </div>
                        <span className="text-[#C53030] font-bold">{formatCurrency(employee.salaryInfo.deductions.professionalTax.amount)}</span>
                      </div>
                    </div>
                  </div>
              </div>

                {/* Salary Slip Generation Block */}
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">Salary Slip Center</h4>
                      <p className="text-[10px] text-[#718096] font-medium">Generate and automatically store employee payslips</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePayslip}
                      disabled={payslipLoading}
                      className="bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                      {payslipLoading ? 'Calculating...' : 'Generate Live Payslip'}
                    </button>
                  </div>

                  {payslipError && (
                    <div className="bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] px-4 py-2.5 rounded-xl text-xs font-semibold">
                      {payslipError}
                    </div>
                  )}

                  {/* Generated Payslip Card Preview */}
                  {generatedPayslip && (
                    <div className="bg-[#F8F9FA] text-[#111111] border border-[#E2E8F0] p-5 rounded-xl space-y-4 animate-scale-in">
                      <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-3">
                        <div>
                          <h5 className="font-bold text-xs uppercase tracking-tight text-[#111111]">DAYFLOW PAYSLIP</h5>
                          <p className="text-[10px] text-[#718096] font-bold uppercase mt-0.5">{generatedPayslip.month}</p>
                        </div>
                        <div>
                          <span className="inline-block bg-[#F0FDF4] border border-[#DCFCE7] text-[#2F855A] text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                            Calculated
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#A0AEC0] text-[9px] uppercase font-bold block">Employee ID</span>
                          <span className="font-semibold font-mono">{generatedPayslip.employee_id}</span>
                        </div>
                        <div>
                          <span className="text-[#A0AEC0] text-[9px] uppercase font-bold block">Name</span>
                          <span className="font-bold">{generatedPayslip.first_name} {generatedPayslip.last_name}</span>
                        </div>
                        <div>
                          <span className="text-[#A0AEC0] text-[9px] uppercase font-bold block">Total Days in Month</span>
                          <span className="font-semibold">{generatedPayslip.total_days_in_month} Days</span>
                        </div>
                        <div>
                          <span className="text-[#A0AEC0] text-[9px] uppercase font-bold block">Payable Days</span>
                          <span className="font-bold text-[#2F855A]">{generatedPayslip.payable_days} Days</span>
                        </div>
                      </div>

                      <div className="border-t border-b border-[#E2E8F0] py-3.5 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#718096] font-semibold">Base Monthly Wage:</span>
                          <span className="font-bold">{formatCurrency(generatedPayslip.base_wage)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#718096] font-semibold">Absence Deductions:</span>
                          <span className="font-bold text-[#C53030]">{formatCurrency(generatedPayslip.unpaid_leave_deduction)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#718096] font-semibold">Gross Earned Pay:</span>
                          <span className="font-bold text-[#2F855A]">{formatCurrency(generatedPayslip.gross_pay)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#718096] font-semibold">PF Deduction:</span>
                          <span className="font-bold text-[#C53030]">{formatCurrency(generatedPayslip.pf_deduction)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#718096] font-semibold">Professional Tax:</span>
                          <span className="font-bold text-[#C53030]">{formatCurrency(generatedPayslip.pt_deduction)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] font-bold uppercase text-[#111111]">Net Payable Amount:</span>
                        <span className="text-base font-bold text-[#111111]">{formatCurrency(generatedPayslip.net_pay)}</span>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleUploadPayslip}
                          disabled={uploadingPayslip}
                          className="bg-[#111111] hover:bg-[#222222] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Employee Documents</h3>
                  {(currentRole === 'HR Officer' || currentRole === 'Admin') && (
                    <span className="bg-[#F8F9FA] border border-[#E2E8F0] text-[#111111] text-[9px] uppercase font-bold px-2 py-0.5 rounded">
                      HR Management Access
                    </span>
                  )}
                </div>

                {docError && (
                  <div className="bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] px-4 py-2.5 rounded-xl text-xs font-semibold">
                    {docError}
                  </div>
                )}

                {/* Document Uploader Dropzone for HR/Admin */}
                {(currentRole === 'HR Officer' || currentRole === 'Admin') && (
                  <div className="border-2 border-dashed border-[#E2E8F0] hover:border-[#111111]/30 p-6 rounded-xl flex flex-col items-center justify-center transition-all bg-[#F8F9FA]">
                    <svg className="w-8 h-8 text-[#A0AEC0] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs font-bold text-[#111111] mb-1">Upload Document for {employee.name}</p>
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
                )}

                {/* Documents List */}
                {docLoading ? (
                  <div className="text-center py-6 text-xs text-[#718096] font-bold">Loading employee documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-10 border border-[#E2E8F0] rounded-xl text-xs text-[#718096] bg-[#F8F9FA]">
                    No documents uploaded for this employee yet.
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
                          {(currentRole === 'HR Officer' || currentRole === 'Admin') && (
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attendance Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
                  
                  {/* Calendar Navigation & Month Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-5">
                    <div>
                      <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Attendance Calendar</h3>
                      <p className="text-[10px] text-[#718096] font-medium mt-0.5 uppercase tracking-wider">Track employee monthly presence details</p>
                    </div>
                    
                    <div className="flex items-center space-x-1.5 bg-[#F8F9FA] border border-[#E2E8F0] p-1 rounded-xl">
                      <button
                        onClick={() => {
                          if (currentMonth === 0) {
                            setCurrentMonth(11);
                            setCurrentYear(prev => prev - 1);
                          } else {
                            setCurrentMonth(prev => prev - 1);
                          }
                        }}
                        className="p-1 hover:bg-white rounded text-[#718096] hover:text-[#111111] transition-colors cursor-pointer"
                        title="Previous Month"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <span className="text-[10px] font-bold text-[#111111] px-3 font-mono uppercase tracking-wider">
                        {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>

                      <button
                        onClick={() => {
                          if (currentMonth === 11) {
                            setCurrentMonth(0);
                            setCurrentYear(prev => prev + 1);
                          } else {
                            setCurrentMonth(prev => prev + 1);
                          }
                        }}
                        className="p-1 hover:bg-white rounded text-[#718096] hover:text-[#111111] transition-colors cursor-pointer"
                        title="Next Month"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Calendar Analytics Stats for the selected Month */}
                  {(() => {
                    // Precompute month-specific attendance count indicators
                    let fullyPresentCount = 0;
                    let partiallyAbsentCount = 0;
                    let totalAbsentCount = 0;
                    let onLeaveCount = 0;
                    const daysInSelMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

                    for (let d = 1; d <= daysInSelMonth; d++) {
                      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const cellLog = logs.find(l => l.date === cellDateStr);

                      if (cellLog) {
                        if (cellLog.status === 'Present') {
                          if ((cellLog.total_hours || 0) >= 8.0) {
                            fullyPresentCount++;
                          } else {
                            partiallyAbsentCount++;
                          }
                        } else if (cellLog.status === 'Leave') {
                          onLeaveCount++;
                        } else if (cellLog.status === 'Absent') {
                          totalAbsentCount++;
                        }
                      } else {
                        // Default past date logic
                        const cellDateObj = new Date(currentYear, currentMonth, d);
                        const todayObj = new Date();
                        todayObj.setHours(0,0,0,0);
                        if (cellDateObj < todayObj && !isWeekend) {
                          totalAbsentCount++;
                        }
                      }
                    }

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-[#F0FDF4] border border-[#DCFCE7] p-4 rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-[#2F855A] font-bold">Fully Present</span>
                          <span className="text-base font-bold text-[#111111] mt-1">{fullyPresentCount} Days</span>
                        </div>
                        <div className="bg-[#FEFCBF] border border-[#FEEBC8] p-4 rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-[#B7791F] font-bold">Under-hours / Partial</span>
                          <span className="text-base font-bold text-[#111111] mt-1">{partiallyAbsentCount} Days</span>
                        </div>
                        <div className="bg-[#FFF5F5] border border-[#FED7D7] p-4 rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-[#C53030] font-bold">Absent</span>
                          <span className="text-base font-bold text-[#111111] mt-1">{totalAbsentCount} Days</span>
                        </div>
                        <div className="bg-[#EBF8FF] border border-[#BEE3F8] p-4 rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-[#2B6CB0] font-bold">Leaves</span>
                          <span className="text-base font-bold text-[#111111] mt-1">{onLeaveCount} Days</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Calendar Render Grid */}
                  {logsError && (
                    <div className="bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 text-center">
                      {logsError}
                    </div>
                  )}

                  {logsLoading ? (
                    <div className="text-center py-12 text-xs text-[#718096] font-bold">Loading calendar logs...</div>
                  ) : (
                    <div>
                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2 border-b border-[#E2E8F0] pb-1.5">
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                        <div>Sun</div>
                      </div>

                      {/* Day cells grid */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {(() => {
                          const daysInSelMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                          let startDay = new Date(currentYear, currentMonth, 1).getDay();
                          // Adjust sunday (0) to end (6), and others to 0-indexed
                          startDay = startDay === 0 ? 6 : startDay - 1;

                          const cells = [];

                          // Empty placeholders for days preceding the 1st of the month
                          for (let i = 0; i < startDay; i++) {
                            cells.push(
                              <div key={`empty-${i}`} className="bg-[#F8F9FA]/40 border border-transparent rounded-xl h-20 sm:h-24"></div>
                            );
                          }

                          // Cells for actual days in the month
                          for (let d = 1; d <= daysInSelMonth; d++) {
                            const cellDateObj = new Date(currentYear, currentMonth, d);
                            const todayObj = new Date();
                            todayObj.setHours(0,0,0,0);
                            const isToday = cellDateObj.getTime() === todayObj.getTime();
                            const isFuture = cellDateObj > todayObj;
                            const dayOfWeek = cellDateObj.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                            const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const cellLog = logs.find(l => l.date === cellDateStr);

                            let cellBg = "bg-white border-[#E2E8F0]";
                            let statusBadge = null;

                            if (cellLog) {
                              if (cellLog.status === 'Present') {
                                if ((cellLog.total_hours || 0) >= 8.0) {
                                  cellBg = "bg-[#F0FDF4]/50 border-[#DCFCE7] hover:bg-[#F0FDF4] text-[#2F855A]";
                                  statusBadge = (
                                    <span className="text-[8px] bg-[#F0FDF4] text-[#2F855A] font-bold px-1.5 py-0.5 rounded border border-[#DCFCE7] tracking-wide font-mono block text-center truncate">
                                      {cellLog.total_hours?.toFixed(1)} Hrs
                                    </span>
                                  );
                                } else {
                                  // Under-hours / Partial
                                  cellBg = "bg-[#FEFCBF]/50 border-[#FEEBC8] hover:bg-[#FEFCBF] text-[#B7791F]";
                                  statusBadge = (
                                    <span className="text-[8px] bg-[#FEFCBF] text-[#B7791F] font-bold px-1.5 py-0.5 rounded border border-[#FEEBC8] tracking-wide font-mono block text-center truncate">
                                      {cellLog.total_hours?.toFixed(1)} Hrs
                                    </span>
                                  );
                                }
                              } else if (cellLog.status === 'Leave') {
                                cellBg = "bg-[#EBF8FF]/50 border-[#BEE3F8] hover:bg-[#EBF8FF] text-[#2B6CB0]";
                                statusBadge = (
                                  <span className="text-[8px] bg-[#EBF8FF] text-[#2B6CB0] font-bold px-1.5 py-0.5 rounded border border-[#BEE3F8] tracking-wide block text-center truncate">
                                    ON LEAVE
                                  </span>
                                );
                              } else if (cellLog.status === 'Absent') {
                                cellBg = "bg-[#FFF5F5]/50 border-[#FED7D7] hover:bg-[#FFF5F5] text-[#C53030]";
                                statusBadge = (
                                  <span className="text-[8px] bg-[#FFF5F5] text-[#C53030] font-bold px-1.5 py-0.5 rounded border border-[#FED7D7] tracking-wide block text-center truncate">
                                    ABSENT
                                  </span>
                                );
                              }
                            } else {
                              if (isFuture) {
                                cellBg = "bg-[#F8F9FA]/30 border-[#E2E8F0]/30 text-[#A0AEC0]";
                              } else if (isWeekend) {
                                cellBg = "bg-[#F8F9FA] border-[#E2E8F0]/50 text-[#718096]";
                                statusBadge = (
                                  <span className="text-[8px] text-[#A0AEC0] font-bold block text-center tracking-wider font-mono">
                                    WEEKEND
                                  </span>
                                );
                              } else {
                                // Default past date is absent if no log
                                cellBg = "bg-[#FFF5F5]/30 border-[#FED7D7]/50 hover:bg-[#FFF5F5]/50 text-[#C53030]";
                                statusBadge = (
                                  <span className="text-[8px] bg-[#FFF5F5] text-[#C53030] font-bold px-1.5 py-0.5 rounded border border-[#FED7D7] tracking-wide block text-center truncate">
                                    ABSENT
                                  </span>
                                );
                              }
                            }

                            cells.push(
                              <div
                                key={d}
                                className={`border rounded-xl p-2 h-20 sm:h-24 flex flex-col justify-between transition-all group ${cellBg} ${isToday ? 'ring-1 ring-[#111111] ring-offset-1' : ''}`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className={`text-[10px] font-mono font-bold ${isToday ? 'bg-[#111111] text-white w-4 h-4 flex items-center justify-center rounded-full' : ''}`}>
                                    {d}
                                  </span>
                                  {isToday && (
                                    <span className="text-[7px] bg-[#111111] text-white font-bold px-1 rounded uppercase scale-90">TODAY</span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  {cellLog && cellLog.check_in && (
                                    <div className="hidden sm:block text-[8px] font-semibold text-[#718096] font-mono leading-none truncate">
                                      IN: {new Date(cellLog.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </div>
                                  )}
                                  {cellLog && cellLog.check_out && (
                                    <div className="hidden sm:block text-[8px] font-semibold text-[#718096] font-mono leading-none truncate">
                                      OUT: {new Date(cellLog.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </div>
                                  )}
                                  {statusBadge}
                                </div>
                              </div>
                            );
                          }

                          return cells;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
