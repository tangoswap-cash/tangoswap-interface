import { Currency, Percent, TradeSmart } from '@tangoswapcash/sdk'

import { useMemo } from 'react'
import { useUserFeePercentWithDefault, useUserSlippageToleranceWithDefault } from '../state/user/hooks'

const V2_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000) // .50%
const SWAP_FEE_PERCENT = new Percent(5, 10_000) // .50%

export function useSmartSwapSlippageTolerance(trade: TradeSmart<Currency, Currency> | undefined): Percent {
  const defaultSlippageTolerance = useMemo(() => {
    return V2_SWAP_DEFAULT_SLIPPAGE
  }, [trade])
  return useUserSlippageToleranceWithDefault(defaultSlippageTolerance)
}

export function useSmartSwapFeePercent(trade: TradeSmart<Currency, Currency> | undefined): Percent {
  const defaultFeePercent = useMemo(() => {
    return SWAP_FEE_PERCENT
  }, [trade])
  return useUserFeePercentWithDefault(defaultFeePercent)
}
