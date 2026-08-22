import React, { useState } from 'react';
import type { UserRole, Employee } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  currentUser: Employee | null;
  onLogout: () => void;
  checkInState: { checkedIn: boolean; checkInTime: string | null };
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentRole,
  onChangeRole,
  currentUser,
  onLogout,
  checkInState,
  onCheckIn,
  onCheckOut,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [systrayOpen, setSystrayOpen] = useState(false);

  const getStatusColor = () => {
    if (checkInState.checkedIn) return 'bg-emerald-500';
    if (currentUser?.attendanceStatus === 'Leave') return 'bg-sky-400';
    return 'bg-amber-500';
  };

  const getStatusText = () => {
    if (checkInState.checkedIn) return 'Present';
    if (currentUser?.attendanceStatus === 'Leave') return 'On Leave';
    return 'Absent';
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#16181d] border-b border-[#242730] px-6 py-3 flex items-center justify-between shadow-md">
      {/* Left Section: Logo & Tabs */}
      <div className="flex items-center space-x-8">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => onNavigate('EMPLOYEES')}
        >
          <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center font-bold text-white tracking-wider">
            DF
          </div>
          <span className="font-bold text-lg text-white tracking-tight hidden sm:inline">Dayflow</span>
        </div>

        {currentUser && (
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onNavigate('EMPLOYEES')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'EMPLOYEES'
                  ? 'bg-purple-600/15 text-purple-400 font-semibold border-b-2 border-purple-500 rounded-b-none'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => onNavigate('ATTENDANCE')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'ATTENDANCE'
                  ? 'bg-purple-600/15 text-purple-400 font-semibold border-b-2 border-purple-500 rounded-b-none'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => onNavigate('TIME_OFF')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'TIME_OFF'
                  ? 'bg-purple-600/15 text-purple-400 font-semibold border-b-2 border-purple-500 rounded-b-none'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Time Off
            </button>
          </div>
        )}
      </div>

      {/* Right Section: Actions & Dropdowns */}
      <div className="flex items-center space-x-4">
        {currentUser && (
          <>
            {/* Attendance Systray Widget */}
            <div className="relative">
              <button
                onClick={() => setSystrayOpen(!systrayOpen)}
                className="flex items-center space-x-2 bg-[#0e0f12] border border-[#242730] hover:border-slate-700 px-3 py-1.5 rounded-md text-xs sm:text-sm text-slate-300 font-medium transition-all"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`}></span>
                <span className="hidden md:inline">{getStatusText()}</span>
                {checkInState.checkedIn && checkInState.checkInTime && (
                  <span className="text-slate-500 text-xs hidden lg:inline">({checkInState.checkInTime})</span>
                )}
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {systrayOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#16181d] border border-[#242730] rounded-md shadow-lg p-3 text-slate-300 z-50">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Attendance Status
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></span>
                    <span className="text-sm font-medium text-white">{getStatusText()}</span>
                    {checkInState.checkedIn && checkInState.checkInTime && (
                      <span className="text-xs text-slate-400">since {checkInState.checkInTime}</span>
                    )}
                  </div>
                  
                  {!checkInState.checkedIn ? (
                    <button
                      onClick={() => {
                        onCheckIn();
                        setSystrayOpen(false);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-3 rounded text-sm flex items-center justify-center space-x-1.5 transition-colors"
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
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 px-3 rounded text-sm flex items-center justify-center space-x-1.5 transition-colors"
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

            {/* Sandbox Role Switcher Selector */}
            <div className="flex items-center bg-[#0e0f12] border border-[#242730] px-2 py-1 rounded-md">
              <span className="text-[10px] uppercase font-bold text-purple-400 mr-2 hidden sm:inline">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => onChangeRole(e.target.value as UserRole)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="Admin" className="bg-[#16181d]">Admin</option>
                <option value="HR Officer" className="bg-[#16181d]">HR Officer</option>
                <option value="Employee" className="bg-[#16181d]">Employee</option>
              </select>
            </div>

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#16181d] border border-[#242730] rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-[#242730]">
                    <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('MY_PROFILE');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};
