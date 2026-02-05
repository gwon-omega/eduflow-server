/**
 * Feature Configuration for Subscription Tiers
 * Defines which features are available at each tier
 */

export type SubscriptionTier = 'trial' | 'starter' | 'professional' | 'enterprise';

export interface TierLimits {
  maxStudents: number;
  maxTeachers: number;
  maxCourses: number;
  maxStorage: number; // in MB
  apiRequestsPerDay: number;
}

export interface TierConfig {
  name: string;
  displayName: string;
  features: string[];
  limits: TierLimits;
  price: {
    monthly: number;
    annual: number;
  };
}

// Feature identifiers
export const FEATURES = {
  // Core features (all tiers)
  DASHBOARD: 'dashboard',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  COURSES: 'courses',
  ATTENDANCE: 'attendance',
  LIBRARY: 'library',
  SCHEDULE: 'schedule',

  // Starter+ features
  MESSAGES: 'messages',
  RESULTS: 'results',
  ASSESSMENTS: 'assessments',

  // Professional+ features
  ANALYTICS: 'analytics',
  FINANCE: 'finance',
  REPORTS: 'reports',
  API_ACCESS: 'api_access',
  INTEGRATIONS: 'integrations',
  EXAMS: 'exams',

  // Enterprise features
  CUSTOM_BRANDING: 'custom_branding',
  MULTI_CAMPUS: 'multi_campus',
  PRIORITY_SUPPORT: 'priority_support',
  SLA_GUARANTEE: 'sla_guarantee',
  WHITE_LABEL: 'white_label',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

// Tier configurations
export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  trial: {
    name: 'trial',
    displayName: 'Free Trial',
    features: [
      FEATURES.DASHBOARD,
      FEATURES.STUDENTS,
      FEATURES.TEACHERS,
      FEATURES.COURSES,
      FEATURES.ATTENDANCE,
      FEATURES.LIBRARY,
      FEATURES.SCHEDULE,
    ],
    limits: {
      maxStudents: 50,
      maxTeachers: 10,
      maxCourses: 5,
      maxStorage: 500, // 500MB
      apiRequestsPerDay: 100,
    },
    price: { monthly: 0, annual: 0 },
  },

  starter: {
    name: 'starter',
    displayName: 'Starter',
    features: [
      FEATURES.DASHBOARD,
      FEATURES.STUDENTS,
      FEATURES.TEACHERS,
      FEATURES.COURSES,
      FEATURES.ATTENDANCE,
      FEATURES.LIBRARY,
      FEATURES.SCHEDULE,
      FEATURES.MESSAGES,
      FEATURES.RESULTS,
      FEATURES.ASSESSMENTS,
    ],
    limits: {
      maxStudents: 200,
      maxTeachers: 25,
      maxCourses: 20,
      maxStorage: 2000, // 2GB
      apiRequestsPerDay: 500,
    },
    price: { monthly: 4999, annual: 3999 },
  },

  professional: {
    name: 'professional',
    displayName: 'Professional',
    features: [
      FEATURES.DASHBOARD,
      FEATURES.STUDENTS,
      FEATURES.TEACHERS,
      FEATURES.COURSES,
      FEATURES.ATTENDANCE,
      FEATURES.LIBRARY,
      FEATURES.SCHEDULE,
      FEATURES.MESSAGES,
      FEATURES.RESULTS,
      FEATURES.ASSESSMENTS,
      FEATURES.ANALYTICS,
      FEATURES.FINANCE,
      FEATURES.REPORTS,
      FEATURES.API_ACCESS,
      FEATURES.INTEGRATIONS,
      FEATURES.EXAMS,
    ],
    limits: {
      maxStudents: 1000,
      maxTeachers: 100,
      maxCourses: 100,
      maxStorage: 10000, // 10GB
      apiRequestsPerDay: 5000,
    },
    price: { monthly: 9999, annual: 7999 },
  },

  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    features: [
      FEATURES.DASHBOARD,
      FEATURES.STUDENTS,
      FEATURES.TEACHERS,
      FEATURES.COURSES,
      FEATURES.ATTENDANCE,
      FEATURES.LIBRARY,
      FEATURES.SCHEDULE,
      FEATURES.MESSAGES,
      FEATURES.RESULTS,
      FEATURES.ASSESSMENTS,
      FEATURES.ANALYTICS,
      FEATURES.FINANCE,
      FEATURES.REPORTS,
      FEATURES.API_ACCESS,
      FEATURES.INTEGRATIONS,
      FEATURES.EXAMS,
      FEATURES.CUSTOM_BRANDING,
      FEATURES.MULTI_CAMPUS,
      FEATURES.PRIORITY_SUPPORT,
      FEATURES.SLA_GUARANTEE,
      FEATURES.WHITE_LABEL,
    ],
    limits: {
      maxStudents: -1, // unlimited
      maxTeachers: -1,
      maxCourses: -1,
      maxStorage: -1,
      apiRequestsPerDay: -1,
    },
    price: { monthly: 24999, annual: 19999 },
  },
};

/**
 * Check if a tier has access to a specific feature
 */
export function hasFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
  return TIER_CONFIG[tier].features.includes(feature);
}

/**
 * Get limits for a tier
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_CONFIG[tier].limits;
}

/**
 * Check if a tier is at or above a minimum tier
 */
export function meetsMinimumTier(currentTier: SubscriptionTier, minimumTier: SubscriptionTier): boolean {
  const tierOrder: SubscriptionTier[] = ['trial', 'starter', 'professional', 'enterprise'];
  return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(minimumTier);
}

/**
 * Get all features for a tier
 */
export function getTierFeatures(tier: SubscriptionTier): string[] {
  return TIER_CONFIG[tier].features;
}

/**
 * Navigation items gated by tier
 */
export const GATED_ROUTES: Record<string, SubscriptionTier> = {
  '/dashboard/analytics': 'professional',
  '/dashboard/finance': 'professional',
  '/dashboard/reports': 'professional',
  '/dashboard/integrations': 'professional',
  '/dashboard/exams': 'professional',
  '/dashboard/settings/branding': 'enterprise',
  '/dashboard/settings/api-keys': 'professional',
};
