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
      <Disclosure.Panel className="w-full" static>
        
        {/* robot.pending !== 0 ?  */}
          {(
              
                
                  <Button
                    color='red'
                    onClick={DeleteRobot}
                    className={`w-full mx-auto`}
                  >
                    {i18n._(t`Delete Tango CMM`)}
                  </Button>
                
              
             
            ) }

          
      </Disclosure.Panel>
    </Transition>
  )
}

export default RobotListItemDetails
