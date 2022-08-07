import { Field, setLimitPrice } from '../../../state/limit-order/actions'
import React, { FC, useCallback } from 'react'
import { useDerivedLimitOrderInfo, useLimitOrderState, useLimitOrderInfoSmartSwap } from '../../../state/limit-order/hooks'
import { TANGO } from '../../../config/tokens'
import { AppDispatch } from '../../../state'
import Input from '../../../components/Input'
import { t } from '@lingui/macro'
import { useDispatch } from 'react-redux'
import { useLingui } from '@lingui/react'
import { Price, Currency, CurrencyAmount } from '@tangoswapcash/sdk'

interface LimitPriceInputPanelProps {
  onBlur: (value: string) => void
}

const LimitPriceInputPanel: FC<LimitPriceInputPanelProps> = ({ onBlur }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { limitPrice } = useLimitOrderState()
  // const { currencies, currentPrice, parsedAmounts } = useDerivedLimitOrderInfo()
  const { currencies, currentPrice } = useLimitOrderInfoSmartSwap()
  const { i18n } = useLingui()

  const handleInput = useCallback(
    (value) => {
      dispatch(setLimitPrice(value))
      onBlur(value)
    },
    [dispatch, onBlur]
  )

  const disabled = !currencies[Field.INPUT] || !currencies[Field.OUTPUT]

  return (
    <div
      className={`flex-col md:flex-row flex bg-dark-800 w-full rounded overflow-hidden h-[110px] md:h-[68px] ${
        disabled ? 'opacity-40 cursor-default' : ''
      }`}
    >
      <div className="flex w-full md:w-[220px] p-4 gap-4 items-center">
        <span className="font-bold text-secondary">{i18n._(t`Rate`)}:</span>
        <span
          className={`uppercase border border-green bg-transparent text-green border-opacity-50 py-0.5 px-1.5 text-xs rounded-3xl flex items-center justify-center ${
            !disabled ? 'cursor-pointer hover:border-opacity-100 hover:bg-green hover:bg-opacity-10' : ''
          }`}
          onClick={() => handleInput(currentPrice?.toSignificant(6))}
        >
          {i18n._(t`Current`)}
        </span>
      </div>
      <div className="flex items-center w-full h-full gap-3 pl-4 pr-5 border-2 rounded bg-dark-900 border-dark-800 md:rounded-r">
        <Input.Numeric
          disabled={disabled}
          className="w-full text-2xl font-medium bg-transparent"
          placeholder={currentPrice ? currentPrice.toSignificant(6) : '0.0'}
          id="limit-price-input"
          value={limitPrice || ''}
          onUserInput={handleInput}
          onBlur={() => onBlur(limitPrice)}
        />
        <div className="text-xs text-secondary whitespace-nowrap">
          {currencies.OUTPUT?.symbol} per {currencies.INPUT?.symbol}
        </div>
      </div>
    </div>
  )
}

export default LimitPriceInputPanel
