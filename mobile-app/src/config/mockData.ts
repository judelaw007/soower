import { Campaign } from '../types';

/**
 * Default campaigns used when Firestore is empty or unavailable
 */
export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'widowcare-001',
    title: 'Widow Care',
    category: 'Relief & Support',
    description: 'Sustaining widows through financial aid, food support, and business empowerment grants. An ongoing commitment to care for the vulnerable.',
    image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=800',
    color: 'bg-rose-500',
    icon: 'heart'
  },
  {
    id: 'dad-project-001',
    title: 'The DAD Project',
    category: 'Orphans & Education',
    description: 'Developing Academically and Discipling (DAD). Providing comprehensive educational sponsorship and mentorship for orphans.',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    color: 'bg-blue-500',
    icon: 'book-open'
  },
  {
    id: 'missioncare-001',
    title: 'Mission Care',
    category: 'Global Missions',
    description: 'Equipping missionaries in remote fields with the resources they need to spread the Gospel effectively.',
    image: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&q=80&w=800',
    color: 'bg-amber-500',
    icon: 'globe'
  }
];

/**
 * Donation amount presets in NGN
 */
export const DONATION_PRESETS = [1000, 5000, 10000, 50000];

/**
 * Minimum donation amount in NGN
 */
export const MIN_DONATION_AMOUNT = 100;
