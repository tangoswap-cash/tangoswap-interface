import { AppDispatch, AppState } from '../index'
import {
  ChainId,
  Currency,
  CurrencyAmount,
  JSBI,
  Percent,
  TANGO_ADDRESS,
  ROUTER_ADDRESS,
  FACTORY_ADDRESS,
  TradeType,
  TradeSmart,
  WNATIVE_ADDRESS,
} from '@tangoswapcash/sdk'
import { DEFAULT_ARCHER_ETH_TIP, DEFAULT_ARCHER_GAS_ESTIMATE } from '../../config/archer'
import {
  EstimatedSwapCall,
  SuccessfulCall,
  swapErrorToUserReadableMessage,
  useSmartSwapCallArguments,
} from '../../hooks/useSmartSwapCallback'
// import {
//   EstimatedSwapCall,
//   SuccessfulCall,
//   useSmartSwapCallArguments,
// } from "../../hooks/useSwapCallback";
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { isAddress, isZero } from '../../functions/validate'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  useExpertModeManager,
  useUserArcherETHTip,
  useUserArcherGasEstimate,
  useUserArcherGasPrice,
  useUserArcherTipManualOverride,
  useUserSingleHopOnly,
  useUserSlippageTolerance,
} from '../user/hooks'

// import { useV2TradeExactIn as useTradeExactIn, useV2TradeExactOut as useTradeExactOut } from '../../hooks/useV2Trades'
import { useSmartTrade } from '../../hooks/useSmartTrades'

import { ParsedQs } from 'qs'
import { SmartSwapState } from './reducer'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../functions/parse'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useCurrency } from '../../hooks/Tokens'
import { useCurrencyBalances } from '../wallet/hooks'
import useENS from '../../hooks/useENS'
import { useLingui } from '@lingui/react'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import {
  useSmartSwapFeePercent,
  useSmartSwapSlippageTolerance,
} from '../../hooks/useSmartSwapSlippageTollerenceAndFeePercent'
import { initialState } from './reducer'

export function useSwapState(): AppState['swap'] {
  return useAppSelector((state) => state.swap)
}

export function useSmartSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useAppDispatch()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency.isToken ? currency.address : 'BCH',
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
  }
}

