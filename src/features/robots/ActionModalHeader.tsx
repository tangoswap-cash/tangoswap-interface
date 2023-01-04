import { AlertTriangle, ArrowDown, Plus } from 'react-feather'
import { Currency, Percent, TradeType, Trade as V2Trade, CurrencyAmount, JSBI } from '@tangoswapcash/sdk'
import React, { useState } from 'react'
import { isAddress, shortenAddress } from '../../functions'
import { AdvancedSwapDetails } from '../exchange-v1/swap/AdvancedSwapDetails'
import Card from '../../components/Card'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Field } from '../../state/swap/actions'
import { RowBetween, RowFixed} from '../../components/Row'
import TradePrice from '../exchange-v1/swap/TradePrice'
import Typography from '../../components/Typography'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import { warningSeverity } from '../../functions'
import QuestionHelper from '../../components/QuestionHelper'

export default function CreateModalHeader({
currencyA,
currencyB,
// maxValue,
// minValue,
// stockInputValue,
// moneyInputValue
}:
{
currencyA: Currency
currencyB: Currency
// maxValue: string
// minValue: string
// stockInputValue: CurrencyAmount<Currency>
// moneyInputValue: CurrencyAmount<Currency>
}) {
  const { i18n } = useLingui()

  // const [showInverted, setShowInverted] = useState<boolean>(false)

  //   const fiatValueInput = useUSDCValue(trade.inputAmount)
  //   const fiatValueOutput = useUSDCValue(trade.outputAmount)

  //   const priceImpactSeverity = warningSeverity(trade.priceImpact)
  
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CurrencyLogo currency={currencyA} size={48} />
            <div className="overflow-ellipsis md:w-[220px] overflow-hidden font-bold text-2xl text-high-emphesis">
              {/* {trade.inputAmount.toSignificant(6)} */}
              stockInputValue.toSignificant(6)
            </div>
          </div>
          {/* <div className="ml-3 text-2xl font-medium text-high-emphesis">{trade.inputAmount.currency.symbol}</div> */}
          <div className="ml-3 text-2xl font-medium text-high-emphesis">{currencyA?.symbol}</div>
        </div>
        <div className="ml-3 my-1 mr-3 min-w-[24px]"><Plus size="24" /></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CurrencyLogo currency={currencyB} size={48} />
            <div
              className={`overflow-ellipsis md:w-[220px] overflow-hidden font-bold text-2xl ${'text-high-emphesis'}`}
            >
              moneyInputValue.toSignificant(6)
            </div>
          </div>
          <div className="ml-3 text-2xl font-medium text-high-emphesis">{currencyB?.symbol}</div>
        </div>
      </div>

      {/* <TradePrice
        price={trade.executionPrice}
        showInverted={showInverted}
        setShowInverted={setShowInverted}
        className="px-0"
      /> */}

      {/* <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} minerBribe={minerBribe} /> */}
      <div className="grid gap-4">
        <RowBetween>
          <RowFixed>
            {/* <div className="text-sm text-secondary">
            {trade.tradeType === TradeType.EXACT_INPUT ? i18n._(t`Minimum received`) : i18n._(t`Maximum sent`)}
          </div> */}
            <div className="text-sm text-secondary">
              Price to Buy
            </div>
            <QuestionHelper
              text={i18n._(
                t`The price that the user will sell ${currencyA.symbol}`
              )}
            />
          </RowFixed>
          <RowFixed>
            {/* <div className="text-sm font-bold text-high-emphesis">
              {trade.tradeType === TradeType.EXACT_INPUT
                ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
                : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
            </div> */}
            <div className="text-sm font-bold text-high-emphesis">
              minValue
            </div>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <div className="text-sm text-secondary">{i18n._(t`Price to Sell`)}</div>
            <QuestionHelper
              text={i18n._(t`The price that the user will buy ${currencyA.symbol}`)}
            />
          </RowFixed>
          <div className="text-sm font-bold text-high-emphesis">
              maxValue
          </div>
        </RowBetween>

        {/* {showAcceptChanges ? (
        <div className="flex items-center justify-between p-2 px-3 border border-gray-800 rounded">
          <div className="flex items-center justify-start text-sm font-bold uppercase text-high-emphesis">
            <div className="mr-3 min-w-[24px]">
              <AlertTriangle size={24} />
            </div>
            <span>{i18n._(t`Price Updated`)}</span>
          </div>
          <span className="text-sm cursor-pointer text-blue" onClick={onAcceptChanges}>
            {i18n._(t`Accept`)}
          </span>
        </div>
      ) : null} */}
        {/* <div className="justify-start text-sm text-secondary">
        {trade.tradeType === TradeType.EXACT_INPUT ? (
          <>
            {i18n._(t`Output is estimated. You will receive at least`)}{' '}
            <b>
              {trade.minimumAmountOut(allowedSlippage).toSignificant(6)} {trade.outputAmount.currency.symbol}
              trade.minimumAmountOut(allowedSlippage).toSignificant(6) trade.outputAmount.currency.symbol
            </b>{' '}
            {i18n._(t`or the transaction will revert.`)}
          </>
         ) : (
          <>
            {i18n._(t`Input is estimated. You will sell at most`)}{' '}
            <b>
              {trade.maximumAmountIn(allowedSlippage).toSignificant(6)} {trade.inputAmount.currency.symbol}
            </b>{' '}
            {i18n._(t`or the transaction will revert.`)}
          </>
        )} 
      </div> */}

        {/* {recipient !== null ? (
        <div className="flex-start">
          <>
            {i18n._(t`Output will be sent to`)}{' '}
            <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
          </>
        </div>
      ) : null} */}
      </div>
    </div>
  )
}
