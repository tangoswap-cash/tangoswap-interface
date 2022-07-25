import React, { FC, useCallback } from 'react'
import { useBlockNumber } from '../../../state/application/hooks'

// import { formatNumber, shortenAddress } from '../../../functions'
// import { useActiveWeb3React, useUSDCPrice } from '../../../hooks'
// import { useDerivedLimitOrderInfo, useLimitOrderState } from '../../../state/limit-order/hooks'

import Button from '../../../components/Button'
import { ButtonConfirmed, ButtonError } from '../../../components/Button'
// import { ConfirmationModalContent } from '../../../modals/TransactionConfirmationModal'
// import CurrencyLogo from '../../../components/CurrencyLogo'
// import { Field } from '../../../state/limit-order/actions'
// import Modal from '../../../components/Modal'
// import { Trans } from '@lingui/react'
// import { FLEXUSD } from '@tangoswapcash/sdk'
// import { t } from '@lingui/macro'
// import { useLingui } from '@lingui/react'

// interface TakeLimitOrderModalProps {
//   open: boolean
//   onDismiss: () => void
//   onTake: () => void
// }
// const TakeLimitOrderModal: FC<TakeLimitOrderModalProps> = ({ open, onDismiss, onTake }) => {
//   const topContent = useCallback(() => <TakeLimitOrderTopContent />, [])
//   const bottomContent = useCallback(() => <TakeLimitOrderBottomContent onClick={onTake} />, [onTake])

//   return (
//     <Modal isOpen={open} onDismiss={onDismiss} maxHeight={90}>
//       <ConfirmationModalContent
//         title="Take Limit Order"
//         onDismiss={onDismiss}
//         topContent={topContent}
//         bottomContent={bottomContent}
//       />
//     </Modal>
//   )
// }

// const TakeLimitOrderTopContent = () => {
//   const { i18n } = useLingui()
//   const { limitPrice } = useLimitOrderState()
//   const { currencies, parsedAmounts } = useDerivedLimitOrderInfo()
//   const { chainId } = useActiveWeb3React()

//   const inputUSDC = useUSDCPrice(
//     currencies[Field.INPUT] && chainId in FLEXUSD ? currencies[Field.INPUT] : undefined
//   )?.toFixed(18)
//   const inputValueUSDC = formatNumber(Number(parsedAmounts[Field.INPUT].toSignificant(6)) * Number(inputUSDC))

//   const outputUSDC = useUSDCPrice(
//     currencies[Field.OUTPUT] && chainId in FLEXUSD ? currencies[Field.OUTPUT] : undefined
//   )?.toFixed(18)
//   const outputValueUSDC = formatNumber(Number(parsedAmounts[Field.OUTPUT].toSignificant(6)) * Number(outputUSDC))

//   return (
//     <div className="py-8">
//       <div className="flex flex-col gap-6">
//         <div className="flex flex-col gap-3">
//           <div className="text-xl font-bold text-white">{i18n._(t`You Pay:`)}</div>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <CurrencyLogo size={40} currency={currencies[Field.INPUT]} />
//               <div className="text-xl font-bold text-white">{parsedAmounts[Field.INPUT]?.toSignificant(6)}</div>
//               <div className="text-xl text-white">{currencies[Field.INPUT]?.symbol}</div>
//             </div>
//             {/* <div className="text-sm text-low-emphesis">≈ {inputValueUSDC} USDC</div> */}
//           </div>
//         </div>
//         <div className="flex justify-between px-5 py-3 rounded bg-dark-800">
//           <span className="font-bold text-secondary">{i18n._(t`Rate`)}</span>
//           <span className="text-primary">
//             {limitPrice} {currencies[Field.OUTPUT]?.symbol} per {currencies[Field.INPUT]?.symbol}
//           </span>
//         </div>
//         <div className="flex flex-col gap-3">
//           <div className="flex gap-2 text-xl font-bold text-white">{i18n._(t`You receive:`)}</div>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <CurrencyLogo size={40} currency={currencies[Field.OUTPUT]} />
//               <div className="text-xl font-bold text-white">{parsedAmounts[Field.OUTPUT]?.toSignificant(6)}</div>
//               <div className="text-xl text-white">{currencies[Field.OUTPUT]?.symbol}</div>
//             </div>
//             {/* <div className="text-sm text-low-emphesis">≈ {outputValueUSDC} USDC</div> */}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// interface TakeLimitOrderBottomContentProps {
//   onClick: () => void
// }

// const TakeLimitOrderBottomContent: FC<TakeLimitOrderBottomContentProps> = ({ onClick }) => {
//   const { i18n } = useLingui()
//   const { orderExpiration, recipient } = useLimitOrderState()
//   const { currencies, parsedAmounts } = useDerivedLimitOrderInfo()

//   return (
//     <div className="flex flex-col gap-6 px-6 py-8 -m-6 bg-dark-800">
//       <div className="flex flex-col gap-1">
//         <div className="flex items-center justify-between">
//           <span className="text-secondary">{i18n._(t`Minimum Received`)}</span>
//           <span className="font-bold text-high-emphesis">
//             {parsedAmounts[Field.OUTPUT]?.toSignificant(6)} {currencies[Field.OUTPUT]?.symbol}
//           </span>
//         </div>
//         <div className="flex items-center justify-between">
//           <span className="text-secondary">{i18n._(t`Order Expiration`)}</span>
//           <span className="font-bold text-high-emphesis">{orderExpiration.label}</span>
//         </div>
//         {recipient && (
//           <div className="flex items-center justify-between">
//             <span className="text-secondary">{i18n._(t`Recipient`)}</span>
//             <span className="font-bold text-high-emphesis">{shortenAddress(recipient, 6)}</span>
//           </div>
//         )}
//       </div>
//       <Button color="gradient" onClick={onClick}>
//         {i18n._(t`Take Limit Order`)}
//       </Button>
//     </div>
//   )
// }

