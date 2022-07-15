import {
  AGGREGATOR_ADDRESS,
  ChainId,
  Currency,
  CurrencyAmount,
  Percent,
  TradeType,
  Trade as V2Trade,
  AddressMap,
} from '@tangoswapcash/sdk'

import { ApprovalState, useApproveCallback } from '.'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useCallback, useMemo } from 'react'

//TODO(fernando)
const ORDERS_CASH_CONTRACT: AddressMap = {
  [ChainId.SMARTBCH]: '0x5eBE6bFcA42C8440c8DC6C688E449E0B26e8E243',
  [ChainId.SMARTBCH_AMBER]: ''
}


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
          ? ORDERS_CASH_CONTRACT[chainId]
          : undefined
        : undefined
      : undefined
  )
}