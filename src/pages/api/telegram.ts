// import { withSentry } from '@sentry/nextjs'
import axios from 'axios'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(404)
    return
  }

  // const url = new URL(req.url, `http://${req.getHeaders().host}`)
  const url = new URL(req.url, `https://tangoswap.cash`)
  const orderUrl = url.searchParams.get('url')
  const endTime = url.searchParams.get('endTime')
  const fromToken = url.searchParams.get('fromToken')
  const fromAmount = url.searchParams.get('fromAmount')
  const toToken = url.searchParams.get('toToken')
  const toAmount = url.searchParams.get('toAmount')
  const price = url.searchParams.get('price')
  const priceInvert = url.searchParams.get('priceInvert')

  console.log("orderUrl: ", orderUrl)
  console.log("endTime: ", endTime)
  console.log("fromToken: ", fromToken)
  console.log("fromAmount: ", fromAmount)
  console.log("toToken: ", toToken)
  console.log("toAmount: ", toAmount)
  console.log("price: ", price)
  console.log("priceInvert: ", priceInvert)

  if ( ! orderUrl || ! endTime || ! fromToken || ! fromAmount || ! toToken || ! toAmount || ! price || ! priceInvert) {
    res.status(404)
    return
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_BOT_CHAT_ID
  const message = "" +
    `Maker pays ${fromAmount} ${fromToken}\n` +
    `Taker pays ${toAmount} ${toToken}\n` +
    `Rate: 1 ${fromToken} = ${price} ${toToken}\n` +
    `      1 ${toToken} = ${priceInvert} ${fromToken}\n` +
    `Expires on ${endTime}\n\n` +
    `Take it -> ${orderUrl}`

  await axios.get(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${message}`)

  res.status(200).json({ok: true})
}

// export default withSentry(handler)
export default handler
