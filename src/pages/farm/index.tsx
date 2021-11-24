import { Chef, PairType } from '../../features/onsen/enum'
import { useActiveWeb3React, useFuse } from '../../hooks'
import {
  useAverageBlockTime,
  useEthPrice,
  useFarmPairAddresses,
  useFarms,
  useMasterChefV1SushiPerBlock,
  useMasterChefV1TotalAllocPoint,
  useSushiPairs,
  useSushiPrice,
} from '../../services/graph'

import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, WNATIVE, Token, WBCH, MASTERCHEF_ADDRESS } from '@tangoswapcash/sdk'
import { TANGO, FLEXUSD } from '../../config/tokens'
import Container from '../../components/Container'
import FarmList from '../../features/onsen/FarmList'
import Head from 'next/head'
import Menu from '../../features/onsen/FarmMenu'
import React, { useEffect } from 'react'
import Search from '../../components/Search'
import { classNames } from '../../functions'
import dynamic from 'next/dynamic'
import { getAddress } from '@ethersproject/address'
import useFarmRewards from '../../hooks/useFarmRewards'
import usePool from '../../hooks/usePool'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { usePositions, usePendingSushi } from '../../features/onsen/hooks'
import { useRouter } from 'next/router'
import { updateUserFarmFilter } from '../../state/user/actions'
import { getFarmFilter, useUpdateFarmFilter } from '../../state/user/hooks'

