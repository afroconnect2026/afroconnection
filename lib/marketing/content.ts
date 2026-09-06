/**
 * Marketing content for AfroConnect public pages.
 *
 * Everything a non-developer needs to update on the public site lives here:
 * how-it-works steps, role CTAs, AI explanations, testimonials, partners,
 * team members and social links.
 *
 * PLACEHOLDER CONTENT is clearly flagged. Flip the `IS_*_PLACEHOLDER`
 * constants to `false` once real content is supplied so the "illustrative
 * example" notices disappear from the UI.
 */

export type RoleSlug = 'investor' | 'founder' | 'opportunities' | 'funding'

/** Maps a marketing role slug onto the `profiles.user_type` enum. */
export type PlatformUserType = 'entrepreneur' | 'investor' | 'professional' | 'company'

export interface HowItWorksStep {
  step: number
  title: string
  description: string
  /** lucide-react icon name resolved by the component. */
  icon: 'UserPlus' | 'FileText' | 'Sparkles' | 'Handshake' | 'Rocket'
}

export interface PlatformPillar {
  title: string
  description: string
  icon: 'Users' | 'TrendingUp' | 'GraduationCap' | 'Building2'
}

export interface RoleCta {
  slug: RoleSlug
  label: string
  headline: string
  subheadline: string
  /** Where this role lands inside the standard onboarding. */
  userType: PlatformUserType
  /** Onboarding goal recorded against the profile. */
  primaryGoal: string
  /** Extra, role specific onboarding question. */
  onboardingQuestion: string
  onboardingOptions: string[]
  benefits: string[]
  icon: 'TrendingUp' | 'Rocket' | 'Briefcase' | 'DollarSign'
  color: string
}

export interface AiCapability {
  title: string
  /** The practical, concrete explanation shown to visitors. */
  example: string
  supporting: string
  icon: 'Target' | 'Sparkles' | 'Gauge'
}

export interface Testimonial {
  quote: string
  name: string
  role: string
  organisation: string
  location: string
  initials: string
}

export interface Partner {
  name: string
  category: string
  initials: string
}

export interface TeamMember {
  name: string
  role: string
  bio: string
  location: string
  initials: string
  /** Path under /public, or null to render the initials monogram. */
  photoUrl: string | null
  linkedinUrl: string | null
}

export interface SocialLink {
  name: 'LinkedIn' | 'X' | 'Facebook' | 'Instagram' | 'Email'
  href: string
  icon: 'Linkedin' | 'Twitter' | 'Facebook' | 'Instagram' | 'Mail'
  /** Primary links are surfaced in more places (header, CTA blocks). */
  primary: boolean
}

/* ------------------------------------------------------------------ */
/* Tagline + positioning                                               */
/* ------------------------------------------------------------------ */

export const TAGLINE = 'Connecting Africa to Opportunity'
export const TAGLINE_SUPPORT =
  'One network for the people building Africa’s next decade — founders, investors, mentors and partners.'

export const PLATFORM_FOCUS =
  'Networking + Investment + Mentorship + Business Partnerships'

export const PLATFORM_PILLARS: PlatformPillar[] = [
  {
    title: 'Networking',
    description:
      'Reach verified founders, investors and operators across African markets and the diaspora — without cold outreach.',
    icon: 'Users',
  },
  {
    title: 'Investment',
    description:
      'Deal flow that moves both ways: founders surface to investors whose thesis actually fits their stage and sector.',
    icon: 'TrendingUp',
  },
  {
    title: 'Mentorship',
    description:
      'Get matched with operators who have already solved the problem in front of you, in a market you understand.',
    icon: 'GraduationCap',
  },
  {
    title: 'Business Partnerships',
    description:
      'Find distribution partners, co-founders and market-entry allies for expansion across borders.',
    icon: 'Building2',
  },
]

