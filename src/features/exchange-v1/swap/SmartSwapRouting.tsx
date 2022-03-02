import React, { useState, FC } from 'react'
import Typography from '../../../components/Typography'
import RoutingModal from '../../../modals/RoutingModal'
import { classNames } from '../../../functions'
import { Currency } from '@tangoswapcash/sdk'

interface SmartSwapRoutingsProps { 
  inputCurrency: Currency; 
  outputCurrency: Currency; 
  distribution: any[]; 
}

const SmartSwapRouting: FC<SmartSwapRoutingsProps> = ({ inputCurrency, outputCurrency, distribution }) => {
  const [routingOpen, setRoutingOpen] = useState(false); 
  const parsedDistribution = distribution?.map(item => item?.toString()); 
  const steps = parsedDistribution.filter(element => element !== "0").length; 

  return (
    <>
      <div
        onClick={() => setRoutingOpen(true)}
        className={classNames(
          'flex justify-between items-center w-full px-5 py-1 cursor-pointer rounded-md text-secondary hover:text-primary mt-1 bg-dark-900',
        )}
      >
        <Typography variant="sm" className="select-none">
          Route
        </Typography>
        <div className="flex items-center text-sm font-medium select-none">
          {`${steps} step${steps > 1 ? 's' : ''}`} 
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 ml-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>
      <RoutingModal isOpen={routingOpen} setIsOpen={setRoutingOpen} inputCurrency={inputCurrency} outputCurrency={outputCurrency} distribution={parsedDistribution} />
    </>
  )
}

export default SmartSwapRouting; 