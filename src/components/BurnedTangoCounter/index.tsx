import { useEffect, useState } from 'react'
import { getBalanceOf } from '../../functions/getBalanceOf'
import { useBlockNumber } from '../../state/application/hooks'
import { useSushiContract } from '../../hooks'
import Image from 'next/image'

const burningAddress = '0x0000000000000000000000626c61636b686f6c65'

const BurnedTangoCounter = () => {
  const blockNumber = useBlockNumber()
  const [burnedQty, setBurnedQty] = useState<number>(null)
  const sushi = useSushiContract()

  useEffect(() => {
    getBalanceOf(sushi, burningAddress).then((balance) => setBurnedQty(balance))
  }, [blockNumber, sushi])

  return (
    <div className="flex items-center justify-center md:flex-col">
      <div className="relative h-40 w-44 md:h-60 md:w-64">
        <Image src="/images/animations/burn.gif" layout="fill" alt="Tango" />
      </div>

      <div className="md:text-center">
        <p className="font-bold text-2xl">{burnedQty && `${burnedQty?.toLocaleString('en-US')} TANGO burned`}</p>
      </div>
    </div>
  )
}

export default BurnedTangoCounter
