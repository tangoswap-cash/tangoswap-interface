import { ChainId, Currency, CurrencyAmount, SmartBCH, Percent, TradeSmart } from '@tangoswapcash/sdk'
import React, { useMemo } from 'react'
import { RowBetween, RowFixed } from '../../../components/Row'

import { ANALYTICS_URL } from '../../../constants'
import ExternalLink from '../../../components/ExternalLink'
import FormattedPriceImpact from './FormattedPriceImpact'
import QuestionHelper from '../../../components/QuestionHelper'
import SwapRoute from './SwapRoute'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'

export interface AdvancedSwapDetailsProps {
  trade?: TradeSmart<Currency, Currency>
  allowedSlippage: Percent
  feePercent: Percent
  minerBribe?: string
}

export function AdvancedSmartSwapDetails({ trade, allowedSlippage, feePercent, minerBribe }: AdvancedSwapDetailsProps) {
  const { i18n } = useLingui()

  const { chainId } = useActiveWeb3React()

  return !trade ? null : (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-row items-center justify-between">
        <span className="flex items-center">
          <div className="text-sm text-secondary">{i18n._(t`Route`)}</div>
          <QuestionHelper text={i18n._(t`Routing through these tokens resulted in the best price for your trade.`)} />
        </span>
        {/* <SwapRoute trade={trade} /> */}
      </div>

      <RowBetween>
        <RowFixed>
          <div className="text-sm text-secondary">
            {i18n._(t`Minimum received`)}
          </div>
          <QuestionHelper
            text={i18n._(
              t`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.`
            )}
          />
        </RowFixed>
        <RowFixed>
          <div className="text-sm font-bold text-high-emphesis">
            {`${trade.minimumAmountOut(allowedSlippage, feePercent).toSignificant(6)} ${trade.outputAmount.currency.symbol}`}
          </div>
        </RowFixed>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <div className="text-sm text-secondary">{i18n._(t`Slippage tolerance`)}</div>
          <QuestionHelper text={i18n._(t`Slippage tolerance...`)} />
        </RowFixed>
        <div className="text-sm font-bold text-high-emphesis">{allowedSlippage.toFixed(2)}%</div>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <div className="text-sm text-secondary">{i18n._(t`Fee percent`)}</div>
          <QuestionHelper text={i18n._(t`Fee percent...`)} />
        </RowFixed>
        <div className="text-sm font-bold text-high-emphesis">{feePercent.toFixed(2)}%</div>
      </RowBetween>

      {minerBribe && (
        <RowBetween>
          <RowFixed>
            <div className="text-sm text-secondary">{i18n._(t`Miner Tip`)}</div>
            <QuestionHelper text={i18n._(t`Tip to encourage miners to select this transaction.`)} />
          </RowFixed>
          <div className="text-sm font-bold text-high-emphesis">
            {CurrencyAmount.fromRawAmount(SmartBCH.onChain(ChainId.SMARTBCH), minerBribe).toFixed(4)} BCH
          </div>
        </RowBetween>
      )}
    </div>
  )
}
