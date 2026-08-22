const API_URL = import.meta.env.VITE_URL;

export const getAuthToken = () => localStorage.getItem('df_token');
export const setAuthToken = (token: string) => localStorage.setItem('df_token', token);
export const removeAuthToken = () => localStorage.removeItem('df_token');

export const getStoredUser = () => {
  const user = localStorage.getItem('df_user');
  return user ? JSON.parse(user) : null;
};
export const setStoredUser = (user: any) => localStorage.setItem('df_user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('df_user');

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || JSON.stringify(errorJson);
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  if (response.status === 204) return null;
  return response.json();
};

const getHeaders = (isMultipart = false) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// API Services
export const authApi = {
  async login(loginId: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', loginId);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await handleResponse(response);
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data; // returns { access_token, token_type, is_first_login, role }
  },

  async signup(payload: { employee_id: string; email: string; password: string; role: string }) {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
    return handleResponse(response);
  },
};

export const employeesApi = {
  async onboard(payload: {
    first_name: string;
    last_name: string;
    email: string;
    joining_year: number;
    designation: string;
    department: string;
    joining_date: string;
    role: string;
  }) {
    // Map 'HR Officer' back to 'HR' for the backend
    const backendRole = payload.role === 'HR Officer' ? 'HR' : payload.role;

    const response = await fetch(`${API_URL}/employees/onboard`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...payload,
        role: backendRole,
      }),
    });
    return handleResponse(response);
  },

  async list() {
    const response = await fetch(`${API_URL}/employees`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getProfile(employeeId: string) {
    const response = await fetch(`${API_URL}/employees/${employeeId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async updateProfile(
    employeeId: string,
    payload: {
      phone?: string | null;
      address?: string | null;
      profile_picture_url?: string | null;
      designation?: string | null;
      department?: string | null;
      joining_date?: string | null;
    }
  ) {
    const response = await fetch(`${API_URL}/employees/${employeeId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async uploadDoc(employeeId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/employees/${employeeId}/documents`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse(response);
  },

  async listDocs(employeeId: string) {
    const response = await fetch(`${API_URL}/employees/${employeeId}/documents`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async deleteDoc(employeeId: string, documentId: string) {
    const response = await fetch(`${API_URL}/employees/${employeeId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const attendanceApi = {
  async checkIn() {
    const response = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async checkOut() {
    const response = await fetch(`${API_URL}/attendance/check-out`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getMyLogs() {
    const response = await fetch(`${API_URL}/attendance/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getTodayPresent() {
    const response = await fetch(`${API_URL}/attendance/today`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const leavesApi = {
  async apply(payload: {
    leave_type: 'Paid' | 'Sick' | 'Unpaid';
    start_date: string;
    end_date: string;
    remarks?: string;
  }) {
    const response = await fetch(`${API_URL}/leaves/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async review(leaveId: string, payload: { status: 'Approved' | 'Rejected'; admin_comments: string }) {
    const response = await fetch(`${API_URL}/leaves/${leaveId}/review`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};

export const payrollApi = {
  async defineSalary(
    employeeId: string,
    payload: {
      defined_wage: number;
      wage_type: string;
      performance_bonus: number;
    }
  ) {
    const response = await fetch(`${API_URL}/payroll/${employeeId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async getPayslip(employeeId: string) {
    const response = await fetch(`${API_URL}/payroll/${employeeId}/payslip`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

import type { Employee, UserRole } from './types';

export const mapBackendProfileToEmployee = (profile: any): Employee => {
  // Map 'HR' from backend to 'HR Officer' for the frontend UserRole
  const roleMapped: UserRole = profile.role === 'HR' ? 'HR Officer' : (profile.role as UserRole);
  
  return {
    id: profile.id,
    loginId: profile.employee_id,
    name: `${profile.first_name} ${profile.last_name}`,
    email: profile.email,
    mobile: profile.phone || '',
    company: localStorage.getItem('df_company_name') || 'Odoo India',
    department: profile.department || 'General',
    manager: 'Jane Doe',
    location: 'Gandhinagar, Gujarat',
    jobPosition: profile.designation || 'Staff',
    avatarUrl: profile.profile_picture_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    attendanceStatus: 'Absent',
    about: '',
    skills: [],
    certifications: [],
    interests: [],
    privateInfo: {
      dateOfBirth: '1995-01-01',
      residingAddress: profile.address || '',
      nationality: 'Indian',
      personalEmail: profile.email,
      gender: 'Male',
      maritalStatus: 'Single',
      dateOfJoining: profile.joining_date || '2026-08-22',
      bankDetails: {
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        panNo: '',
        uanNo: '',
        empCode: profile.employee_id,
      }
    },
    role: roleMapped,
  };
};
