import { FC } from "react";
import CurrencyLogo from "../../components/CurrencyLogo";
import { FLEXUSD, TANGO } from '../../config/tokens'
import { WBCH, ChainId, Currency } from '@tangoswapcash/sdk'

interface RoutingCurrencyBoxProps {
  currencyGroup: [string, {percentage: number, exchange: string, currency: string}[]]
  outputCurrency: Currency;
}

const swapCurrencies = {
  BCH: WBCH[ChainId.SMARTBCH],
  flexUSD: FLEXUSD,
  TANGO: TANGO[ChainId.SMARTBCH],
}

const RoutingCurrencyBox: FC<RoutingCurrencyBoxProps> = ({ currencyGroup, outputCurrency }) => {
  const boxPercentage = currencyGroup[1].reduce((accumulator , item) => accumulator + item.percentage, 0);

  return (
    <div className="rounded border border-pink px-4 py-3 mb-2 routing-currency-box">
      <span className="flex items-center mb-2">
        <CurrencyLogo currency={currencyGroup[0] === "DIRECT_SWAP" ? outputCurrency : swapCurrencies[currencyGroup[0]]} size="24px"/>
        <h3 className="font-bold ml-1">{currencyGroup[0] === "DIRECT_SWAP" ? outputCurrency.name : currencyGroup[0]}</h3>
      </span>
      {currencyGroup[1].map((swap, index) => (
        <div className={`bg-dark-800 rounded-md px-3 mt-2`} key={`${swap}-${index}`}>
          {swap.exchange}: {swap.percentage}%
        </div>
      ))}

      <style jsx>{`
        .routing-currency-box {
          position: relative;
        }
        .routing-currency-box::before {
          content: "${boxPercentage !== 100 ? boxPercentage + "%" : ""} >";
          position: absolute;
          font-size: 18px;
          color: #BFBFBF;
          top: 40%;
          bottom: 0;
          left: -80px;
        }
        .routing-currency-box::after {
          content: ">";
          position: absolute;
          font-size: 18px;
          color: #BFBFBF;
          top: 40%;
          bottom: 0;
          right: -80px;
        }
      `}</style>
    </div>
  )
}

export default RoutingCurrencyBox
