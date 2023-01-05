import { classNames, formatNumber, formatPercent } from '../../functions'
import { DotsHorizontalIcon } from '@heroicons/react/outline'
import { ZERO } from '@tangoswapcash/sdk'
import { Disclosure } from '@headlessui/react'
import DoubleLogo from '../../components/DoubleLogo'
import Image from '../../components/Image'
import React from 'react'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
import { useCurrency, useToken } from '../../hooks/Tokens'
import { isMobile } from 'react-device-detect'
import { usePendingSushi } from '../onsen/hooks'
import usePendingReward from '../onsen/usePendingReward'
import RobotListItemDetails from './RobotListItemDetails'
import { PairType } from '../onsen/enum'
import { useState } from 'react'

const RobotListItems = ({
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
  setRobotHighPrice,
  setRobotLowPrice,
  setRobotStockAmount,
  setRobotMoneyAmount,
  setActionToCall,
  ...rest
}) => {
  const token0 = robot?.stock
  const token1 = robot?.money

  const sell = marketSelector
  const buy = !marketSelector
  const portfolio = window.location.href.endsWith('?filter=portfolio')

  const pendingSushi = usePendingSushi(robot)
  const rewardAmount = usePendingReward(robot)

  const { i18n } = useLingui()
  return (
    <Disclosure {...rest}>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={classNames(
              open && 'rounded-b-none',
              'w-full sm:px-4 px-2 py-6 text-left rounded cursor-pointer select-none bg-dark-900 text-primary text-sm md:text-lg'
            )}
          >
            <div className={portfolio ? 'grid grid-cols-4' : 'grid grid-cols-3'}>
              <div className="flex col-span-1 space-x-5 ">
                <DoubleLogo currency0={token0} currency1={token1} size={isMobile ? 30 : 40} />

                <div className="sm:flex flex-col hidden justify-center">
                  <div>
                    <p className="font-bold">{token0?.symbol}</p>
                    <p className={robot?.pair?.type === PairType.KASHI ? 'font-thin' : 'font-bold'}>{token1?.symbol}</p>
                  </div>
                </div>
              </div>
              <div className={sell || portfolio ? 'flex flex-col items-center justify-center font-bold' : 'hidden'}>
                {String(robot.lowPrice).slice(0, 8)}
              </div>
              <div className={buy || portfolio ? 'flex flex-col items-center justify-center' : 'hidden'}>
                <div className="font-bold text-righttext-high-emphesis">{String(robot.highPrice).slice(0, 8)}</div>
              </div>
              {pendingSushi && pendingSushi.greaterThan(ZERO) ? (
                <div className="flex flex-col items-center justify-center md:flex-row space-x-4 font-bold md:flex">
                  <div className="hidden md:flex items-center space-x-2">
                    {robot?.rewards?.map((reward, i) => (
                      <div key={i} className="flex items-center">
                        <Image
                          src={reward.icon}
                          width="30px"
                          height="30px"
                          className="rounded-md"
                          layout="fixed"
                          alt={reward.token}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col space-y-1">
                    {robot?.rewards?.map((reward, i) => (
                      <div key={i} className="text-xs md:text-sm whitespace-nowrap">
                        {i == 0 ? formatNumber(pendingSushi.toFixed(18)) : formatNumber(rewardAmount)} {reward.token}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex-row items-center flex justify-center font-bold text-xs sm:text-sm">
                    {robot.stockAmount < 0.001
                      ? i18n._(t`Stock: < 0.001`)
                      : i18n._(t`Stock: ${Number(robot.stockAmount).toFixed(5)}`)}
                  </div>
                  <div className="flex-row  items-center justify-center flex font-bold text-xs sm:text-sm">
                    {robot.moneyAmount < 0.001
                      ? i18n._(t`Money: < 0.001`)
                      : i18n._(t`Money: ${Number(robot.moneyAmount).toFixed(5)}`)}
                  </div>
                </div>
              )}
            </div>
          </Disclosure.Button>
          {open && (
            <RobotListItemDetails
              stockAddress={stockAddress}
              moneyAddress={moneyAddress}
              robot={robot}
              inputValue={inputValue}
              RobotsMap={RobotsMap}
              showMaxButton={showMaxButton}
              onUserInput={onUserInput}
              onMax={onMax}
              currency={currency}
              currencyB={currencyB}
              selectedCurrencyBBalance={selectedCurrencyBBalance}
              selectedCurrencyBalance={selectedCurrencyBalance}
              marketSelector={marketSelector}
              setModalOpen={setModalOpen}
              setIndex={setIndex}
              setRobotId={setRobotId}
              setRobotHighPrice={setRobotHighPrice}
              setRobotLowPrice={setRobotLowPrice}
              setRobotStockAmount={setRobotStockAmount}
              setRobotMoneyAmount={setRobotMoneyAmount}
              setActionToCall={setActionToCall}
            />
          )}
        </>
      )}
    </Disclosure>
  )
}

export default RobotListItems

// robot.rewards.length > 1 ? `& ${formatNumber(reward)} ${robot.rewards[1].token}` : ''
