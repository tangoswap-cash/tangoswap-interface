import { FC } from "react"; 
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import CurrencyLogo from "../../components/CurrencyLogo";
import RoutingCurrencyBox from "../RoutingCurrencyBox";
import { Currency } from "@tangoswapcash/sdk";
import { groupBy } from "lodash";
import { PARTS } from "../../hooks/useSmartTrades";

const getDistribution = (distribution: string[], parts: number = PARTS) => {
  const swapOptions = [
      {exchange: "1BCHDEX", currency: "DIRECT_SWAP"},
      {exchange: "1BCHDEX", currency: "BCH"},
      {exchange: "1BCHDEX", currency: "FLEXUSD"},
      {exchange: "BenSwap", currency: "DIRECT_SWAP"},
      {exchange: "BenSwap", currency: "BCH"},
      {exchange: "BenSwap", currency: "FLEXUSD"},
      {exchange: "MistSwap", currency: "DIRECT_SWAP"},
      {exchange: "MistSwap", currency: "BCH"},
      {exchange: "MistSwap", currency: "FLEXUSD"},
      {exchange: "MuesliSwap", currency: "DIRECT_SWAP"},
      {exchange: "MuesliSwap", currency: "BCH"},
      {exchange: "MuesliSwap", currency: "FLEXUSD"},
      {exchange: "TangoSwap", currency: "DIRECT_SWAP"},
      {exchange: "TangoSwap", currency: "BCH"},
      {exchange: "TangoSwap", currency: "FLEXUSD"}, 
      {exchange: "Tropical", currency: "DIRECT_SWAP"},
      {exchange: "Tropical", currency: "BCH"},
      {exchange: "Tropical", currency: "FLEXUSD"}, 
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
  distribution: any[]; 
}

const RoutingModal: FC<RoutingModalProps> = ({ isOpen, setIsOpen, inputCurrency, outputCurrency, distribution }) => {
  const parsedDistribution = distribution?.map(item => item?.toString()); 
  const routingDistribution = groupBy(getDistribution(parsedDistribution), "currency");

  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} maxWidth={700}>
      <ModalHeader onClose={() => setIsOpen(false)} title="Routing" />
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
