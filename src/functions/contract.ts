// NOTE: Try not to add anything to thie file, it's almost entirely refactored out.

import { AGGREGATOR_ADDRESS, ChainId, ORDERS_CASH_V1_ADDRESS, ROUTER_ADDRESS } from '@tangoswapcash/sdk'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'

import { AddressZero } from '@ethersproject/constants'
import ArcherSwapRouterABI from '../constants/abis/archer-router.json'
import { Contract } from '@ethersproject/contracts'
import IUniswapV2Router02ABI from '../constants/abis/uniswap-v2-router-02.json'
import IUniswapV2Router02NoETHABI from '../constants/abis/uniswap-v2-router-02-no-eth.json'
import SmartSwapABI from '../constants/abis/smart-swap.json'
import OrdersCashABI from '../constants/abis/limit-order.json'
import { isAddress } from '../functions/validate'

// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

export function getRouterAddress(chainId?: ChainId) {
  if (!chainId) {
    throw Error(`Undefined 'chainId' parameter '${chainId}'.`)
  }
  return ROUTER_ADDRESS[chainId]
}

// account is optional
export function getRouterContract(chainId: number, library: Web3Provider, account?: string): Contract {
  return getContract(getRouterAddress(chainId), IUniswapV2Router02ABI, library, account)
}

export function getArcherRouterContract(chainId: number, library: Web3Provider, account?: string): Contract {
  return getContract('', ArcherSwapRouterABI, library, account)
}

export function getAggregatorAddress(chainId?: ChainId) {
  if (!chainId) {
    throw Error(`Undefined 'chainId' parameter '${chainId}'.`)
  }
  return AGGREGATOR_ADDRESS[chainId]
}

// account is optional
export function getAggregatorContract(chainId: number, library: Web3Provider, account?: string): Contract {
  return getContract(getAggregatorAddress(chainId), SmartSwapABI, library, account)
}

export function getOrdersCashAddress(chainId?: ChainId) {
  if (!chainId) {
    throw Error(`Undefined 'chainId' parameter '${chainId}'.`)
  }
  return ORDERS_CASH_V1_ADDRESS[chainId]
}

// account is optional
export function getOrdersCashContract(chainId: number, library: Web3Provider, account?: string): Contract {
  return getContract(getOrdersCashAddress(chainId), OrdersCashABI, library, account)
}
