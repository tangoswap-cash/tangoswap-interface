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
import { useFactoryGridexContract, useGridexMarketContract } from '../../hooks'

const RobotListItemDetails = ({stockAddress, moneyAddress, robot }) => {
  const { i18n } = useLingui()
  const [marketAddress, setMarketAddress] = useState('')

  const ImplAddr = "0x8dEa2aB783258207f6db13F8b43a4Bda7B03bFBe" // add this to SDK

  const factoryContract = useFactoryGridexContract()
  factoryContract.getAddress(stockAddress, moneyAddress, ImplAddr).then(a => setMarketAddress(a))

  const marketContract = useGridexMarketContract(marketAddress)

  const router = useRouter()

  const { account, chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [maxValue, setMaxValue] = useState(robot.maxValue ? robot.maxValue : 0)
  const [minValue, setMinValue] = useState(robot.minValue ? robot.minValue : 0)

  const addTransaction = useTransactionAdder()

  const handleSellRobot = () => {
    console.log('Vendido')
  }

  const handleBuyRobot = () => {
    console.log('Borrado')
  }
  
  const DeleteRobot = async () => {
    await marketContract.deleteRobot(robot.index, robot.fullId).then((response) => {
      addTransaction(response, {
        summary: `Delete Robot`
      })      
    });
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
      <Disclosure.Panel className="flex flex-col w-full border-t-0 rounded rounded-t-none bg-dark-800" static>
        <div className="grid grid-cols-2 gap-4 p-4 pt-0">
          <div className="col-span-2 text-center md:col-span-1 pt-4">
            <div className="relative flex flex-col items-start w-full mb-4">
            <label className="text-sm text-secondary py-1">Min Price to Buy</label>
              <Input.Numeric
                className="w-full p-3 pr-20 rounded bg-dark-700 focus:ring focus:ring-blue"
                value={minValue}
                onUserInput={setMinValue}
                
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
                
              />
            </div>
          </div>
        </div>
        {/* robot.pending !== 0 ?  */}
          {(
              <div className="flex pb-4 gap-4 px-4">
                <div>
                  <Button
                    color='red'
                    onClick={DeleteRobot}
                  >
                    {i18n._(t`Delete Tango CMM`)}
                  </Button>
                </div>
                <div>
                  <Button
                    className='bg-green text-black'
                    onClick={handleSellRobot}
                  >
                    {i18n._(t`Sell Tango CMM`)}
                  </Button>
                </div>
              </div>
            ) }
             {/*: (    
              <div className="px-4 pb-4">
                <Button
                  color="gradient"
                  onClick={handleBuyRobot}
                >
                  {i18n._(t`Buy Gridex`)}
                </Button>
              </div>
            )*/}
          
      </Disclosure.Panel>
    </Transition>
  )
}

export default RobotListItemDetails
