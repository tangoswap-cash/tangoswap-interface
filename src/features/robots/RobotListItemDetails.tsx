import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import {
  ChainId,
  CurrencyAmount,
  JSBI,
  MASTERCHEF_ADDRESS,
  MASTERCHEF_V2_ADDRESS,
  Token,
  ZERO,
} from '@tangoswapcash/sdk'
import { Disclosure, Transition } from '@headlessui/react'
import React, { useCallback, useEffect, useState } from 'react'

import Button, { ButtonError } from '../../components/Button'
import Dots from '../../components/Dots'
import Input from '../../components/Input'
import { classNames, formatCurrencyAmount, formatNumber, formatPercent } from '../../functions'
import { getAddress } from '@ethersproject/address'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../functions/parse'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { isMobile } from 'react-device-detect'
import { useRouter } from 'next/router'
import { Chef, PairType } from '../onsen/enum'
import { usePendingSushi, useUserInfo } from '../onsen/hooks'
import useMasterChef from '../onsen/useMasterChef'
import usePendingReward from '../onsen/usePendingReward'
import { useFactoryGridexContract, useGridexMarketContract, useTokenContract } from '../../hooks'
import { parseEther, parseUnits } from '@ethersproject/units'
import { FiatValue } from '../../components/BuyRobotsPanel/FiatValue'