// export default TakeLimitOrderModal

// import useLimitOrderApproveCallback, { BentoApprovalState } from '../../../hooks/useLimitOrderApproveCallback'

import Alert from '../../../components/Alert'
import { ArrowLeftIcon } from '@heroicons/react/solid'
import { ChainId } from '@tangoswapcash/sdk'
// import CompletedOrders from '../../../features/exchange-v1/take-order/CompletedOrders'
import Container from '../../../components/Container'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import Head from 'next/head'
import NavLink from '../../../components/NavLink'
import NetworkGuard from '../../../guards/Network'
// import OpenOrders from '../../../features/exchange-v1/take-order/OpenOrders'
// import React from 'react'
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
import { CurrencyAmount, JSBI } from '@tangoswapcash/sdk'

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

  // console.log(hh + ":" + mm + ":" + ss);
  // return dd + " " + hh + ":" + mm + ":" + ss;
}


function TakeOrderPage() {
  /*
  const { i18n } = useLingui()
  const [approvalState] = useLimitOrderApproveCallback()
  const { pending } = useLimitOrders()

  return (
    <Container id="take-order-page" className="py-4 md:py-8 lg:py-12" maxWidth="2xl">
      <Head>
        <title>Open Orders | Tango</title>
        <meta name="description" content="Open orders..." />
      </Head>
      <div className="min-w-0 md:min-w-[672px]">
        <div className="flex items-center justify-start gap-2 py-3">
          <NavLink href="/limit-order">
            <a className="flex gap-2 text-sm text-secondary">
              <ArrowLeftIcon width={20} height={20} className="text-high-emphesis" />
              {i18n._(t`Back to Limit Orders`)}
            </a>
          </NavLink>
        </div>
        {pending.totalOrders > 0 && approvalState === BentoApprovalState.NOT_APPROVED && (
          <div className="flex pb-6">
            <Alert
              type="error"
              title={i18n._(t`Not approved`)}
              message={i18n._(t`It seems like you have some open orders while the limit order master contract is not yet approved. Please make
          sure you have approved the limit order master contract or the order will not execute`)}
              dismissable={false}
            />
          </div>
        )}
        <DoubleGlowShadow>
          <div id="limit-order-page" className="flex flex-col w-full gap-4 p-3 rounded md:p-5 bg-dark-900">
            <OpenOrders />
            <CompletedOrders />
          </div>
        </DoubleGlowShadow>
      </div>
    </Container>
  )
  */

  const { oParam } = useDefaultsFromURLSearch();
  // console.log("oParam: ", oParam);


	const u8arr = base64DecToArr(oParam, undefined);

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
    console.log("callback");
  }, [])
  // }, [account, addPopup, chainId, library, mutate, orderExpiration.value, parsedAmounts, recipient])

  // const { id } = useParams();

  let coinTypeToTaker = order.coinTypeToTaker
  if (coinTypeToTaker == "0x0000000000000000000000000000000000002711") {
    coinTypeToTaker = "BCH"
  }

  const inputCurrency = useCurrency(coinTypeToTaker)
  const outputCurrency = useCurrency(order.coinTypeToMaker)
  let temp = parseUnits(order.amountToTakerBN.toString(), 0).toString()

  console.log("coinTypeToTaker: ", coinTypeToTaker)
  console.log("inputCurrency:   ", inputCurrency)
  console.log("temp:            ", temp)

  const parsedInputAmount = CurrencyAmount.fromRawAmount(inputCurrency, JSBI.BigInt(temp))
  temp = parseUnits(order.amountToMakerBN.toString(), 0).toString()
  const parsedOutputAmount = CurrencyAmount.fromRawAmount(outputCurrency, JSBI.BigInt(temp))


  //TODO(fernando)
  const limitPrice = 1;

  const blockNumber = useBlockNumber()
  // const [expiration, setExpiration] = useState<number>(null)
  const [expiration, setExpiration] = useState<string>(null)
  const [isValid, setIsValid] = useState<boolean>(null)

  const dueTime = Math.floor(Number(order.dueTime.toString()) / 1000000);

  useEffect(() => {
    // getBalanceOf(sushi, burningAddress).then((balance) => setExpiration(balance))
    const now = new Date().getTime()
    // const diff = dueTime - now;
    // console.log("new Date().getTime(): ", new Date().getTime());
    // console.log("order.dueTime:        ", order.dueTime.toString());
    // console.log("dueTime:              ", dueTime);
    // console.log("diff:                 ", diff);

    setExpiration(timeDiff(dueTime, now))
    setIsValid(now <= dueTime)

  }, [blockNumber])

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
                {limitPrice} {inputCurrency?.symbol} per {outputCurrency?.symbol}
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
                {/* {limitPrice} {inputCurrency?.symbol} per {outputCurrency?.symbol} */}
              </span>
          </div>

          {/* <Button color="gradient" onClick={handler}>
            {i18n._(t`Take Limit Order`)}
          </Button> */}

          <ButtonError
                onClick={handler}
                id="swap-button"
                disabled={!isValid}
                error={isValid}
              >
                {isValid
                  ? i18n._(t`Take Limit Order`)
                  : i18n._(t`Order Expired`)
                  }
          </ButtonError>
        </div>
      </DoubleGlowShadow>

     </Container>
   )
}

export default TakeOrderPage
