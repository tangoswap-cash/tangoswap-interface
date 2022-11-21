import { Chef, PairType } from '../../../features/onsen/enum'
import { PlusIcon } from '@heroicons/react/outline'
import { useActiveWeb3React, useFactoryGridexContract, useFuse, useGridexMarketContract, useTokenContract } from '../../../hooks'
import {
  useAverageBlockTime,
  useEthPrice,
  useFarmPairAddresses,
  useFarms,
  useMasterChefV1SushiPerBlock,
  useMasterChefV1TotalAllocPoint,
  useSushiPairs,
  useSushiPrice,
} from '../../../services/graph'

import { BigNumber } from '@ethersproject/bignumber'
import {
  ChainId,
  WNATIVE,
  Token,
  CurrencyAmount,
  JSBI,
  WBCH,
  MASTERCHEF_ADDRESS,
  MASTERCHEF_V2_ADDRESS,
  Currency,
} from '@tangoswapcash/sdk'
import { TANGO, FLEXUSD } from '../../../config/tokens'
import Container from '../../../components/Container'
import FarmList from '../../../features/onsen/FarmList'
import Head from 'next/head'
import Menu from '../../../features/onsen/FarmMenu'
import React, { useEffect, useMemo, useState } from 'react'
import Search from '../../../components/Search'
import { classNames, maxAmountSpend } from '../../../functions'
import dynamic from 'next/dynamic'
import { getAddress } from '@ethersproject/address'
import useFarmRewards from '../../../hooks/useFarmRewards'
import usePool from '../../../hooks/usePool'
import { useTokenBalancesWithLoadingIndicator } from '../../../state/wallet/hooks'
import { usePositions, usePendingSushi } from '../../../features/onsen/hooks'
import { useRouter } from 'next/router'
import { updateUserFarmFilter } from '../../../state/user/actions'
import { getFarmFilter, useUpdateFarmFilter } from '../../../state/user/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import RobotList from '../../../features/robots/RobotList'
import Button from '../../../components/Button'
import NavLink from '../../../components/NavLink'
import GridexMenu from '../../../features/onsen/GridexMenu'
import { isMobile } from 'react-device-detect'
import { ethers } from 'ethers'
import { parseUnits } from '@ethersproject/units'
import { formatUnits } from '@ethersproject/units'
import { formatCurrencyAmount } from '../../../functions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../../state/mint/hooks'
import BuyRobotsPanel from "../../../components/BuyRobotsPanel"
import { Field } from '../../../state/burn/actions'

function packPrice(price) {
  var effBits = 1
  while (!price.mask(effBits).eq(price)) {
    effBits += 1
  }
  var twoPow24 = BigNumber.from(2).pow(24)
  if (effBits <= 25) {
    return price
  }
  var shift = effBits - 25
  var shiftBN = BigNumber.from(2).pow(shift)
  var low24 = price.div(shiftBN).sub(twoPow24)
  var high8 = BigNumber.from(shift).add(1).mul(twoPow24)
  return high8.add(low24)
}

function unpackPrice(packed) {
  var twoPow24 = BigNumber.from(2).pow(24)
  var low24 = packed.mod(twoPow24)
  var shift = packed.div(twoPow24)
  if (shift.isZero()) {
    return low24
  }
  var shiftBN = BigNumber.from(2).pow(shift.sub(1))
  return low24.add(twoPow24).mul(shiftBN)
}

