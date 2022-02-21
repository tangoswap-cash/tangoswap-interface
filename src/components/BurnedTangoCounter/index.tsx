import { useEffect, useState } from 'react';
import { getBalanceOf } from '../../functions/getBalanceOf';
import { useBlockNumber } from '../../state/application/hooks'
import Image from 'next/image';

const burningAddress = '0x0000000000000000000000626c61636b686f6c65';
const tangoAddress  = '0x73BE9c8Edf5e951c9a0762EA2b1DE8c8F38B5e91';

const BurnedTangoCounter = () => {
  const blockNumber = useBlockNumber()
  const [burnedQty, setBurnedQty] = useState<number>(null)

  useEffect(() => {
    getBalanceOf(burningAddress, tangoAddress).then(balance => setBurnedQty(balance))
  }, [blockNumber])
  
  return (
    <div className='flex items-center justify-center'>
        <Image src="/images/animations/burn.gif" width={130} height={120} alt="Tango" />
        <div className='text-center'>
          <h3 className='font-bold text-2xl'>Burned</h3>
          <p className='font-bold text-2xl'>{ burnedQty && `${burnedQty?.toLocaleString("en-US")} TANGO`}</p>
        </div>
    </div>
  )
}

export default BurnedTangoCounter
