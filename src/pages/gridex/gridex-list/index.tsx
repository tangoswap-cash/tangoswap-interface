import { Chef, PairType } from '../../../features/onsen/enum'
import { PlusIcon } from '@heroicons/react/outline'
import {
  useActiveWeb3React,
  useFactoryGridexContract,
  useFuse,
  useGridexMarketContract,
  useTokenContract,
} from '../../../hooks'
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
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import Search from '../../../components/Search'
import { classNames, maxAmountSpend } from '../../../functions'
import dynamic from 'next/dynamic'
import { getAddress } from '@ethersproject/address'
import useFarmRewards from '../../../hooks/useFarmRewards'
import usePool from '../../../hooks/usePool'
import { useCurrencyBalance, useTokenBalancesWithLoadingIndicator } from '../../../state/wallet/hooks'
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
import BuyRobotsPanel from '../../../components/BuyRobotsPanel'
import { Field } from '../../../state/burn/actions'
import Typography from '../../../components/Typography'
import GridexInfo from '../../../modals/GridexModal'
import GridexToggle from '../../../components/Toggle/gridexToggle'
import { NextPage } from 'next'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../../modals/TransactionConfirmationModal'
import ActionModalHeader from '../../../features/robots/ActionModalHeader'
import ActionModalFooter from '../../../features/robots/ActionModalFooter'
import { useTransactionAdder } from '../../../state/transactions/hooks'
import { Contract } from '@ethersproject/contracts'

async function getAllRobots(onlyForAddr, moneyContract, stockContract, marketContract, token1, token2) {
  const moneyDecimals = await moneyContract?.decimals()
  const stockDecimals = await stockContract?.decimals()

  let allRobotsArr = await marketContract?.getAllRobots()
  const RobotsMapF = {}

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
      stock: token1,
      money: token2,
    }
    robot.shortId = fullId.mod(twoPow96).toNumber()
    robot.ownerAddr = ethers.utils.getAddress(fullId.div(twoPow96).toHexString())
    if (onlyForAddr && onlyForAddr != robot.ownerAddr) {
      continue
    }
    let info = allRobotsArr[i + 1]
    robot.lowPrice = formatUnits(unpackPrice(info.mod(twoPow32)))
    info = info.div(twoPow32)
    robot.highPrice = formatUnits(unpackPrice(info.mod(twoPow32)))
    info = info.div(twoPow32)
    robot.moneyAmountBN = info.mod(twoPow96)
    robot.stockAmountBN = info.div(twoPow96)
    robot.moneyAmount = formatUnits(robot.moneyAmountBN, moneyDecimals)
    robot.stockAmount = formatUnits(robot.stockAmountBN, stockDecimals)
    allRobots.push(robot)
    RobotsMapF[robot.fullId] = robot
  }
  // setRobotsMap(RobotsMapF)
  // console.log("allRobots: ", allRobots)
  return { RobotsMapF, allRobots }
}

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

