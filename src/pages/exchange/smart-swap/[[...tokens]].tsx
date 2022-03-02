import {
  ChainId,
  Currency,
  CurrencyAmount,
  JSBI,
  Token,
  TradeSmart
} from '@tangoswapcash/sdk'
import { ApprovalState, useApproveCallbackFromTradeSmart } from '../../../hooks/useApproveCallback'
import { ArrowWrapper, BottomGrouping, SwapCallbackError } from '../../../features/exchange-v1/swap/styleds'
import { ButtonConfirmed, ButtonError } from '../../../components/Button'
import Column, { AutoColumn } from '../../../components/Column'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { UseERC20PermitState, useERC20PermitFromTrade } from '../../../hooks/useERC20Permit'
import { useAllTokens, useCurrency } from '../../../hooks/Tokens'
import {
  useDefaultsFromURLSearch,
  useDerivedSmartSwapInfo,
  useSmartSwapActionHandlers,
  useSwapState,
} from '../../../state/smart-swap/hooks'
import {
  useExpertModeManager,
  useUserArcherETHTip,
  useUserArcherGasPrice,
  useUserArcherUseRelay,
  useUserSingleHopOnly,
  useUserSlippageTolerance,
  useUserTransactionTTL,
} from '../../../state/user/hooks'
import { useNetworkModalToggle, useToggleSettingsMenu, useWalletModalToggle } from '../../../state/application/hooks'
import useWrapCallback, { WrapType } from '../../../hooks/useWrapCallback'

import AddressInputPanel from '../../../components/AddressInputPanel'
import { AdvancedSwapDetails } from '../../../features/exchange-v1/swap/AdvancedSwapDetails'
import AdvancedSwapDetailsDropdown from '../../../features/exchange-v1/swap/AdvancedSwapDetailsDropdown'
import Alert from '../../../components/Alert'
import { ArrowDownIcon } from '@heroicons/react/outline'
import Button from '../../../components/Button'
import ConfirmSmartSwapModal from '../../../features/exchange-v1/swap/ConfirmSmartSwapModal'
import Container from '../../../components/Container'
import CurrencyInputPanel from '../../../components/CurrencyInputPanel'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import { Field } from '../../../state/smart-swap/actions'
import Head from 'next/head'
// import { INITIAL_ALLOWED_SLIPPAGE } from '../../../constants'
import Loader from '../../../components/Loader'
import Lottie from 'lottie-react'
import MinerTip from '../../../features/exchange-v1/swap/MinerTip'
import ProgressSteps from '../../../components/ProgressSteps'
import SwapHeader from '../../../features/trade/Header'
import TokenWarningModal from '../../../modals/TokenWarningModal'
import SmartSwapInfo from '../../../modals/SmartSwapInfo'
import { default as TradePrice, GetRateText } from '../../../features/exchange-v1/swap/TradePrice'
import SmartSwapRouting from "../../../features/exchange-v1/swap/SmartSwapRouting"
import Typography from '../../../components/Typography'
import UnsupportedCurrencyFooter from '../../../features/exchange-v1/swap/UnsupportedCurrencyFooter'
import Web3Connect from '../../../components/Web3Connect'
import BurnedTangoCounter from '../../../components/BurnedTangoCounter'
import { classNames } from '../../../functions'
import { computeFiatValuePriceImpact } from '../../../functions/trade'
import confirmPriceImpactWithoutFee from '../../../features/exchange-v1/swap/confirmPriceImpactWithoutFee'
import { maxAmountSpend } from '../../../functions/currency'
import swapArrowsAnimationData from '../../../animation/swap-arrows.json'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import useENSAddress from '../../../hooks/useENSAddress'
import useIsArgentWallet from '../../../hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from '../../../hooks/useIsSwapUnsupported'
import { useLingui } from '@lingui/react'
import usePrevious from '../../../hooks/usePrevious'
import { useRouter } from 'next/router'
import { useSmartSwapCallback } from '../../../hooks/useSmartSwapCallback'
import { useUSDCValue } from '../../../hooks/useUSDCPrice'
import { warningSeverity } from '../../../functions/prices'
import Image from 'next/image'

