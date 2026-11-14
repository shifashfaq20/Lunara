import { router } from 'expo-router';

/** Return to the welcome screen without stacking duplicate copies of it. */
export function goHome() {
  const r = router as typeof router & { dismissTo?: (href: string) => void };
  if (typeof r.dismissTo === 'function') r.dismissTo('/');
  else router.replace('/');
}
