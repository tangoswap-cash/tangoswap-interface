import { useState, useEffect } from 'react'
import { FLEXUSD, TANGO } from '../../config/tokens'
import { useV2TradeExactIn as useTradeExactIn } from '../../hooks/useV2Trades'
import { tryParseAmount } from '../../functions/parse'
import { ChainId } from '@tangoswapcash/sdk'

const TangoPrice = () => {
  const [price, setPrice] = useState(null)
  const parsedAmount = tryParseAmount('1', TANGO[ChainId.SMARTBCH])
  const bestTradeExactIn = useTradeExactIn(parsedAmount, FLEXUSD)

  useEffect(() => {
    if (bestTradeExactIn) setPrice(bestTradeExactIn?.executionPrice?.toSignificant(6))
  }, [bestTradeExactIn])

  return (
    <div className="font-bold ml-2">
      $<span className={!price && 'opacity-30'}>{price ? price : '0.000000'}</span>
    </div>
  )
}

export default TangoPrice
