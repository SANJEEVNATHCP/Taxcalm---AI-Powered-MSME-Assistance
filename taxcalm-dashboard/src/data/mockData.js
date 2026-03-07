// ── KPI Analytics Cards ──────────────────────────────────────────────────────
export const kpiCards = [
  {
    id: 1,
    title: 'GST Liability',
    value: '₹1,24,800',
    trend: '+8%',
    trendUp: true,
    subtitle: 'Due by 20th March',
    icon: 'Receipt',
    color: 'yellow',
    navTarget: 'gst',
  },
  {
    id: 2,
    title: 'Revenue This Month',
    value: '₹8,42,000',
    trend: '+12%',
    trendUp: true,
    subtitle: 'vs ₹7,51,200 last month',
    icon: 'TrendingUp',
    color: 'green',
    navTarget: 'finance',
  },
  {
    id: 3,
    title: 'Pending Filings',
    value: '3',
    trend: '-2',
    trendUp: false,
    subtitle: 'Next due: GSTR-3B',
    icon: 'FileWarning',
    color: 'red',
    navTarget: 'compliance',
  },
  {
    id: 4,
    title: 'Expenses Logged',
    value: '₹2,18,500',
    trend: '+5%',
    trendUp: true,
    subtitle: '94 transactions this month',
    icon: 'Wallet',
    color: 'blue',
    navTarget: 'finance',
  },
]

// ── Chart Data ────────────────────────────────────────────────────────────────
export const gstTrendData = [
  { month: 'Oct', gst: 92000, target: 100000 },
  { month: 'Nov', gst: 105000, target: 100000 },
  { month: 'Dec', gst: 98000, target: 100000 },
  { month: 'Jan', gst: 112000, target: 110000 },
  { month: 'Feb', gst: 118000, target: 110000 },
  { month: 'Mar', gst: 124800, target: 120000 },
]

export const expensesData = [
  { category: 'Salaries', amount: 85000 },
  { category: 'Operations', amount: 68000 },
  { category: 'Rent', amount: 32000 },
  { category: 'Marketing', amount: 42000 },
  { category: 'Tech', amount: 23500 },
  { category: 'Other', amount: 18000 },
]

// ── Smart Tools ───────────────────────────────────────────────────────────────
export const smartTools = [
  {
    id: 1,
    icon: 'Calculator',
    title: 'GST Calculator',
    description: 'Instantly compute GST liability, input tax credit, and net payable across all slabs.',
    color: 'yellow',
    badge: 'Most Used',
    navTarget: 'gst',
  },
  {
    id: 2,
    icon: 'TrendingUp',
    title: 'Financial Hub',
    description: 'Upload bank statements, track P&L, and get AI-powered spending insights in real time.',
    color: 'green',
    badge: 'New',
    navTarget: 'finance',
  },
  {
    id: 3,
    icon: 'ShieldCheck',
    title: 'Compliance Checker',
    description: 'Stay on top of all filing deadlines with automated reminders and penalty forecasts.',
    color: 'blue',
    badge: null,
    navTarget: 'compliance',
  },
]

// ── Latest Updates ────────────────────────────────────────────────────────────
export const updates = [
  {
    id: 1,
    tag: 'GST',
    tagColor: 'yellow',
    title: 'GST Council reduces rate on EVs to 5%',
    description:
      'The 53rd GST Council meeting approved a rate reduction on electric vehicles and related components, effective April 1st.',
    source: 'Ministry of Finance',
    date: 'Mar 05, 2026',
    readTime: '3 min read',
  },
  {
    id: 2,
    tag: 'MSME',
    tagColor: 'green',
    title: 'New ₹50,000 Cr MSME Credit Fund announced',
    description:
      'Government launches a dedicated credit facility for small businesses with a streamlined approval process and 6% interest subsidy.',
    source: 'MSME Ministry',
    date: 'Mar 03, 2026',
    readTime: '4 min read',
  },
  {
    id: 3,
    tag: 'Policy',
    tagColor: 'blue',
    title: 'E-invoicing threshold lowered to ₹5 Crore',
    description:
      'CBIC mandates e-invoicing for businesses with turnover above ₹5 Crore, bringing more SMEs under the digital invoicing system.',
    source: 'CBIC',
    date: 'Mar 01, 2026',
    readTime: '5 min read',
  },
  {
    id: 4,
    tag: 'Economy',
    tagColor: 'purple',
    title: 'India GDP growth projected at 7.2% for FY26',
    description:
      "IMF revises India's growth projection upward, citing strong domestic consumption and infrastructure spending momentum.",
    source: 'IMF Report',
    date: 'Feb 28, 2026',
    readTime: '6 min read',
  },
  {
    id: 5,
    tag: 'GST',
    tagColor: 'yellow',
    title: 'GSTR-2B reconciliation now auto-populated',
    description:
      'New feature on the GST portal enables automatic reconciliation between GSTR-2A and your purchase register books.',
    source: 'GSTN Portal',
    date: 'Feb 25, 2026',
    readTime: '2 min read',
  },
  {
    id: 6,
    tag: 'MSME',
    tagColor: 'green',
    title: 'Udyam registration portal revamped with AI',
    description:
      'New AI-powered features added to streamline business registration and compliance tracking for all MSMEs nationwide.',
    source: 'Udyam Portal',
    date: 'Feb 22, 2026',
    readTime: '3 min read',
  },
]

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifications = [
  {
    id: 1,
    icon: 'FileText',
    title: 'GSTR-3B due in 5 days',
    desc: 'February return pending. ₹1,24,800 payable.',
    time: '2h ago',
    unread: true,
  },
  {
    id: 2,
    icon: 'TrendingUp',
    title: 'Revenue milestone reached',
    desc: 'You crossed ₹8L revenue this month!',
    time: '5h ago',
    unread: true,
  },
  {
    id: 3,
    icon: 'Info',
    title: 'New GST notification',
    desc: 'EV rate revised to 5% from April 1st.',
    time: '1d ago',
    unread: false,
  },
]

// ── AI Chat Responses ─────────────────────────────────────────────────────────
export const aiResponses = [
  'Based on your Q3 GST data, your liability has grown 8%. I recommend reviewing ITC claims on capital goods to offset this.',
  'Your GSTR-3B for February is due on March 20th. Shall I prepare a pre-filled summary of your input tax credits?',
  'I found 3 potential ITC claims worth ₹18,400 that you may have missed. Want me to generate a detailed reconciliation report?',
  'Your expense breakdown shows Marketing costs are up 15% MoM. I can help identify tax-deductible items to reduce liability.',
  'Compliance tip: Filing GSTR-1 before the 11th ensures your buyers can claim ITC faster, improving your business relationships.',
  'Based on current trends, your estimated annual GST liability for FY26 is ₹14.2L. Shall I run a scenario analysis?',
]
