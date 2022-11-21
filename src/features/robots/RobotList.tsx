import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/outline'
import InfiniteScroll from 'react-infinite-scroll-component'
import Dots from '../../components/Dots'
import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import useSortableData from '../../hooks/useSortableData'
import { useInfiniteScroll } from '../onsen/hooks'
import RobotListItems from './RobotListItems'
import { isMobile } from 'react-device-detect'

const RobotList = ({ stockAddress, moneyAddress, robots, term, inputValue, RobotsMap }) => {
  const { items, requestSort, sortConfig } = useSortableData(robots)
  const { i18n } = useLingui()
  const [numDisplayed, setNumDisplayed] = useInfiniteScroll(items)

  return items ? (
    <>
      <div className={ "grid grid-cols-4 text-base font-bold text-primary" }>
        <div
          className="flex items-center col-span-1 sm:px-4 cursor-pointer"
          onClick={() => requestSort('symbol')}
        >
          <div className="hover:text-high-emphesis px-2 sm:px-4 text-sm sm:text-lg">{i18n._(t`Stock/Money`)}</div>
          {sortConfig &&
            sortConfig.key === 'symbol' &&
            ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
              (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
        </div>
        <div
          className="flex items-center justify-center pl-4 sm:px-4 cursor-pointer text-sm sm:text-lg hover:text-high-emphesis"
          onClick={() => requestSort('lowPrice')}
        >
          {i18n._(t`Min Price to Buy`)}
          {sortConfig &&
            sortConfig.key === 'lowPrice' &&
            ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
              (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
        </div>
        <div
          className="flex items-center justify-center pl-4 sm:px-4 cursor-pointer text-sm sm:text-lg hover:text-high-emphesis"
          onClick={() => requestSort('highPrice')}
        >
          {i18n._(t`Max Price to Sell`)}
          {sortConfig &&
            sortConfig.key === 'highPrice' &&
            ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
              (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
        </div>
        <div
          className="items-center justify-center pl-4 sm:px-4 cursor-pointer md:flex hover:text-high-emphesis"
          
        >
          {i18n._(t`Balance`)}
        </div>
      </div>
      <InfiniteScroll
        dataLength={numDisplayed}
        next={() => setNumDisplayed(numDisplayed + 5)}
        hasMore={true}
        loader={null}
      >
        <div className="space-y-1">
          {items.slice(0, numDisplayed).map((robot, index) => (
            <RobotListItems stockAddress={stockAddress} moneyAddress={moneyAddress} key={index} robot={robot} inputValue={inputValue} RobotsMap={RobotsMap} />
          ))}
        </div>
      </InfiniteScroll>
    </>
  ) : (
    <div className="w-full py-6 text-center">{term ? <span>No Results.</span> : <Dots>Loading</Dots>}</div>
  )
}

export default RobotList