export default function Swap() {
  const { i18n } = useLingui()

  const loadedUrlParams = useDefaultsFromURLSearch()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const { account, chainId } = useActiveWeb3React()

  const toggleNetworkModal = useNetworkModalToggle()

  const router = useRouter()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()
  const toggleSettings = useToggleSettingsMenu()

  // get custom setting values for user
  const [ttl] = useUserTransactionTTL()
  const [useArcher] = useUserArcherUseRelay()
  const [archerETHTip] = useUserArcherETHTip()
  const [archerGasPrice] = useUserArcherGasPrice()

  // archer
  const archerRelay = undefined
  // const doArcher = archerRelay !== undefined && useArcher
  const doArcher = undefined

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const {
    trade: smartTrade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    allowedSlippage,
    feePercent
  } = useDerivedSmartSwapInfo(doArcher)

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const trade = showWrap ? undefined : smartTrade

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
            [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, trade]
  )

  const fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDCValue(parsedAmounts[Field.OUTPUT])
  const priceImpact = computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSmartSwapActionHandlers()

  const isValid = !swapInputError
  // console.log("isValid:        ", isValid)
  // console.log("swapInputError: ", swapInputError)
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    router.push('/swap/')
  }, [router])


  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: TradeSmart<Currency, Currency> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  // check whether the user has approved the aggregator on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTradeSmart(trade, allowedSlippage, feePercent, doArcher)

  const signatureData = undefined

  // const {
  //   state: signatureState,
  //   signatureData,
  //   gatherPermitSignature,
  // } = useERC20PermitFromTrade(trade, allowedSlippage)

  const handleApprove = useCallback(async () => {
    await approveCallback()
    // if (signatureState === UseERC20PermitState.NOT_SIGNED && gatherPermitSignature) {
    //   try {
    //     await gatherPermitSignature()
    //   } catch (error) {
    //     // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
    //     if (error?.code !== 4001) {
    //       await approveCallback()
    //     }
    //   }
    // } else {
    //   await approveCallback()
    // }
  }, [approveCallback])
  // }, [approveCallback, gatherPermitSignature, signatureState])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSmartSwapCallback(
    trade,
    allowedSlippage,
    feePercent,
    // recipient,
    signatureData,
    // doArcher ? ttl : undefined
  )

  const [singleHopOnly] = useUserSingleHopOnly()

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
      return
    }
    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      showConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
    })
    swapCallback()
      .then((hash) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: undefined,
          txHash: hash,
        })
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [
    swapCallback,
    priceImpact,
    tradeToConfirm,
    showConfirm,
    recipient,
    recipientAddress,
    account,
    trade?.inputAmount?.currency?.symbol,
    trade?.outputAmount?.currency?.symbol,
    singleHopOnly,
  ])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // // warnings on slippage
  // const priceImpactSeverity = useMemo(() => {
  //   const executionPriceImpact = trade?.priceImpact
  //   return warningSeverity(
  //     executionPriceImpact && priceImpact
  //       ? executionPriceImpact.greaterThan(priceImpact)
  //         ? executionPriceImpact
  //         : priceImpact
  //       : executionPriceImpact ?? priceImpact
  //   )
  // }, [priceImpact, trade])

  const isArgentWallet = useIsArgentWallet()

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !isArgentWallet &&
    !swapInputError &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.PENDING ||
      (approvalSubmitted && approvalState === ApprovalState.APPROVED))
      // && !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({
      showConfirm: false,
      tradeToConfirm,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: trade,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
    })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )

  // useEffect(() => {
  //   if (
  //     doArcher &&
  //     parsedAmounts[Field.INPUT] &&
  //     maxAmountInput &&
  //     parsedAmounts[Field.INPUT]?.greaterThan(maxAmountInput)
  //   ) {
  //     handleMaxInput();
  //   }
  // }, [handleMaxInput, parsedAmounts, maxAmountInput, doArcher]);

  const swapIsUnsupported = useIsSwapUnsupported(currencies?.INPUT, currencies?.OUTPUT)

  // const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode

  const [animateSwapArrows, setAnimateSwapArrows] = useState<boolean>(false)

  const previousChainId = usePrevious<ChainId>(chainId)

  // useEffect(() => {
  //   if (
  //     previousChainId &&
  //     previousChainId !== chainId &&
  //     router.asPath.includes(Currency.getNativeCurrencySymbol(previousChainId))
  //   ) {
  //     router.push(`/swap/${Currency.getNativeCurrencySymbol(chainId)}`);
  //   }
  // }, [chainId, previousChainId, router]);


  const [refreshingPrice, setRefreshingPrice] = useState(false)
  const refreshPrice = () => {
      if(formattedAmounts[Field.INPUT] || formattedAmounts[Field.OUTPUT]){
        setRefreshingPrice(true)
        setTimeout(() => {
          independentField === Field.INPUT
          ? handleTypeInput(formattedAmounts[Field.INPUT])
          : handleTypeOutput(formattedAmounts[Field.OUTPUT])
          setRefreshingPrice(false)
        }, 700);
      }
  }

  const [swapInfoOpen, setSwapInfoOpen] = useState(false)

  return (
    <Container id="swap-page" className="py-4 md:py-8 lg:py-12">
      <Head>
        <title>{i18n._(t`TANGOswap`)} | TANGOswap</title>
        {/* <title>{GetRateText({price: trade?.executionPrice, showInverted}) || i18n._(t`TANGOswap`)} | TANGOswap</title> */}
        <meta
          key="description"
          name="description"
          content="TANGOswap allows for swapping of SEP20 compatible tokens"
        />
      </Head>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
      />
      <DoubleGlowShadow>
        <div className="p-4 space-y-4 rounded bg-dark-900 z-1">
          <SwapHeader
            input={currencies[Field.INPUT]}
            output={currencies[Field.OUTPUT]}
            allowedSlippage={allowedSlippage}
            refreshPrice={refreshPrice}
            refreshingPrice={refreshingPrice}
          />

          <ConfirmSmartSwapModal
            isOpen={showConfirm}
            trade={trade}
            originalTrade={tradeToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            allowedSlippage={allowedSlippage}
            feePercent={feePercent}
            onConfirm={handleSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
            minerBribe={doArcher ? archerETHTip : undefined}
          />
          <div className={refreshingPrice ? "opacity-40 pointer-events-none" : undefined}>
            <CurrencyInputPanel
              // priceImpact={priceImpact}
              label={
                independentField === Field.OUTPUT && !showWrap ? i18n._(t`Swap From (est.):`) : i18n._(t`Swap From:`)
              }
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={showMaxButton}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              fiatValue={fiatValueInput ?? undefined}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencies[Field.OUTPUT]}
              showCommonBases={true}
              id="swap-currency-input"
            />
            <AutoColumn justify="space-between" className="py-3">
              <div
                className={classNames(isExpertMode ? 'justify-between' : 'flex-start', 'px-4 flex-wrap w-full flex')}
              >
                <button
                  className="z-10 -mt-6 -mb-6 rounded-full"
                  onClick={() => {
                    setApprovalSubmitted(false) // reset 2 step UI for approvals
                    handleTypeInput("") // clear input value
                    handleTypeOutput("") // clear output value
                    onSwitchTokens()
                  }}
                >
                  <div className="rounded-full bg-dark-900 p-3px">
                    <div
                      className="p-3 rounded-full bg-dark-800 hover:bg-dark-700"
                      onMouseEnter={() => setAnimateSwapArrows(true)}
                      onMouseLeave={() => setAnimateSwapArrows(false)}
                    >
                      <Lottie
                        animationData={swapArrowsAnimationData}
                        autoplay={animateSwapArrows}
                        loop={false}
                        style={{ width: 32, height: 32 }}
                      />
                    </div>
                  </div>
                </button>
                {isExpertMode ? (
                  recipient === null && !showWrap ? (
                    <Button variant="link" size="none" id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                      + Add recipient (optional)
                    </Button>
                  ) : (
                    <Button
                      variant="link"
                      size="none"
                      id="remove-recipient-button"
                      onClick={() => onChangeRecipient(null)}
                    >
                      - {i18n._(t`Remove recipient`)}
                    </Button>
                  )
                ) : null}
              </div>
            </AutoColumn>

            <div>
              <CurrencyInputPanel
                value={formattedAmounts[Field.OUTPUT]}
                onUserInput={handleTypeOutput}
                label={independentField === Field.INPUT && !showWrap ? i18n._(t`Swap To (est.):`) : i18n._(t`Swap To:`)}
                showMaxButton={false}
                hideBalance={true}
                fiatValue={fiatValueOutput ?? undefined}
                priceImpact={priceImpact}
                currency={currencies[Field.OUTPUT]}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[Field.INPUT]}
                showCommonBases={true}
                id="swap-currency-output"
                readOnly={true}
              />
              {Boolean(trade) && (
                <div className="p-1 -mt-2 cursor-pointer rounded-b-md bg-dark-800">
                  <TradePrice
                    price={trade?.executionPrice}
                    showInverted={showInverted}
                    setShowInverted={setShowInverted}
                    className="bg-dark-900"
                  />
                  <SmartSwapRouting outputCurrency={currencies[Field.OUTPUT]} inputCurrency={currencies[Field.INPUT]} distribution={trade?.distribution}/>
                </div>
              )}
            </div>
            <div className='ml-1 mt-1'>
              <button className='text-sm hover:text-high-emphesis' onClick={() => setSwapInfoOpen(true)}>What is SmartSwap?</button>
              <SmartSwapInfo isOpen={swapInfoOpen} setIsOpen={setSwapInfoOpen} />
            </div>
          </div>

          {recipient !== null && !showWrap && (
            <>
              <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
              {recipient !== account && (
                <Alert
                  type="warning"
                  dismissable={false}
                  showIcon
                  message={i18n._(
                    t`Please note that the recipient address is different from the connected wallet address.`
                  )}
                />
              )}
            </>
          )}

          {/* {showWrap ? null : (
            <div
              style={{
                padding: showWrap ? '.25rem 1rem 0 1rem' : '0px',
              }}
            >
              <div className="px-5 mt-1">{doArcher && userHasSpecifiedInputOutput && <MinerTip />}</div>
            </div>
          )} */}
          {/*
          {trade && (
            <div className="p-5 rounded bg-dark-800">
              <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} />
            </div>
          )} */}

          <BottomGrouping>
            {swapIsUnsupported ? (
              <Button color="blue" size="lg" disabled>
                {i18n._(t`Unsupported Asset`)}
              </Button>
            ) : !account ? (
              <Web3Connect size="lg" color="blue" className="w-full" />
            ) : showWrap ? (
              <Button color="gradient" size="lg" disabled={Boolean(wrapInputError)} onClick={onWrap}>
                {wrapInputError ??
                  (wrapType === WrapType.WRAP
                    ? i18n._(t`Wrap`)
                    : wrapType === WrapType.UNWRAP
                    ? i18n._(t`Unwrap`)
                    : null)}
              </Button>
            ) : showApproveFlow ? (
              <div>
                {approvalState !== ApprovalState.APPROVED && (
                  <ButtonConfirmed
                    onClick={handleApprove}
                    disabled={approvalState !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                    size="lg"
                  >
                    {approvalState === ApprovalState.PENDING ? (
                      <div className="flex items-center justify-center h-full space-x-2">
                        <div>Approving</div>
                        <Loader stroke="white" />
                      </div>
                    ) : (
                      i18n._(t`Approve ${currencies[Field.INPUT]?.symbol}`)
                    )}
                  </ButtonConfirmed>
                )}
                {approvalState === ApprovalState.APPROVED && (
                  <ButtonError
                    onClick={() => {
                      if (isExpertMode) {
                        handleSwap()
                      } else {
                        setSwapState({
                          tradeToConfirm: trade,
                          attemptingTxn: false,
                          swapErrorMessage: undefined,
                          showConfirm: true,
                          txHash: undefined,
                        })
                      }
                    }}
                    style={{
                      width: '100%',
                    }}
                    id="swap-button"
                    disabled={
                      !isValid || approvalState !== ApprovalState.APPROVED
                    }
                    error={isValid}
                  >
                    {i18n._(t`Swap`)}
                  </ButtonError>
                )}
              </div>
            ) : (
              <ButtonError
                onClick={() => {
                  if (isExpertMode) {
                    handleSwap()
                  } else {
                    setSwapState({
                      tradeToConfirm: trade,
                      attemptingTxn: false,
                      swapErrorMessage: undefined,
                      showConfirm: true,
                      txHash: undefined,
                    })
                  }
                }}
                id="swap-button"
                disabled={!isValid || !!swapCallbackError}
                // error={isValid && !swapCallbackError}
                error={false}
              >
                {swapInputError
                  ? swapInputError
                  : i18n._(t`Swap`)}
              </ButtonError>
            )}
            {showApproveFlow && (
              <Column style={{ marginTop: '1rem' }}>
                <ProgressSteps steps={[approvalState === ApprovalState.APPROVED]} />
              </Column>
            )}
            {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
          </BottomGrouping>
          {/* {!swapIsUnsupported ? (
        <AdvancedSwapDetailsDropdown trade={trade} />
      ) : (
        <UnsupportedCurrencyFooter
          show={swapIsUnsupported}
          currencies={[currencies.INPUT, currencies.OUTPUT]}
        />
      )} */}

          {!swapIsUnsupported ? null : (
            <UnsupportedCurrencyFooter show={swapIsUnsupported} currencies={[currencies.INPUT, currencies.OUTPUT]} />
          )}
        </div>
      </DoubleGlowShadow>

      <div className="text-center flex items-center absolute bottom-20 lg:bottom-2 right-2">
        <p className="font-bold mt-2 mr-3">Powered by:</p>
        <div className="relative h-24 w-24">
          <Image layout="fill" objectFit="contain" objectPosition="bottom" src="/smart-swap-neon-white.png" alt="Smart Swap" />
        </div>
      </div>

      <div className='mt-2 lg:mt-6'>
        <BurnedTangoCounter />
      </div>
    </Container>
  )
}