const RobotListItemDetails = ({
  stockAddress,
  moneyAddress,
  robot,
  inputValue,
  RobotsMap,
  showMaxButton,
  onUserInput,
  onMax,
  currency,
  currencyB,
  selectedCurrencyBBalance,
  selectedCurrencyBalance,
  marketSelector,
  setModalOpen,
  setIndex,
  setRobotId,
  setActionToCall,
}) => {
  const { i18n } = useLingui()
  const [marketAddress, setMarketAddress] = useState('')

  const sell = marketSelector
  const buy = !marketSelector
  const portfolio = window.location.href.endsWith('?filter=portfolio')

  const ImplAddr = '0x8dEa2aB783258207f6db13F8b43a4Bda7B03bFBe' // add this to SDK

  const factoryContract = useFactoryGridexContract()
  factoryContract.getAddress(stockAddress, moneyAddress, ImplAddr).then((a) => setMarketAddress(a))

  const marketContract = useGridexMarketContract(marketAddress)

  const addTransaction = useTransactionAdder()

  const router = useRouter()

  const { account, chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [maxValue, setMaxValue] = useState(robot.maxValue ? robot.maxValue : 0)
  const [minValue, setMinValue] = useState(robot.minValue ? robot.minValue : 0)

  const [errorCode, setErrorCode] = useState(null)

  const stockContract = useTokenContract(stockAddress)
  const moneyContract = useTokenContract(moneyAddress)

  // variable to check if the user has enough balance || cmm has enough balance
  async function balanceStatus() {
    if (sell) {
      const stockDecimals = await stockContract?.decimals()
      const stockDelta = inputValue
      const stockDeltaBN = parseUnits(inputValue, stockDecimals)
      const moneyDelta = stockDelta * robot.lowPrice
      const stockBalance = await stockContract?.balanceOf(account)

      console.log(stockDelta);

      if (stockDeltaBN.gt(stockBalance)) {
        return 0 // "Error: You don't have enough stock."
      } else if (moneyDelta > robot.moneyAmount) {
        return 1 // "Error: CMM has not enough money"
      } 

    }
    if (buy) {
      const moneyDecimals = await moneyContract?.decimals()
      const moneyDelta = inputValue
      const moneyDeltaBN = parseUnits(inputValue, moneyDecimals)
      const moneyBalance = await moneyContract.balanceOf(account)
      const stockDelta = moneyDelta / robot.highPrice

      if (moneyDeltaBN.gt(moneyBalance)) {
        return 0 // "Error: You don't have enough money"
      } else if (stockDelta > robot.stockAmount) {
        return 1 // "Error: Tango CMM has not enough stock"
      }
    }
  }

  useEffect(() => {
    balanceStatus().then((r) => setErrorCode(r))
  }, [balanceStatus, currency, currencyB, marketSelector, inputValue])


  const openTx = (action: string) => {
    setModalOpen(true)
    setActionToCall(action)
    setIndex(robot?.index)
    setRobotId(robot?.fullId)
  }

  return (
    <Transition
      show={true}
      enter="transition-opacity duration-250"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-250"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Disclosure.Panel
        className="m-auto mt-2 mb-3 flex flex-col justify-center w-full border-t-0 rounded rounded-t-none p-2 bg-dark-800"
        static
      >
        <>
          <div
            className={
              portfolio
                ? `hidden`
                : classNames(
                    'flex mb-2 items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 h-16 px-3 sm:w-full'
                  )
            }
          >
            <>
              {showMaxButton && (
                <Button
                  onClick={onMax}
                  size="xs"
                  className="text-base font-medium bg-transparent border rounded-full hover:bg-primary border-low-emphesis text-secondary whitespace-nowrap"
                >
                  {i18n._(t`Max`)}
                </Button>
              )}
              <Input.Numeric
                id="token-amount-input"
                value={inputValue}
                onUserInput={(val) => {
                  // console.log('val:', val);
                  onUserInput(val)
                }}
                className={`w-2/3 h-16 text-base bg-transparent`}
              />
              {currency && selectedCurrencyBBalance ? (
                <div className="flex flex-col">
                  <div onClick={onMax} className="text-xs  text-right  cursor-pointer text-low-emphesis">
                    {buy ? (
                      <>
                        {i18n._(t`Balance:`)} {formatCurrencyAmount(selectedCurrencyBBalance, 4)} {currencyB.symbol}
                      </>
                    ) : (
                      sell && (
                        <>
                          {i18n._(t`Balance:`)} {formatCurrencyAmount(selectedCurrencyBalance, 4)} {currency.symbol}
                        </>
                      )
                    )}
                  </div>
                  {/* <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} /> */}
                </div>
              ) : null}
            </>
          </div>
        </>
        {(robot.ownerAddr == account && (
          <Button
            color="red"
            onClick={() => openTx("delete")}
            className={`w-full mx-auto`}
          >
            {i18n._(t`Delete Tango CMM`)}
          </Button>
        )) ||
          (buy &&
            (inputValue == "" ? (
              <Button disabled={true} className={`w-full mx-auto bg-[#723827] text-gray-200 hover:text-white`}>
                {i18n._(t`Input an amount`)}
              </Button>
            ) : errorCode == 0 ? (
              <Button disabled={true} className={`w-full mx-auto bg-[#723827] text-gray-200 hover:text-white`}>
                {i18n._(t`You don't have enough Money`)}
              </Button>
            ) : errorCode == 1 ? (
              <Button disabled={true} className={`w-full mx-auto bg-[#723827] text-gray-200 hover:text-white`}>
                {i18n._(t`CMM has not enough stock`)}
              </Button>
            ) : (
              <Button
                onClick={() => openTx("buy")}
                className={`w-full mx-auto bg-[#B95C40]  text-gray-200 hover:text-white`}
              >
                {i18n._(t`Buy ${robot?.stock?.symbol} from CMM`)}
              </Button>
            ))) ||
          (inputValue == "" ? (
            <Button disabled={true} className={`w-full mx-auto bg-[#330f06] text-gray-200 hover:text-white`}>
              {i18n._(t`Input an amount`)}
            </Button>
          ) : sell && errorCode == 0 ? (
            <Button disabled={true} className={`w-full mx-auto bg-[#330f06] text-gray-200 hover:text-white`}>
              {i18n._(t`You don't have enough Stock`)}
            </Button>
          ) : errorCode == 1 ? (
            <Button disabled={true} className={`w-full mx-auto bg-[#330f06] text-gray-200 hover:text-white`}>
              {i18n._(t`CMM has not enough money`)}
            </Button>
          ) : (
            <Button
              onClick={() => openTx("delete")}
              className={`w-full mx-auto bg-[#5C1B0B] text-gray-200 hover:text-white`}
            >
              {i18n._(t`Sell ${robot?.stock?.symbol} to CMM`)}
            </Button>
          ))}
      </Disclosure.Panel>
    </Transition>
  )
}

export default RobotListItemDetails