export default function Gridex(): JSX.Element {
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()
  const router = useRouter()

  const [marketAddress, setMarketAddress] = useState('')
  const [gridexList, setGridexList] = useState([])
  const [RobotsMap, setRobotsMap] = useState({})

  const [currenciesSelected, setCurrenciesSelected] = useState(null);

  const handleCurrencyASelect = (currencyA: Currency) => {
    // console.log('currencyA:', currencyA)
    setCurrenciesSelected({ ...currenciesSelected, currencyA: currencyA })
  }
  const handleCurrencyBSelect = (currencyB: Currency) => {
    setCurrenciesSelected({ ...currenciesSelected, currencyB: currencyB })
  }

  const { independentField, typedValue, otherTypedValue } = useMintState()

  const {
    dependentField,
    currencies,
    currencyBalances,
    parsedAmounts,
    noLiquidity
  } = useDerivedMintInfo(currenciesSelected?.currencyA ?? undefined, currenciesSelected?.currencyB ?? undefined)


  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )
  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  const ImplAddr = "0x8dEa2aB783258207f6db13F8b43a4Bda7B03bFBe" // add this to SDK

  const stock = currenciesSelected?.currencyA
  const money = currenciesSelected?.currencyB
  const stockAddress = stock?.symbol == 'BCH' ? '0x0000000000000000000000000000000000002711' : stock?.address
  const moneyAddress = money?.symbol == 'BCH' ? '0x0000000000000000000000000000000000002711' : money?.address
  
  const factoryContract = useFactoryGridexContract()
  factoryContract.getAddress(stockAddress, moneyAddress, ImplAddr).then(a => setMarketAddress(a))

  const marketContract = useGridexMarketContract(marketAddress)

  const stockContract = useTokenContract(stock?.address)
  const moneyContract = useTokenContract(money?.address)
  
  const RobotsMapF = {}

  async function getAllRobots(onlyForAddr) {
    const moneyDecimals = await moneyContract?.decimals()
    const stockDecimals = await stockContract?.decimals()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    let allRobotsArr = await marketContract?.getAllRobots()
    let allRobots = []
    let twoPow96 = BigNumber.from(2).pow(96)
    let twoPow32 = BigNumber.from(2).pow(32)
    for (var i = 0; i < allRobotsArr?.length; i += 2) {
      let fullId = allRobotsArr[i]
      let robot = {
        fullId: fullId.toHexString(),
        index: i / 2,
        shortId: '',
        ownerAddr: '',
        lowPrice: null,
        highPrice: null,
        moneyAmountBN: '',
        stockAmountBN: '',
        moneyAmount: null,
        stockAmount: null,
        stock: stock,
        money: money,
      }
      robot.shortId = fullId.mod(twoPow96).toNumber()
      robot.ownerAddr = ethers.utils.getAddress(fullId.div(twoPow96).toHexString())
      if (onlyForAddr && onlyForAddr != robot.ownerAddr) { continue }
      let info = allRobotsArr[i + 1]
      robot.lowPrice = formatUnits(unpackPrice(info.mod(twoPow32)))
      info = info.div(twoPow32)
      robot.highPrice = formatUnits(unpackPrice(info.mod(twoPow32)))
      info = info.div(twoPow32)
      robot.moneyAmountBN = info.mod(twoPow96)
      robot.stockAmountBN = info.div(twoPow96)
      robot.moneyAmount = formatUnits(robot.stockAmountBN, stockDecimals)
      robot.stockAmount = formatUnits(robot.stockAmountBN, moneyDecimals)
      allRobots.push(robot)
      RobotsMapF[robot.fullId] = robot
    }
    setRobotsMap(RobotsMapF)
    return allRobots
  }


  function getRobots() { 
    getAllRobots("").then(result => setGridexList(result))  
  }

  const type = router.query.filter as string

  const savedFilter = getFarmFilter()

  const updateFarmFilter = useUpdateFarmFilter()
  updateFarmFilter(type)

  const positions = usePositions(chainId)


  const FILTER = {
    sell: (gridexList) => gridexList.moneyAmount !== 0,
    buy: (gridexList) => gridexList.stockAmount !== 0, 
    portfolio: (gridexList) => gridexList.ownerAddr == account, 
  } 

  const data = gridexList
    .filter((farm) => {
      return type in FILTER ? FILTER[type](farm) : true
    })
  
  const options = {
    keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol'],
    threshold: 0.4,
  }

  const { result, term, search } = useFuse({
    data,
    options,
  })

  console.log('result:', result);
  
  const basePath = 'gridex/gridex-list'

  const optionsMenu = [
    {
      href: `/${basePath}`,
      label: 'Your Tango CMM',
      exact: true
    },
    {
      divider: true
    },
    {
      href: `/${basePath}/buy-gridex`,
      label: 'Buy Tango CMM',
      exact: true
    }
  ]

  return (
    <Container
      id="robots-page"
      className="lg:grid lg:grid-cols-4 h-full py-4 mx-auto md:py-8 lg:py-12 gap-9"
      maxWidth="7xl"
    >
      <Head>
        <title>Tango CMM | Tango</title>
        <meta key="description" name="description" content="TANGO CMM List" />
      </Head>
      <div className={classNames('px-3 md:px-0 mb-8 lg:block md:col-span-1')}>
        <GridexMenu positionsLength={positions.length} options={optionsMenu} robots={result} />
      </div>

      <div className={classNames('space-y-6 col-span-4 lg:col-span-3')}>

          <div className='w-full sm:flex sm:gap-2'>
            <BuyRobotsPanel
              id="stock-robot-search"
              showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
              onUserInput={onFieldBInput}
              onMax={() => {
                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
              }}
              value={formattedAmounts[Field.CURRENCY_B]}
              onCurrencySelect={handleCurrencyASelect}
              onCurrencyBSelect={handleCurrencyBSelect}
              currency={currenciesSelected && currenciesSelected.currencyA && currenciesSelected.currencyA}
              currencyB={currenciesSelected && currenciesSelected.currencyB && currenciesSelected.currencyB}
              showCommonBases
              searchFunction={getRobots}
            />

            <div>

            </div>
            <div className='flex gap-2 my-6  sm:m-0'>

              <NavLink href="/gridex/create-gridex">
                <Button
                  color='border'
                  className='w-full sm:w-[190px] mx-2 text-[#e3e3e3c6] border-gradient-r-blue-pink-dark-900 ring-2 ring-gray-800 hover:text-gray-200 hover:ring-gray-200 flex items-center gap-2'
                >
                  <PlusIcon width={16} height={16} />
                  {i18n._(t`Create Tango CMM`)}
                </Button>
              </NavLink>
            </div>

          </div>
         

        <div className="hidden md:block flex items-center text-lg font-bold text-high-emphesis whitespace-nowrap">
          Tango CMM list{' '}
          <div className="w-full h-0 ml-4 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20"></div>
        </div>

        <RobotList stockAddress={stockAddress} moneyAddress={moneyAddress} robots={result} term={term} inputValue={formattedAmounts[Field.CURRENCY_B]} RobotsMap={RobotsMap} />
      </div>
    </Container>
  )
}

