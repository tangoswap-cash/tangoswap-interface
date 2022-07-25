import { ApprovalState, useApproveCallback } from '../../../hooks'
import { BENTOBOX_ADDRESS, ChainId, computeConstantProductPoolAddress, Currency } from '@tangoswapcash/sdk'
import Button, { ButtonProps } from '../../../components/Button'
import { Field, setFromBentoBalance } from '../../../state/limit-order/actions'
import React, { FC, useCallback, useState } from 'react'
import { useAddPopup, useWalletModalToggle } from '../../../state/application/hooks'
import { useDerivedLimitOrderInfo, useLimitOrderState } from '../../../state/limit-order/hooks'
import { ClipboardCopyIcon } from '@heroicons/react/solid'
import useCopyClipboard from '../../../hooks/useCopyClipboard'

// import useLimitOrderApproveCallback, { BentoApprovalState } from '../../../hooks/useLimitOrderApproveCallback'
// import { ApprovalState, useLimitOrderApproveCallback } from '../../../hooks/useLimitOrderApproveCallback'
import { useLimitOrderApproveCallback } from '../../../hooks/useLimitOrderApproveCallback'

import Alert from '../../../components/Alert'
import { AppDispatch } from '../../../state'
import ConfirmLimitOrderModal from './ConfirmLimitOrderModal'
import Dots from '../../../components/Dots'
import { LimitOrder } from '@tangoswapcash/sdk'
import { OrderExpiration } from '../../../state/limit-order/reducer'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import { useDispatch } from 'react-redux'
import useLimitOrders from '../../../hooks/useLimitOrders'
import { useLingui } from '@lingui/react'

import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from "@ethersproject/units";
import { id } from "@ethersproject/hash";
import { hexZeroPad } from "@ethersproject/bytes";

//TODO(fernando)
import {
  AddressMap,
} from '@tangoswapcash/sdk'
import Tooltip, { MouseoverTooltip } from '../../../components/Tooltip'

//TODO(fernando)
const ORDERS_CASH_ADDRESS: AddressMap = {
  [ChainId.SMARTBCH]: '0x5eBE6bFcA42C8440c8DC6C688E449E0B26e8E243',
  [ChainId.SMARTBCH_AMBER]: ''
}

interface LimitOrderButtonProps extends ButtonProps {
  currency: Currency
}

function hexToArr(hexString) {
	return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

function hexStr32(bn) {
	return hexZeroPad(bn.toHexString(), 32);
}

function uint6ToB64 (nUint6) {

  return nUint6 < 26 ?
      nUint6 + 65
    : nUint6 < 52 ?
      nUint6 + 71
    : nUint6 < 62 ?
      nUint6 - 4
    : nUint6 === 62 ?
      45 // "-"
    : nUint6 === 63 ?
      95 // "_"
    :
      65;

}

function base64EncArr (aBytes) {
  var nMod3 = 2, sB64Enc = "";

  for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    //if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
    nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
      nUint24 = 0;
    }
  }
  return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');
}

