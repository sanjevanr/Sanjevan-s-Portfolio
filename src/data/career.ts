export type CareerRole = {
  title: string
  period: string
  details?: string
  arrangement?: string
  location?: string
}

export type CareerEntry = {
  id: string
  organisation: string
  initials: string
  organisationPeriod: string
  status?: 'incoming'
  arrangement?: string
  location?: string
  roles: CareerRole[]
}

// Kept in reverse chronological order, with incoming roles before current roles.
export const career: CareerEntry[] = [
  {
    id: 'deloitte-digital',
    organisation: 'Deloitte Digital',
    initials: 'DD',
    organisationPeriod: 'Incoming',
    status: 'incoming',
    roles: [
      { title: 'Front End Development Vacationer', period: 'Incoming' },
    ],
  },
  {
    id: 'muas',
    organisation: 'Monash Uncrewed Aerial Systems',
    initials: 'MUAS',
    organisationPeriod: 'August 2024 – Present',
    arrangement: 'Part-time · On-site',
    location: 'Clayton, Victoria',
    roles: [
      { title: 'Marketing Team Lead', period: 'October 2025 – Present' },
      {
        title: 'Marketing Director',
        period: 'August 2025 – October 2025',
        details: 'Managed, filmed, edited and organised social media content and team activities to support engagement, sponsorship opportunities and team productivity.',
      },
      {
        title: 'Events and Programs Coordinator',
        period: 'August 2024 – July 2025',
        details: 'Organised and facilitated outreach events and promoted team initiatives to improve visibility and team engagement.',
      },
    ],
  },
  {
    id: 'lake-press',
    organisation: 'Lake Press',
    initials: 'LP',
    organisationPeriod: 'June 2025 – Present',
    arrangement: 'Contract · Hybrid',
    location: 'Hawthorn, Victoria',
    roles: [
      {
        title: 'Software Developer',
        period: 'June 2025 – Present',
        details: 'Contributed to the development of internal publishing software using React, TypeScript and Supabase, implementing product workflows, reusable user interfaces, database-backed features and business-facing tooling.',
      },
    ],
  },
  {
    id: 'campion',
    organisation: 'Campion Education',
    initials: 'CE',
    organisationPeriod: 'August 2023 – July 2026',
    arrangement: 'Part-time · On-site',
    location: 'Dandenong Sorth, Victoria',
    roles: [
      {
        title: 'Senior Customer Support Supervisor',
        period: 'February 2024 – July 2026',
        details: 'Managed and trained staff, handled escalated customer interactions and worked with financial and corporate departments to resolve complex enquiries.',
      },
      {
        title: 'Customer Support Representative',
        period: 'August 2023 – February 2024',
        details: 'Supported customers through calls and emails, using Bookmaster software to provide accurate information and resolve enquiries.',
      },
    ],
  },
  {
    id: 'mcav',
    organisation: 'Monash Connected Autonomous Vehicle',
    initials: 'MCAV',
    organisationPeriod: 'February 2024 – March 2025',
    arrangement: 'Part-time · On-site',
    location: 'Clayton, Victoria',
    roles: [
      {
        title: 'Software and Networking Engineer',
        period: 'February 2024 – March 2025',
        details: 'Collaborated with a student-led autonomous vehicle team using ROS2, Python and JavaScript to develop and support software and decision-making functionality.',
      },
    ],
  },
  {
    id: 'nandos',
    organisation: "Nando's Australia & New Zealand",
    initials: 'NANDO’S',
    organisationPeriod: 'November 2022 – August 2023',
    arrangement: 'Part-time · On-site',
    location: 'Dandenong North, Victoria',
    roles: [
      {
        title: 'Food Assistant and Waiter',
        period: 'November 2022 – August 2023',
        details: 'Supported restaurant operations through food preparation, food safety practices and customer service.',
      },
    ],
  },
]