/* ------------------------------------------------------------------ */
/* 1. How it works                                                     */
/* ------------------------------------------------------------------ */

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    title: 'Sign Up',
    description:
      'Create a free account in under two minutes. Tell us whether you are investing, building, hiring or raising.',
    icon: 'UserPlus',
  },
  {
    step: 2,
    title: 'Create Your Profile',
    description:
      'Add your sector, stage, ticket size or expertise. The more specific you are, the sharper your matches.',
    icon: 'FileText',
  },
  {
    step: 3,
    title: 'Get Matched',
    description:
      'We surface the people whose goals line up with yours, each with a compatibility score explaining why.',
    icon: 'Sparkles',
  },
  {
    step: 4,
    title: 'Connect',
    description:
      'Message directly, meet at events, and move from introduction to real conversation.',
    icon: 'Handshake',
  },
  {
    step: 5,
    title: 'Build Opportunities',
    description:
      'Close the round, sign the partnership, hire the team — and post your own opportunities back into the network.',
    icon: 'Rocket',
  },
]

/* ------------------------------------------------------------------ */
/* 7. Role specific calls to action                                    */
/* ------------------------------------------------------------------ */

export const ROLE_CTAS: RoleCta[] = [
  {
    slug: 'investor',
    label: "I'm an Investor",
    headline: 'Find your next investment in Africa',
    subheadline:
      'Screen founders by sector, stage and traction — and see who matches your thesis before you take the meeting.',
    userType: 'investor',
    primaryGoal: 'Find investment opportunities',
    onboardingQuestion: 'What stage do you typically invest at?',
    onboardingOptions: [
      'Pre-seed',
      'Seed',
      'Series A',
      'Series B and beyond',
      'Stage agnostic',
    ],
    benefits: [
      'Curated deal flow matched to your thesis',
      'Verified founder profiles with stage and traction',
      'Direct messaging — no gatekeepers',
    ],
    icon: 'TrendingUp',
    color: 'from-gold-500 to-gold-600',
  },
  {
    slug: 'founder',
    label: "I'm a Founder",
    headline: 'Build the network your company needs',
    subheadline:
      'Investors, co-founders, mentors and partners — matched to the stage your startup is actually at.',
    userType: 'entrepreneur',
    primaryGoal: 'Grow my startup',
    onboardingQuestion: 'What stage is your startup at?',
    onboardingOptions: [
      'Idea / pre-product',
      'MVP launched',
      'Early revenue',
      'Scaling',
      'Profitable',
    ],
    benefits: [
      'Get discovered by investors backing your sector',
      'Find co-founders and early team members',
      'Learn from operators who have scaled before you',
    ],
    icon: 'Rocket',
    color: 'from-primary-500 to-primary-600',
  },
  {
    slug: 'opportunities',
    label: "I'm Looking for Opportunities",
    headline: 'Roles, partnerships and mentorship across Africa',
    subheadline:
      'Browse live opportunities from vetted companies and founders, and get matched to the ones that fit your expertise.',
    userType: 'professional',
    primaryGoal: 'Find opportunities',
    onboardingQuestion: 'What kind of opportunity are you looking for?',
    onboardingOptions: [
      'Full-time role',
      'Consulting / advisory work',
      'Board or mentor seat',
      'Co-founder position',
      'Partnership or distribution deal',
    ],
    benefits: [
      'Live roles, partnerships and advisory seats',
      'Matched to your skills, sector and location',
      'Apply once — your profile does the rest',
    ],
    icon: 'Briefcase',
    color: 'from-blue-500 to-blue-600',
  },
  {
    slug: 'funding',
    label: "I'm Looking for Funding",
    headline: 'Get in front of investors who fund your stage',
    subheadline:
      'Add your funding stage and raise amount, and we put your startup in front of the investors actively writing those cheques.',
    userType: 'entrepreneur',
    primaryGoal: 'Raise funding',
    onboardingQuestion: 'What funding stage are you raising at?',
    onboardingOptions: [
      'Pre-seed',
      'Seed',
      'Series A',
      'Series B and beyond',
      'Grant or non-dilutive funding',
    ],
    benefits: [
      'Matched with investors active in your sector',
      'Show traction, stage and ask in one profile',
      'Track who viewed your startup',
    ],
    icon: 'DollarSign',
    color: 'from-purple-500 to-purple-600',
  },
]

