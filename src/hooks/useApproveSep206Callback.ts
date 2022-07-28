import {
  AGGREGATOR_ADDRESS,
  ChainId,
  Currency,
  CurrencyAmount,
  Percent,
  ROUTER_ADDRESS,
  SEP206,
  TradeType,
  Trade as V2Trade,
  TradeSmart,
} from '@tangoswapcash/sdk'

import { useCallback, useMemo } from 'react'
import { useHasPendingApproval, useTransactionAdder } from '../state/transactions/hooks'

import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin, getGasPrice } from '../functions/trade'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useTokenAllowance } from './useTokenAllowance'
import { useTokenContract } from './useContract'
import { ApprovalState } from './useApproveCallback'

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveSep206Callback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const { account, chainId } = useActiveWeb3React()

  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : SEP206[chainId]

  console.log('token:  ', token)

  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    // if (amountToApprove.currency.isNative) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    if (currentAllowance.equalTo(0)) {
      return pendingApproval ? ApprovalState.PENDING : ApprovalState.NOT_APPROVED
    } else if (currentAllowance.lessThan(amountToApprove)) {
      return pendingApproval ? ApprovalState.PENDING : ApprovalState.NOT_APPROVED
    } else {
      return ApprovalState.APPROVED
    }
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (): Promise<void> => {
    console.log(approvalState)
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spender) {
      console.error('no spender')
      return
    }

    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString())
    })

    return tokenContract
      .approve(spender, useExact ? amountToApprove.quotient.toString() : MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas),
        gasPrice: getGasPrice(),
      })
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: 'Approve ' + (amountToApprove.currency.symbol ?? ''),
          approval: { tokenAddress: token.address, spender: spender },
        })
      })
      .catch((error: Error) => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction])

  return [approvalState, approve]
}
