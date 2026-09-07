export type Role = "owner" | "manager" | "receptionist" | "cashier" | "housekeeping";

export type Settings = {
  id: number; hotel_name: string; tagline: string; address: string; po_box: string;
  phone: string; whatsapp: string; email: string; checkout_time: string; currency: string;
  momo_number: string; momo_name: string; momo_pattern: string;
  advance_percent: number; hold_hours: number; arrival_grace_hours: number;
  cancel_window_hours: number; strike_limit: number;
  policy_text: string; owner_name: string; owner_phone: string;
  kiosk_pin: string; mail_from: string; updated_at: string;
};

export type Room = {
  id: string; number: string; name: string;
  category: "standard" | "modern" | "vip" | "executive";
  price: number; floor: number; capacity: number; bed: string; description: string;
  amenities: string[]; photos: string[]; videos: string[];
  status: "available" | "occupied" | "cleaning" | "maintenance";
  active: boolean; created_at: string;
};

export type MenuItem = {
  id: string; name: string; price: number; category: string;
  description: string; available: boolean; sort_order: number;
};

export type Staff = {
  id: string; username: string; full_name: string; phone: string;
  role: Role; active: boolean; last_login: string | null; created_at: string;
};

export type FoodLine = { id: string; name: string; price: number; qty: number };

export type ResStatus = "held" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";

export type Reservation = {
  id: string; code: string; source: "online" | "walk-in" | "kiosk";
  guest_name: string; guest_phone: string; guest_email: string;
  room_id: string | null; room_label: string; room_name: string; room_price: number;
  check_in: string; check_out: string; nights: number; guests: number;
  arrival: string; note: string;
  food: FoodLine[]; food_total: number; room_total: number; total: number;
  advance_percent: number; advance_due: number; paid: number;
  status: ResStatus;
  payment_status: "unpaid" | "reported" | "part" | "confirmed" | "settled";
  momo_ref: string; hold_until: string | null;
  id_card_type: string; id_card_number: string;
  checked_in_at: string | null; checked_in_by: string;
  checked_out_at: string | null; confirmation_sent_at: string | null;
  history: { at: string; what: string; by: string }[];
  created_at: string; updated_at: string;
};

export type Payment = {
  id: string; reservation_id: string; receipt_no: string; amount: number;
  method: string; reference: string; taken_by: string | null; taken_by_name: string;
  created_at: string;
};

export type BlacklistRow = {
  id: string; phone: string; name: string; strikes: number;
  banned: boolean; reason: string; last_at: string;
};
