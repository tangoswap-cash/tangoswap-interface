import React, { useState, useRef } from 'react'
import { classNames, escapeRegExp } from '../../functions'
import Input from '../Input'


const PanelLimitPrice = ({label, currencyA, currencyB, caca}) => {
  const [value, setValue] = useState('')

  caca(value)
  
  const handleValue = (e) => {
    setValue(e.target.value)
  }

  const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

  const defaultClassName = 'w-0 p-0 text-2xl bg-transparent'

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      setValue(nextUserInput)
    }
  }

  return (
    <div className='border border-[#424242] p-2 max-w-[190px] rounded flex flex-col items-center gap-1'>
      <div className="text-xs font-medium text-secondary whitespace-nowrap">
        {label}
      </div>
      <input
        value={value}
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