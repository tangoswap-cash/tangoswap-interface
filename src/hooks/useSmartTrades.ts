import { Aggregator, Currency, CurrencyAmount, Pair, TradeSmart } from '@tangoswapcash/sdk'
import { PairState, useV2Pairs } from './useV2Pairs'

import { BETTER_TRADE_LESS_HOPS_THRESHOLD } from '../constants'
import { isTradeBetter } from '../functions/trade'
import { useAllCurrencyCombinations } from './useAllCurrencyCombinations'
import { useMemo } from 'react'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useSmartSwapContract } from './useContract'
// import { useArgentWalletContract } from './useArgentWalletContract'
import { useSingleCallResult } from '../state/multicall/hooks'

export const PARTS = 10
export const FLAGS = 0

interface GetExpectedReturnCallData {
  address: string
  calldata: string
  value: string
}

/**
 */
 export function useSmartTrade(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
  { parts = PARTS } = {},
  { flags = FLAGS } = {},
): TradeSmart<Currency, Currency> | null {
  const smartSwapContract = useSmartSwapContract()

  const args = useMemo(() => {
    if (!currencyAmountIn || !currencyOut || !smartSwapContract ) return
    const { methodName, args, value } = Aggregator.getExpectedReturnCallParameters(
      currencyAmountIn,
      currencyOut,
      {
        parts,
        flags,
      }
    )
    return args;
  }, [currencyAmountIn, currencyOut])

  const result = useSingleCallResult(args ? smartSwapContract : null, "getExpectedReturn", args)?.result
  const returnAmount = result?.[0]
  const distribution = result?.[1]

  const trade = returnAmount ?
    new TradeSmart<Currency, Currency>(currencyAmountIn, CurrencyAmount.fromRawAmount(currencyOut, returnAmount), distribution, flags) :
    null;

  return trade;
}

