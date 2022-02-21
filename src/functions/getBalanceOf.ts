import Web3 from 'Web3';

export async function getBalanceOf(walletAddress: string, tokenAddress: string): Promise<number> {
  const provider = 'https://smartbch.fountainhead.cash/mainnet'
  const web3 = new Web3(new Web3.providers.HttpProvider(provider));

  // The minimum ABI to get ERC20 Token balance
  const minABI = [
      // balanceOf
      {
          "constant":true,
          "inputs":[{"name":"_owner","type":"address"}],
          "name":"balanceOf",
          "outputs":[{"name":"balance","type":"uint256"}],
          "type":"function" as const
      },
      // decimals
      {
          "constant":true,
          "inputs":[],
          "name":"decimals",
          "outputs":[{"name":"","type":"uint8"}],
          "type":"function" as const
      }
  ];

  const contract = new web3.eth.Contract(minABI,tokenAddress);
  const balance = await contract.methods.balanceOf(walletAddress).call();
  const decimals = await contract.methods.decimals().call();

  const total = Math.trunc(balance/(10**decimals))
  
  return total;
}

