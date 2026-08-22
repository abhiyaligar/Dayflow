from pydantic import BaseModel


class SalaryStructureDefine(BaseModel):
    defined_wage: float
    wage_type: str = "Fixed"
    performance_bonus: float = 0.00


class SalaryStructureOut(BaseModel):
    defined_wage: float
    wage_type: str
    basic_salary: float
    hra: float
    standard_allowance: float
    lta: float
    performance_bonus: float
    fixed_allowance: float
    pf_rate: float
    professional_tax: float


class PayslipOut(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    month: str  # e.g., "August 2026"
    total_days_in_month: int
    payable_days: int
    base_wage: float
    gross_pay: float
    pf_deduction: float
    pt_deduction: float
    unpaid_leave_deduction: float
    net_pay: float
