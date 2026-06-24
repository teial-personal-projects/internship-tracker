import type { TrustedSourceAdapter } from './types';
import { weWorkRemotelyAdapter } from './weWorkRemotely';

const TRUSTED_SOURCE_ADAPTERS: Record<string, TrustedSourceAdapter> = {
  we_work_remotely: weWorkRemotelyAdapter,
};

export function getTrustedSourceAdapter(adapterType: string): TrustedSourceAdapter {
  const adapter = TRUSTED_SOURCE_ADAPTERS[adapterType];
  if (!adapter) {
    throw new Error(`Unsupported trusted source adapter: ${adapterType}`);
  }
  return adapter;
}
