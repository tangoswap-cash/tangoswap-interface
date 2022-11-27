import React from 'react'
import { Switch } from '@headlessui/react'
import { classNames } from '../../functions'

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
}

export default function GridexToggle({ id, isActive, toggle }: ToggleProps) {
  return (
    <Switch
      checked={isActive}
      onChange={toggle}
      className={classNames(
        isActive ? 'bg-blue' : 'bg-[#060]',
        'relative inline-flex flex-shrink-0 sm:h-8 h-6 w-11 sm:w-20 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none'
      )}
    >

      <span
        className={classNames(
          isActive ? 'sm:translate-x-11 translate-x-5' : 'sm:translate-x-1 translate-x-0',
          'pointer-events-none relative inline-block h-5 sm:h-7 w-5 sm:w-7 rounded-full bg-dark-900 shadow transform ring-0 transition ease-in-out duration-200'
        )}
      >
        <span
          className={classNames(
            isActive ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200',
            'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
          )}
          aria-hidden="true"
        >
       
        </span>
        <span
          className={classNames(
            isActive ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100',
            'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
          )}
          aria-hidden="true"
        >
         
        </span>
      </span>
    </Switch>
  )
}
