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

const RobotList = ({
  stockAddress,
  moneyAddress,
  robots,
  term,
  inputValue,
  RobotsMap,
  showMaxButton,
  onUserInput,
  onMax,
  currency,
  currencyB,
  selectedCurrencyBBalance,
  selectedCurrencyBalance,
  marketSelector,
  setModalOpen,
  setActionToCall,
  value
}) => {
  const { items, requestSort, sortConfig } = useSortableData(robots)
  const { i18n } = useLingui()
  const [numDisplayed, setNumDisplayed] = useInfiniteScroll(items)
  const sell = marketSelector
  const buy = !marketSelector
  const portfolio = window.location.href.endsWith("?filter=portfolio")

  return items ? (
    <>
      <div className={portfolio ? "grid grid-cols-4 text-base font-bold text-primary space-x-3 sm:space-x-14": "grid grid-cols-3 text-base font-bold text-primary space-x-5 sm:space-x-24 "}>
        <div
          className="flex  items-center col-span-1 px-4 cursor-pointer"
          onClick={() => requestSort('symbol')}
        >
            <div className="flex hover:text-high-emphesis   text-sm sm:text-lg">{i18n._(t`Stock/Money`)}</div>
            {sortConfig &&
              sortConfig.key === 'symbol' &&
              ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
                (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
          </div>
          <div
            className={sell || portfolio ? "flex col-span-1 items-center pl-4 sm:px-3 cursor-pointer text-sm sm:text-lg hover:text-high-emphesis" : "hidden"}
            onClick={() => requestSort('lowPrice')}
          >
            {i18n._(t`Price to Sell`)}
            {sortConfig &&
              sortConfig.key === 'lowPrice' &&
              ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
                (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
          </div>
          <div
            className={buy || portfolio ? "flex items-center col-span-1 pl-4 sm:px-2 cursor-pointer text-sm sm:text-lg hover:text-high-emphesis" : "hidden"}
            onClick={() => requestSort('highPrice')}
          >
            {i18n._(t`Price to Buy`)}
            {sortConfig &&
              sortConfig.key === 'highPrice' &&
              ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
                (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
          </div>
          <div
            className="flex items-center col-span-1 pl-4 sm:px-4 cursor-pointer hover:text-high-emphesis"

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
            <RobotListItems
              stockAddress={stockAddress}
              moneyAddress={moneyAddress}
              key={index}
              robot={robot}
              inputValue={inputValue}
              RobotsMap={RobotsMap}
              showMaxButton={showMaxButton}
              onUserInput={onUserInput}
              onMax={onMax}
              currency={currency}
              currencyB={currencyB}
              selectedCurrencyBBalance={selectedCurrencyBBalance}
              selectedCurrencyBalance={selectedCurrencyBalance}
              marketSelector={marketSelector}
              setModalOpen={setModalOpen}
              setActionToCall={setActionToCall}
              value={value}
            />
          ))}
        </div>
      </InfiniteScroll>
    </>
  ) : (
    <div className="w-full py-6 text-center">{term ? <span>No Results.</span> : <Dots>Loading</Dots>}</div>
  )
}

export default RobotList
