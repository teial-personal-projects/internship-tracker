import type { AtsType } from '@internship-tracker/shared';
import type { AtsAdapter } from './types';
import { ashbyAdapter } from './ashby';
import { customSiteAdapter, pinpointAdapter, welcomeKitAdapter } from './htmlFallback';
import { greenhouseAdapter } from './greenhouse';
import { leverAdapter } from './lever';
import { smartRecruitersAdapter } from './smartrecruiters';

const ADAPTERS: Record<AtsType, AtsAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  ashby: ashbyAdapter,
  smartrecruiters: smartRecruitersAdapter,
  pinpoint: pinpointAdapter,
  welcomekit: welcomeKitAdapter,
  custom: customSiteAdapter,
};

export function getAtsAdapter(atsType: string): AtsAdapter {
  const adapter = ADAPTERS[atsType as AtsType];
  if (!adapter) {
    throw new Error(`Unsupported ATS type: ${atsType}`);
  }
  return adapter;
}