export function getRoleCta(slug: string | null | undefined): RoleCta | null {
  if (!slug) return null
  return ROLE_CTAS.find((role) => role.slug === slug) ?? null
}

export interface OnboardingQuestion {
  question: string
  options: string[]
  primaryGoal: string
}

/**
 * Fallback onboarding question used when a visitor picks a member type
 * directly instead of arriving through a role specific call to action.
 */
export const USER_TYPE_ONBOARDING: Record<PlatformUserType, OnboardingQuestion> = {
  entrepreneur: {
    question: 'What stage is your startup at?',
    options: [
      'Idea / pre-product',
      'MVP launched',
      'Early revenue',
      'Scaling',
      'Profitable',
    ],
    primaryGoal: 'Grow my startup',
  },
  investor: {
    question: 'What stage do you typically invest at?',
    options: ['Pre-seed', 'Seed', 'Series A', 'Series B and beyond', 'Stage agnostic'],
    primaryGoal: 'Find investment opportunities',
  },
  professional: {
    question: 'What kind of opportunity are you looking for?',
    options: [
      'Full-time role',
      'Consulting / advisory work',
      'Board or mentor seat',
      'Co-founder position',
      'Partnership or distribution deal',
    ],
    primaryGoal: 'Find opportunities',
  },
  company: {
    question: 'What is your company here to do?',
    options: [
      'Hire talent',
      'Find distribution or channel partners',
      'Enter a new African market',
      'Raise capital',
      'Invest in or acquire companies',
    ],
    primaryGoal: 'Build business partnerships',
  },
}

export function getOnboardingQuestion(
  userType: PlatformUserType,
  role: RoleCta | null
): OnboardingQuestion {
  if (role && role.userType === userType) {
    return {
      question: role.onboardingQuestion,
      options: role.onboardingOptions,
      primaryGoal: role.primaryGoal,
    }
  }
  return USER_TYPE_ONBOARDING[userType]
}

/* ------------------------------------------------------------------ */
/* 3. Practical AI                                                     */
/* ------------------------------------------------------------------ */

export const AI_HEADLINE = 'What our AI actually does for you'
export const AI_SUBHEADLINE =
  'No buzzwords. Three concrete jobs the matching engine does every time you use AfroConnect.'

export const AI_CAPABILITIES: AiCapability[] = [
  {
    title: 'Smart Matching',
    example:
      'Our AI matches fintech investors with founders in Africa who are raising seed funding.',
    supporting:
      'It reads sector, stage, ticket size and location on both sides, so an investor writing $250K seed cheques into fintech sees exactly those founders — not a feed of everyone.',
    icon: 'Target',
  },
  {
    title: 'Profile Optimization',
    example:
      'Adding your funding stage helps investors find and understand your startup faster.',
    supporting:
      'We tell you which specific field is missing and what it unlocks — add your raise amount and you appear in the searches investors are already running.',
    icon: 'Sparkles',
  },
  {
    title: 'Compatibility Scores',
    example:
      'See at a glance how closely your goals align with a potential investor or co-founder.',
    supporting:
      'Every suggested connection carries a score and a plain-English reason, so you know why the match was made before you send the first message.',
    icon: 'Gauge',
  },
]

/* ------------------------------------------------------------------ */
/* 2. Testimonials and partners                                        */
/* ------------------------------------------------------------------ */

/**
 * Set to `false` once real, attributable testimonials are collected.
 * While `true`, the UI labels the section as illustrative examples so
 * nothing on the live site reads as a fabricated endorsement.
 */
