import React, { FC, useCallback } from 'react'
import { useBlockNumber } from '../../../state/application/hooks'
import Button from '../../../components/Button'
import { ButtonConfirmed, ButtonError } from '../../../components/Button'
import Alert from '../../../components/Alert'
import { ArrowLeftIcon } from '@heroicons/react/solid'
import { ChainId, Price } from '@tangoswapcash/sdk'
import Container from '../../../components/Container'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import Head from 'next/head'
import NavLink from '../../../components/NavLink'
import NetworkGuard from '../../../guards/Network'
import { t } from '@lingui/macro'
import useLimitOrders from '../../../hooks/useLimitOrders'
import { useLingui } from '@lingui/react'

import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import { useAppDispatch, useAppSelector } from '../../../state/hooks'
import useParsedQueryString from '../../../hooks/useParsedQueryString'
import {
  useExpertModeManager,
} from '../../../state/user/hooks'

import { useEffect, useState } from 'react'

import { BigNumber } from '@ethersproject/bignumber'
import { getAddress } from '@ethersproject/address'
import { parseUnits } from '@ethersproject/units'
import { arrayify, hexlify, splitSignature } from '@ethersproject/bytes'

import { useCurrency } from '../../../hooks/Tokens'
import CurrencyLogo from '../../../components/CurrencyLogo'
import { tryParseAmount } from '../../../functions/parse'
import { CurrencyAmount, JSBI, ORDERS_CASH_ADDRESS, SEP206_ADDRESS } from '@tangoswapcash/sdk'
import { useV2TradeExactIn as useTradeExactIn, useV2TradeExactOut as useTradeExactOut } from '../../../hooks/useV2Trades'
import { Currency } from '@tangoswapcash/sdk'
import { ApprovalState, useApproveCallback } from '../../../hooks'
import Dots from '../../../components/Dots'
import { useWalletModalToggle } from '../../../state/application/hooks'

function b64ToUint6 (nChr) {
  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 45 ?
      62
    : nChr === 95 ?
      63
    :
      0;
}

function base64DecToArr (sBase64, nBlocksSize: number | undefined) {
  var
    sB64Enc = sBase64.replace(/=/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
    taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;

    }
  }

  return taBytes;
}

// updates the swap state to use the defaults for a given network
function useDefaultsFromURLSearch():
  | {
      oParam: string | undefined
    }
  | undefined {

  const { chainId } = useActiveWeb3React()
  const parsedQs = useParsedQueryString()

  if (!chainId) return

  return {
    oParam: parsedQs.o,
  };
}

function formatDateTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString()
}

function timeDiff(dueTime: number, now: number) {
  if (now > dueTime) return "(expired)"

  const diff = dueTime - now;

  let msec = diff;

  const dd = Math.floor(msec / 1000 / 60 / 60 / 24);
  if (dd > 0) return `(in ~${dd} days)`
  msec -= dd * 1000 * 60 * 60 * 24;

  const hh = Math.floor(msec / 1000 / 60 / 60);
  if (hh > 0) return `(in ~${hh} hours)`
  msec -= hh * 1000 * 60 * 60;

  const mm = Math.floor(msec / 1000 / 60);
  if (mm > 0) return `(in ~${mm} minutes)`
  msec -= mm * 1000 * 60;

  const ss = Math.floor(msec / 1000);
  if (dd > 0)
  msec -= ss * 1000;
  return `(in ~${ss} seconds)`
}

