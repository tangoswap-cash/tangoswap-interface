import { Currency, CurrencyAmount, Pair, Percent, Token } from '@tangoswapcash/sdk'
import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { classNames, formatCurrencyAmount } from '../../functions'

import Button from '../Button'
import { ChevronDownIcon } from '@heroicons/react/outline'
import CurrencyLogo from '../CurrencyLogo'
import CurrencySearchModal from '../../modals/SearchModal/CurrencySearchModal'
import DoubleCurrencyLogo from '../DoubleLogo'
import { FiatValue } from './FiatValue'
import Input from '../Input'
import Lottie from 'lottie-react'
import selectCoinAnimation from '../../animation/select-coin.json'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { useLingui } from '@lingui/react'
import { Search as SearchIcon } from 'react-feather'

interface CurrencyInputPanelProps {
  onCurrencySelect?: (currency: Currency) => void
  onCurrencyBSelect?: (currency: Currency) => void
  currency?: Currency | null
  currencyB?: Currency | null
  disableCurrencySelect?: boolean
  pair?: Pair | null
  hideInput?: boolean
  id: string
  showCommonBases?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  searchFunction?: any
}

export default function BuyRobotsPanel({
  onCurrencySelect,
  onCurrencyBSelect,
  currency,
  currencyB,
  disableCurrencySelect = false,
  id,
  showCommonBases,
  pair = null, // used for double token logo
  hideInput = false,
  // searchFunction
}: CurrencyInputPanelProps) {
  const { i18n } = useLingui()

  const [modalOpen, setModalOpen] = useState(false)

  const [currencySelector, setCurrencySelector] = useState('')

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const activeLink = String(window.location)

  return (
    <div id={id} className={classNames(hideInput ? 'p-2' : 'p-2', 'w-11/12 mx-4 sm:w-full px-2 rounded  sm:m-0  bg-dark-800')}>
      <div className="flex flex-col justify-center items-center space-y-3 sm:space-y-0 sm:flex-row">
        <div className={classNames('w-full p-2 sm:w-2/5')}>
          <button
            type="button"
            className={classNames(
              !!currency ? 'text-primary' : 'text-high-emphesis',
              'open-currency-select-button h-full outline-none select-none cursor-pointer border-none text-xl font-medium items-center'
            )}
            onClick={() => {
              setCurrencySelector('A')
              if (onCurrencySelect) {
                setModalOpen(true)
              }
            }}
          >
            <div className="flex">
              {currency ? (
                <div className="flex items-center">
                  <CurrencyLogo currency={currency} size={'54px'} />
                </div>
              ) : (
                <div className="rounded bg-dark-700" style={{ maxWidth: 54, maxHeight: 54 }}>
                  <div style={{ width: 54, height: 54 }}>
                    <Lottie animationData={selectCoinAnimation} autoplay loop />
                  </div>
                </div>
              )}
              {pair ? (
                <span
                  className={classNames(
                    'pair-name-container',
                    Boolean(currency && currency.symbol) ? 'text-2xl' : 'text-xs'
                  )}
                >
                  {pair?.token0.symbol}:{pair?.token1.symbol}
                </span>
              ) : (
                <div className="flex flex-1 flex-col items-start justify-center mx-3.5">
                  {"Stock" && <div className="text-xs font-medium text-secondary whitespace-nowrap">Stock</div>}
                  <div className="flex items-center">
                    <div className="text-lg font-bold token-symbol-container md:text-2xl">
                      {(currency && currency.symbol && currency.symbol.length > 20
                        ? currency.symbol.slice(0, 4) +
                        '...' +
                        currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                        : currency?.symbol) || (
                          <div className="px-2 py-1 mt-1 text-xs font-medium bg-transparent border rounded-full hover:bg-primary border-low-emphesis text-secondary whitespace-nowrap ">
                            {i18n._(t`Select a token`)}
                          </div>
                        )}
                    </div>

                    {!disableCurrencySelect && currency && (
                      <ChevronDownIcon width={16} height={16} className="ml-2 stroke-current" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
        {/* Second input */}
        <div className={classNames(`w-full p-2 sm:mx-2  sm:w-1/3 sm:p-0`)}>
          <button
            type="button"
            className={classNames(
              !!currencyB ? 'text-primary' : 'text-high-emphesis',
              'open-currency-select-button h-full outline-none select-none cursor-pointer border-none text-xl font-medium items-center'
            )}
            onClick={() => {
              setCurrencySelector('B')
              if (onCurrencyBSelect) {
                setModalOpen(true) 
              }
            }}
          >
            <div className="flex">
              {currencyB ? (
                <div className={"flex items-center"}>
                  <CurrencyLogo currency={currencyB} size={'54px'} />
                </div>
              ) : (
                <div className="rounded bg-dark-700" style={{ maxWidth: 54, maxHeight: 54 }}>
                  <div style={{ width: 54, height: 54 }}>
                    <Lottie animationData={selectCoinAnimation} autoplay loop />
                  </div>
                </div>
              )}
              {pair ? (
                <span
                  className={classNames(
                    'pair-name-container',
                    Boolean(currencyB && currencyB.symbol) ? 'text-2xl' : 'text-xs'
                  )}
                >
                  {pair?.token0.symbol}:{pair?.token1.symbol}
                </span>
              ) : (
                <div className="flex flex-1 flex-col items-start justify-center mx-3.5">
                  {"Money" && <div className="text-xs font-medium text-secondary whitespace-nowrap">{"Money"}</div>}
                  <div className="flex items-center">
                    <div className="text-lg font-bold token-symbol-container md:text-2xl">
                      {(currencyB && currencyB.symbol && currencyB.symbol.length > 20
                        ? currencyB.symbol.slice(0, 4) +
                        '...' +
                        currencyB.symbol.slice(currencyB.symbol.length - 5, currencyB.symbol.length)
                        : currencyB?.symbol) || (
                          <div className="px-2 py-1 mt-1 text-xs font-medium bg-transparent border rounded-full hover:bg-primary border-low-emphesis text-secondary whitespace-nowrap ">
                            {i18n._(t`Select a token`)}
                          </div>
                        )}
                    </div>

                    {!disableCurrencySelect && currencyB && (
                      <ChevronDownIcon width={16} height={16} className="ml-2 stroke-current" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* <Button
          color={'gradient'}
          size="sm"
          className='h-12 w-10/12 ml-2 text-sm  sm:pr-14 sm:text-sm  sm:w-1/12 sm:text-center '
          onClick={searchFunction}
        >{i18n._(t`Search`)}
        </Button> */}
      </div>
      {
        currencySelector == 'A' ? (
          <CurrencySearchModal
            isOpen={modalOpen}
            onDismiss={handleDismissSearch}
            onCurrencySelect={onCurrencySelect}
            selectedCurrency={currency}
            otherSelectedCurrency={currency}
            showCommonBases={showCommonBases}
          />
        )
          :
          (
            <CurrencySearchModal
              isOpen={modalOpen}
              onDismiss={handleDismissSearch}
              onCurrencySelect={onCurrencyBSelect}
              selectedCurrency={currencyB}
              otherSelectedCurrency={currencyB}
              showCommonBases={showCommonBases}
            />
          )
      }
    </div>
  )
}