import { Chef, PairType } from '../../../features/onsen/enum'
import { PlusIcon } from '@heroicons/react/outline'
import { useActiveWeb3React, useFuse } from '../../../hooks'
import {
  useAverageBlockTime,
  useEthPrice,
  useFarmPairAddresses,
  useFarms,
  useMasterChefV1SushiPerBlock,
  useMasterChefV1TotalAllocPoint,
  useSushiPairs,
  useSushiPrice,
} from '../../../services/graph'

import { BigNumber } from '@ethersproject/bignumber'
import {
  ChainId,
  WNATIVE,
  Token,
  CurrencyAmount,
  JSBI,
  WBCH,
  MASTERCHEF_ADDRESS,
  MASTERCHEF_V2_ADDRESS,
} from '@tangoswapcash/sdk'
import { TANGO, FLEXUSD } from '../../../config/tokens'
import Container from '../../../components/Container'
import FarmList from '../../../features/onsen/FarmList'
import Head from 'next/head'
import Menu from '../../../features/onsen/FarmMenu'
import React, { useEffect } from 'react'
import Search from '../../../components/Search'
import { classNames } from '../../../functions'
import dynamic from 'next/dynamic'
import { getAddress } from '@ethersproject/address'
import useFarmRewards from '../../../hooks/useFarmRewards'
import usePool from '../../../hooks/usePool'
import { useTokenBalancesWithLoadingIndicator } from '../../../state/wallet/hooks'
import { usePositions, usePendingSushi } from '../../../features/onsen/hooks'
import { useRouter } from 'next/router'
import { updateUserFarmFilter } from '../../../state/user/actions'
import { getFarmFilter, useUpdateFarmFilter } from '../../../state/user/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import RobotList from '../../../features/robots/RobotList'
import Button from '../../../components/Button'
import NavLink from '../../../components/NavLink'
import GridexMenu from '../../../features/onsen/GridexMenu'
import { isMobile } from 'react-device-detect'
import { ethers } from 'ethers'
import { parseUnits } from '@ethersproject/units'
import { formatUnits } from '@ethersproject/units'
import { formatCurrencyAmount } from '../../../functions'
import { CCABI } from '../create-gridex'

function getTokensSorted(pool, pair) {
  if (pool.token0 == pair.token0.address && pool.token1 == pair.token1.address) {
    return [pair.token0, pair.token1, pool.reserves[0], pool.reserves[1]]
  }

  if (pool.token0 == pair.token1.address && pool.token1 == pair.token0.address) {
    return [pair.token0, pair.token1, pool.reserves[1], pool.reserves[0]]
  }

  return [undefined, undefined, undefined, undefined]
}

function getTokenPriceInBch(pool, pair, chainId, tangoPriceBCH, bchPriceUSD) {
  let [token0, token1, reserve0, reserve1] = getTokensSorted(pool, pair)

  if (!token0) return 0

  let factor = 0
  let tokenAmount0 = Number.parseFloat(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(reserve0.toString())).toFixed())
  let tokenAmount1 = Number.parseFloat(CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(reserve1.toString())).toFixed())

  if (token0.address === TANGO[chainId].address) {
    factor = tangoPriceBCH
  } else if (token1.address === TANGO[chainId].address) {
    ;[tokenAmount1, tokenAmount0] = [tokenAmount0, tokenAmount1]
    factor = tangoPriceBCH
  } else if (token0.address === FLEXUSD.address) {
    factor = bchPriceUSD
  } else if (token1.address === FLEXUSD.address) {
    ;[tokenAmount1, tokenAmount0] = [tokenAmount0, tokenAmount1]
    factor = bchPriceUSD
  } else if (token0.address === WBCH[chainId].address) {
    factor = 1
  } else if (token1.address === WBCH[chainId].address) {
    ;[tokenAmount1, tokenAmount0] = [tokenAmount0, tokenAmount1]
    factor = 1
  }
  const derivedETH = (tokenAmount0 / tokenAmount1) * factor
  return derivedETH
}

