import React, { useState } from 'react';
import type { LeaveRequest, UserRole, Employee } from '../types';

interface TimeOffModuleProps {
  leaveRequests: LeaveRequest[];
  currentRole: UserRole;
  currentUser: Employee | null;
  onApplyLeave: (newLeave: LeaveRequest, attachment?: File) => void;
  onReviewLeave: (leaveId: string, status: 'Approved' | 'Rejected') => void;
}

export const TimeOffModule: React.FC<TimeOffModuleProps> = ({
  leaveRequests,
  currentRole,
  currentUser,
  onApplyLeave,
  onReviewLeave,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeoff' | 'allocation'>('timeoff');

  // New Request Form States
  const [leaveType, setLeaveType] = useState<'Paid' | 'Sick' | 'Unpaid'>('Paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState('');

  const isAdminOrHR = currentRole === 'Admin' || currentRole === 'HR Officer';

  // Calculate leave duration in days
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const durationDays = calculateDays(startDate, endDate);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please select validity start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('End date must be on or after start date.');
      return;
    }

    // Sick Leave requires a medical certificate file attachment
    if (leaveType === 'Sick' && !attachment) {
      setError('Please upload a medical certificate attachment for Sick Leave.');
      return;
    }

    const newRequest: LeaveRequest = {
      id: `l_new_${Date.now()}`,
      employeeId: currentUser?.id || 'e_temp',
      employeeName: currentUser?.name || 'Employee',
      leaveType: leaveType,
      startDate: startDate,
      endDate: endDate,
      durationDays: durationDays,
      remarks: remarks.trim(),
      status: 'Pending',
      attachmentName: attachment ? attachment.name : undefined
    };

    onApplyLeave(newRequest, attachment || undefined);

    // Reset Form
    setLeaveType('Paid');
    setStartDate('');
    setEndDate('');
    setRemarks('');
    setAttachment(null);
    setShowRequestModal(false);
  };

  // Filter requests
  const filteredRequests = leaveRequests.filter((req) => {
    const matchesSearch = req.employeeName.toLowerCase().includes(searchTerm.toLowerCase().trim());
    if (isAdminOrHR) {
      return matchesSearch; // Admin sees everyone's requests
    } else {
      return req.employeeId === currentUser?.id; // Employee sees only their own
    }
  });

  const getStatusBadgeClass = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Approved':
        return 'text-[#2F855A] bg-[#F0FDF4] border-[#DCFCE7]';
      case 'Rejected':
        return 'text-[#C53030] bg-[#FFF5F5] border-[#FED7D7]';
      case 'Pending':
      default:
        return 'text-[#B7791F] bg-[#FEFCBF] border-[#FEEBC8]';
    }
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] px-8 py-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#111111] tracking-tight">Time Off & Leaves</h2>
          <p className="text-xs text-[#718096] mt-0.5 font-semibold uppercase tracking-wider">
            {isAdminOrHR ? 'Employee Leave Approvals Workspace' : 'My Personal Time-Off Board'}
          </p>
        </div>

        {/* Action Header controls */}
        <div className="flex items-center space-x-3">
          {/* Admin Navigation Tabs */}
          {isAdminOrHR && (
            <div className="flex bg-[#F8F9FA] border border-[#E2E8F0] p-1 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('timeoff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'timeoff' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#718096] hover:text-[#111111]'
                }`}
              >
                Time Off
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('allocation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'allocation' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#718096] hover:text-[#111111]'
                }`}
              >
                Allocation
              </button>
            </div>
          )}

          {/* Employee Request Trigger */}
          {!isAdminOrHR && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-[#111111] hover:bg-[#222222] text-white font-bold text-xs tracking-wider px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>APPLY LEAVE</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="space-y-6">
        
        {/* Balances widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[#718096] text-[10px] font-bold uppercase tracking-wider block">Paid Time Off</span>
              <span className="text-xl font-bold text-[#111111] mt-1 block">24 Days Available</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F8F9FA] text-[#718096] border border-[#E2E8F0] rounded">ANNUAL</span>
          </div>
          
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[#718096] text-[10px] font-bold uppercase tracking-wider block">Sick Leave</span>
              <span className="text-xl font-bold text-[#111111] mt-1 block">07 Days Available</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFF5F5] text-[#C53030] border border-[#FED7D7] rounded">MEDICAL</span>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="space-y-4 animate-slide-up">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAdminOrHR ? "Search requests by employee..." : "Search my requests..."}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:outline-none focus:border-[#111111] transition-all"
            />
            <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A0AEC0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#4A5568] border-b border-[#E2E8F0] uppercase font-bold tracking-wider text-[10px]">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Start Date</th>
                    <th className="p-4">End Date</th>
                    <th className="p-4 text-center">Days</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    {isAdminOrHR && <th className="p-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111111]">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="p-4 font-bold flex items-center space-x-2.5">
                        <span className="w-7 h-7 bg-[#F8F9FA] text-[#111111] border border-[#E2E8F0] rounded-full flex items-center justify-center font-bold text-[10px]">
                          {req.employeeName.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <span>{req.employeeName}</span>
                          {req.remarks && (
                            <p className="text-[10px] text-[#718096] font-normal mt-0.5 max-w-[200px] truncate" title={req.remarks}>
                              "{req.remarks}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[#111111]">{req.startDate}</td>
                      <td className="p-4 font-mono text-[#111111]">{req.endDate}</td>
                      <td className="p-4 font-mono text-center font-bold">{req.durationDays}</td>
                      <td className="p-4">
                        <span className="text-[#111111] font-semibold">{req.leaveType}</span>
                        {req.attachmentName && (
                          <span className="block text-[10px] text-[#718096] font-semibold underline truncate max-w-[120px]" title={req.attachmentName}>
                            📎 {req.attachmentName}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] uppercase font-bold tracking-wider ${getStatusBadgeClass(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      {isAdminOrHR && (
                        <td className="p-4 text-center">
                          {req.status === 'Pending' ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => onReviewLeave(req.id, 'Approved')}
                                className="bg-white border border-[#E2E8F0] hover:border-[#111111] text-[#111111] rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onReviewLeave(req.id, 'Rejected')}
                                className="bg-white border border-[#E2E8F0] hover:border-red-500 hover:text-red-500 text-[#718096] rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shadow-sm"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#A0AEC0] italic text-[10px] font-semibold">Reviewed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={isAdminOrHR ? 7 : 6} className="p-8 text-center text-[#A0AEC0] font-bold bg-white">
                        No leave requests logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 relative shadow-sm animate-scale-in">
            
            {/* Close */}
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 text-[#718096] hover:text-[#111111] p-1.5 hover:bg-[#F8F9FA] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">Apply for Time Off</h3>

            {error && (
              <div className="mb-4 bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] px-3 py-2 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4">
              
              {/* Employee display */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1">Employee</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.name || ''}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#718096] focus:outline-none"
                />
              </div>

              {/* Type dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1" htmlFor="leaveType">Time off Type</label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as 'Paid' | 'Sick' | 'Unpaid')}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-all"
                >
                  <option value="Paid">Paid Time off</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Unpaid">Unpaid Leaves</option>
                </select>
              </div>

              {/* Date ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1" htmlFor="startDate">Start Date</label>
                  <input
                    id="startDate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1" htmlFor="endDate">End Date</label>
                  <input
                    id="endDate"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>
              </div>

              {/* Estimated Allocation displays */}
              <div className="flex justify-between items-center text-xs bg-[#F8F9FA] px-4 py-2.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#718096] font-bold uppercase tracking-wider text-[10px]">Estimated Duration:</span>
                <span className="text-[#111111] font-mono font-bold text-sm">
                  {durationDays} Days
                </span>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568] mb-1" htmlFor="remarks">Remarks / Reason</label>
                <input
                  id="remarks"
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Family vacation, medical appointment..."
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#A0AEC0] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>

              {/* File upload ONLY visible if Sick Leave */}
              {leaveType === 'Sick' && (
                <div className="bg-[#F8F9FA] border border-[#E2E8F0] p-3.5 rounded-xl space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#718096]">
                    Medical Certificate Attachment
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#718096] truncate max-w-[200px]">
                      {attachment ? attachment.name : 'No file selected'}
                    </span>
                    <label className="bg-white hover:bg-[#F8F9FA] border border-[#E2E8F0] text-[#111111] px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                      Attach Certificate
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[9px] text-[#A0AEC0] font-semibold">(PDF, PNG, JPG up to 5MB required)</p>
                </div>
              )}

              {/* Submit actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="bg-[#F8F9FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#718096] font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="bg-[#111111] hover:bg-[#222222] text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm"
                >
                  Submit Request
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
