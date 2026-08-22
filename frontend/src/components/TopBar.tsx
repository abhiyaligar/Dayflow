import React, { useState } from 'react';
import type { UserRole, Employee } from '../types';

interface TopBarProps {
  currentView: string;
  currentRole: UserRole;
  currentUser: Employee;
  checkInState: { checkedIn: boolean; checkInTime: string | null };
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  currentRole,
  currentUser,
  checkInState,
  onCheckIn,
  onCheckOut,
}) => {
  const [systrayOpen, setSystrayOpen] = useState(false);

  const getStatusColor = () => {
    if (checkInState.checkedIn) return 'bg-[#43B77A] text-[#43B77A]';
    if (currentUser?.attendanceStatus === 'Leave') return 'bg-[#5D78E8] text-[#5D78E8]';
    return 'bg-[#E9A93A] text-[#E9A93A]';
  };

  const getStatusText = () => {
    if (checkInState.checkedIn) return 'Present';
    if (currentUser?.attendanceStatus === 'Leave') return 'On Leave';
    return 'Absent';
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return 'Dashboard';
      case 'EMPLOYEES':
        return 'Employees Directory';
      case 'ATTENDANCE':
        return 'Attendance Tracker';
      case 'TIME_OFF':
        return 'Time Off & Leaves';
      case 'MY_PROFILE':
        return 'My Profile Settings';
      default:
        return 'Dayflow HRMS';
    }
  };

  return (
    <header className="bg-white border-b border-[#E2E6F2] py-3.5 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: View Breadcrumbs */}
      <div>
        <h1 className="text-lg font-bold text-[#171A45] tracking-tight">{getViewTitle()}</h1>
      </div>

      {/* Right: Actions, Role Selector & Systray */}
      <div className="flex items-center space-x-4">
        
        {/* Attendance Systray Widget */}
        <div className="relative">
          <button
            onClick={() => setSystrayOpen(!systrayOpen)}
            className="flex items-center space-x-2 bg-[#F5F6FC] border border-[#E2E6F2] hover:border-[#6658F5]/30 px-3.5 py-1.8 rounded-xl text-xs text-[#171A45] font-semibold transition-all"
          >
            <span className={`w-2 h-2 rounded-full ${getStatusColor().split(' ')[0]} animate-pulse`}></span>
            <span>{getStatusText()}</span>
            {checkInState.checkedIn && checkInState.checkInTime && (
              <span className="text-[#70738D] font-mono">({checkInState.checkInTime})</span>
            )}
            <svg className="w-4 h-4 text-[#70738D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {systrayOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E6F2] rounded-xl shadow-premium p-4 z-50 animate-scale-in">
              <div className="text-[10px] font-bold text-[#9A9DB5] uppercase tracking-wider mb-2">
                Presence Status
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor().split(' ')[0]}`}></span>
                <span className="text-sm font-bold text-[#171A45]">{getStatusText()}</span>
                {checkInState.checkedIn && checkInState.checkInTime && (
                  <span className="text-[10px] text-[#70738D] font-mono">since {checkInState.checkInTime}</span>
                )}
              </div>
              
              {!checkInState.checkedIn ? (
                <button
                  onClick={() => {
                    onCheckIn();
                    setSystrayOpen(false);
                  }}
                  className="w-full bg-[#43B77A] hover:bg-[#3ca46d] text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Check In</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onCheckOut();
                    setSystrayOpen(false);
                  }}
                  className="w-full bg-[#E95D73] hover:bg-[#dc4e64] text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Check Out</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Role Badge (Non-changeable, fetched from DB) */}
        <div className="flex items-center bg-[#6658F5]/10 border border-[#6658F5]/20 px-3.5 py-1.8 rounded-xl select-none">
          <span className="text-[10px] uppercase font-extrabold text-[#6658F5] mr-1.5">Role:</span>
          <span className="text-xs text-[#6658F5] font-extrabold">{currentRole}</span>
        </div>

        {/* Calendar / Notifications indicators */}
        <div className="hidden sm:flex items-center space-x-2">
          <button className="w-9 h-9 bg-[#F5F6FC] border border-[#E2E6F2] hover:bg-[#EEF0FA] rounded-xl flex items-center justify-center text-[#70738D] transition-colors">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
};
