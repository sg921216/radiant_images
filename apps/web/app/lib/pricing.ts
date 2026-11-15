import type { PricingRevision, ShootType } from '@radiant/shared';
export const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const titleCase = (value: string) => value[0]!.toUpperCase() + value.slice(1);
export const packagesFor = (revision: PricingRevision, type: ShootType) =>
  revision.packages.filter((p) => p.shootType === type).sort((a, b) => a.sortOrder - b.sortOrder);