export default function Farm(): JSX.Element {
  const { chainId } = useActiveWeb3React()
  const router = useRouter()

  const type = router.query.filter as string

  const savedFilter = getFarmFilter()

  if (!type && savedFilter) {
    router.push(`/farm?filter=${savedFilter}`)
  }

  const updateFarmFilter = useUpdateFarmFilter()
  updateFarmFilter(type)

  const hardcodedPairs = {
    [ChainId.SMARTBCH]: {
      "0x7963269e8a854D3F9D98a6cDEa81efFb31B4D1f2": {
        farmId: 0,
        allocPoint: 9999999,
        token0: TANGO[ChainId.SMARTBCH],
        token1: new Token(ChainId.SMARTBCH, '0x98Ff640323C059d8C4CB846976973FEEB0E068aA', 18, 'XTANGO', 'TANGObar'),
      },
      "0xf8534BB9603c501Bbe16deF7D08D941F0241855b": {
        farmId: 1,
        allocPoint: 171699999,
        token0: TANGO[ChainId.SMARTBCH],
        token1: FLEXUSD,
      },
      "0x4b773a2ea30C6A77564E4FaE60204e7Bc0a81A90": {
        farmId: 2,
        allocPoint: 509999999,
        token0: TANGO[ChainId.SMARTBCH],
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0xA15F8102AB4723A4D1554363c0c8AFF471F16E21": {
        farmId: 3,
        allocPoint: 250749999,
        token0: FLEXUSD,
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0x1A2bdFF5bA942bF20f0db7218cdE28D19aC8dD20": {
        farmId: 4,
        allocPoint: 14999999,
        token0: new Token(ChainId.SMARTBCH, '0x98Dd7eC28FB43b3C4c770AE532417015fa939Dd3', 18, 'FLEX', 'FLEX Coin'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0x5b860757a77c62Dca833542e8E4650AEE777a08F": {
        farmId: 5,
        allocPoint: 4999999,
        token0: new Token(ChainId.SMARTBCH, '0x5fA664f69c2A4A3ec94FaC3cBf7049BD9CA73129', 18, 'MIST', 'MistToken'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0xd12C1De8740406438eb84Dde44cd0839F48211aa": {
        farmId: 6,
        allocPoint: 4999999,
        token0: new Token(ChainId.SMARTBCH, '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B', 18, 'EBEN', 'Green Ben'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0xa790208A8C49e586a3F2145aD2c9096d6072E1F3": {
        farmId: 7,
        allocPoint: 2499999,
        token0: new Token(ChainId.SMARTBCH, '0xc8E09AEdB3c949a875e1FD571dC4b3E48FB221f0', 18, 'MILK', 'Milk'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0xF463db65674426A58E9C3fE557FaaE338026ef39": {
        farmId: 8,
        allocPoint: 4999999,
        token0: new Token(ChainId.SMARTBCH, '0x675E1d6FcE8C7cC091aED06A68D079489450338a', 18, 'ARG', 'Bitcoin Cash Argentina'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0xCFa5B1C5FaBF867842Ac3C25E729Fc3671d27c50": {
        farmId: 9,
        allocPoint: 4999999,
        token0: new Token(ChainId.SMARTBCH, '0xc70c7718C7f1CCd906534C2c4a76914173EC2c44', 18, 'KTH', 'Knuth'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0xf9185C281fE4C8af452244A65cE7317345352942": {
        farmId: 10,
        allocPoint: 2499999,
        token0: new Token(ChainId.SMARTBCH, '0xe11829a7d5d8806bb36e118461a1012588fafd89', 18, 'SPICE', 'SPICE'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0xBe0e246a87a3e9a2D2Db2efD384E0174F13E62b1": {
        farmId: 11,
        allocPoint: 4999999,
        token0: new Token(ChainId.SMARTBCH, '0x0b00366fBF7037E9d75E4A569ab27dAB84759302', 18, 'LAW', 'LAWTOKEN'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0x1946978E39E6105fEb2107D9c01197a962746bf5": {
        farmId: 12,
        allocPoint: 2499999,
        token0: new Token(ChainId.SMARTBCH, '0xff3ed63bf8bc9303ea0a7e1215ba2f82d569799e', 18, 'ORB', 'ORB'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0x23e1E177aE511342fFc27F59da57685b3a0413bc": {
        farmId: 13,
        allocPoint: 4999999,
        token0: new Token(ChainId.SMARTBCH, '0x265bD28d79400D55a1665707Fa14A72978FA6043', 2, 'CATS', 'CashCats'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0x5340619781a8963377aFD76A6999edB6437e3B72": {
        farmId: 14,
        allocPoint: 2499999,
        token0: new Token(ChainId.SMARTBCH, '0x6732E55Ac3ECa734F54C26Bd8DF4eED52Fb79a6E', 2, 'JOY', 'Joystick.club'),
        token1: WBCH[ChainId.SMARTBCH],
      },
      "0x91dde68D0C08e8620d77B8e7F1836aD4ec3CB33c": {
        farmId: 15,
        allocPoint: 2499999,
        token0: new Token(ChainId.SMARTBCH, '0x7642Df81b5BEAeEb331cc5A104bd13Ba68c34B91', 2, 'CLY', 'Celery'),
        token1: WBCH[ChainId.SMARTBCH],
      },
    },
    [ChainId.SMARTBCH_AMBER]: {
      "0x07DE6fc05597E0E4c92C83637A8a0CA411f3a769": {
        farmId: 0,
        allocPoint: 1000,
        token0: WBCH[ChainId.SMARTBCH_AMBER],
        token1: new Token(ChainId.SMARTBCH_AMBER, '0xC6F80cF669Ab9e4BE07B78032b4821ed5612A9ce', 18, 'sc', 'testcoin2'),
      },
    }
  };

  const kashiPairs = [] // unused
  const swapPairs = []
  const farms = []

  for (const [pairAddress, pair] of Object.entries(hardcodedPairs[chainId])) {
    swapPairs.push({
      id: pairAddress,
      reserveUSD: "100000",
      totalSupply: "1000",
      timestamp: "1599830986",
      token0: {
        id: pair.token0.address,
        name: pair.token0.name,
        symbol: pair.token0.symbol,
      },
      token1: {
        id: pair.token1.address,
        name: pair.token1.name,
        symbol: pair.token1.symbol,
      },
    })

    const f = {
      pair: pairAddress,
      symbol: `${hardcodedPairs[chainId][pairAddress].token0.symbol}-${hardcodedPairs[chainId][pairAddress].token1.symbol}`,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      pool: usePool(pairAddress),
      allocPoint: pair.allocPoint,
      balance: "1000000000000000000",
      chef: 0,
      id: pair.farmId,
      pendingSushi: undefined,
      pending: 0,
      owner: {
        id: MASTERCHEF_ADDRESS[chainId],
        sushiPerBlock: "100000000000000000000",
        totalAllocPoint: "999949984"
      },
      userCount: 1,
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    f.pendingSushi = usePendingSushi(f)
    f.pending = Number.parseFloat(f.pendingSushi?.toFixed())

    farms.push(f);
  }

  // console.log(farms);

  const flexUSDTangoPool = farms[1].pool;
  const bchFlexUSDPool = farms[3].pool;
  let bchPriceUSD = 0;
  let tangoPriceUSD = 0;
  if (bchFlexUSDPool.reserves) {
    bchPriceUSD = Number.parseFloat(bchFlexUSDPool.reserves[1].toFixed()) / Number.parseFloat(bchFlexUSDPool.reserves[0].toFixed());
  }
  if (flexUSDTangoPool.reserves) {
    tangoPriceUSD = 1. / ( Number.parseFloat(flexUSDTangoPool.reserves[0].toFixed()) / Number.parseFloat(flexUSDTangoPool.reserves[1].toFixed()))
  }

  let v2PairsBalances = {};
  let fetchingV2PairBalances = false;

  for (let i=0; i<farms.length; i+=8) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [partial_v2PairsBalances, partial_fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
        MASTERCHEF_ADDRESS[chainId],
        farms.slice(i, Math.min(i+8, farms.length)).map((farm) => new Token(chainId, farm.pair, 18, 'LP', 'LP Token'))
      )

      v2PairsBalances = {
        ...v2PairsBalances,
        ...partial_v2PairsBalances,
      };

      if (partial_fetchingV2PairBalances) {
        fetchingV2PairBalances = true;
      }
  }
  if (! fetchingV2PairBalances) {
    for (let i=0; i<farms.length; ++i) {
      if (v2PairsBalances.hasOwnProperty(farms[i].pair) && farms[i].pool.totalSupply) {
        const totalSupply = Number.parseFloat(farms[i].pool.totalSupply.toFixed());
        const chefBalance = Number.parseFloat(v2PairsBalances[farms[i].pair].toFixed());

        let tvl = 0;
        if (farms[i].pool.token0 === TANGO[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed());
          tvl = reserve / totalSupply * chefBalance * tangoPriceUSD * 2;
        }
        else if (farms[i].pool.token1 === TANGO[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed());
          tvl = reserve / totalSupply * chefBalance * tangoPriceUSD * 2;
        }
        else if (farms[i].pool.token0 === FLEXUSD.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed());
          tvl = reserve / totalSupply * chefBalance * 2;
        }
        else if (farms[i].pool.token1 === FLEXUSD.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed());
          tvl = reserve / totalSupply * chefBalance * 2;
        }
        else if (farms[i].pool.token0 === WBCH[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed());
          tvl = reserve / totalSupply * chefBalance * bchPriceUSD * 2;
        }
        else if (farms[i].pool.token1 === WBCH[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed());
          tvl = reserve / totalSupply * chefBalance * bchPriceUSD * 2;
        }
        farms[i].tvl = tvl;
      } else {
        farms[i].tvl = "0";
      }
    }
  }

  const positions = usePositions(chainId)

  // const averageBlockTime = useAverageBlockTime()
  const averageBlockTime = 6;

  // const masterChefV1TotalAllocPoint = useMasterChefV1TotalAllocPoint()

  const masterChefV1SushiPerBlock = useMasterChefV1SushiPerBlock()

  const blocksPerDay = 86400 / Number(averageBlockTime)

  const map = (pool) => {
    // TODO: Account for fees generated in case of swap pairs, and use standard compounding
    // algorithm with the same intervals acrosss chains to account for consistency.
    // For lending pairs, what should the equivilent for fees generated? Interest gained?
    // How can we include this?

    // TODO: Deal with inconsistencies between properties on subgraph
    pool.owner = pool?.owner || pool?.masterChef
    pool.balance = pool?.balance || pool?.slpBalance

    const swapPair = swapPairs?.find((pair) => pair.id === pool.pair)
    const kashiPair = kashiPairs?.find((pair) => pair.id === pool.pair)

    const type = swapPair ? PairType.SWAP : PairType.KASHI

    const pair = swapPair || kashiPair

    const blocksPerDay = 15684 // calculated empirically

    function getRewards() {
      // TODO: Some subgraphs give sushiPerBlock & sushiPerSecond, and mcv2 gives nothing
      const sushiPerBlock =
        pool?.owner?.sushiPerBlock / 1e18 ||
        (pool?.owner?.sushiPerSecond / 1e18) * averageBlockTime ||
        masterChefV1SushiPerBlock

      const rewardPerBlock = (pool.allocPoint / pool.owner.totalAllocPoint) * sushiPerBlock

      const defaultReward = {
        token: 'TANGO',
        icon: 'https://raw.githubusercontent.com/tangoswap-cash/assets/master/blockchains/smartbch/assets/0x73BE9c8Edf5e951c9a0762EA2b1DE8c8F38B5e91/logo.png',
        rewardPerBlock,
        rewardPerDay: rewardPerBlock * blocksPerDay,
        rewardPrice: +tangoPriceUSD,
      }

      const defaultRewards = [defaultReward]

      return defaultRewards
    }

    const rewards = getRewards()

    const balance = Number(pool.balance / 1e18);

    const roiPerBlock = rewards.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
    }, 0) / pool.tvl

    const roiPerDay = roiPerBlock * blocksPerDay

    const roiPerYear = roiPerDay * 365

    const position = positions.find((position) => position.id === pool.id && position.chef === pool.chef)

    return {
      ...pool,
      ...position,
      pair: {
        ...pair,
        decimals: pair.type === PairType.KASHI ? Number(pair.asset.tokenInfo.decimals) : 18,
        type,
      },
      balance,
      roiPerYear,
      rewards,
    }
  }

  const FILTER = {
    all: (farm) => farm.allocPoint !== '0',
    portfolio: (farm) => farm.pending !== 0,
    past: (farm) => farm.allocPoint === '0',
    sushi: (farm) => farm.pair.type === PairType.SWAP && farm.allocPoint !== '0',
    kashi: (farm) => farm.pair.type === PairType.KASHI && farm.allocPoint !== '0',
    '2x': (farm) => (farm.chef === Chef.MASTERCHEF_V2) && farm.allocPoint !== '0',
  }

  const data = farms
    .filter((farm) => {
      return (
        (swapPairs && swapPairs.find((pair) => pair.id === farm.pair)) ||
        (kashiPairs && kashiPairs.find((pair) => pair.id === farm.pair))
      )
    })
    .map(map)
    .filter((farm) => {
      return type in FILTER ? FILTER[type](farm) : true
    })

  const options = {
    keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol'],
    threshold: 0.4,
  }

  const { result, term, search } = useFuse({
    data,
    options,
  })

  return (
    <Container id="farm-page" className="lg:grid lg:grid-cols-4 h-full py-4 mx-auto md:py-8 lg:py-12 gap-9" maxWidth="7xl">
      <Head>
        <title>Farm | Tango</title>
        <meta key="description" name="description" content="Farm TANGO" />
      </Head>
      <div className={classNames('px-3 md:px-0 lg:block md:col-span-1')} style={{ maxHeight: '40rem' }}>
        <Menu positionsLength={positions.length} />
      </div>
      <div className={classNames('space-y-6 col-span-4 lg:col-span-3')}>
        <Search
          search={search}
          term={term}
          className={classNames('px-3 md:px-0 ')}
          inputProps={{
            className:
              'relative w-full bg-transparent border border-transparent focus:border-gradient-r-blue-pink-dark-900 rounded placeholder-secondary focus:placeholder-primary font-bold text-base px-6 py-3.5',
          }}
        />

        <div className="hidden md:block flex items-center text-lg font-bold text-high-emphesis whitespace-nowrap">
          Farms{' '}
          <div className="w-full h-0 ml-4 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20"></div>
        </div>

        <FarmList farms={result} term={term} />
      </div>
    </Container>
  )
}