const LimitOrderButton: FC<LimitOrderButtonProps> = ({ currency, color, ...rest }) => {
  const { i18n } = useLingui()
  const { account, chainId, library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const addPopup = useAddPopup()
  const toggleWalletModal = useWalletModalToggle()

  const [depositPending, setDepositPending] = useState(false)
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false)
  const [takeOrderURL, setTakeOrderURL] = useState<string>(null); 

  const [isCopied, setCopied] = useCopyClipboard()

  const { fromBentoBalance, orderExpiration, recipient } = useLimitOrderState()
  const { parsedAmounts, inputError } = useDerivedLimitOrderInfo()

  // const [approvalState, fallback, permit, onApprove, execute] = useLimitOrderApproveCallback()
  // const [approvalState, approveCallback] = useLimitOrderApproveCallback(trade, allowedSlippage, doArcher)
  const [approvalState, approveCallback] = useLimitOrderApproveCallback(undefined, undefined, undefined)

  const { mutate } = useLimitOrders()

  const [tokenApprovalState, tokenApprove] = useApproveCallback(
    parsedAmounts[Field.INPUT],
    chainId && ORDERS_CASH_ADDRESS[chainId]
  )

  // const showLimitApprove =
  //   (approvalState === BentoApprovalState.NOT_APPROVED || approvalState === BentoApprovalState.PENDING) && !permit

  // console.log("fromBentoBalance:  ", fromBentoBalance)
  // console.log("chainId:           ", chainId)
  // console.log("currency:          ", currency)
  // console.log("currency.isNative: ", currency.isNative)
  // console.log("parsedAmounts:           ", parsedAmounts)
  // console.log("parsedAmounts[Field.INPUT]:           ", parsedAmounts[Field.INPUT])
  // console.log("tokenApprovalState:           ", tokenApprovalState)

  const showTokenApprove =
    // !fromBentoBalance &&
    chainId &&
    currency &&
    !currency.isNative &&
    parsedAmounts[Field.INPUT] &&
    (tokenApprovalState === ApprovalState.NOT_APPROVED || tokenApprovalState === ApprovalState.PENDING)

  // console.log("showTokenApprove: ", showTokenApprove)

  const disabled =
    !!inputError ||
    // approvalState === BentoApprovalState.PENDING ||
    depositPending ||
    tokenApprovalState === ApprovalState.PENDING

  const handler = useCallback(async () => {
    console.log("callback");
    const signer = library.getSigner();
    console.log("signer: ", signer);

    let endTime
    switch (orderExpiration.value) {
      case OrderExpiration.hour:
        endTime = Math.floor(new Date().getTime() / 1000) + 3600
        break
      case OrderExpiration.day:
        endTime = Math.floor(new Date().getTime() / 1000) + 86400
        break
      case OrderExpiration.week:
        endTime = Math.floor(new Date().getTime() / 1000) + 604800
        break

      // 30 days
      case OrderExpiration.never:
        // endTime = Number.MAX_SAFE_INTEGER
        endTime = Math.floor(new Date().getTime() / 1000) + 2592000
    }

    // console.log("endTime:                 ", endTime);
    // console.log("Number.MAX_SAFE_INTEGER: ", Number.MAX_SAFE_INTEGER);

    // const order = new LimitOrder(
    //   account,
    //   parsedAmounts[Field.INPUT].wrapped,
    //   parsedAmounts[Field.OUTPUT].wrapped,
    //   recipient ? recipient : account,
    //   Math.floor(new Date().getTime() / 1000).toString(),
    //   endTime.toString()
    // )

    // console.log("parsedAmounts[Field.INPUT].wrapped:                 ", parsedAmounts[Field.INPUT].wrapped);
    // console.log("parsedAmounts[Field.OUTPUT].wrapped:                ", parsedAmounts[Field.OUTPUT].wrapped);

    console.log("Input:  ", parsedAmounts[Field.INPUT].wrapped.quotient.toString());
    console.log("Input:  ", parsedAmounts[Field.INPUT].wrapped.currency.address);
    console.log("Output: ", parsedAmounts[Field.OUTPUT].wrapped.quotient.toString());
    console.log("Output: ", parsedAmounts[Field.OUTPUT].wrapped.currency.address);

    const twoPow96 = BigNumber.from(2).pow(96);
    // const amtBN = parseUnits(amount.toString(), decimals)
    const amtBN = parseUnits(parsedAmounts[Field.INPUT].wrapped.quotient.toString(), 0)
    let coinsToTakerBN = BigNumber.from(parsedAmounts[Field.INPUT].wrapped.currency.address);
    coinsToTakerBN = coinsToTakerBN.mul(twoPow96).add(amtBN);
    // console.log("amtBN:  ", amtBN);
    // console.log("amtBN:  ", amtBN.toString());
    console.log("coinsToTakerBN:  ", coinsToTakerBN.toHexString());

    const amtBNIn = parseUnits(parsedAmounts[Field.OUTPUT].wrapped.quotient.toString(), 0)
    let coinsToMakerBN = BigNumber.from(parsedAmounts[Field.OUTPUT].wrapped.currency.address);
    coinsToMakerBN = coinsToMakerBN.mul(twoPow96).add(amtBNIn);
    console.log("coinsToMakerBN:  ", coinsToMakerBN.toHexString());

    console.log("endTime:             ", endTime);

    // const expireDate = new Date(document.getElementById("expireDate").value).getTime()
    const expireDate = new Date(endTime).getTime()
    console.log("expireDate:          ", expireDate);

    const expireTimestamp =  Math.floor(expireDate / 1000)
    const expireNanosecondsBN = BigNumber.from(expireTimestamp).mul(1000*1000*1000)
    const expirePicosecondsBN = expireNanosecondsBN.add(Math.floor(Math.random()*1000*1000*1000)).mul(1000)

    console.log("expireTimestamp:     ", expireTimestamp);
    console.log("expireNanosecondsBN: ", expireNanosecondsBN);
    console.log("expirePicosecondsBN: ", expirePicosecondsBN);


    const msg = {
        coinsToMaker: coinsToMakerBN,
        coinsToTaker: coinsToTakerBN,
        dueTime80: expirePicosecondsBN,
    };

    const Domain = {
      name: "exchange dapp",
      version: "v0.1.0",
      chainId: 10000,
      verifyingContract: ORDERS_CASH_ADDRESS[chainId],
      salt: id("Exchange"),
    }

    const Types = {
      Exchange: [
        { name: "coinsToMaker", type: "uint256" },
        { name: "coinsToTaker", type: "uint256" },
        { name: "dueTime80", type: "uint256" },
      ]
    }


    // console.log(`Domain:         ${JSON.stringify(Domain)}`);
    // console.log(`Types:          ${JSON.stringify(Types)}`);
    // console.log(`msg:            ${JSON.stringify(msg)}`);
    // console.log(`coinsToMakerBN: ${hexStr32(coinsToMakerBN)}`);
    // const sig = await signer._signTypedData(Domain, Types, msg);


    try {
      const sig = await signer._signTypedData(Domain, Types, msg);
      console.log(`sig:         ${sig}`);


      // o=ver8,coinsToMaker256,coinsToTaker256,dueTime80,r256,s256,v8
      let order = "00"
      order += hexStr32(coinsToMakerBN).substr(2)
      order += hexStr32(coinsToTakerBN).substr(2)
      order += hexStr32(expirePicosecondsBN).substr(64+2-20)
      order += sig.substr(2)

      console.log(`order:         ${order}`);
      console.log(`order:         ${hexToArr(order)}`);
      console.log(`order:         ${base64EncArr(hexToArr(order))}`);

      const url = "https://orders.cash/take?o="+base64EncArr(hexToArr(order))
      console.log("url: ", url);
      setTakeOrderURL(url); 

      // await order.signOrderWithProvider(chainId, library)
      setOpenConfirmationModal(false)

      // const resp = await order.send()
      // if (resp.success) {
      if (true) {
        addPopup({
          txn: { hash: null, summary: 'Limit order created', success: true },
        })
        await mutate()
      }
    } catch (e) {
      console.log("error: ", e)
      addPopup({
        txn: {
          hash: null,
          summary: `Error: ${e?.response?.data?.data}`,
          success: false,
        },
      })
    }
  }, [account, addPopup, chainId, library, mutate, orderExpiration.value, parsedAmounts, recipient])

    // https://orders.cash/take?o=ADdD7AZzRT5QCTEMcnuk6vezocwEAAAAAA3gtrOnZAAAN0PsBnNFPlAJMQxye6Tq97OhzAQAAAAADeC2s6dkAAAAABcLO5TvAupAfB_5tXs94HqnUExC2Xi6DL2cE4G17nurR2R1zZ-J3Yo080zriab_sxczqbZ__z8C-M64bE8XR2mWEl3ryrU-xRs=
    // http://localhost:3000/exchange/take-order?o=ADdD7AZzRT5QCTEMcnuk6vezocwEAAAAAA3gtrOnZAAAN0PsBnNFPlAJMQxye6Tq97OhzAQAAAAADeC2s6dkAAAAABcLO5TvAupAfB_5tXs94HqnUExC2Xi6DL2cE4G17nurR2R1zZ-J3Yo080zriab_sxczqbZ__z8C-M64bE8XR2mWEl3ryrU-xRs=

  // const deposit = useCallback(async () => {
  //   const tx = await execute(currency)
  //   setDepositPending(true)
  //   await tx.wait()
  //   setDepositPending(false)
  //   dispatch(setFromBentoBalance(true))
  // }, [currency, dispatch, execute])


  // console.log("disabled: ", disabled);

  let button = (
    <>
      <ConfirmLimitOrderModal
        open={openConfirmationModal}
        onConfirm={() => handler()}
        onDismiss={() => setOpenConfirmationModal(false)}
      />
      <Button
        disabled={disabled}
        color={disabled ? 'gray' : 'blue'}
        onClick={() => setOpenConfirmationModal(true)}
        {...rest}
      >
        {i18n._(t`Create Limit Order`)}
      </Button>
    </>
  )

  // if (depositPending)
  //   button = (
  //     <Button disabled={disabled} color={disabled ? 'gray' : color} onClick={deposit} {...rest}>
  //       <Dots>{i18n._(t`Depositing ${currency.symbol} into Mirror`)}</Dots>
  //     </Button>
  //   )
  // else
  if (!account)
    button = (
      <Button disabled={disabled} color="pink" onClick={toggleWalletModal} {...rest}>
        {i18n._(t`Connect Wallet`)}
      </Button>
    )
  else if (inputError)
    button = (
      <Button disabled={true} color="gray" {...rest}>
        {inputError}
      </Button>
    )
  else if (showTokenApprove)
    button = (
      <Button disabled={disabled} onClick={tokenApprove} color={disabled ? 'gray' : 'pink'} className="mb-4" {...rest}>
        {tokenApprovalState === ApprovalState.PENDING ? (
          <Dots>{i18n._(t`Approving ${currency.symbol}`)}</Dots>
        ) : (
          i18n._(t`Approve ${currency.symbol}`)
        )}
      </Button>
    )
  // else if (showLimitApprove)
  //   button = (
  //     <Button disabled={disabled} color={disabled ? 'gray' : 'pink'} onClick={onApprove} {...rest}>
  //       {approvalState === BentoApprovalState.PENDING ? (
  //         <Dots>{i18n._(t`Approving Limit Order`)}</Dots>
  //       ) : (
  //         i18n._(t`Approve Limit Order`)
  //       )}
  //     </Button>
  //   )
  // else if (
  //   (permit && !fromBentoBalance) ||
  //   (!permit && approvalState === BentoApprovalState.APPROVED && !fromBentoBalance)
  // )
    // button = (
    //   <Button disabled={disabled} color={disabled ? 'gray' : 'blue'} /*onClick={deposit}*/ {...rest}>
    //     {i18n._(t`Deposit ${currency.symbol} into Mirror`)}
    //   </Button>
    // )

  return (
    <div className="flex flex-col flex-1">
      {takeOrderURL && (        
        <div data-tooltip-target="tooltip-copy" className="copy-button pl-1 text-sm flex cursor-pointer mb-2 hover:text-high-emphesis focus:text-high-emphesis" onClick={() => setCopied(takeOrderURL)}>
          <p className="text-sm mr-1">{`${takeOrderURL.substring(0,40)}...`}</p>
          <ClipboardCopyIcon width={16} height={16} />
        </div>
      )}
      {/* {fallback && (
        <Alert
          message={i18n._(
            t`Something went wrong during signing of the approval. This is expected for hardware wallets, such as Trezor and Ledger. Click again and the fallback method will be used`
          )}
          className="flex flex-row w-full mb-4"
        />
      )} */}
      {button}
      <style jsx>{`
        .copy-button { 
          width: fit-content; 
          transition: transform .1s; 
        }
        .copy-button:active, .copy-button:focus { 
          transform: scale(0.98); 
        }   
      `}</style>
    </div>
  )


  // return (
  //   <div className="flex flex-col flex-1">
  //   </div>
  // )
}

export default LimitOrderButton
