import { FC } from "react";
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import CurrencyLogo from "../../components/CurrencyLogo";
import RoutingCurrencyBox from "../../components/RoutingCurrencyBox";
import { Currency } from "@tangoswapcash/sdk";
import { groupBy } from "lodash";
import { PARTS } from "../../hooks/useSmartTrades";
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'

const getDistribution = (distribution: string[], parts: number = PARTS) => {
  const swapOptions = [
      {exchange: "1BCH", currency: "DIRECT_SWAP"},
      {exchange: "1BCH", currency: "BCH"},
      {exchange: "1BCH", currency: "flexUSD"},
      {exchange: "BenSwap", currency: "DIRECT_SWAP"},
      {exchange: "BenSwap", currency: "BCH"},
      {exchange: "BenSwap", currency: "flexUSD"},
      {exchange: "MistSwap", currency: "DIRECT_SWAP"},
      {exchange: "MistSwap", currency: "BCH"},
      {exchange: "MistSwap", currency: "flexUSD"},
      {exchange: "CowSwap", currency: "DIRECT_SWAP"},
      {exchange: "CowSwap", currency: "BCH"},
      {exchange: "CowSwap", currency: "flexUSD"},
      {exchange: "TangoSwap", currency: "DIRECT_SWAP"},
      {exchange: "TangoSwap", currency: "BCH"},
      {exchange: "TangoSwap", currency: "flexUSD"},
      {exchange: "Tropical", currency: "DIRECT_SWAP"},
      {exchange: "Tropical", currency: "BCH"},
      {exchange: "Tropical", currency: "flexUSD"},
      {exchange: "EmberSwap", currency: "DIRECT_SWAP"},
      {exchange: "EmberSwap", currency: "BCH"},
      {exchange: "EmberSwap", currency: "flexUSD"},

      {exchange: "1BCH", currency: "TANGO"},
      {exchange: "BenSwap", currency: "TANGO"},
      {exchange: "MistSwap", currency: "TANGO"},
      {exchange: "CowSwap", currency: "TANGO"},
      {exchange: "TangoSwap", currency: "TANGO"},
      {exchange: "Tropical", currency: "TANGO"},
      {exchange: "EmberSwap", currency: "TANGO"},

      {exchange: "LawSwap", currency: "DIRECT_SWAP"},
      {exchange: "LawSwap", currency: "BCH"},
      {exchange: "LawSwap", currency: "flexUSD"},
      {exchange: "LawSwap", currency: "TANGO"},

      {exchange: "Verse", currency: "DIRECT_SWAP"},
      {exchange: "Verse", currency: "BCH"},
      {exchange: "Verse", currency: "flexUSD"},
      {exchange: "Verse", currency: "TANGO"},
    ];

  const exchangesDistribution = [];

  distribution.forEach((value, index) => {
    if(value !== "0") {
      exchangesDistribution.push({percentage: parseInt(value) * 100 / parts, ...swapOptions[index] })
    }
  })

  return exchangesDistribution;
}

interface RoutingModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  inputCurrency: Currency;
  outputCurrency: Currency;
  distribution: string[];
}

const RoutingModal: FC<RoutingModalProps> = ({ isOpen, setIsOpen, inputCurrency, outputCurrency, distribution }) => {
  const routingDistribution = groupBy(getDistribution(distribution), "currency");
  const { i18n } = useLingui()

  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} maxWidth={700}>
      <ModalHeader onClose={() => setIsOpen(false)} title={i18n._(t`Routing`)} />

      <div className="max-w-full overflow-x-auto">
        <div className="flex justify-between items-center w-[650px] md:w-full">
          <div className="input-currency">
            <CurrencyLogo currency={inputCurrency} size="32px"/>
          </div>
          <div className="swap-container relative w-6/12">
            {Object.entries(routingDistribution).map((currencyGroup, index) => (
              <RoutingCurrencyBox currencyGroup={currencyGroup} outputCurrency={outputCurrency} key={`${index}-${currencyGroup[0]}`} />
            ))}
          </div>
          <div className="output-currency">
            <CurrencyLogo currency={outputCurrency} size="32px"/>
          </div>
        </div>
      </div>

      <style jsx>{`
        .swap-container::after {
          content: "";
          position: absolute;
          width: 1px;
          background: linear-gradient(180deg, rgba(101,25,6,1) 2%, rgba(187,94,65,1) 100%);
          top: 0;
          bottom: 0;
          right: -110px;
        }
        .swap-container::before {
          content: "";
          position: absolute;
          width: 1px;
          background: linear-gradient(180deg, rgba(187,94,65,1) 2%, rgba(101,25,6,1) 100%);
          top: 0;
          bottom: 0;
          left: -110px;
        }
      `}</style>
    </Modal>
  )
}

export default RoutingModal
