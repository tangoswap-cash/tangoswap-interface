import { classNames, formatNumber, formatPercent } from '../../functions'
import { DotsHorizontalIcon } from '@heroicons/react/outline'
import { ZERO } from '@tangoswapcash/sdk'
import { Disclosure } from '@headlessui/react'
import DoubleLogo from '../../components/DoubleLogo'
import Image from '../../components/Image'
import React from 'react'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
import { useCurrency } from '../../hooks/Tokens'
import { isMobile } from 'react-device-detect'
import { usePendingSushi } from '../onsen/hooks'
import usePendingReward from '../onsen/usePendingReward'
import RobotListItemDetails from './RobotListItemDetails'
import { PairType } from '../onsen/enum'

const RobotListItems = ({ robot, ...rest }) => {
  const token0 = useCurrency(robot.pair.token0.id)
  const token1 = useCurrency(robot.pair.token1.id)

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
              'w-full px-4 py-6 text-left rounded cursor-pointer select-none bg-dark-900 text-primary text-sm md:text-lg'
            )}
          >
            <div className="grid grid-cols-4">
              <div className="flex col-span-2 space-x-4 md:col-span-1">
                <DoubleLogo currency0={token0} currency1={token1} size={isMobile ? 30 : 40} />
                <div className="flex flex-col justify-center">
                  <div>
                    <p className="font-bold">{robot?.pair?.token0?.symbol}</p>
                    <p className={robot?.pair?.type === PairType.KASHI ? 'font-thin' : 'font-bold'}>
                      {robot?.pair?.token1?.symbol}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center font-bold">
                $ {robot.allocPoint / 4}
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="font-bold text-righttext-high-emphesis">
                  $ {robot.allocPoint}
                </div>
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
                <div className="flex-row items-center justify-center flex pl-3 font-bold text-sm">
                  {i18n._(t`Stake LP to robot`)}
                  {/* <DotsHorizontalIcon width={22} height={22}/> */}
                </div>
              )}
            </div>
          </Disclosure.Button>
          {/* {open && <RobotListItemDetails robot={robot} />} */}
        </>
      )}
    </Disclosure>
  )
}

export default RobotListItems

// robot.rewards.length > 1 ? `& ${formatNumber(reward)} ${robot.rewards[1].token}` : ''
