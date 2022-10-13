import { ApprovalState, useApproveCallback } from '../../../hooks/useApproveCallback'
import { AutoRow, RowBetween } from '../../../components/Row'
import Button, { ButtonError } from '../../../components/Button'
import { Currency, CurrencyAmount, Percent, WNATIVE, currencyEquals } from '@tangoswapcash/sdk'
import { ONE_BIPS, ZERO_PERCENT } from '../../../constants'
import React, { useCallback, useEffect, useState } from 'react'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../../modals/TransactionConfirmationModal'
import { calculateGasMargin, calculateSlippageAmount, getGasPrice } from '../../../functions/trade'
import { currencyId, maxAmountSpend } from '../../../functions/currency'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../../state/mint/hooks'
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
import LiquidityHeader from '../../../features/exchange-v1/liquidity/LiquidityHeader'
import LiquidityPrice from '../../../features/exchange-v1/liquidity/LiquidityPrice'
import { MinimalPositionCard } from '../../../components/PositionCard'
import NavLink from '../../../components/NavLink'
import { PairState } from '../../../hooks/useV2Pairs'
import { Plus } from 'react-feather'
import { TransactionResponse } from '@ethersproject/providers'
import Typography from '../../../components/Typography'
import UnsupportedCurrencyFooter from '../../../features/exchange-v1/swap/UnsupportedCurrencyFooter'
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
  } = useDerivedMintInfo(currenciesSelected?.currencyA ?? undefined, currenciesSelected?.currencyB ?? undefined)

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

  const stockContract = useContract(stock?.address, SEP20ABI, false) 
  const moneyContract = useContract(money?.address, SEP20ABI, false) 
  const factoryContract = useContract(FactoryAddr, FactoryABI, false)

  const [marketAddress, setMarketAddress] = useState()
  factoryContract.getAddress(stock?.address, money?.address, ImplAddr).then(a => setMarketAddress(a))
  
  let moneySymbol = moneyContract?.symbol()
  let moneyDecimals = moneyContract?.decimals()
  let moneyAmount = moneyContract?.balanceOf(account)

  let stockSymbol = stockContract?.symbol()
  let stockDecimals = stockContract?.decimals()
  let stockAmount = stockContract?.balanceOf(account)
  
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

   console.log('parsedAmounts A', parsedAmounts[Field.CURRENCY_A]);
   console.log('stockApprovalState:', stockApprovalState);
  
  // to create the robot factoryContract.create(stockAddr, moneyAddr, ImplAddr)

  // async function checkAllowanceAndBalance(contract, symbol, myAddr, amount, decimals) {
  //   const allowanceBN = await contract.allowance(myAddr, await MarketAddress)
  //   const allowance = ethers.utils.formatUnits(allowanceBN, decimals)*1.0
  //   // console.log(symbol, ', allowance:', allowance); 

  //     if(allowance < amount) {
  //       new Attention.Confirm({title: `Approve ${symbol}`,
  //         content: `You did not approve enough ${symbol} to continue.cash, do you want to approve now? After sending the approving transaction, you can retry.`,
  //         onConfirm(component) {
  //           const MaxAmount = ethers.utils.parseUnits('999999999')
  //           contract.approve(MarketAddress, MaxAmount)
  //         },
  //         onCancel(component) {}});
  //       return
  //     }
  //     const balanceBN = await contract.balanceOf(myAddr)
  //     const balance = ethers.utils.formatUnits(balanceBN, decimals)*1.0
  //     if(balance < amount) {
  //       window.AlertDlg = new Attention.Alert({title: "Not Enough ${symbol}",
  //         content: `${amount} ${symbol} is needed, but you only have ${balance}`});
  //     }
  // }
  
  // async function CreateRobot() {

  //   checkAllowanceAndBalance(stockContract, await stockSymbol, account, await stockAmount, await stockDecimals)
  //   checkAllowanceAndBalance(moneyContract, await moneySymbol, account, await moneyAmount, await moneyDecimals)

  //   var stockAmountBN = ethers.utils.parseUnits(stockAmount, await stockDecimals)
  //   var moneyAmountBN = ethers.utils.parseUnits(moneyAmount, await moneyDecimals)
  //   var highPrice = packPrice(ethers.utils.parseUnits(document.getElementById("highPrice").value))
  //   var lowPrice = packPrice(ethers.utils.parseUnits(document.getElementById("lowPrice").value))
  //   var robotInfo = stockAmountBN.mul(ethers.BigNumber.from(2).pow(96)).add(moneyAmountBN)
  //   robotInfo = robotInfo.mul(ethers.BigNumber.from(2).pow(32)).add(highPrice)
  //   robotInfo = robotInfo.mul(ethers.BigNumber.from(2).pow(32)).add(lowPrice)
  //   // const provider = new ethers.providers.Web3Provider(window.ethereum);
  //   // const signer = provider.getSigner();
  //   const marketContract = new ethers.Contract(MarketAddress, CCABI, provider).connect(signer);

  //   let val = null;
  //   if (window.stockAddr == '0x0000000000000000000000000000000000002711') {
  //     val = {value: stockAmountBN};
  //   } else if (window.moneyAddr == '0x0000000000000000000000000000000000002711') {
  //     val = {value: moneyAmountBN};
  //   }
  //   console.log('val:', val);

  //   await marketContract.createRobot(robotInfo, val)
  //   }


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

  const routerContract = useRouterContract()

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], routerContract?.address)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], routerContract?.address)

  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account || !routerContract) return

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts

    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
    }

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (currencyA.isNative || currencyB.isNative) {
      const tokenBIsETH = currencyB.isNative
      estimate = routerContract.estimateGas.addLiquidityETH
      method = routerContract.addLiquidityETH
      args = [
        (tokenBIsETH ? currencyA : currencyB)?.wrapped?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).quotient.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadline.toHexString(),
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).quotient.toString())
    } else {
      estimate = routerContract.estimateGas.addLiquidity
      method = routerContract.addLiquidity
      args = [
        currencyA?.wrapped?.address ?? '',
        currencyB?.wrapped?.address ?? '',
        parsedAmountA.quotient.toString(),
        parsedAmountB.quotient.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadline.toHexString(),
      ]
      value = null
    }

    setAttemptingTxn(true)
    try {
      const estimatedGasLimit = await estimate(...args, {
        ...(value ? { value } : {}),
        gasPrice: getGasPrice(),
      })

      const response = await method(...args, {
        ...(value ? { value } : {}),
        gasLimit: calculateGasMargin(estimatedGasLimit),
        gasPrice: getGasPrice(),
      })

      setAttemptingTxn(false)

      addTransaction(response, {
        summary: i18n._(
          t`Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${
            currencies[Field.CURRENCY_A]?.symbol
          } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`
        ),
      })

      setTxHash(response.hash)
    } catch (error) {
      setAttemptingTxn(false)
      // we only care if the error is something _other_ than the user rejected the tx
      if (error?.code !== 4001) {
        console.error(error)
      }
    }
  }

  const handleCurrencyASelect = (currencyA: Currency) => {
    setCurrenciesSelected({...currenciesSelected, currencyA: currencyA})
  }
  const handleCurrencyBSelect = (currencyB: Currency) => {
    setCurrenciesSelected({...currenciesSelected, currencyB: currencyB})      
  }

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)
  

  console.log('parsedAmounts A', formatCurrencyAmount(parsedAmounts[Field.CURRENCY_A], 4))
  console.log('parsedAmounts B', formatCurrencyAmount(parsedAmounts[Field.CURRENCY_B], 4))

  
  console.log(formattedAmounts)
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
              <span>{i18n._(t`View Your Tango CMMs`)}</span>
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
                    <PanelLimitPrice label='Max price to Sell' currencyA={!currenciesSelected ?'BCH':currenciesSelected?.currencyA?.symbol} currencyB={!currenciesSelected ?'TANGO': currenciesSelected?.currencyB?.symbol}/>
                    <PanelLimitPrice label='Min price to Buy' currencyA={!currenciesSelected ?'TANGO': currenciesSelected?.currencyB?.symbol} currencyB={!currenciesSelected ?'BCH':currenciesSelected?.currencyA?.symbol}/>
                  </div>
                
              }

              {
              !account ? (
                <Web3Connect size="lg" color="blue" className="w-full" />
              )
              : !stock && !money ? (
                <Button color="blue" size="lg" disabled>
                  {i18n._(t`Select your Tokens`)}
                </Button>
              ) 
              : !stock ? (
                <Button color="blue" size="lg" disabled>
                  {i18n._(t`Select your Stock`)}
                </Button>
              ) 
              : !money ? (
                <Button color="blue" size="lg" disabled>
                {i18n._(t`Select your Money`)}
                 </Button>
              ) 
              : !parsedAmounts[Field.CURRENCY_A] && !parsedAmounts[Field.CURRENCY_B] ? (
                <Button color="blue" size="lg" disabled>
                  {i18n._(t`Enter an Amount`)}
                 </Button>
              )
              : balanceInStock && amountInStock && balanceInStock.lessThan(amountInStock) ? (
                <Button color="blue" size="lg" disabled>
                  {i18n._(t`Insufficient ${currencies[Field.CURRENCY_A]?.symbol} balance`)}
                 </Button>
              )
              : balanceInMoney && amountInMoney && balanceInMoney.lessThan(amountInMoney) ? (
                <Button color="blue" size="lg" disabled>
                  {i18n._(t`Insufficient ${currencies[Field.CURRENCY_B]?.symbol} balance`)}
                 </Button>
              )
              : showStockApprove ? (
                <Button onClick={stockApprove} color={disabled ? 'gray' : 'gradient'} className="mb-4">
                  {stockApprovalState === ApprovalState.PENDING ? (
                    <Dots>{i18n._(t`Approving ${stock.symbol}`)}</Dots>
                  ) : (
                    i18n._(t`Approve ${stock.symbol}`) // ver como se usa useApproveSep206Callback
                  )}
                </Button>
              ) :
              (
                <Button color="gradient" size="lg" disabled={!currenciesSelected}>
                  {i18n._(t`Create Tango CMM`)}
                </Button>
              )
              }
            </div>

            {/* {!addIsUnsupported ? (
              pair && !noLiquidity && pairState !== PairState.INVALID ? (
                <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
              ) : null
            ) : (
              <UnsupportedCurrencyFooter
                show={addIsUnsupported}
                currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
              />
            )} */}
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
