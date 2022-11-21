import { escapeRegExp } from 'lodash'
import React, { useState } from 'react'

const PanelLimitPrice = ({label, currencyA, currencyB, minPrice, maxPrice}) => {
  const [minPriceValue, setMinPriceValue] = useState('')
  const [maxPriceValue, setMaxPriceValue] = useState('')

  minPrice(minPriceValue)
  maxPrice(maxPriceValue)

  const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
  const defaultClassName = 'w-0 p-0 text-2xl bg-transparent'

  const enforcer = (nextUserInput: string) => { 
    inputRegex.test(escapeRegExp(nextUserInput)) && (label == 'Price to Buy' ? setMinPriceValue(nextUserInput) : setMaxPriceValue(nextUserInput))
  }
  
  return (
    <div className='border border-[#424242] p-2 max-w-[190px] rounded flex flex-col items-center gap-1'>
      <div className="text-xs font-medium text-secondary whitespace-nowrap">
        {label}
      </div>
      <input
        value={label == 'Price to Buy' ? minPriceValue : maxPriceValue}
        onChange={(event) => {
          // replace commas with periods, because uniswap exclusively uses period as the decimal separator
          enforcer(event.target.value.replace(/,/g, '.'))
        }}
        // universal input options
        inputMode="decimal"
        title="Token Amount"
        autoComplete="off"
        autoCorrect="off"
        // text-specific options
        type="text"
        pattern="^[0-9]*[.,]?[0-9]*$"
        placeholder={'0.0'}
        min={0.0}
        minLength={1}
        maxLength={14}
        spellCheck="false"
        className={'relative flex text-center justify-center font-bold outline-none border-none overflow-hidden overflow-ellipsis placeholder-low-emphesis focus:placeholder-primary text-xl bg-transparent'}
        // readOnly={true}
      />
      <div className="text-xs font-medium text-secondary whitespace-nowrap">
        {/* {label} */}
        {currencyA} per {currencyB}
      </div>
    </div>
  )
}

export default PanelLimitPrice