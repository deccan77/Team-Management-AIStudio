export enum ProjectStatus {
  WISHLIST = 'Wishlist',
  PENDING = 'Pending Confirmation',
  CONFIRMED = 'Confirmed'
}

export enum ProjectCategory {
  CTB = 'CTB',
  RTB = 'RTB',
  SSP = 'SSP',
  BAU = 'BAU',
  OTHER = 'Other'
}

export enum OrderPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum OrderStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum TaskRecurrence {
  NONE = 'None',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export enum WorkTaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
  CANCELLED = 'Cancelled'
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  weeklyHours: number;
  availability: number; // 0-100 percentage for dashboard
  leaveDates: string[]; // Array of ISO date strings (YYYY-MM-DD)
  email: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  effortDays: number;
  assignedTo?: string;
  status: 'Todo' | 'Doing' | 'Done';
}

export interface WorkTask {
  id: string; // Format: {Category}-{YYYY}-{MM}-{Sequence}
  parentId: string | null;
  title: string;
  category: 'CTB' | 'RTB' | 'SSP' | 'BAU' | 'Other';
  assignedTo: string;
  effortHours: number;
  startDate: string;
  endDate: string;
  status: WorkTaskStatus;
  recurrence: TaskRecurrence;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  category: ProjectCategory;
  status: ProjectStatus;
  description: string;
  tasks: Task[];
  createdAt: string;
}

export interface Order {
  id: string;
  title: string;
  description: string;
  status: OrderStatus | string;
  priority: OrderPriority;
  assignedTo?: string;
  ownerId?: string;
  tags?: string[];
  createdAt: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  category: ProjectCategory;
  defaultTasks: Array<{
    title: string;
    relativeStartDay: number;
    durationDays: number;
    effortEstimate: number;
  }>;
}