import type { TrustedSourceAdapter } from './types';

const TRUSTED_SOURCE_ADAPTERS: Record<string, TrustedSourceAdapter> = {
};

export function getTrustedSourceAdapter(adapterType: string): TrustedSourceAdapter {
  const adapter = TRUSTED_SOURCE_ADAPTERS[adapterType];
  if (!adapter) {
    throw new Error(`Unsupported trusted source adapter: ${adapterType}`);
  }
  return adapter;
}
