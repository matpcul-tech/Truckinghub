export type CarrierStatus = "pending" | "active" | "paused";

export interface Profile {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export interface Carrier {
  id: string;
  company_name: string;
  mc_number: string | null;
  dot_number: string | null;
  authority_active: boolean;
  insurance_coi_url: string | null;
  insurance_expiry: string | null;
  dispatch_agreement_url: string | null;
  dispatch_agreement_signed: boolean;
  fee_percent: number;
  status: CarrierStatus;
  assigned_dispatcher: string | null;
  created_at: string;
}

export interface Equipment {
  id: string;
  carrier_id: string;
  unit_number: string | null;
  type: string | null;
  created_at: string;
}

export interface Driver {
  id: string;
  carrier_id: string;
  full_name: string;
  phone: string | null;
  cdl_number: string | null;
  created_at: string;
}

export interface Broker {
  id: string;
  name: string;
  mc_number: string | null;
  credit_score: number | null;
  notes: string | null;
  created_at: string;
}

export type LoadStatus =
  | "booked"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "invoiced"
  | "paid";

export interface Load {
  id: string;
  carrier_id: string;
  broker_id: string | null;
  driver_id: string | null;
  equipment_id: string | null;
  origin_city: string | null;
  origin_state: string | null;
  dest_city: string | null;
  dest_state: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  rate: number;
  loaded_miles: number;
  deadhead_miles: number;
  rate_per_mile: number;
  status: LoadStatus;
  ratecon_url: string | null;
  created_at: string;
}

export const LOAD_STATUSES: LoadStatus[] = [
  "booked",
  "dispatched",
  "in_transit",
  "delivered",
  "invoiced",
  "paid",
];
