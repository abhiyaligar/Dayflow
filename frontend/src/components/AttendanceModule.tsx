import React, { useState } from 'react';
import type { AttendanceRecord, UserRole, Employee } from '../types';

interface AttendanceModuleProps {
  attendanceRecords: AttendanceRecord[];
  currentRole: UserRole;
  currentUser: Employee | null;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  attendanceRecords,
  currentRole,
  currentUser,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdminOrHR = currentRole === 'Admin' || currentRole === 'HR Officer';

  // Navigate date backwards/forwards
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // --- Admin/HR Logic ---
  // Filter records for the selected date, matching search term
  const adminRecords = attendanceRecords.filter((rec) => {
    const matchesDate = rec.date === selectedDate;
    const matchesSearch = rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesDate && matchesSearch;
  });

  // --- Employee Logic ---
  // Filter records belonging to the current user
  const employeeRecords = attendanceRecords.filter((rec) => rec.employeeId === currentUser?.id);

  // Summary Stats for Employee View
  const daysPresent = employeeRecords.filter((r) => r.status === 'Present').length;
  const daysOnLeave = employeeRecords.filter((r) => r.status === 'Leave').length;
  const totalWorkingDays = employeeRecords.length;

  return (
    <div className="flex-1 bg-[#0e0f12] px-6 py-8">
      {/* View Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#242730] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Attendance Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdminOrHR ? 'Organization-wide Daily Log View' : 'Personal Monthly Attendance Sheet'}
          </p>
        </div>

        {/* Date Selector for Admin */}
        {isAdminOrHR && (
          <div className="flex items-center space-x-2 bg-[#16181d] border border-[#242730] px-3 py-1.5 rounded-md">
            <button
              onClick={handlePrevDate}
              className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-semibold text-white px-2 min-w-[130px] text-center">
              {formatDateDisplay(selectedDate)}
            </span>
            <button
              onClick={handleNextDate}
              className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isAdminOrHR ? (
        // ==================== ADMIN & HR OFFICER VIEW ====================
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search present employees by name..."
              className="w-full bg-[#16181d] border border-[#242730] rounded-md pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Daily list table */}
          <div className="bg-[#16181d] border border-[#242730] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e0f12] text-slate-400 border-b border-[#242730] uppercase font-bold tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4 text-center">Check In</th>
                    <th className="p-4 text-center">Check Out</th>
                    <th className="p-4 text-center">Work Hours</th>
                    <th className="p-4 text-center">Extra Hours</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242730] text-slate-300">
                  {adminRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center space-x-3">
                        <span className="w-7 h-7 bg-purple-900/40 text-purple-400 rounded-full flex items-center justify-center font-bold text-xs">
                          {rec.employeeName.substring(0, 2).toUpperCase()}
                        </span>
                        <span>{rec.employeeName}</span>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-200">{rec.checkIn}</td>
                      <td className="p-4 text-center font-mono text-slate-200">{rec.checkOut || '-- : --'}</td>
                      <td className="p-4 text-center font-mono text-slate-200">
                        {rec.workHours !== undefined ? `${rec.workHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center font-mono text-slate-200">
                        {rec.extraHours !== undefined ? `${rec.extraHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-950/20 text-emerald-400 border border-emerald-800/30">
                          🟢 Present
                        </span>
                      </td>
                    </tr>
                  ))}
                  {adminRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                        No checked-in employees recorded for {formatDateDisplay(selectedDate)}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // ==================== EMPLOYEE PERSONAL VIEW ====================
        <div className="space-y-6">
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#16181d] border border-[#242730] p-5 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Days Present</span>
                <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">{daysPresent} Days</span>
              </div>
              <div className="w-10 h-10 rounded bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-center text-emerald-400 text-lg">
                🟢
              </div>
            </div>
            
            <div className="bg-[#16181d] border border-[#242730] p-5 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Leaves Count</span>
                <span className="text-3xl font-extrabold text-sky-400 mt-1 block">{daysOnLeave} Days</span>
              </div>
              <div className="w-10 h-10 rounded bg-sky-950/30 border border-sky-800/50 flex items-center justify-center text-sky-400 text-lg">
                ✈️
              </div>
            </div>

            <div className="bg-[#16181d] border border-[#242730] p-5 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Total Working Days</span>
                <span className="text-3xl font-extrabold text-white mt-1 block">{totalWorkingDays} Days</span>
              </div>
              <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-lg font-bold">
                🗓️
              </div>
            </div>
          </div>

          {/* Employee Month Table */}
          <div className="bg-[#16181d] border border-[#242730] rounded-xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 bg-[#0e0f12] border-b border-[#242730] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">August 2026 Logs</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e0f12]/50 text-slate-400 border-b border-[#242730] uppercase font-bold tracking-wider">
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Check In</th>
                    <th className="p-4 text-center">Check Out</th>
                    <th className="p-4 text-center">Work Hours</th>
                    <th className="p-4 text-center">Extra Hours</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242730] text-slate-300">
                  {employeeRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-white font-mono">
                        {new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-center font-mono text-slate-200">{rec.checkIn || '--:--'}</td>
                      <td className="p-4 text-center font-mono text-slate-200">{rec.checkOut || '--:--'}</td>
                      <td className="p-4 text-center font-mono text-slate-200">
                        {rec.workHours !== undefined ? `${rec.workHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center font-mono text-slate-200">
                        {rec.extraHours !== undefined ? `${rec.extraHours.toFixed(2)} hrs` : '--'}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                            rec.status === 'Present'
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30'
                              : rec.status === 'Leave'
                              ? 'bg-sky-950/20 text-sky-400 border-sky-800/30'
                              : 'bg-amber-950/20 text-amber-400 border-amber-800/30'
                          }`}
                        >
                          {rec.status === 'Present' ? '🟢 Present' : rec.status === 'Leave' ? '✈️ Leave' : '🟡 Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employeeRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                        No attendance records logged for the current month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
