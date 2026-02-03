import { TeamMember, Project, ProjectStatus, ProjectCategory, ProjectTemplate } from './types';

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'm1',
    name: 'Sarah Chen',
    role: 'Senior Developer',
    avatar: 'https://picsum.photos/seed/sarah/200',
    skills: ['React', 'TypeScript', 'Node.js'],
    weeklyHours: 40,
    availability: 85,
    leaveDates: ['2024-12-24', '2024-12-25', '2024-12-26'],
    email: 'sarah.c@company.com'
  },
  {
    id: 'm2',
    name: 'Marcus Thorne',
    role: 'UI/UX Designer',
    avatar: 'https://picsum.photos/seed/marcus/200',
    skills: ['Figma', 'Prototyping', 'Tailwind'],
    weeklyHours: 35,
    availability: 100,
    leaveDates: [],
    email: 'm.thorne@company.com'
  },
  {
    id: 'm3',
    name: 'Elena Rodriguez',
    role: 'Product Manager',
    avatar: 'https://picsum.photos/seed/elena/200',
    skills: ['Agile', 'Jira', 'Strategy'],
    weeklyHours: 40,
    availability: 90,
    leaveDates: ['2024-07-01', '2024-07-02', '2024-07-03', '2024-07-04', '2024-07-05'],
    email: 'elena.r@company.com'
  },
  {
    id: 'm4',
    name: 'David Kim',
    role: 'DevOps Engineer',
    avatar: 'https://picsum.photos/seed/david/200',
    skills: ['AWS', 'Docker', 'CI/CD'],
    weeklyHours: 40,
    availability: 100,
    leaveDates: [],
    email: 'd.kim@company.com'
  }
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Standard Software Release',
    category: ProjectCategory.CTB,
    defaultTasks: [
      { title: 'Requirements Gathering', relativeStartDay: 0, durationDays: 5, effortEstimate: 3 },
      { title: 'UI/UX Design Mockups', relativeStartDay: 5, durationDays: 10, effortEstimate: 8 },
      { title: 'Frontend Development', relativeStartDay: 15, durationDays: 20, effortEstimate: 15 },
      { title: 'Backend Integration', relativeStartDay: 20, durationDays: 15, effortEstimate: 12 },
      { title: 'QA & Bug Fixing', relativeStartDay: 35, durationDays: 7, effortEstimate: 5 }
    ]
  },
  {
    id: 'tpl-2',
    name: 'Infrastructure Upgrade',
    category: ProjectCategory.RTB,
    defaultTasks: [
      { title: 'Environment Audit', relativeStartDay: 0, durationDays: 3, effortEstimate: 2 },
      { title: 'System Architecture Prep', relativeStartDay: 3, durationDays: 5, effortEstimate: 4 },
      { title: 'Data Migration', relativeStartDay: 8, durationDays: 4, effortEstimate: 8 },
      { title: 'Post-Migration Monitoring', relativeStartDay: 12, durationDays: 5, effortEstimate: 2 }
    ]
  },
  {
    id: 'tpl-3',
    name: 'Monthly Compliance Review',
    category: ProjectCategory.BAU,
    defaultTasks: [
      { title: 'Data Collection', relativeStartDay: 0, durationDays: 2, effortEstimate: 1 },
      { title: 'Risk Assessment', relativeStartDay: 2, durationDays: 3, effortEstimate: 3 },
      { title: 'Final Reporting', relativeStartDay: 5, durationDays: 2, effortEstimate: 2 }
    ]
  }
];