export default function Gridex() {
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()
  const router = useRouter()

  const [marketAddress, setMarketAddress] = useState('')
  const [gridexList, setGridexList] = useState([])
  const [RobotsMap, setRobotsMap] = useState({})
  const [gridexInfoOpen, setGridexInfoOpen] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)

  const [attemptingTxn, setAttempingTxn] = useState(false)
  const [hash, setHash] = useState('')
  
  const [currenciesSelected, setCurrenciesSelected] = useState({
    currencyA: null,
    currencyB: null,
  })

  const [marketSelector, setMarketSelector] = useState(false)

  const [index, setIndex] = useState()
  const [robotId, setRobotId] = useState()
  const [robotHighPrice, setRobotHighPrice] = useState(0)
  const [robotLowPrice, setRobotLowPrice] = useState(0)
  const [robotStockAmount, setRobotStockAmount] = useState(0)
  const [robotMoneyAmount, setRobotMoneyAmount] = useState(0)

  const handleCurrencyASelect = (currencyA: Currency) => {
    setCurrenciesSelected({ ...currenciesSelected, currencyA: currencyA })
  }

  const handleCurrencyBSelect = (currencyB: Currency) => {
    setCurrenciesSelected({ ...currenciesSelected, currencyB: currencyB })
  }

  const { independentField, typedValue, otherTypedValue } = useMintState()

  const { dependentField, currencies, currencyBalances, parsedAmounts, noLiquidity } = useDerivedMintInfo(
    currenciesSelected?.currencyA ?? undefined,
    currenciesSelected?.currencyB ?? undefined
  )

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

  const ImplAddr = '0x8dEa2aB783258207f6db13F8b43a4Bda7B03bFBe'

  const stock = currenciesSelected.currencyA
  const money = currenciesSelected.currencyB

  const stockAddress = stock?.symbol == 'BCH' ? '0x0000000000000000000000000000000000002711' : stock?.address
  const moneyAddress = money?.symbol == 'BCH' ? '0x0000000000000000000000000000000000002711' : money?.address

  const factoryContract = useFactoryGridexContract()

  const marketContract = useGridexMarketContract(marketAddress)

  /* This can be used anywhere on the code too */
  const stockcontract = useTokenContract(stock?.address)
  const moneycontract = useTokenContract(money?.address)

  /* This states are neccesary to make Buy/Sell functions work, if these states are not existent, the function doesn't detect stockContract, moneyContract */
  const [stockContract, setStockContract] = useState<Contract>() 
  const [moneyContract, setMoneyContract] = useState<Contract>()

  const [actionToCall, setActionToCall] = useState("")

  useEffect(() => {
    getAllRobots(
      '',
      moneycontract,
      stockcontract,
      marketContract,
      currenciesSelected?.currencyA,
      currenciesSelected?.currencyB
    ).then((result) => {
      setGridexList(result.allRobots)
      setRobotsMap(result.RobotsMapF)
    })
  }, [currenciesSelected, moneycontract, stockcontract, marketContract])

  useEffect(() => {
    factoryContract.getAddress(stockAddress, moneyAddress, ImplAddr).then((a) => setMarketAddress(a))
    setStockContract(stockcontract)
    setMoneyContract(moneycontract)
  }, [currenciesSelected, moneycontract, stockcontract, marketContract])

  const type = router.query.filter as string
  const portfolio = type == 'portfolio'
  const sell = marketSelector
  const buy = !marketSelector

  const savedFilter = getFarmFilter()

  const updateFarmFilter = useUpdateFarmFilter()
  updateFarmFilter(type)

  const positions = usePositions(chainId)

  const FILTER = {
    sell: (x) => x.moneyAmount !== 0 && x.ownerAddr !== account,
    buy: (x) => x.stockAmount !== 0 && x.ownerAddr !== account,
    portfolio: (x) => x.ownerAddr == account,
  }

  const data = gridexList.filter((x) => {
    if (portfolio) {
      return x.ownerAddr == account
    }
    if (buy) {
      return x.stockAmount !== 0 && x.ownerAddr !== account
    }
    if (sell) {
      return x.moneyAmount !== 0 && x.ownerAddr !== account
    }
    return false
    // return type in FILTER ? FILTER[type](element) : true
  })

  const options = {
    keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol'],
    threshold: 0.4,
  }

  const { result, term, search } = useFuse({
    data,
    options,
  })

  const basePath = 'gridex/gridex-list'

  const optionsMenu = [
    {
      href: `/${basePath}`,
      label: 'Your Tango CMM',
      exact: true,
    },
    {
      divider: true,
    },
    {
      href: `/${basePath}/buy-gridex`,
      label: 'Buy Tango CMM',
      exact: true,
    },
  ]

  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currenciesSelected?.currencyA ?? undefined)
  const selectedCurrencyBBalance = useCurrencyBalance(account ?? undefined, currenciesSelected?.currencyB ?? undefined)

  const pendingText = `This is the action modal`
  const pendingText2 = ``

  const addTransaction = useTransactionAdder()

  
  const inputValue = formattedAmounts[Field.CURRENCY_B]

  async function Buy(robotId) {
    const moneyDecimals = await moneyContract?.decimals()
    var moneyDelta = inputValue //*1.0
    var moneyDeltaBN = parseUnits(inputValue, moneyDecimals)
    var robot = RobotsMap[robotId]
    var moneyBalance = moneyContract.balanceOf(account)

    var stockDelta = moneyDelta / robotHighPrice

    if (moneyDeltaBN > moneyBalance) {
      alert(`You don't have enough money.`)
    } else if (stockDelta > robotStockAmount) {
      alert('Tango CMM has not enough stock')
    }

    let val = null
    val = moneyAddress == '0x0000000000000000000000000000000000002711' ? { value: moneyDeltaBN } : null

    setAttempingTxn(true)
    await marketContract.buyFromRobot(robotId, moneyDeltaBN, val).then((response) => {
      setHash(response.hash)
      setAttempingTxn(false)
      addTransaction(response, {
        summary: `Buy Stock from ${robot.fullId.slice(0, 8)}...`,
      })
    }).catch(e => {
      setHash('')
      setAttempingTxn(false)
  })
  }
  async function Sell(robotId) {
    const stockDecimals = await stockContract?.decimals()
    var stockDelta = inputValue
    var stockDeltaBN = parseUnits(inputValue, stockDecimals)
    var robot = RobotsMap[robotId]
    var moneyDelta = stockDelta * robotLowPrice
    var stockBalance = stockContract?.balanceOf(account)

    if (stockDeltaBN > stockBalance) {
      alert(`You don't have enough stock.`)
    } else if (moneyDelta > robotMoneyAmount) {
      alert(`Tango CMM has not enough money`)
    }

    let val = null
    val = stockAddress == '0x0000000000000000000000000000000000002711' ? { value: stockDeltaBN } : null

      setAttempingTxn(true)
      await marketContract.sellToRobot(robotId, stockDeltaBN, val).then((response) => {
      setHash(response.hash)
      setAttempingTxn(false)
      addTransaction(response, {
        summary: `Sell Stock to ${robot.fullId.slice(0, 8)}...`,
      })
    }).catch(e => {
        setHash('')
        setAttempingTxn(false)
    })
  }

  async function DeleteRobot() {
      setAttempingTxn(true)
      await marketContract.deleteRobot(index, robotId).then((response) => {
      setHash(response.hash)
      setAttempingTxn(false)
      addTransaction(response, {
        summary: `Delete Robot`,
      })
    }).catch(e => {
      setHash('')
      setAttempingTxn(false)
  })
  }

  const modalHeader = useCallback(() => {
    return (
      <ActionModalHeader
        currencyA={currenciesSelected?.currencyA}
        currencyB={currenciesSelected?.currencyB}
        // maxValue={maxValue}
        // minValue={minValue}
        // stockInputValue={stockInputValue}
        // moneyInputValue={moneyInputValue}
      />
    )
  }, [currenciesSelected])

  const onConfirm = () => {
    actionToCall == "buy" 
    ? Buy(robotId)
    : actionToCall == "sell" 
    ? Sell(robotId) 
    : actionToCall == "delete" 
    && DeleteRobot()
  }

  const modalBottom = useCallback(() => {
    return (
      <ActionModalFooter 
        onConfirm={onConfirm} 
        swapErrorMessage={undefined} 
    />
    )
  }, [modalHeader, currenciesSelected, stockContract, moneyContract, marketContract, factoryContract, index, robotId,])

  const confirmationContent = useCallback(
    () => (
      <ConfirmationModalContent
        title="Confirm Action"
        onDismiss={() => {
          setModalOpen(false)
          setHash(undefined)
        }}
        topContent={modalHeader}
        bottomContent={modalBottom}
      />
    ),
    [modalBottom, modalHeader]
  )

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

      <TransactionConfirmationModal
        isOpen={modalOpen}
        onDismiss={() => setModalOpen(false)}
        attemptingTxn={attemptingTxn}
        hash={hash}
        content={confirmationContent}
        pendingText={pendingText}
        pendingText2={pendingText2}
      />

      <div className={classNames('space-y-6 col-span-4 lg:col-span-3')}>
        <div className="w-full sm:flex sm:gap-2">
          <BuyRobotsPanel
            id="stock-robot-search"
            onCurrencySelect={handleCurrencyASelect}
            onCurrencyBSelect={handleCurrencyBSelect}
            currency={currenciesSelected.currencyA}
            currencyB={currenciesSelected.currencyB}
            showCommonBases
          />
          <div className="flex gap-2 my-6  sm:m-0">
            <NavLink href="/gridex/create-gridex">
              <Button
                color="border"
                className="w-full sm:w-[190px] mx-2 text-[#e3e3e3c6] border-gradient-r-blue-pink-dark-900 ring-2 ring-gray-800 hover:text-gray-200 hover:ring-gray-200 flex items-center gap-2"
              >
                <PlusIcon width={16} height={16} />
                {i18n._(t`Create Tango CMM`)}
              </Button>
            </NavLink>
          </div>
        </div>

        <div className="flex  px-4  sm:px-0 items-center sm:items-start  sm:text-[25px] text-lg font-bold text-high-emphesis whitespace-nowrap">
          <div className="sm:mr-40">Tango CMM list </div>
          <div
            className={
              window.location.href.endsWith(`?filter=portfolio`)
                ? 'hidden'
                : 'flex items-center h-full pl-2 ml-8 sm:ml-auto'
            }
          >
            <div className="cursor-pointer" onClick={() => setMarketSelector(false)}>
              <Typography variant="sm" className="font-bold text-md sm:text-xl text-primary pr-2 sm:pr-4">
                {i18n._(t`Buy `)}
                {stock?.symbol == undefined ? ` Stock` : ` ${stock?.symbol}`}
              </Typography>
            </div>
            <GridexToggle
              id="toggle-market-selector"
              isActive={marketSelector}
              onChange={() => setMarketSelector(!marketSelector)}
            />
            <div className="cursor-pointer" onClick={() => setMarketSelector(true)}>
              <Typography variant="sm" className="text-primary  font-bold text-md sm:text-xl pl-2 sm:pl-4 ">
                {i18n._(t`Sell `)}
                {money?.symbol == undefined || stock?.symbol == undefined ? ` Stock` : ` ${stock?.symbol}`}
              </Typography>
            </div>
          </div>
          <div className="w-full h-0 ml-4 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20"></div>
        </div>

        <RobotList
          stockAddress={stockAddress}
          moneyAddress={moneyAddress}
          robots={result}
          term={term}
          inputValue={inputValue}
          RobotsMap={RobotsMap}
          showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
          onUserInput={onFieldBInput}
          onMax={() => {
            onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
          }}
          currency={currenciesSelected.currencyA}
          currencyB={currenciesSelected.currencyB}
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
        <div className="ml-2 mt-4">
          <button className="text-sm hover:text-high-emphesis" onClick={() => setGridexInfoOpen(true)}>
            What is Tango CMM?
          </button>
          <GridexInfo isOpen={gridexInfoOpen} setIsOpen={setGridexInfoOpen} />
        </div>
      </div>
    </Container>
  )
}
