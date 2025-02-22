import { ChainId } from '@tangoswapcash/sdk'

export enum Feature {
  AMM = 'AMM',
  AMM_V2 = 'AMM V2',
  LIQUIDITY_MINING = 'Liquidity Mining',
  BENTOBOX = 'Mirror',
  KASHI = 'Lend',
  MISO = 'MISO',
  ANALYTICS = 'Analytics',
  MIGRATE = 'Migrate',
  STAKING = 'Staking',
  GRIDEX = 'Gridex',
}

const features = {
  [ChainId.SMARTBCH]: [
    Feature.AMM,
    Feature.LIQUIDITY_MINING,
    // Feature.MIGRATE,
    Feature.ANALYTICS,
    Feature.STAKING,
    Feature.GRIDEX
  ],
  [ChainId.SMARTBCH_AMBER]: [
    Feature.AMM,
    Feature.LIQUIDITY_MINING,
    /*
    Feature.MIGRATE,
    Feature.ANALYTICS,
    */
    Feature.STAKING,
    Feature.BENTOBOX,
    Feature.KASHI
  ],
}

export function featureEnabled(feature: Feature, chainId: ChainId): boolean {
  return features?.[chainId]?.includes(feature)
}

export function chainsWithFeature(feature: Feature): ChainId[] {
  return Object.keys(features)
    .filter((chain) => features[chain].includes(feature))
    .map((chain) => ChainId[chain])
}