export const IS_TESTIMONIALS_PLACEHOLDER = true

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'We were matched with three investors who already back logistics in West Africa. Two took the meeting in the same week — that used to take us a quarter of cold emails.',
    name: 'Founder, Series A logistics startup',
    role: 'Co-Founder & CEO',
    organisation: 'Logistics · West Africa',
    location: 'Lagos, Nigeria',
    initials: 'LG',
  },
  {
    quote:
      'The compatibility score is the part that saves me time. I can see a founder’s stage, sector and ask before I open the profile, so my deal review actually stays manageable.',
    name: 'Partner, early-stage fund',
    role: 'Investment Partner',
    organisation: 'Seed fund · Pan-African',
    location: 'Nairobi, Kenya',
    initials: 'EF',
  },
  {
    quote:
      'I joined to find a mentor and ended up finding a market-entry partner for East Africa. The network is small enough to be real and wide enough to be useful.',
    name: 'Operator, fintech scale-up',
    role: 'Head of Expansion',
    organisation: 'Fintech · East Africa',
    location: 'Kigali, Rwanda',
    initials: 'FT',
  },
]

/**
 * Set to `false` once partnerships are confirmed and real logos are added
 * to /public/partners. Placeholder names are intentionally generic so the
 * live site never implies an endorsement that does not exist.
 */
export const IS_PARTNERS_PLACEHOLDER = false

export const PARTNERS: Partner[] = [
  { name: 'Haraka', category: 'Food Delivery & Courier', initials: 'HR' },
  { name: 'Africa Cyber Trust', category: 'Cybersecurity', initials: 'AC' },
  { name: 'Nilus', category: 'Fintech', initials: 'NL' },
  { name: 'Lifeline', category: 'Healthcare', initials: 'LL' },
]

export const TRUST_INDICATORS: { label: string; value: string }[] = [
  { value: '100%', label: 'Member profiles verified before matching' },
  { value: 'Free', label: 'To join, build a profile and browse' },
  { value: '4', label: 'Member types: founders, investors, professionals, companies' },
  { value: '0', label: 'Data sold to third parties, ever' },
]

/* ------------------------------------------------------------------ */
/* 4. About / meet the team                                            */
/* ------------------------------------------------------------------ */

export const VISION_STATEMENT =
  'An Africa where a good idea reaches the right backer, partner or mentor in days — not years, and never because of who you happened to already know.'

export const MISSION_STATEMENT =
  'To build the trusted network layer for African opportunity: verifying who people are, understanding what they are looking for, and making the introduction that moves capital, expertise and partnerships to where they create the most value.'

export const OUR_STORY: string[] = [
  'AfroConnect started from a pattern we kept seeing repeat itself. A founder in Accra with real traction could not get in front of an investor in London who was actively looking for exactly that company. A fund with capital earmarked for African fintech was reviewing the same handful of already-connected startups. The opportunity and the capital were both there. The introduction was not.',
  'The gap was never talent or ambition — it was access. Networks in African markets are dense but fragmented: strong within a city, thin across borders, and almost invisible to the diaspora and international investors who want in. Everything moved through personal referral, which meant the same people kept getting the same chances.',
  'So we built the layer that was missing. AfroConnect verifies who members are, captures what they are actually looking for — stage, sector, ticket size, expertise — and uses that to make matches with a reason attached. Founders, investors, professionals and companies meet on structure, not on luck.',
  'We are early, and deliberately so. Every member is verified, every match is explainable, and the network grows in the direction its members need. If you are building, backing or partnering across African markets, there is a place for you in it.',
]

export const OUR_VALUES: { title: string; description: string }[] = [
  {
    title: 'Access over gatekeeping',
    description:
      'The best idea should reach the right person regardless of which alumni network or WhatsApp group they belong to.',
  },
  {
    title: 'Verified, always',
    description:
      'Every member is checked before they can match. Trust is the product; we do not trade it for growth numbers.',
  },
  {
    title: 'Explainable matching',
    description:
      'Every match comes with a reason. If we cannot explain why two people should meet, we do not make the introduction.',
  },
  {
    title: 'Built for African markets',
    description:
      'Cross-border, multi-currency, mobile-first, diaspora-aware. The realities of the continent are the default, not an edge case.',
  },
]