// TODO: Swtich for ours...
const BAD_RECIPIENT_ADDRESSES: { [chainId: string]: { [address: string]: true } } = {
  [ChainId.SMARTBCH]: {
    [FACTORY_ADDRESS[ChainId.SMARTBCH]]: true,
    [ROUTER_ADDRESS[ChainId.SMARTBCH]]: true,
  },
  [ChainId.SMARTBCH_AMBER]: {
    [FACTORY_ADDRESS[ChainId.SMARTBCH_AMBER]]: true,
    [ROUTER_ADDRESS[ChainId.SMARTBCH_AMBER]]: true,
  },
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSmartSwapInfo(doArcher = false): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: string
  trade: TradeSmart<Currency, Currency> | undefined
  allowedSlippage: Percent
  feePercent: Percent
} {
  const { i18n } = useLingui()

  const { account, chainId, library } = useActiveWeb3React()

  // const [singleHopOnly] = useUserSingleHopOnly()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)

  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ])

  const parsedAmount = tryParseAmount(typedValue, inputCurrency ?? undefined)

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  }

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  }

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? i18n._(t`Enter an amount`)
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? i18n._(t`Select a token`)
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? i18n._(t`Enter a recipient`)
  } else {
    if (BAD_RECIPIENT_ADDRESSES?.[chainId]?.[formattedTo]) {
      inputError = inputError ?? i18n._(t`Invalid recipient`)
    }
  }

  const trade = useSmartTrade(parsedAmount, outputCurrency ?? undefined, { parts: undefined }, { flags: undefined })

  const allowedSlippage = useSmartSwapSlippageTolerance(trade)
  const feePercent = useSmartSwapFeePercent(trade)

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade?.maximumAmountIn(allowedSlippage, feePercent)]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = i18n._(t`Insufficient ${amountIn.currency.symbol} balance`)
  }

  const swapCalls = useSmartSwapCallArguments(trade, allowedSlippage, feePercent, undefined) //, doArcher)

  const [, setUserETHTip] = useUserArcherETHTip()
  const [userGasEstimate, setUserGasEstimate] = useUserArcherGasEstimate()
  const [userGasPrice] = useUserArcherGasPrice()
  const [userTipManualOverride, setUserTipManualOverride] = useUserArcherTipManualOverride()

  useEffect(() => {
    if (doArcher) {
      setUserTipManualOverride(false)
      setUserETHTip(DEFAULT_ARCHER_ETH_TIP.toString())
      setUserGasEstimate(DEFAULT_ARCHER_GAS_ESTIMATE.toString())
    }
  }, [doArcher, setUserTipManualOverride, setUserETHTip, setUserGasEstimate])

  useEffect(() => {
    if (doArcher && !userTipManualOverride) {
      setUserETHTip(JSBI.multiply(JSBI.BigInt(userGasEstimate), JSBI.BigInt(userGasPrice)).toString())
    }
  }, [doArcher, userGasEstimate, userGasPrice, userTipManualOverride, setUserETHTip])

  useEffect(() => {
    async function estimateGas() {
      const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
        swapCalls.map((call) => {
          const { address, calldata, value } = call

          const tx =
            !value || isZero(value)
              ? { from: account, to: address, data: calldata }
              : {
                  from: account,
                  to: address,
                  data: calldata,
                  value,
                }

          return library
            .estimateGas(tx)
            .then((gasEstimate) => {
              return {
                call,
                gasEstimate,
              }
            })
            .catch((gasError) => {
              console.debug('Gas estimate failed, trying eth_call to extract error', call)

              return library
                .call(tx)
                .then((result) => {
                  console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                  return {
                    call,
                    error: new Error('Unexpected issue with estimating the gas. Please try again.'),
                  }
                })
                .catch((callError) => {
                  console.debug('Call threw error', call, callError)
                  return {
                    call,
                    error: new Error(swapErrorToUserReadableMessage(callError)),
                  }
                })
            })
        })
      )

      // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
      const successfulEstimation = estimatedCalls.find(
        (el, ix, list): el is SuccessfulCall =>
          'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
      )

      if (successfulEstimation) {
        setUserGasEstimate(successfulEstimation.gasEstimate.toString())
      }
    }
    if (doArcher && trade && swapCalls && !userTipManualOverride) {
      estimateGas()
    }
  }, [doArcher, trade, swapCalls, userTipManualOverride, library, setUserGasEstimate])

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    trade: trade ?? undefined,
    allowedSlippage,
    feePercent,
  }
}

function parseCurrencyFromURLParameter(urlParam: any): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toUpperCase() === 'BCH') return 'BCH'
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function defaultSwapState(): SmartSwapState {
  return queryParametersToSwapState(initialState)
}

export function queryParametersToSwapState(parsedQs: ParsedQs, chainId: ChainId = ChainId.SMARTBCH): SmartSwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency)
  const eth = 'BCH'
  const sushi = TANGO_ADDRESS[chainId]
  if (inputCurrency === '' && outputCurrency === '') {
    inputCurrency = eth
    outputCurrency = sushi
  } else if (inputCurrency === '') {
    inputCurrency = outputCurrency === eth ? sushi : eth
  } else if (outputCurrency === '' || inputCurrency === outputCurrency) {
    outputCurrency = inputCurrency === eth ? sushi : eth
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency,
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    recipient,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch():
  | {
      inputCurrencyId: string | undefined
      outputCurrencyId: string | undefined
    }
  | undefined {
  const { chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()
  const [expertMode] = useExpertModeManager()
  const [result, setResult] = useState<
    | {
        inputCurrencyId: string | undefined
        outputCurrencyId: string | undefined
      }
    | undefined
  >()

  if (!chainId) return
  const defaultState = defaultSwapState()
  const hadQuery = Object.keys(parsedQs).length
  const parsed = queryParametersToSwapState(parsedQs, chainId)

  if (!hadQuery && JSON.stringify(parsed) === JSON.stringify(defaultState)) {
    return {
      inputCurrencyId: defaultState[Field.INPUT].currencyId,
      outputCurrencyId: defaultState[Field.OUTPUT].currencyId,
    }
  }

  useEffect(() => {
    dispatch(
      replaceSwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId: parsed[Field.INPUT].currencyId,
        outputCurrencyId: parsed[Field.OUTPUT].currencyId,
        recipient: expertMode ? parsed.recipient : null,
      })
    )

    setResult({
      inputCurrencyId: parsed[Field.INPUT].currencyId,
      outputCurrencyId: parsed[Field.OUTPUT].currencyId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}