function TakeOrderPage() {
  const { oParam } = useDefaultsFromURLSearch();
	const u8arr = base64DecToArr(oParam, undefined);
  const toggleWalletModal = useWalletModalToggle()

  const CoinTypeToMakerStart = 1
  const AmountToMakerStart   = 1+20
  const CoinTypeToTakerStart = 1+20+12
  const AmountToTakerStart   = 1+20+12+20
  const DueTimeStart         = 1+20+12+20+12
  const SigRStart            = 1+20+12+20+12+10
  const SigSStart            = 1+20+12+20+12+10+32
  const SigVStart            = 1+20+12+20+12+10+32+32

	const order = {
    coinTypeToMaker: getAddress(hexlify(u8arr.slice(CoinTypeToMakerStart, AmountToMakerStart))),
    amountToMakerBN: BigNumber.from(hexlify(u8arr.slice(AmountToMakerStart, CoinTypeToTakerStart))),
    coinsToMaker: hexlify(u8arr.slice(CoinTypeToMakerStart, CoinTypeToTakerStart)),

    coinTypeToTaker: getAddress(hexlify(u8arr.slice(CoinTypeToTakerStart, AmountToTakerStart))),
    amountToTakerBN: BigNumber.from(hexlify(u8arr.slice(AmountToTakerStart, DueTimeStart))),
    coinsToTaker: hexlify(u8arr.slice(CoinTypeToTakerStart, DueTimeStart)),

    dueTime: BigNumber.from(hexlify(u8arr.slice(DueTimeStart, SigRStart))),
    r: BigNumber.from(hexlify(u8arr.slice(SigRStart, SigSStart))).toHexString(),
    s: BigNumber.from(hexlify(u8arr.slice(SigSStart, SigVStart))).toHexString(),
    v: BigNumber.from(hexlify(u8arr.slice(SigVStart))),
  };
  // console.log("order: ", order);

	// window.order = order


  const { i18n } = useLingui()

  const handler = useCallback(async () => {
    // console.log("callback");
  }, [])
  // }, [account, addPopup, chainId, library, mutate, orderExpiration.value, parsedAmounts, recipient])

  // const { id } = useParams();


  let coinTypeToMaker = order.coinTypeToMaker
  if (coinTypeToMaker == SEP206_ADDRESS) {
    coinTypeToMaker = "BCH"
  }

  const inputCurrency = useCurrency(coinTypeToMaker)
  const inputAmountTemp = parseUnits(order.amountToMakerBN.toString(), 0)

  let coinTypeToTaker = order.coinTypeToTaker
  if (coinTypeToTaker == SEP206_ADDRESS) {
    coinTypeToTaker = "BCH"
  }
  const outputCurrency = useCurrency(coinTypeToTaker)

  const parsedInputAmount = CurrencyAmount.fromRawAmount(inputCurrency, JSBI.BigInt(inputAmountTemp.toString()))
  const outputAmountTemp = parseUnits(order.amountToTakerBN.toString(), 0)

  console.log("coinTypeToTaker:   ", coinTypeToTaker)
  console.log("outputCurrency:    ", outputCurrency)
  console.log("outputAmountTemp:  ", outputAmountTemp.toString())


  const parsedOutputAmount = CurrencyAmount.fromRawAmount(outputCurrency, JSBI.BigInt(outputAmountTemp.toString()))

  const limitPrice = new Price(
    parsedInputAmount.currency,
    parsedOutputAmount.currency,
    parsedInputAmount.quotient,
    parsedOutputAmount.quotient
  )

  const limitPriceInv = new Price(
    parsedOutputAmount.currency,
    parsedInputAmount.currency,
    parsedOutputAmount.quotient,
    parsedInputAmount.quotient
  )

  // console.log("limitPrice:    ", limitPrice.toSignificant(6))
  // console.log("limitPriceInv: ", limitPriceInv.toSignificant(6))

  // console.log("coinTypeToMaker:   ", coinTypeToMaker)
  // console.log("inputCurrency:     ", inputCurrency)
  // console.log("outputCurrency:    ", outputCurrency)
  // console.log("inputAmountTemp:   ", inputAmountTemp.toString())


  const blockNumber = useBlockNumber()
  const [expiration, setExpiration] = useState<string>(null)
  const [isValid, setIsValid] = useState<boolean>(null)

  const dueTime = Math.floor(Number(order.dueTime.toString()) / 1000000);

  useEffect(() => {
    const now = new Date().getTime()
    setExpiration(timeDiff(dueTime, now))
    setIsValid(now <= dueTime)

  }, [blockNumber])

  const { account, chainId, library } = useActiveWeb3React()

  const [tokenApprovalState, tokenApprove] = useApproveCallback(
    parsedInputAmount,
    chainId && ORDERS_CASH_ADDRESS[chainId]
  )

  const currency = inputCurrency
  const showTokenApprove =
    chainId &&
    currency &&
    !currency.isNative &&
    parsedInputAmount &&
    (tokenApprovalState === ApprovalState.NOT_APPROVED || tokenApprovalState === ApprovalState.PENDING)


  const disabled =
    tokenApprovalState === ApprovalState.PENDING


  let button = (
    <ButtonError
      onClick={handler}
      id="swap-button"
      disabled={!isValid}
      error={!isValid}
    >
      {isValid
        ? i18n._(t`Take Limit Order`)
        : i18n._(t`Order Expired`)
        }
    </ButtonError>
  )

  if (!account)
    button = (
      <Button disabled={disabled} color="pink" onClick={toggleWalletModal} >
        {i18n._(t`Connect Wallet`)}
      </Button>
    )
  else if (showTokenApprove)
    button = (
      <Button disabled={disabled} onClick={tokenApprove} color={disabled ? 'gray' : 'pink'} className="mb-4">
        {tokenApprovalState === ApprovalState.PENDING ? (
          <Dots>{i18n._(t`Approving ${currency.symbol}`)}</Dots>
        ) : (
          i18n._(t`Approve ${currency.symbol}`)
        )}
      </Button>
    )

  return (
     <Container id="take-order-page" className="py-4 md:py-8 lg:py-12" maxWidth='lg'>
      <Head>
        <title>Take Order | Tango</title>
        <meta name="description" content="Take order..." />
      </Head>

      <DoubleGlowShadow>
        <div className="p-4 space-y-4 rounded bg-dark-900 z-1">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="text-xl font-bold text-white">{i18n._(t`You pay:`)}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CurrencyLogo size={40} currency={inputCurrency} />

                  <div className="text-xl font-bold text-white">{parsedInputAmount?.toSignificant(6)}</div>
                  <div className="text-xl text-white">{inputCurrency?.symbol}</div>
                </div>
                {/* <div className="text-sm text-low-emphesis">≈ {inputValueUSDC} USDC</div> */}
              </div>
            </div>
            <div className="flex justify-between px-5 py-3 rounded bg-dark-800">
              <span className="font-bold text-secondary">{i18n._(t`Rate`)}</span>
              <span className="text-primary">
                {limitPrice?.toSignificant(6)} {outputCurrency?.symbol} per {inputCurrency?.symbol} - {limitPriceInv?.toSignificant(6)} {inputCurrency?.symbol} per {outputCurrency?.symbol}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 text-xl font-bold text-white">{i18n._(t`You receive:`)}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* <CurrencyLogo size={40} currency={currencies[Field.OUTPUT]} />
                  <div className="text-xl font-bold text-white">{parsedAmounts[Field.OUTPUT]?.toSignificant(6)}</div>
                  <div className="text-xl text-white">{currencies[Field.OUTPUT]?.symbol}</div> */}
                  <CurrencyLogo size={40} currency={outputCurrency} />
                  <div className="text-xl font-bold text-white">{parsedOutputAmount?.toSignificant(6)}</div>
                  <div className="text-xl text-white">{outputCurrency?.symbol}</div>
                </div>
                {/* <div className="text-sm text-low-emphesis">≈ {outputValueUSDC} USDC</div> */}
              </div>
            </div>
          </div>

          <div className="flex justify-between px-5 py-3 rounded bg-dark-800">
              <span className="font-bold text-secondary">{i18n._(t`Order Expiration`)}</span>
              <span className="text-primary">
                {formatDateTime(dueTime) + " " + expiration}
              </span>
          </div>

          {button}
        </div>
      </DoubleGlowShadow>

     </Container>
   )
}

export default TakeOrderPage
