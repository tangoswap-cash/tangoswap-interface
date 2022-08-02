import { ApprovalState, useApproveSep206Callback } from '../../../hooks'
import {
  ChainId,
  computeConstantProductPoolAddress,
  Currency,
  ORDERS_CASH_V1_ADDRESS,
  Price,
  SEP206_ADDRESS,
} from '@tangoswapcash/sdk'
import Button, { ButtonProps } from '../../../components/Button'
import { ButtonError } from '../../../components/Button'
import { Field } from '../../../state/limit-order/actions'
import React, { FC, useCallback, useState } from 'react'
import { useAddPopup, useWalletModalToggle } from '../../../state/application/hooks'
import { useDerivedLimitOrderInfo, useLimitOrderState } from '../../../state/limit-order/hooks'
import { ClipboardCopyIcon } from '@heroicons/react/solid'
import useCopyClipboard from '../../../hooks/useCopyClipboard'
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
import { parseUnits } from '@ethersproject/units'
import { id } from '@ethersproject/hash'
import { hexZeroPad } from '@ethersproject/bytes'
import { Chain } from '@ethereumjs/common'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import axios from 'axios'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

interface LimitOrderButtonProps extends ButtonProps {
  currency: Currency
}

function hexToArr(hexString) {
  return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
}

function hexStr32(bn) {
  return hexZeroPad(bn.toHexString(), 32)
}

function uint6ToB64(nUint6) {
  return nUint6 < 26
    ? nUint6 + 65
    : nUint6 < 52
    ? nUint6 + 71
    : nUint6 < 62
    ? nUint6 - 4
    : nUint6 === 62
    ? 45 // "-"
    : nUint6 === 63
    ? 95 // "_"
    : 65
}

function base64EncArr(aBytes) {
  var nMod3 = 2,
    sB64Enc = ''

  for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3
    //if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
    nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24)
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCharCode(
        uint6ToB64((nUint24 >>> 18) & 63),
        uint6ToB64((nUint24 >>> 12) & 63),
        uint6ToB64((nUint24 >>> 6) & 63),
        uint6ToB64(nUint24 & 63)
      )
      nUint24 = 0
    }
  }
  return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==')
}