/**
 * PLACEHOLDER — replace with real founder names, bios and photos before launch.
 * Drop photos into /public/team/ and set `photoUrl` (e.g. '/team/founder.jpg').
 * While `IS_TEAM_PLACEHOLDER` is true the page shows a "profiles being finalised"
 * note instead of presenting placeholder people as real.
 */
export const IS_TEAM_PLACEHOLDER = true

export const TEAM: TeamMember[] = [
  {
    name: 'Co-Founder & Chief Executive',
    role: 'Vision, partnerships and network growth',
    bio: 'Leads AfroConnect’s vision and partnerships, working with funds, accelerators and trade bodies across the continent to bring verified opportunity onto the platform.',
    location: 'Africa · Remote',
    initials: 'AC',
    photoUrl: null,
    linkedinUrl: null,
  },
  {
    name: 'Co-Founder & Chief Technology Officer',
    role: 'Product, matching engine and platform',
    bio: 'Owns the matching engine and platform architecture — the verification, scoring and messaging systems that turn a directory into a network that actually introduces people.',
    location: 'Africa · Remote',
    initials: 'AC',
    photoUrl: null,
    linkedinUrl: null,
  },
  {
    name: 'Head of Community',
    role: 'Members, events and verification',
    bio: 'Runs member verification, events and the day-to-day life of the community, making sure every new member arrives to a network that is ready for them.',
    location: 'Africa · Remote',
    initials: 'AC',
    photoUrl: null,
    linkedinUrl: null,
  },
]

/* ------------------------------------------------------------------ */
/* 5. Social links                                                     */
/* ------------------------------------------------------------------ */

/**
 * Update these to the organisation's live pages. LinkedIn is the priority
 * channel; any link left empty is hidden automatically.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/afroconnect-network',
    icon: 'Linkedin',
    primary: true,
  },
  {
    name: 'X',
    href: 'https://x.com/afroconnect',
    icon: 'Twitter',
    primary: false,
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/afroconnect',
    icon: 'Facebook',
    primary: false,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/afroconnect',
    icon: 'Instagram',
    primary: false,
  },
]

export const CONTACT_EMAIL = 'Support@afroconnect.io'

/* ------------------------------------------------------------------ */
/* 6. Public preview fallbacks                                         */
/* ------------------------------------------------------------------ */

export interface SampleEvent {
  id: string
  title: string
  description: string
  event_type: string
  start_date: string
  location: string
  isSample: true
}

export interface SampleOpportunity {
  id: string
  title: string
  description: string
  opportunity_type: string
  location: string
  isSample: true
}

export interface AnonymisedDeal {
  headline: string
  sector: string
  stage: string
  raising: string
  location: string
  traction: string
}

export interface SampleMatch {
  personA: string
  personB: string
  score: number
  reason: string
}

/** Used only when the live database returns nothing for a visitor. */
export const SAMPLE_EVENTS: SampleEvent[] = [
  {
    id: 'sample-event-1',
    title: 'Africa Fintech Investor Roundtable',
    description:
      'Seed and Series A investors meet vetted fintech founders for structured 1:1 sessions across three African markets.',
    event_type: 'networking',
    start_date: '',
    location: 'Lagos, Nigeria · Hybrid',
    isSample: true,
  },
  {
    id: 'sample-event-2',
    title: 'Founder Fundraising Clinic',
    description:
      'A working session on deck structure, valuation and investor targeting for founders raising their first institutional round.',
    event_type: 'workshop',
    start_date: '',
    location: 'Online',
    isSample: true,
  },
  {
    id: 'sample-event-3',
    title: 'Cross-Border Expansion Summit',
    description:
      'Operators who have taken companies into new African markets share what worked, what cost them, and who to talk to first.',
    event_type: 'conference',
    start_date: '',
    location: 'Nairobi, Kenya',
    isSample: true,
  },
  {
    id: 'sample-event-4',
    title: 'Diaspora Capital Mixer',
    description:
      'Diaspora investors and continental founders meet for informal introductions and follow-on deal conversations.',
    event_type: 'networking',
    start_date: '',
    location: 'London, UK · Hybrid',
    isSample: true,
  },
]

