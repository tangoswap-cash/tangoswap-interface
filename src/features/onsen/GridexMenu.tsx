import { ChainId } from '@tangoswapcash/sdk'
import NavLink from '../../components/NavLink'
import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useActiveWeb3React } from '../../hooks'
import { useWalletModalToggle } from '../../state/application/hooks'
import { classNames } from '../../functions'

const basePath = 'gridex/gridex-list'

const defaultOptions = [
  {
    href: `/${basePath}`,
    label: 'Your Tango CMM',
    exact: true
  },
  {
    divider: true
  },
  {
    href: `/${basePath}/buy-gridex`,
    label: 'Buy Tango CMM',

  }]

const GridexMenu = ({ positionsLength, options = defaultOptions, robots }) => {
  const { account, chainId } = useActiveWeb3React()
  const { i18n } = useLingui()
  const toggleWalletModal = useWalletModalToggle()
  const portfolio = window.location.href.endsWith("?filter=portfolio")

  return (
    <div className="space-y-4">
      {account ? (<>
        <NavLink
          exact
          href={`/${basePath}?filter=portfolio`}
          activeClassName="font-bold bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-blue-pink-dark-900"        >
          <a className="flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800">
            {i18n._(t`Your CMM`)}
          </a>
        </NavLink>
        <div className="hidden md:block w-full h-0 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20" />

        <NavLink
          exact
          href={`/${basePath}/?filter=buy`}
          activeClassName="font-bold bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-blue-pink-dark-900"        >
          <a className={classNames(portfolio ? null: "border-gradient-r-blue-pink-dark-900"  ,"flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer  bg-dark-900 hover:bg-dark-800")}>
            {i18n._(t`CMM Market`)}
          </a>
        </NavLink>
        <div className="md:hidden w-full h-0 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20" />
      </>) : (
        <a
          className="striped-background text-secondary flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800"
          onClick={toggleWalletModal}
        >
          {i18n._(t`Your CMM`)}
        </a>
      )}


    </div>
  )
}

export default GridexMenu
