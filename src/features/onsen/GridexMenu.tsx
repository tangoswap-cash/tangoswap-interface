import { ChainId } from '@tangoswapcash/sdk'
import NavLink from '../../components/NavLink'
import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useActiveWeb3React } from '../../hooks'
import { useWalletModalToggle } from '../../state/application/hooks'

const basePath = 'gridex/gridex-list'

const defaultOptions = [
  {
    href: `/${basePath}`,
    label: 'Your Tango CMMs',
    exact: true
  },
  {
    divider: true
  },
  {
    href: `/${basePath}/on-sale`,
    label: 'Tango CMM on Sale'
  },{
    divider: true
  },
  {
    href: `/gridex/buy-gridex`,
    label: 'Buy Tango CMM',
    exact: true
  }]

const GridexMenu = ({ positionsLength, options = defaultOptions}) => {
  const { account, chainId } = useActiveWeb3React()
  const { i18n } = useLingui()
  const toggleWalletModal = useWalletModalToggle()

  return (
    <div className="space-y-4">
      {account ? (
        <NavLink
          exact
          href={`/${basePath}`}
          activeClassName="font-bold bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-blue-pink-dark-900"
        >
          <a className="flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800">
            Your Tango CMMs
          </a>
        </NavLink>
      ) : (
        <a
          className="striped-background text-secondary flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800"
          onClick={toggleWalletModal}
        >
          Your Tango CMMs
        </a>
      )}
      <NavLink
          exact
          href={`/gridex/on-sale`}
          activeClassName="bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-blue-pink-dark-900"
        >
          <a className="flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800">
            Tango CMMs on Sale
          </a>
      </NavLink>

      <div className="hidden md:block w-full h-0 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20" />

      <NavLink
        href="/gridex/buy-gridex"
        activeClassName="font-bold bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-blue-pink-dark-900"
      >
        <a className="flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800">
          {i18n._(t`Buy Tango CMMs`)}
        </a>
      </NavLink>
      {/* <NavLink
        href="/farm?filter=past"
        activeClassName="font-bold bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-blue-pink-dark-900"
      >
        <a className="flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800">
          {i18n._(t`Past Farms`)}
        </a>
      </NavLink> */}


      {/*chainId === ChainId.MAINNET && (
        <>
          <NavLink
            exact
            href={`/farm?filter=kashi`}
            activeClassName="font-bold bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-blue-pink-dark-900"
          >
            <a className="flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800">
              Kashi Farms
            </a>
          </NavLink>
          <NavLink
            exact
            href={`/farm?filter=sushi`}
            activeClassName="font-bold bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-blue-pink-dark-900"
          >
            <a className="flex items-center justify-between px-2 py-3 md:px-4 md:py-6 text-base font-bold border border-transparent rounded cursor-pointer bg-dark-900 hover:bg-dark-800">
              TANGOswap Farms
            </a>
          </NavLink>
        </>
      )*/}

      <div className="md:hidden w-full h-0 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20" />
    </div>
  )
}

export default GridexMenu
