import { Contract } from '@ethersproject/contracts'

export async function getBalanceOf(sushi: Contract, walletAddress: string): Promise<number> {
  const balanceOf = await sushi?.balanceOf(walletAddress)
  const decimals = await sushi?.decimals()
  const total = Math.trunc(balanceOf / 10 ** decimals)
  return total
}