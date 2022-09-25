import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { ChainId, CurrencyAmount, JSBI, MASTERCHEF_ADDRESS, MASTERCHEF_V2_ADDRESS, Token, ZERO } from '@tangoswapcash/sdk'
import { Disclosure, Transition } from '@headlessui/react'
import React, { useState } from 'react'

import Button, { ButtonError } from '../../components/Button'
import Dots from '../../components/Dots'
import Input from '../../components/Input'
import { formatCurrencyAmount, formatNumber, formatPercent } from '../../functions'
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

const RobotListItemDetails = ({ robot }) => {
  const { i18n } = useLingui()

  const router = useRouter()

  const { account, chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [maxValue, setMaxValue] = useState(robot.maxValue ? robot.maxValue : 0)
  const [minValue, setMinValue] = useState(robot.minValue ? robot.minValue : 0)

  const addTransaction = useTransactionAdder()

  const liquidityToken = new Token(
    chainId,
    getAddress(robot.pair.id),
    robot.pair.type === PairType.KASHI ? Number(robot.pair.asset.decimals) : 18,
    robot.pair.symbol,
    robot.pair.name
  )

  // User liquidity token balance
  const balance = useTokenBalance(account, liquidityToken)

  // TODO: Replace these
  const amount = useUserInfo(robot, liquidityToken)

  const handleSellRobot = () => {
    console.log('Vendido')
  }

  const handleBuyRobot = () => {
    console.log('Borrado')
  }

  const handleDeleteRobot = () => {
    console.log('Borrado')
  }

  const { deposit, withdraw, harvest } = useMasterChef(robot.chef)

  const poolFraction = (Number.parseFloat(amount?.toFixed()) / robot.chefBalance) || 0
  const token0Reserve = robot.pool.reserves ? (robot.pool.reserves.reserve0 as BigNumber).toString() : 0
  const token0Amount = CurrencyAmount.fromRawAmount(robot.pair.token0, JSBI.BigInt(token0Reserve)).multiply(Math.round(poolFraction * 1e8)).divide(1e8)
  const token1Reserve = robot.pool.reserves ? (robot.pool.reserves.reserve1 as BigNumber).toString() : 0
  const token1Amount = CurrencyAmount.fromRawAmount(robot.pair.token1, JSBI.BigInt(token1Reserve)).multiply(Math.round(poolFraction * 1e8)).divide(1e8)
  const token0Name = robot.pool.token0 === robot.pair.token0.id ? robot.pair.token0.symbol : robot.pair.token1.symbol
  const token1Name = robot.pool.token1 === robot.pair.token1.id ? robot.pair.token1.symbol : robot.pair.token0.symbol

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
      <Disclosure.Panel className="flex flex-col w-full border-t-0 rounded rounded-t-none bg-dark-800" static>
        <div className="grid grid-cols-2 gap-4 p-4 pt-0">
          <div className="col-span-2 text-center md:col-span-1 pt-4">
            <div className="relative flex flex-col items-start w-full mb-4">
            <label className="text-sm text-secondary py-1">Min Price to Buy</label>
              <Input.Numeric
                className="w-full p-3 pr-20 rounded bg-dark-700 focus:ring focus:ring-blue"
                value={minValue}
                onUserInput={setMinValue}
                disabled
              />
            </div>
          </div>
          <div className="col-span-2 text-center md:col-span-1 pt-4">
            <div className="relative flex flex-col items-start w-full mb-4">
              <label className="text-sm text-secondary py-1">Max Price to Sell</label>
              <Input.Numeric
                className="w-full p-3 pr-20 rounded bg-dark-700 focus:ring focus:ring-pink"
                value={maxValue}
                onUserInput={(value) => {
                  setMaxValue(value)
                }}
                disabled
              />
            </div>
          </div>
        </div>
          { robot.pending !== 0 ? (
              <div className="flex pb-4 gap-4 px-4">
                <div>
                  <Button
                    color='red'
                    onClick={handleDeleteRobot}
                  >
                    {i18n._(t`Delete Robot`)}
                  </Button>
                </div>
                <div>
                  <Button
                    color='default'
                    onClick={handleSellRobot}
                  >
                    {i18n._(t`Sell Robot`)}
                  </Button>
                </div>
              </div>
            ) : (    
              <div className="px-4 pb-4">
                <Button
                  color="gradient"
                  onClick={handleBuyRobot}
                >
                  {i18n._(t`BUY ROBOT`)}
                </Button>
              </div>
            )
          }
      </Disclosure.Panel>
    </Transition>
  )
}

export default RobotListItemDetails
