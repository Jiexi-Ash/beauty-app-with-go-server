export interface PayfastCustomerDetails {
  name_first?: string;
  name_last?: string;
  email_address?: string;
  cell_number?: string;
}

export interface PayfastTransactionDetails {
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_int1?: number;
  custom_int2?: number;
  custom_int3?: number;
  custom_int4?: number;
  custom_int5?: number;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
}

export interface PayfastMerchantDetails {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  fica_idnumber?: string;
}

export type PayfastPayment = {
  merchant: PayfastMerchantDetails;
  customer: PayfastCustomerDetails;
  transactions: PayfastTransactionDetails;
  email_confirmation?: 1;
  confirmation_address?: string;
  signature?: string;
};

export interface PayfastITN {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: "COMPLETE" | "CANCELLED";
  item_name: string;
  item_description?: string;
  amount_gross: string; 
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string;
  custom_int2?: string;
  custom_int3?: string;
  custom_int4?: string;
  custom_int5?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  merchant_id: string;
  signature: string;
}