export const SAMPLE_OPPORTUNITIES: SampleOpportunity[] = [
  {
    id: 'sample-opp-1',
    title: 'Seed Investment — Agritech Supply Chain',
    description:
      'Investor seeking agritech companies digitising smallholder supply chains, with early revenue and a regional expansion plan.',
    opportunity_type: 'investment',
    location: 'East Africa',
    isSample: true,
  },
  {
    id: 'sample-opp-2',
    title: 'Distribution Partner — Consumer Fintech',
    description:
      'Scale-up looking for a distribution partner with existing agent networks to launch in two new markets.',
    opportunity_type: 'partnership',
    location: 'West Africa',
    isSample: true,
  },
  {
    id: 'sample-opp-3',
    title: 'Technical Co-Founder — Health Logistics',
    description:
      'Commercial founder with pilot contracts in place seeking a technical co-founder to own the product build.',
    opportunity_type: 'cofounder',
    location: 'Remote · Africa',
    isSample: true,
  },
  {
    id: 'sample-opp-4',
    title: 'Mentorship — Go-To-Market for B2B SaaS',
    description:
      'Operator offering structured mentorship to early-stage B2B SaaS founders selling into enterprise across the continent.',
    opportunity_type: 'mentorship',
    location: 'Online',
    isSample: true,
  },
]

/** Anonymised investment opportunities — no company is identifiable. */
export const ANONYMISED_DEALS: AnonymisedDeal[] = [
  {
    headline: 'Payments infrastructure company',
    sector: 'Fintech',
    stage: 'Seed',
    raising: '$1.5M',
    location: 'West Africa',
    traction: 'Processing volume growing 18% month on month',
  },
  {
    headline: 'Cold-chain logistics platform',
    sector: 'Agritech / Logistics',
    stage: 'Pre-Series A',
    raising: '$3M',
    location: 'East Africa',
    traction: 'Contracts with three national distributors',
  },
  {
    headline: 'Clinical records platform for private clinics',
    sector: 'Health tech',
    stage: 'Pre-seed',
    raising: '$600K',
    location: 'Southern Africa',
    traction: '40 paying clinics, 92% retention',
  },
  {
    headline: 'Solar financing for small businesses',
    sector: 'Climate / Fintech',
    stage: 'Series A',
    raising: '$6M',
    location: 'Pan-African',
    traction: 'Loan book profitable in two markets',
  },
]

export const SAMPLE_MATCHES: SampleMatch[] = [
  {
    personA: 'Seed investor · Fintech · $250K cheques',
    personB: 'Founder · Payments · Raising $1.5M seed',
    score: 94,
    reason: 'Same sector, matching stage, ticket size covers the round',
  },
  {
    personA: 'Operator · Scaled B2B SaaS across 4 markets',
    personB: 'Founder · Enterprise SaaS · First market expansion',
    score: 88,
    reason: 'Mentor has already solved the exact expansion problem',
  },
  {
    personA: 'Company · Hiring a country lead, Kenya',
    personB: 'Professional · 8 years East Africa market entry',
    score: 91,
    reason: 'Location, seniority and market experience all align',
  },
]

/** Member outcomes shown publicly, aggregated and non-identifying. */
export const SUCCESS_STORIES: { outcome: string; detail: string; tag: string }[] = [
  {
    tag: 'Fundraising',
    outcome: 'Seed round closed after three matched investor introductions',
    detail:
      'A logistics founder was matched with investors already backing the sector in their region and closed within one quarter.',
  },
  {
    tag: 'Partnership',
    outcome: 'Market entry partner found for a second African market',
    detail:
      'A fintech scale-up met a distribution partner with an existing agent network and launched two markets ahead of plan.',
  },
  {
    tag: 'Talent',
    outcome: 'Technical co-founder matched to a commercial founder',
    detail:
      'Complementary skills, same city, same stage ambition — surfaced by compatibility score rather than cold outreach.',
  },
]