const LimitOrderButton: FC<LimitOrderButtonProps> = ({ currency, color, ...rest }) => {
  const { i18n } = useLingui()
  const { account, chainId, library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const addPopup = useAddPopup()
  const toggleWalletModal = useWalletModalToggle()

  const [openConfirmationModal, setOpenConfirmationModal] = useState(false)
  const [takeOrderURL, setTakeOrderURL] = useState<string>(null)

  const [isCopied, setCopied] = useCopyClipboard()
  const [clicked, wasClicked] = useState(false)
  const [endTimeState, setEndTimeState] = useState<string>(null)

  const { orderExpiration, recipient } = useLimitOrderState()
  const { parsedAmounts, inputError } = useDerivedLimitOrderInfo()

  const { mutate } = useLimitOrders()

  const [tokenApprovalState, tokenApprove] = useApproveSep206Callback(
    parsedAmounts[Field.INPUT],
    chainId && ORDERS_CASH_V1_ADDRESS[chainId]
  )

  const showTokenApprove =
    chainId &&
    currency &&
    parsedAmounts[Field.INPUT] &&
    (tokenApprovalState === ApprovalState.NOT_APPROVED || tokenApprovalState === ApprovalState.PENDING)

  const disabled = !!inputError || tokenApprovalState === ApprovalState.PENDING

  const handler = useCallback(async () => {
    const signer = library.getSigner()

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
      case OrderExpiration.month:
        endTime = Math.floor(new Date().getTime() / 1000) + 2592000
      // case OrderExpiration.never:
      //   endTime = Number.MAX_SAFE_INTEGER
    }
    setEndTimeState(new Date(endTime * 1000).toUTCString())

    let coinsToTakerAddr
    if (parsedAmounts[Field.INPUT].currency.isNative) {
      coinsToTakerAddr = SEP206_ADDRESS[chainId]
    } else {
      coinsToTakerAddr = parsedAmounts[Field.INPUT].wrapped.currency.address
    }

    const twoPow96 = BigNumber.from(2).pow(96)
    const amtBN = parseUnits(parsedAmounts[Field.INPUT].wrapped.quotient.toString(), 0)
    let coinsToTakerBN = BigNumber.from(coinsToTakerAddr)
    coinsToTakerBN = coinsToTakerBN.mul(twoPow96).add(amtBN)

    let coinsToMakerAddr
    if (parsedAmounts[Field.OUTPUT].currency.isNative) {
      coinsToMakerAddr = SEP206_ADDRESS[chainId]
    } else {
      coinsToMakerAddr = parsedAmounts[Field.OUTPUT].wrapped.currency.address
    }

    const amtBNIn = parseUnits(parsedAmounts[Field.OUTPUT].wrapped.quotient.toString(), 0)
    let coinsToMakerBN = BigNumber.from(coinsToMakerAddr)
    coinsToMakerBN = coinsToMakerBN.mul(twoPow96).add(amtBNIn)

    const expireDate = new Date(endTime).getTime() * 1000
    const expireTimestamp = Math.floor(expireDate / 1000)
    const expireNanosecondsBN = BigNumber.from(expireTimestamp).mul(1000 * 1000 * 1000)
    const expirePicosecondsBN = expireNanosecondsBN.add(Math.floor(Math.random() * 1000 * 1000 * 1000)).mul(1000)

    const msg = {
      coinsToMaker: coinsToMakerBN,
      coinsToTaker: coinsToTakerBN,
      dueTime80: expirePicosecondsBN,
    }

    const Domain = {
      name: 'exchange dapp',
      version: 'v0.1.0',
      chainId: 10000,
      verifyingContract: ORDERS_CASH_V1_ADDRESS[chainId],
      salt: id('Exchange'),
    }

    const Types = {
      Exchange: [
        { name: 'coinsToMaker', type: 'uint256' },
        { name: 'coinsToTaker', type: 'uint256' },
        { name: 'dueTime80', type: 'uint256' },
      ],
    }

    try {
      const sig = await signer._signTypedData(Domain, Types, msg)
      // o=ver8,coinsToMaker256,coinsToTaker256,dueTime80,r256,s256,v8
      const order = '01'
        + hexStr32(coinsToMakerBN).substr(2)
        + hexStr32(coinsToTakerBN).substr(2)
        + hexStr32(expirePicosecondsBN).substr(64 + 2 - 20)
        + sig.substr(2)

      const url = 'https://orders.cash/take?o=' + base64EncArr(hexToArr(order))
      console.log('url: ', url)
      setTakeOrderURL(url)

      setOpenConfirmationModal(false)

      if (true) {
        addPopup({
          txn: { hash: null, summary: 'Limit order created', success: true },
        })
        await mutate()
      }
    } catch (e) {
      console.log('error: ', e)
      addPopup({
        txn: {
          hash: null,
          summary: `Error: ${e?.response?.data?.data}`,
          success: false,
        },
      })
    }
  }, [account, addPopup, chainId, library, mutate, orderExpiration.value, parsedAmounts, recipient])

  let button = (
    <>
      <ConfirmLimitOrderModal
        open={openConfirmationModal}
        onConfirm={() => handler()}
        onDismiss={() => setOpenConfirmationModal(false)}
      />

      <ButtonError
        onClick={() => setOpenConfirmationModal(true)}
        style={{
          width: '100%',
        }}
        id="swap-button"
        disabled={disabled}
        // error={isValid && priceImpactSeverity > 2}
      >
        {i18n._(t`Create Limit Order`)}
      </ButtonError>
    </>
  )

  const telegramMessage = async () => {

    const limitPrice = new Price(
      parsedAmounts[Field.INPUT].currency,
      parsedAmounts[Field.OUTPUT].currency,
      parsedAmounts[Field.INPUT].quotient,
      parsedAmounts[Field.OUTPUT].quotient
    )

    const ret = await axios.post(`https://orders.cash/api/telegram?url=${takeOrderURL}&endTime=${endTimeState}&fromToken=${parsedAmounts[Field.INPUT].currency.symbol}&fromAmount=${parsedAmounts[Field.INPUT].toSignificant(6)}&toToken=${parsedAmounts[Field.OUTPUT].currency.symbol}&toAmount=${parsedAmounts[Field.OUTPUT].toSignificant(6)}&price=${limitPrice.toSignificant(6)}&priceInvert=${limitPrice.invert().toSignificant(6)}`)
    console.log("telegram post result: ", ret);
    wasClicked(true)
  }


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
  else if (takeOrderURL)
    button = (
        <ButtonError
          onClick={() => telegramMessage()}
          style={{
            width: '100%',
          }}
          id="swap-button"
          disabled={clicked === false ? disabled : true}
          // error={isValid && priceImpactSeverity > 2}
        >{clicked === false ? (
          <>
          <FontAwesomeIcon icon={faTelegram} style={{ fontSize: '20px', marginBottom: '-1.5px'}}/> {i18n._(t`Share`)}
          </>
          )
          : (
            <>
          <FontAwesomeIcon icon={faCheck} style={{ fontSize: '20px', marginBottom: '-1.5px'}}/> {i18n._(t`Shared`)}
            </>
          )}
        </ButtonError>
    )


  return (
    <div className="flex flex-col flex-1">
      {takeOrderURL && (
        <div
          data-tooltip-target="tooltip-copy"
          className="flex pl-1 mb-2 text-sm cursor-pointer copy-button hover:text-high-emphesis focus:text-high-emphesis rounded border border-dark-800 hover:border-dark-300"
          onClick={() => setCopied(takeOrderURL)}
        >
          <p className="mr-1 text-sm">{`${takeOrderURL.substring(0, 60)}...`}</p>
          <ClipboardCopyIcon width={16} height={16} />
        </div>
      )}

      {button}

      <style jsx>{`
        .copy-button {
          width: fit-content;
          transition: transform 0.1s;
        }
        .copy-button:active,
        .copy-button:focus {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  )
}

export default LimitOrderButton
