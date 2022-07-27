import {
  AGGREGATOR_ADDRESS,
  ChainId,
  Currency,
  CurrencyAmount,
  Percent,
  TradeType,
  Trade as V2Trade,
  AddressMap,
  ORDERS_CASH_V1_ADDRESS,
} from '@tangoswapcash/sdk'

import { ApprovalState, useApproveCallback } from '.'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useCallback, useMemo } from 'react'

// wraps useApproveCallback in the context of a swap
export function useLimitOrderApproveCallback(
  trade: V2Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent,
  doArcher: boolean = false
) {
  const { chainId } = useActiveWeb3React()
  const amountToApprove = useMemo(
    () => (trade && trade.inputAmount.currency.isToken ? trade.maximumAmountIn(allowedSlippage) : undefined),
    [trade, allowedSlippage]
  )
  return useApproveCallback(
    amountToApprove,
    chainId
      ? trade instanceof V2Trade
        ? !doArcher
          ? ORDERS_CASH_V1_ADDRESS[chainId]
          : undefined
        : undefined
      : undefined
  )
}
