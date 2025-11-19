
export type Role = 'super_admin' | 'church_admin' | 'member' | 'finance_manager';

export interface UserProfile {
  id: string;
  igreja_id: string;
  role: Role;
  full_name: string;
  email: string;
}

export interface Church {
  id: string;
  name: string;
  address?: string;
  created_by?: string;
  created_at: string;
}

export interface Member {
  id: string;
  igreja_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  baptism_date?: string;
  birth_date?: string;
  role_type: 'Member' | 'Pastor' | 'Leader' | 'Visitor';
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface Transaction {
  id: number;
  igreja_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  member_id?: string; // Link to Member (Tithes)
  member_name?: string; // Virtual field for UI
  supplier?: string; // For expenses
  created_at: string;
}

export interface Event {
  id: number;
  igreja_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  created_at: string;
}

export interface Ministry {
  id: number;
  igreja_id: string;
  name: string;
  description?: string;
  leader_id?: string;
  created_at: string;
}

export interface DiscipleshipGroup {
  id: number;
  igreja_id: string;
  name: string;
  description?: string;
  leader_name?: string;
  meeting_day?: string;
  created_at: string;
}

export interface GroupMeeting {
  id: number;
  group_id: number;
  igreja_id: string;
  date: string;
  topic?: string;
  attendance_count: number;
  observations?: string;
  created_at: string;
}

export interface Communication {
  id: number;
  igreja_id: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  recipient_group?: string;
  sent_at: string;
}

export interface ChurchDocument {
  id: number;
  igreja_id: string;
  title: string;
  type: 'minute' | 'certificate';
  content: string;
  document_date: string;
  created_at: string;
}

export interface Notice {
  id: number;
  igreja_id: string;
  title: string;
  content: string;
  priority: 'High' | 'Normal';
  expiration_date?: string;
  created_at: string;
}

export interface MediaItem {
  id: number;
  igreja_id: string;
  title: string;
  type: 'Photo' | 'Video' | 'File';
  url: string;
  category?: string; // Album name
  created_at: string;
}

export interface Asset {
  id: number;
  igreja_id: string;
  name: string;
  description?: string;
  value?: number;
  acquisition_date?: string;
  location?: string; 
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  created_at: string;
}

export interface EbdClass {
  id: number;
  igreja_id: string;
  name: string; 
  teacher_name?: string;
  topic?: string;
  students_count?: number; 
  created_at: string;
}

export interface VolunteerScale {
  id: number;
  igreja_id: string;
  title: string; 
  date: string;
  ministry_name: string; 
  volunteers: string; 
  created_at: string;
}

export interface PrayerRequest {
  id: number;
  igreja_id: string;
  requester_name: string;
  request: string;
  status: 'Pending' | 'Prayed';
  is_public: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface DatabaseTask {
  id: number;
  created_at: string;
  title: string;
  is_complete: boolean;
  user_id: string;
}
