// --- Constants ---
export const INITIAL_RESTAURANTS = ["Subway", "Paramount", "Pretzels", "LFD Bagel"];
export const INITIAL_AIRLINES = {
  "Air Canada": "ACD",
  "Air France": "AFR",
  "British Airways": "BAW",
};

export const TABS = {
  VOUCHERS: "Vouchers",
  GENERAL_SETTINGS: "General Settings",
  SETTINGS: "Settings",
  AGING_REPORT: "Aging Report",
};

export const VOUCHER_STATUS = {
  UNBILLED: "Unbilled",
  INVOICED: "Invoiced",
  PAID: "Paid",
};

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

export const TAX_RATES = {
  DEFAULT_TPS: 5.0,
  DEFAULT_TVQ: 9.975,
};

export const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
