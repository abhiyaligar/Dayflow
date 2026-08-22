import type { SalaryInfo } from '../types';

export const calculateSalaryInfo = (monthlyWage: number, performanceBonus: number = 0): SalaryInfo => {
  const basicAmount = monthlyWage * 0.50;
  const hraAmount = basicAmount * 0.50;
  const standardAmount = monthlyWage * 0.0833;
  const ltaAmount = monthlyWage * 0.0833;
  const fixedAllowanceAmount = Math.max(0, monthlyWage - (basicAmount + hraAmount + standardAmount + ltaAmount + performanceBonus));

  const employeePFAmount = basicAmount * 0.12;
  const employerPFAmount = basicAmount * 0.12;
  const ptAmount = 200.0;

  return {
    wageType: 'Fixed',
    monthWage: monthlyWage,
    yearlyWage: monthlyWage * 12,
    workingDaysPerWeek: 5,
    breakTime: 1,
    components: {
      basic: {
        name: 'Basic Salary',
        calculationType: 'Percentage',
        value: 50,
        amount: basicAmount,
      },
      hra: {
        name: 'House Rent Allowance (HRA)',
        calculationType: 'Percentage',
        value: 50,
        amount: hraAmount,
      },
      standard: {
        name: 'Standard Allowance',
        calculationType: 'Percentage',
        value: 8.33,
        amount: standardAmount,
      },
      performanceBonus: {
        name: 'Performance Bonus',
        calculationType: 'Fixed',
        value: performanceBonus,
        amount: performanceBonus,
      },
      lta: {
        name: 'Leave Travel Allowance (LTA)',
        calculationType: 'Percentage',
        value: 8.33,
        amount: ltaAmount,
      },
      fixedAllowance: {
        name: 'Fixed Allowance',
        calculationType: 'Fixed',
        value: fixedAllowanceAmount,
        amount: fixedAllowanceAmount,
      },
    },
    deductions: {
      employeePF: {
        name: 'Employee PF',
        calculationType: 'Percentage',
        value: 12,
        amount: employeePFAmount,
      },
      employerPF: {
        name: 'Employer PF',
        calculationType: 'Percentage',
        value: 12,
        amount: employerPFAmount,
      },
      professionalTax: {
        name: 'Professional Tax (PT)',
        calculationType: 'Fixed',
        value: ptAmount,
        amount: ptAmount,
      },
    },
  };
};