function packPrice(price) {
	var effBits = 1
	while(!price.mask(effBits).eq(price)) {
		effBits += 1
	}
	var twoPow24 = BigNumber.from(2).pow(24)
	if(effBits <= 25) {
		return price
	}
	var shift = effBits-25
	var shiftBN = BigNumber.from(2).pow(shift)
	var low24 = price.div(shiftBN).sub(twoPow24)
	var high8 = BigNumber.from(shift).add(1).mul(twoPow24)
	return high8.add(low24)
}

function unpackPrice(packed) {
	var twoPow24 = BigNumber.from(2).pow(24)
	var low24 = packed.mod(twoPow24)
	var shift = packed.div(twoPow24)
	if(shift.isZero()) {
		return low24
	}
	var shiftBN = BigNumber.from(2).pow(shift.sub(1))
	return low24.add(twoPow24).mul(shiftBN)
}

async function getAllRobots(onlyForAddr) {
	const provider = new ethers.providers.Web3Provider(window.ethereum)
	const marketContract = new ethers.Contract(window.MarketAddress, CCABI, provider)
  let allRobotsArr = await marketContract.getAllRobots()
	// console.log('allRobotsArr:', allRobotsArr);
  let allRobots = []
  let twoPow96 = BigNumber.from(2).pow(96)
  let twoPow32 = BigNumber.from(2).pow(32)
	const RobotsMap = {}
	for(var i=0; i<allRobotsArr.length; i+=2) {
		let fullId = allRobotsArr[i]
		let robot = {
    fullId: fullId.toHexString(), 
    index: i/2,
    shortId: '', 
    ownerAddr: '', 
    lowPrice: null, 
    highPrice: null, 
    moneyAmountBN: '', 
    stockAmountBN: '', 
    moneyAmount: null, 
    stockAmount: null
    }
		robot.shortId = fullId.mod(twoPow96).toNumber()
		robot.ownerAddr = ethers.utils.getAddress(fullId.div(twoPow96).toHexString())
		if(onlyForAddr && onlyForAddr != robot.ownerAddr) {continue}
		let info = allRobotsArr[i+1]
		robot.lowPrice = formatUnits(unpackPrice(info.mod(twoPow32)))
		info = info.div(twoPow32)
		robot.highPrice = formatUnits(unpackPrice(info.mod(twoPow32)))
		info = info.div(twoPow32)
		robot.moneyAmountBN = info.mod(twoPow96)
		robot.stockAmountBN = info.div(twoPow96)
		robot.moneyAmount = formatUnits(robot.stockAmountBN, window.stockDecimals)
		robot.stockAmount = formatUnits(robot.stockAmountBN, window.moneyDecimals)
		allRobots.push(robot)
		RobotsMap[robot.fullId] = robot
	}
	return allRobots
}

async function listMyRobots() {
	const provider = new ethers.providers.Web3Provider(window.ethereum);
	const signer = provider.getSigner();
	const myAddr = await signer.getAddress();
	
	var robots = await getAllRobots(myAddr);
	if(robots.length == 0) {
		document.getElementById("deleteDiv").innerHTML = "<p>You have no robots on duty!</p>"
		return
	}
	var htmlStr = "<p>"
	for(var i=0; i<robots.length; i++) {
		htmlStr += `<b>Robot#${robots[i].shortId+1}</b>&nbsp;`
		htmlStr += `<button onclick="DeleteRobot(${robots[i].index}, '${robots[i].fullId}')">Delete</button>&nbsp;`
		htmlStr += `Stock: ${robots[i].stockAmount}&nbsp;`
		htmlStr += `Money: ${robots[i].moneyAmount}&nbsp;`
		htmlStr += `HighPrice: ${robots[i].highPrice}&nbsp;`
		htmlStr += `LowPrice: ${robots[i].lowPrice}</p>`
	}
	document.getElementById("deleteDiv").innerHTML = htmlStr
}

