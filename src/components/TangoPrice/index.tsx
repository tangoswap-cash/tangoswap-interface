import { useState, useEffect } from 'react'
import { BCUSDT, FLEXUSD, TANGO } from '../../config/tokens'
import { useV2TradeExactIn as useTradeExactIn } from '../../hooks/useV2Trades'
import { tryParseAmount } from '../../functions/parse'
import { ChainId } from '@tangoswapcash/sdk'
import axios from 'axios'

const TangoPrice = () => {
  const [price, setPrice] = useState(null)
  // const parsedAmount = tryParseAmount('1', TANGO[ChainId.SMARTBCH])
  // const bestTradeExactIn = useTradeExactIn(parsedAmount, BCUSDT)

  axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tangoswap&vs_currencies=usd')
  .then(response => {
    return setPrice(response.data.tangoswap.usd)
  })

  // useEffect(() => {
  //   if (bestTradeExactIn) setPrice(bestTradeExactIn?.executionPrice?.toSignificant(6))
  // }, [bestTradeExactIn])

  return (
    <div className="ml-2 font-bold">
      $<span className={!price && 'opacity-30'}>{price ? price : '0.000000'}</span>
    </div>
  )
}

export default TangoPrice