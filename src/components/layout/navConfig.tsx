import type { ReactNode } from 'react';
import { LayoutDashboard, ScanSearch, KanbanSquare, Scale, CloudCog, Building2, Radio, FileSignature } from 'lucide-react';
import type { AppView } from '../../context/DealflowContext';

export interface NavItem {
  id: AppView;
  label: string;
  short: string;
  description: string;
  icon: (size?: number) => ReactNode;
  section: 'Workspace' | 'Live data' | 'Infrastructure';
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    short: 'Overview',
    description: 'Mandate, firepower and top-fit targets',
    icon: (s = 17) => <LayoutDashboard size={s} strokeWidth={1.8} />,
    section: 'Workspace',
  },
  {
    id: 'screener',
    label: 'Target screener',
    short: 'Screener',
    description: 'Filter, source and underwrite companies',
    icon: (s = 17) => <ScanSearch size={s} strokeWidth={1.8} />,
    section: 'Workspace',
  },
  {
    id: 'pipeline',
    label: 'Deal pipeline',
    short: 'Pipeline',
    description: 'Kanban from discovery to close',
    icon: (s = 17) => <KanbanSquare size={s} strokeWidth={1.8} />,
    section: 'Workspace',
  },
  {
    id: 'compare',
    label: 'Compare',
    short: 'Compare',
    description: 'Side-by-side target comparison',
    icon: (s = 17) => <Scale size={s} strokeWidth={1.8} />,
    section: 'Workspace',
  },
  {
    id: 'documents',
    label: 'Deal documents',
    short: 'Documents',
    description: 'Legal checklist, templates and precedents',
    icon: (s = 17) => <FileSignature size={s} strokeWidth={1.8} />,
    section: 'Workspace',
  },
  {
    id: 'research',
    label: 'Company research',
    short: 'Research',
    description: 'Live SEC financials, valuation and filings',
    icon: (s = 17) => <Building2 size={s} strokeWidth={1.8} />,
    section: 'Live data',
  },
  {
    id: 'activity',
    label: 'M&A activity',
    short: 'Activity',
    description: 'Companies in a sale, merger or tender offer',
    icon: (s = 17) => <Radio size={s} strokeWidth={1.8} />,
    section: 'Live data',
  },
  {
    id: 'aws-guide',
    label: 'AWS hosting',
    short: 'AWS',
    description: 'Multi-account deployment guide',
    icon: (s = 17) => <CloudCog size={s} strokeWidth={1.8} />,
    section: 'Infrastructure',
  },
];

export const viewIndex = (v: AppView) => NAV_ITEMS.findIndex((n) => n.id === v);