export default function Gridex(): JSX.Element {
  const { i18n } = useLingui()
  const { chainId } = useActiveWeb3React()
  const router = useRouter()

  const type = router.query.filter as string

  const savedFilter = getFarmFilter()

  const updateFarmFilter = useUpdateFarmFilter()
  updateFarmFilter(type)

  const hardcodedPairs = {
    [ChainId.SMARTBCH]: {
      '0x7963269e8a854D3F9D98a6cDEa81efFb31B4D1f2': {
        farmId: 0,
        allocPoint: 9999999,
        token0: TANGO[ChainId.SMARTBCH],
        token1: new Token(ChainId.SMARTBCH, '0x98Ff640323C059d8C4CB846976973FEEB0E068aA', 18, 'XTANGO', 'TANGObar'),
      },
      '0xf8534BB9603c501Bbe16deF7D08D941F0241855b': {
        farmId: 1,
        allocPoint: 205699999,
        token0: TANGO[ChainId.SMARTBCH],
        token1: FLEXUSD,
      },
      '0x4b773a2ea30C6A77564E4FaE60204e7Bc0a81A90': {
        farmId: 2,
        allocPoint: 509999999,
        token0: TANGO[ChainId.SMARTBCH],
        token1: WBCH[ChainId.SMARTBCH],
      },
      '0xA15F8102AB4723A4D1554363c0c8AFF471F16E21': {
        farmId: 3,
        allocPoint: 170250512,
        token0: FLEXUSD,
        token1: WBCH[ChainId.SMARTBCH],
      },
    },
    [ChainId.SMARTBCH_AMBER]: {
      '0x07DE6fc05597E0E4c92C83637A8a0CA411f3a769': {
        farmId: 0,
        allocPoint: 1000,
        token0: WBCH[ChainId.SMARTBCH_AMBER],
        token1: new Token(ChainId.SMARTBCH_AMBER, '0xC6F80cF669Ab9e4BE07B78032b4821ed5612A9ce', 18, 'sc', 'testcoin2'),
      },
    },
  }

  const hardcodedPairs2x = {
    [ChainId.SMARTBCH]: {
      '0xCFa5B1C5FaBF867842Ac3C25E729Fc3671d27c50': {
        farmId: 0,
        allocPoint: 1249938,
        token0: new Token(ChainId.SMARTBCH, '0xc70c7718C7f1CCd906534C2c4a76914173EC2c44', 18, 'KTH', 'Knuth'),
        token1: WBCH[ChainId.SMARTBCH],
        rewarderId: '0xbA85D6bB454315A0fb65b205Fa48DBAff82A4019',
        rewardToken: new Token(ChainId.SMARTBCH, '0xc70c7718C7f1CCd906534C2c4a76914173EC2c44', 18, 'KTH', 'Knuth'),
        rewardPerSecond: '1000000000000000000',
      },
      '0xF463db65674426A58E9C3fE557FaaE338026ef39': {
        farmId: 1,
        allocPoint: 1249937,
        token0: new Token(
          ChainId.SMARTBCH,
          '0x675E1d6FcE8C7cC091aED06A68D079489450338a',
          18,
          'ARG',
          'Bitcoin Cash Argentina'
        ),
        token1: WBCH[ChainId.SMARTBCH],
        rewarderId: '0x3f28b9BE239038568D67f076a0ff9AEdEa5668d8',
        rewardToken: new Token(
          ChainId.SMARTBCH,
          '0x675E1d6FcE8C7cC091aED06A68D079489450338a',
          18,
          'ARG',
          'Bitcoin Cash Argentina'
        ),
        rewardPerSecond: '2342000000000000000000',
      },
      '0x0152E5F007D85aae58Eb7191Bd484f12F9c13052': {
        farmId: 2,
        allocPoint: 499999,
        token0: new Token(ChainId.SMARTBCH, '0x49F9ECF126B6dDF51C731614755508A4674bA7eD', 18, 'RMZ', 'Xolos'),
        token1: WBCH[ChainId.SMARTBCH],
        rewarderId: '0xefEf4dC16316Ae8c7AF00489b0e5FA52be68D1B6',
        rewardToken: new Token(ChainId.SMARTBCH, '0x49F9ECF126B6dDF51C731614755508A4674bA7eD', 18, 'RMZ', 'Xolos'),
        rewardPerSecond: '58330000000000',
      },
    },
    [ChainId.SMARTBCH_AMBER]: {
      '0xCFa5B1C5FaBF867842Ac3C25E729Fc3671d27c50': {
        farmId: 0,
        allocPoint: 1249937,
        token0: new Token(ChainId.SMARTBCH, '0xc70c7718C7f1CCd906534C2c4a76914173EC2c44', 18, 'KTH', 'Knuth'),
        token1: WBCH[ChainId.SMARTBCH],
        rewarderId: '0xbA85D6bB454315A0fb65b205Fa48DBAff82A4019',
        rewardToken: new Token(ChainId.SMARTBCH, '0xc70c7718C7f1CCd906534C2c4a76914173EC2c44', 18, 'KTH', 'Knuth'),
        rewardPerSecond: '1000000000000000000',
      },
    },
  }
  
  const kashiPairs = [] // unused
  const swapPairs = []
  const farms2 = useFarms()
  let farms = []

  for (const [pairAddress, pair] of Object.entries(hardcodedPairs[chainId])) {
    swapPairs.push({
      id: pairAddress,
      reserveUSD: '100000',
      totalSupply: '1000',
      timestamp: '1599830986',
      token0: {
        id: pair.token0.address,
        name: pair.token0.name,
        symbol: pair.token0.symbol,
        decimals: pair.token0.decimals,
      },
      token1: {
        id: pair.token1.address,
        name: pair.token1.name,
        symbol: pair.token1.symbol,
        decimals: pair.token1.decimals,
      },
    })

    const f = {
      pair: pairAddress,
      symbol: `${hardcodedPairs[chainId][pairAddress].token0.symbol}-${hardcodedPairs[chainId][pairAddress].token1.symbol}`,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      pool: usePool(pairAddress),
      allocPoint: pair.allocPoint,
      balance: '1000000000000000000',
      chef: 0,
      id: pair.farmId,
      pendingSushi: undefined,
      pending: 0,
      owner: {
        id: MASTERCHEF_ADDRESS[chainId],
        sushiPerBlock: '10000000000000000000',
        totalAllocPoint: '999949984',
      },
      userCount: 1,
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    f.pendingSushi = usePendingSushi(f)
    f.pending = Number.parseFloat(f.pendingSushi?.toFixed())

    farms.push(f)
  }

  // console.log(farms);
  const flexUSDTangoPool = farms[1].pool
  const bchFlexUSDPool = farms[3].pool
  const bchTangoPool = farms[2].pool
  let bchPriceUSD = 0
  let tangoPriceUSD = 0
  let tangoPriceBCH = 0
  if (bchFlexUSDPool.reserves) {
    bchPriceUSD =
      Number.parseFloat(bchFlexUSDPool.reserves[1].toFixed()) / Number.parseFloat(bchFlexUSDPool.reserves[0].toFixed())
  }
  if (flexUSDTangoPool.reserves) {
    tangoPriceUSD =
      1 /
      (Number.parseFloat(flexUSDTangoPool.reserves[0].toFixed()) /
        Number.parseFloat(flexUSDTangoPool.reserves[1].toFixed()))
  }
  if (bchTangoPool.reserves) {
    tangoPriceBCH =
      Number.parseFloat(bchTangoPool.reserves[0].toFixed()) / Number.parseFloat(bchTangoPool.reserves[1].toFixed())
  }

  for (const [pairAddress, pair] of Object.entries(hardcodedPairs2x[chainId])) {
    swapPairs.push({
      id: pairAddress,
      reserveUSD: '100000',
      totalSupply: '1000',
      timestamp: '1599830986',
      token0: {
        id: pair.token0.address,
        name: pair.token0.name,
        symbol: pair.token0.symbol,
        decimals: pair.token0.decimals,
      },
      token1: {
        id: pair.token1.address,
        name: pair.token1.name,
        symbol: pair.token1.symbol,
        decimals: pair.token1.decimals,
      },
    })

    const f = {
      pair: pairAddress,
      symbol: `${hardcodedPairs2x[chainId][pairAddress].token0.symbol}-${hardcodedPairs2x[chainId][pairAddress].token1.symbol}`,

      // eslint-disable-next-line react-hooks/rules-of-hooks
      pool: usePool(pairAddress),

      allocPoint: pair.allocPoint,
      balance: '1000000000000000000',
      chef: 1,
      id: pair.farmId,
      pendingSushi: undefined,
      pending: 0,
      owner: {
        id: MASTERCHEF_V2_ADDRESS[chainId],
        sushiPerBlock: '10000000000000000000',
        totalAllocPoint: '999949984', // "999949984"
      },

      rewarder: {
        id: pair.rewarderId,
        rewardToken: pair.rewardToken.address,
        rewardPerSecond: pair.rewardPerSecond,
      },

      rewardToken: {
        ...pair.rewardToken,
        // eslint-disable-next-line react-hooks/rules-of-hooks
        derivedETH: getTokenPriceInBch(usePool(pairAddress), pair, chainId, tangoPriceBCH, bchPriceUSD),
      },
      maxPrice: (100 * Math.random()).toFixed(4),
      minPrice: (10 * Math.random()).toFixed(4),
      userCount: 1,
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    f.pendingSushi = usePendingSushi(f)
    f.pending = f.id % 2 === 0 ? 1 : 0
    farms.push(f)
  }

  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    MASTERCHEF_ADDRESS[chainId],
    farms.map((farm) => new Token(chainId, farm.pair, 18, 'LP', 'LP Token'))
  )

  const [v2PairsBalances2x, fetchingV2PairBalances2x] = useTokenBalancesWithLoadingIndicator(
    MASTERCHEF_V2_ADDRESS[chainId],
    farms.map((farm) => new Token(chainId, farm.pair, 18, 'LP', 'LP Token'))
  )

  if (!fetchingV2PairBalances) {
    for (let i = 0; i < farms.length; ++i) {
      if (v2PairsBalances.hasOwnProperty(farms[i].pair) && farms[i].pool.totalSupply) {
        const totalSupply = Number.parseFloat(farms[i].pool.totalSupply.toFixed())
        let chefBalance = Number.parseFloat(v2PairsBalances[farms[i].pair].toFixed())

        if (v2PairsBalances2x.hasOwnProperty(farms[i].pair)) {
          chefBalance += Number.parseFloat(v2PairsBalances2x[farms[i].pair].toFixed())
        }

        let tvl = 0
        if (farms[i].pool.token0 === TANGO[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * tangoPriceUSD * 2
        } else if (farms[i].pool.token1 === TANGO[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * tangoPriceUSD * 2
        } else if (farms[i].pool.token0 === FLEXUSD.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * 2
        } else if (farms[i].pool.token1 === FLEXUSD.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * 2
        } else if (farms[i].pool.token0 === WBCH[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * bchPriceUSD * 2
        } else if (farms[i].pool.token1 === WBCH[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * bchPriceUSD * 2
        }
        farms[i].tvl = tvl
        farms[i].chefBalance = chefBalance
      } else {
        farms[i].tvl = '0'
        farms[i].chefBalance = 0
      }
    }
  }

  const positions = usePositions(chainId)

  // const averageBlockTime = useAverageBlockTime()
  const averageBlockTime = 6
  const masterChefV1TotalAllocPoint = useMasterChefV1TotalAllocPoint()
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

      let rewards = [defaultReward]

      if (pool.chef === Chef.MASTERCHEF_V2) {
        // override for mcv2...
        pool.owner.totalAllocPoint = masterChefV1TotalAllocPoint

        const icon = `https://raw.githubusercontent.com/tangoswap-cash/assets/master/blockchains/smartbch/assets/${getAddress(
          pool.rewarder.rewardToken
        )}/logo.png`

        const decimals = 10 ** pool.rewardToken.decimals
        // console.log("pool.rewardToken.decimals:      ", pool.rewardToken.decimals);
        // console.log("pool.rewardToken.derivedETH:    ", pool.rewardToken.derivedETH);
        // console.log("pool.rewarder.rewardPerSecond:  ", pool.rewarder.rewardPerSecond);
        // console.log("decimals:      ", decimals);

        if (pool.rewarder.rewardToken !== '0x0000000000000000000000000000000000000000') {
          // console.log("pool.rewarder.rewardPerSecond / decimals:      ", pool.rewarder.rewardPerSecond / decimals);

          const rewardPerBlock = (pool.rewarder.rewardPerSecond / decimals) * averageBlockTime

          // console.log("rewardPerBlock:      ", rewardPerBlock);

          const rewardPerDay = (pool.rewarder.rewardPerSecond / decimals) * averageBlockTime * blocksPerDay
          const rewardPrice = pool.rewardToken.derivedETH * bchPriceUSD

          // console.log("rewardPrice:      ", rewardPrice);

          const reward = {
            token: pool.rewardToken.symbol,
            icon: icon,
            rewardPerBlock,
            rewardPerDay,
            rewardPrice,
          }

          rewards[1] = reward
        }
      }

      return rewards
    }

    const rewards = getRewards()

    const balance = Number(pool.balance / 1e18)

    const roiPerBlock =
      rewards.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
      }, 0) / pool.tvl

    const roiPerDay = roiPerBlock * blocksPerDay
    const roiPerYear = roiPerDay * 365

    // console.log("rewards:      ", rewards);
    // console.log("roiPerBlock:  ", roiPerBlock);
    // console.log("roiPerDay:    ", roiPerDay);
    // console.log("roiPerYear:   ", roiPerYear);

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
    buy: (farm) => farm.allocPoint !== 0, // buscar alguna estadistica que sea unica de los gridex activos y ponerlo aca
    portfolio: (farm) => farm.pending !== 0, // buscar alguna estadistica que sea unica de los gridex propios y ponerlo aca
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

  const basePath = 'gridex/gridex-list'

  const optionsMenu = [
    {
      href: `/${basePath}`,
      label: 'Your Tango CMM',
      exact: true
    },
    {
      divider: true
    },
    {
      href: `/${basePath}/on-Sale`,
      label: 'Tango CMM on Sale'
    },{
      divider: true
    },
    {
      href: `/gridex/buy-gridex`,
      label: 'Buy Tango CMM',
      exact: true
    }
  ]

  return (
    <Container
      id="robots-page"
      className="lg:grid lg:grid-cols-4 h-full py-4 mx-auto md:py-8 lg:py-12 gap-9"
      maxWidth="7xl"
    >
      <Head>
        <title>Tango CMM | Tango</title>
        <meta key="description" name="description" content="Farm TANGO" />
      </Head>
      <div className={classNames('px-3 md:px-0 lg:block md:col-span-1')}>
        <GridexMenu positionsLength={positions.length} options={optionsMenu}/>
      </div>
      <div className={classNames('space-y-6 col-span-4 lg:col-span-3')}>
        {!isMobile ? 
        <div className='flex gap-2'>
          <Search
            search={search}
            placeholder={i18n._(t`Search by name, symbol, address`)}
            term={term}
            className={classNames('mr-4 px-3 self-center sm:px-0 w-9/12')}
            inputProps={{
              className:
                'relative w-full bg-transparent border border-transparent focus:border-gradient-r-blue-pink-dark-900 rounded placeholder-secondary focus:placeholder-primary font-bold text-base px-6 py-3.5',
            }}
          />
          <NavLink href="/gridex/create-gridex">
            <Button
              color='border'
              className='w-[190px] mx-2 text-[#e3e3e3c6] border-gradient-r-blue-pink-dark-900 ring-2 ring-gray-600 hover:text-white hover:ring-white flex items-center gap-2'
            >
              <PlusIcon width={16} height={16}/>
              {i18n._(t`Create Tango CMM`)}
          </Button>
          </NavLink>
        </div>
        :
        <>
         <div className='flex gap-2'>
         <Search
           search={search}
           placeholder={i18n._(t`Search by name, symbol, address`)}
           term={term}
           className={classNames('mr-4 px-3 self-center sm:px-0 ')}
           inputProps={{
             className:
               'relative w-full bg-transparent border border-transparent focus:border-gradient-r-blue-pink-dark-900 rounded placeholder-secondary focus:placeholder-primary font-bold text-base px-6 py-3.5',
           }}
         />
       </div>
           <NavLink href="/gridex/create-gridex">
           <Button
             color='border'
             className='w-[190px] mx-2 text-[#E3E3E3] border-gradient-r-blue-pink-dark-900 ring-2 ring-gray-600 hover:ring-white flex items-center gap-2'
           >
             <PlusIcon width={16} height={16}/>
             {i18n._(t`Create Tango CMM`)}
         </Button>
         </NavLink>
         </>
       }

        <div className="hidden md:block flex items-center text-lg font-bold text-high-emphesis whitespace-nowrap">
          Tango CMM list{' '}
          <div className="w-full h-0 ml-4 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20"></div>
        </div>

         <RobotList robots={result} term={term}/> 
      </div>
    </Container>
  )
}
