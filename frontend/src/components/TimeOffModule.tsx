import React, { useState } from 'react';
import type { LeaveRequest, UserRole, Employee } from '../types';

interface TimeOffModuleProps {
  leaveRequests: LeaveRequest[];
  currentRole: UserRole;
  currentUser: Employee | null;
  onApplyLeave: (newLeave: LeaveRequest) => void;
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

    onApplyLeave(newRequest);

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

  const getStatusStyle = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-950/20 text-emerald-400 border border-emerald-800/30';
      case 'Rejected':
        return 'bg-rose-950/20 text-rose-400 border border-rose-800/30';
      case 'Pending':
      default:
        return 'bg-amber-950/20 text-amber-400 border border-amber-800/30';
    }
  };

  return (
    <div className="flex-1 bg-[#0e0f12] px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#242730] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Time Off & Leaves</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdminOrHR ? 'Employee Leave Approvals Workspace' : 'My Personal Time-Off Board'}
          </p>
        </div>

        {/* Action Header controls */}
        <div className="flex items-center space-x-3">
          {/* Admin Navigation Tabs */}
          {isAdminOrHR && (
            <div className="flex bg-[#16181d] border border-[#242730] p-1 rounded-md">
              <button
                onClick={() => setActiveTab('timeoff')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'timeoff' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Time Off
              </button>
              <button
                onClick={() => setActiveTab('allocation')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'allocation' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
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
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm tracking-wider px-4 py-2 rounded-md flex items-center justify-center space-x-1 transition-colors shadow"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>NEW</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="space-y-6">
        
        {/* Balances widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
          <div className="bg-[#16181d] border border-[#242730] p-5 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Paid Time Off</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">24 Days Available</span>
            </div>
            <div className="w-10 h-10 rounded bg-purple-950/20 border border-purple-800/30 flex items-center justify-center text-purple-400 text-lg">
              🏖️
            </div>
          </div>
          
          <div className="bg-[#16181d] border border-[#242730] p-5 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Sick Leave</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">07 Days Available</span>
            </div>
            <div className="w-10 h-10 rounded bg-rose-950/20 border border-rose-800/30 flex items-center justify-center text-rose-400 text-lg">
              🤒
            </div>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAdminOrHR ? "Search requests by employee name..." : "Search my requests..."}
              className="w-full bg-[#16181d] border border-[#242730] rounded-md pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="bg-[#16181d] border border-[#242730] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e0f12] text-slate-400 border-b border-[#242730] uppercase font-bold tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Start Date</th>
                    <th className="p-4">End Date</th>
                    <th className="p-4">Days</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    {isAdminOrHR && <th className="p-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242730] text-slate-300">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center space-x-3">
                        <span className="w-7 h-7 bg-purple-900/40 text-purple-400 rounded-full flex items-center justify-center font-bold text-xs">
                          {req.employeeName.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <span>{req.employeeName}</span>
                          {req.remarks && (
                            <p className="text-[10px] text-slate-500 font-normal mt-0.5 max-w-[200px] truncate" title={req.remarks}>
                              "{req.remarks}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-200">{req.startDate}</td>
                      <td className="p-4 font-mono font-medium text-slate-200">{req.endDate}</td>
                      <td className="p-4 font-mono text-center sm:text-left">{req.durationDays}</td>
                      <td className="p-4">
                        <span className="text-slate-300 font-semibold">{req.leaveType}</span>
                        {req.attachmentName && (
                          <span className="block text-[10px] text-purple-400 font-medium underline truncate max-w-[120px]" title={req.attachmentName}>
                            📎 {req.attachmentName}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getStatusStyle(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      {isAdminOrHR && (
                        <td className="p-4 text-center">
                          {req.status === 'Pending' ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => onReviewLeave(req.id, 'Approved')}
                                className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded px-2.5 py-1 text-xs font-bold transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onReviewLeave(req.id, 'Rejected')}
                                className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded px-2.5 py-1 text-xs font-bold transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[10px]">Reviewed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={isAdminOrHR ? 7 : 6} className="p-8 text-center text-slate-500 font-medium">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16181d] border border-[#242730] rounded-xl max-w-md w-full p-6 relative">
            
            {/* Close */}
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Time off Type Request</h3>

            {error && (
              <div className="mb-4 bg-rose-900/20 border border-rose-800 text-rose-300 px-3 py-2 rounded text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4">
              
              {/* Employee display */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employee</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.name || ''}
                  className="w-full bg-[#0e0f12]/50 border border-[#242730] rounded px-3 py-2 text-sm text-slate-400 focus:outline-none"
                />
              </div>

              {/* Type dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="leaveType">Time off Type</label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as 'Paid' | 'Sick' | 'Unpaid')}
                  className="w-full bg-[#0e0f12] border border-[#242730] rounded px-2.5 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="Paid">Paid Time off</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Unpaid">Unpaid Leaves</option>
                </select>
              </div>

              {/* Date ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1" htmlFor="startDate">Start Date</label>
                  <input
                    id="startDate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1" htmlFor="endDate">End Date</label>
                  <input
                    id="endDate"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Estimated Allocation displays */}
              <div className="flex justify-between items-center text-xs bg-[#0e0f12] px-3 py-2 rounded border border-[#242730]">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Estimated Allocation:</span>
                <span className="text-purple-400 font-mono font-bold text-sm">
                  {durationDays} Days
                </span>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1" htmlFor="remarks">Remarks / Reason</label>
                <input
                  id="remarks"
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Family trip, dental surgery..."
                  className="w-full bg-[#0e0f12] border border-[#242730] rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              {/* File upload ONLY visible if Sick Leave */}
              {leaveType === 'Sick' && (
                <div className="bg-[#0e0f12] border border-[#242730] p-3.5 rounded-lg space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Upload Sick Leave Certificate
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 truncate max-w-[200px]">
                      {attachment ? attachment.name : 'No certificate selected'}
                    </span>
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors shadow">
                      Attach File
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-600">(PDF, JPG up to 5MB required)</p>
                </div>
              )}

              {/* Submit actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#242730]">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded text-sm transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded text-sm transition-colors shadow"
                >
                  Submit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
