import { ApprovalState, useApproveCallback } from '../../../hooks/useApproveCallback'
import { AutoRow, RowBetween } from '../../../components/Row'
import Button, { ButtonError } from '../../../components/Button'
import { Currency, CurrencyAmount, Percent, WNATIVE, currencyEquals, SmartBCH, Token } from '@tangoswapcash/sdk'
import { ONE_BIPS, ZERO_PERCENT } from '../../../constants'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../../modals/TransactionConfirmationModal'
import { calculateGasMargin, calculateSlippageAmount, getGasPrice } from '../../../functions/trade'
import { currencyId, maxAmountSpend } from '../../../functions/currency'
import { useDerivedMintInfo, useGridexMintInfo, useMintActionHandlers, useMintState } from '../../../state/mint/hooks'
import { useExpertModeManager, useUserSlippageToleranceWithDefault } from '../../../state/user/hooks'
import Alert from '../../../components/Alert'
import { AutoColumn } from '../../../components/Column'
import { BigNumber } from '@ethersproject/bignumber'
import { ConfirmAddModalBottom } from '../../../features/exchange-v1/liquidity/ConfirmAddModalBottom'
import Container from '../../../components/Container'
import CurrencyInputPanel from '../../../components/CurrencyInputPanel'
import CurrencyLogo from '../../../components/CurrencyLogo'
import Dots from '../../../components/Dots'
import DoubleCurrencyLogo from '../../../components/DoubleLogo'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import ExchangeHeader from '../../../features/trade/Header'
import { Field } from '../../../state/mint/actions'
import Head from 'next/head'
import NavLink from '../../../components/NavLink'
import { Plus } from 'react-feather'
import { TransactionResponse } from '@ethersproject/providers'
import Web3Connect from '../../../components/Web3Connect'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import { useCurrency } from '../../../hooks/Tokens'
import { useIsSwapUnsupported } from '../../../hooks/useIsSwapUnsupported'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'
import { useApproveSep206Callback, useContract, useRouterContract } from '../../../hooks'
import { useTransactionAdder } from '../../../state/transactions/hooks'
import useTransactionDeadline from '../../../hooks/useTransactionDeadline'
import { useWalletModalToggle } from '../../../state/application/hooks'
import PanelLimitPrice from '../../../components/PanelLimitPrice'
import { useCurrencyBalances } from '../../../state/wallet/hooks'
import { ethers } from 'ethers'
import { parseUnits } from '@ethersproject/units'
import { formatUnits } from '@ethersproject/units'
import { formatCurrencyAmount } from '../../../functions'

const DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function CreateGridexPage() {
  const { i18n } = useLingui()
  const { account, chainId, library } = useActiveWeb3React()
  const router = useRouter()
  const tokens = router.query.tokens
  const [currencyIdA, currencyIdB] = (tokens as string[]) || [undefined, undefined]

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const [currenciesSelected, setCurrenciesSelected] = useState(null)

  const [minValue, setMinValue] = useState()
  const [maxValue, setMaxValue] = useState()

  const minPriceValue = (value) => useMemo(() => {
        setMinValue(value)
        console.log('minValue:', value);
      },
      [value]
    )

  const maxPriceValue = (value) => useMemo(() => {
      setMaxValue(value)
      console.log('maxValue:', value);
    },
    [value]
  )

  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(currencyA, WNATIVE[chainId])) ||
        (currencyB && currencyEquals(currencyB, WNATIVE[chainId])))
  )

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const [isExpertMode] = useExpertModeManager()
  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useGridexMintInfo(currenciesSelected?.currencyA ?? undefined, currenciesSelected?.currencyB ?? undefined)

  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  // const [allowedSlippage] = useUserSlippageTolerance(); // custom from users

  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE) // custom from users

  const [txHash, setTxHash] = useState<string>('')

  function packPrice(price) {
    var effBits = 1
    while(!price.mask(effBits).eq(price)) {
      effBits += 1
    }
    var twoPow24 = BigNumber.from(2).pow(24)
    if(effBits <= 25) {
      return price
    }
    var shift = effBits-25
    var shiftBN = BigNumber.from(2).pow(shift)
    var low24 = price.div(shiftBN).sub(twoPow24)
    var high8 = BigNumber.from(shift).add(1).mul(twoPow24)
    return high8.add(low24)
  }
  

  const SEP20ABI = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
  ]

  const ImplAddr = "0x8dEa2aB783258207f6db13F8b43a4Bda7B03bFBe"
  const FactoryAddr = "0xc6ec5d65cA33E7E3ac58A263177c9eEF8042fE17"

  const CCABI = [
    "function getAllRobots() view public returns (uint[] memory robotsIdAndInfo)",
    "function createRobot(uint robotInfo) external payable",
    "function deleteRobot(uint index, uint robotId) external",
    "function sellToRobot(uint robotId, uint stockDelta) external payable",
    "function buyFromRobot(uint robotId, uint moneyDelta) external payable",
  ]

  const FactoryABI = [
    "function create(address stock, address money, address impl) external",
    "function getAddress(address stock, address money, address impl) public view returns (address)",
  ]

  const stock = currenciesSelected?.currencyA
  const money = currenciesSelected?.currencyB

  const stockContract = useContract(stock?.address, SEP20ABI) 
  const moneyContract = useContract(money?.address, SEP20ABI) 
  const factoryContract = useContract(FactoryAddr, FactoryABI)

  const [marketAddress, setMarketAddress] = useState()
  factoryContract.getAddress(stock?.address, money?.address, ImplAddr).then(a => setMarketAddress(a))
  
  let moneySymbol = moneyContract?.symbol()
  let moneyDecimals = moneyContract?.decimals()
  let moneyAmount = moneyContract?.balanceOf(account)

  let stockSymbol = stockContract?.symbol()
  let stockDecimals = stockContract?.decimals()
  let stockAmount = stockContract?.balanceOf(account)

  // to create a robot market factoryContract.create(stockAddr, moneyAddr, ImplAddr)

  const marketContract = useContract(marketAddress, CCABI)
  
  async function CreateRobot() {
    const stockAmount = formatCurrencyAmount(parsedAmounts[Field.CURRENCY_A], 4)
    const moneyAmount = formatCurrencyAmount(parsedAmounts[Field.CURRENCY_B], 4)
    var stockAmountBN = parseUnits(stockAmount, await stockDecimals)
    var moneyAmountBN = parseUnits(moneyAmount, await moneyDecimals)
    var highPrice = packPrice(parseUnits(maxValue))
    var lowPrice = packPrice(parseUnits(minValue))
    var robotInfo = stockAmountBN.mul(BigNumber.from(2).pow(96)).add(moneyAmountBN)
    robotInfo = robotInfo.mul(BigNumber.from(2).pow(32)).add(highPrice)
    robotInfo = robotInfo.mul(BigNumber.from(2).pow(32)).add(lowPrice)

    // let val = null;
    // if (stock?.address == '0x0000000000000000000000000000000000002711') {
    //   val = {value: stockAmountBN};
    // } else if (money?.address == '0x0000000000000000000000000000000000002711') {
    //   val = {value: moneyAmountBN};
    

    await marketContract.createRobot(robotInfo)
  }

  async function createMarket() {
    factoryContract.create(stock?.address, money?.address, ImplAddr)
  }

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    stock ?? undefined,
    money ?? undefined,
  ])

  const walletBalances = {
    [Field.CURRENCY_A]: relevantTokenBalances[0],
    [Field.CURRENCY_B]: relevantTokenBalances[1],
  }

  const [balanceInStock, amountInStock] = [
    walletBalances[Field.CURRENCY_A],
    parsedAmounts[Field.CURRENCY_A],
  ]

  const [balanceInMoney, amountInMoney] = [
    walletBalances[Field.CURRENCY_B],
    parsedAmounts[Field.CURRENCY_B],
  ]

  // get the max amounts user can add
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

  // const routerContract = useRouterContract()

  // check whether the user has approved the router on the tokens
  // const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], routerContract?.address)
  // const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], routerContract?.address)

  // const addTransaction = useTransactionAdder()

  // async function onAdd() {
  //   if (!chainId || !library || !account || !routerContract) return

  //   const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts

  //   if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
  //     return
  //   }

  //   const amountsMin = {
  //     [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
  //     [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
  //   }

  //   let estimate,
  //     method: (...args: any) => Promise<TransactionResponse>,
  //     args: Array<string | string[] | number>,
  //     value: BigNumber | null
  //   if (currencyA.isNative || currencyB.isNative) {
  //     const tokenBIsETH = currencyB.isNative
  //     estimate = routerContract.estimateGas.addLiquidityETH
  //     method = routerContract.addLiquidityETH
  //     args = [
  //       (tokenBIsETH ? currencyA : currencyB)?.wrapped?.address ?? '', // token
  //       (tokenBIsETH ? parsedAmountA : parsedAmountB).quotient.toString(), // token desired
  //       amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
  //       amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
  //       account,
  //       deadline.toHexString(),
  //     ]
  //     value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).quotient.toString())
  //   } else {
  //     estimate = routerContract.estimateGas.addLiquidity
  //     method = routerContract.addLiquidity
  //     args = [
  //       currencyA?.wrapped?.address ?? '',
  //       currencyB?.wrapped?.address ?? '',
  //       parsedAmountA.quotient.toString(),
  //       parsedAmountB.quotient.toString(),
  //       amountsMin[Field.CURRENCY_A].toString(),
  //       amountsMin[Field.CURRENCY_B].toString(),
  //       account,
  //       deadline.toHexString(),
  //     ]
  //     value = null
  //   }

  //   setAttemptingTxn(true)
  //   try {
  //     const estimatedGasLimit = await estimate(...args, {
  //       ...(value ? { value } : {}),
  //       gasPrice: getGasPrice(),
  //     })

  //     const response = await method(...args, {
  //       ...(value ? { value } : {}),
  //       gasLimit: calculateGasMargin(estimatedGasLimit),
  //       gasPrice: getGasPrice(),
  //     })

  //     setAttemptingTxn(false)

  //     addTransaction(response, {
  //       summary: i18n._(
  //         t`Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${
  //           currencies[Field.CURRENCY_A]?.symbol
  //         } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`
  //       ),
  //     })

  //     setTxHash(response.hash)
  //   } catch (error) {
  //     setAttemptingTxn(false)
  //     // we only care if the error is something _other_ than the user rejected the tx
  //     if (error?.code !== 4001) {
  //       console.error(error)
  //     }
  //   }
  // }
  
  const handleCurrencyASelect = (currencyA: Currency) => {
    setCurrenciesSelected({...currenciesSelected, currencyA: currencyA})
  }
  const handleCurrencyBSelect = (currencyB: Currency) => {
    setCurrenciesSelected({...currenciesSelected, currencyB: currencyB})      
  }
 
  const [stockApprovalState, stockApprove] = useApproveSep206Callback(
    parsedAmounts[Field.CURRENCY_A],
    marketAddress
  )

  const [moneyApprovalState, moneyApprove] = useApproveSep206Callback(
    parsedAmounts[Field.CURRENCY_B],
    marketAddress
  )

  const showStockApprove =
  chainId &&
  currenciesSelected?.currencyA &&
  parsedAmounts[Field.CURRENCY_A] &&
  (stockApprovalState === ApprovalState.NOT_APPROVED || stockApprovalState === ApprovalState.PENDING)

  const showMoneyApprove =
  chainId &&
  currenciesSelected?.currencyB &&
  parsedAmounts[Field.CURRENCY_B] &&
  (moneyApprovalState === ApprovalState.NOT_APPROVED || moneyApprovalState === ApprovalState.PENDING)
  
  const disabled = stockApprovalState === ApprovalState.PENDING || moneyApprovalState === ApprovalState.PENDING
  const haveMarketAddress = !marketAddress && currenciesSelected
  console.log(haveMarketAddress);
  
  return (
    <>
      <Head>
        <title>Create | Tango CMM</title>
        <meta
          key="description"
          name="description"
          content="Add liquidity to the TANGOswap CMM to enable gas optimized and low slippage trades across countless networks"
        />
      </Head>

      <Container id="create-robot-page" className="py-4 space-y-6 md:py-8 lg:py-12" maxWidth="2xl">
        <div className="flex items-center justify-between mb-5">
          <NavLink href="/robots/robots-list?filter=portfolio">
            <a className="flex items-center space-x-2 text-base font-medium text-center cursor-pointer text-secondary hover:text-high-emphesis">
              <span>{i18n._(t`View Your Tango CMM`)}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </NavLink>
        </div>

        <DoubleGlowShadow>
          <div className="p-4 space-y-4 rounded bg-dark-900" style={{ zIndex: 1 }}>
            <div className="flex flex-col space-y-4">
              <div>
                <CurrencyInputPanel
                  label="Stock"
                  onUserInput={onFieldAInput}
                  onMax={() => {
                    onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                  }}
                  value={formattedAmounts[Field.CURRENCY_A]}
                  onCurrencySelect={handleCurrencyASelect}
                  showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                  currency={currenciesSelected && currenciesSelected.currencyA && currenciesSelected.currencyA}
                  id="add-liquidity-input-tokena"
                  showCommonBases
                />

                <AutoColumn justify="space-between" className="py-2.5">
                  <AutoRow justify={isExpertMode ? 'space-between' : 'flex-start'} style={{ padding: '0 1rem' }}>
                    <button className="z-10 -mt-6 -mb-6 rounded-full cursor-default bg-dark-900 p-3px">
                      <div className="p-3 rounded-full bg-dark-800">
                        <Plus size="32" />
                      </div>
                    </button>
                  </AutoRow>
                </AutoColumn>

                <CurrencyInputPanel
                
                  label="Money"
                  onUserInput={onFieldBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onMax={() => {
                    onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                  }}
                  value={formattedAmounts[Field.CURRENCY_B]}
                  showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                  currency={currenciesSelected && currenciesSelected.currencyB && currenciesSelected.currencyB}
                  id="add-liquidity-input-tokenb"
                  showCommonBases
                />
              </div>
              {
                  <div className='flex justify-center gap-5'>
                    <PanelLimitPrice minPrice={minPriceValue} maxPrice={maxPriceValue} label='Max price to Sell' currencyA={!currenciesSelected ?'BCH':currenciesSelected?.currencyA?.symbol} currencyB={!currenciesSelected ?'TANGO': currenciesSelected?.currencyB?.symbol}/>
                    <PanelLimitPrice minPrice={minPriceValue} maxPrice={maxPriceValue} label='Min price to Buy' currencyA={!currenciesSelected ?'TANGO': currenciesSelected?.currencyB?.symbol} currencyB={!currenciesSelected ?'BCH':currenciesSelected?.currencyA?.symbol}/>
                  </div>
              }
            
              {
              !account ? (
                <Web3Connect size="lg" color="blue" className="w-full" />
              )
              : 
              error ? (
                <Button color="blue" size="lg" disabled>
                  {i18n._(t`${error}`)}
                </Button>
              )
              :
              haveMarketAddress ? (
                <Button color="gradient" size="lg" disabled={!currenciesSelected} onClick={createMarket}>
                 {i18n._(t`Create Market`)}
                </Button>
              )
              :
              showStockApprove ? (
                <Button onClick={stockApprove} color={disabled ? 'gray' : 'gradient'} className="mb-4">
                  {stockApprovalState === ApprovalState.PENDING ? (
                    <Dots>{i18n._(t`Approving ${stock.symbol}`)}</Dots>
                  ) : (
                    i18n._(t`Approve ${stock.symbol}`)
                  )}
                </Button>
              ) 
              :
              showMoneyApprove ? (
                <Button onClick={moneyApprove} color={disabled ? 'gray' : 'gradient'} className="mb-4">
                   {moneyApprovalState === ApprovalState.PENDING ? (
                    <Dots>{i18n._(t`Approving ${money.symbol}`)}</Dots>
                  ) : (
                    i18n._(t`Approve ${money.symbol}`)
                  )}
                </Button>
              )
              :
              (
                <Button color="gradient" size="lg" disabled={!currenciesSelected} onClick={CreateRobot}>
                  {i18n._(t`Create Tango CMM`)}
                </Button>
              )
              }
            </div>
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
