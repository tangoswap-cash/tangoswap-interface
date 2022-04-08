import { FC } from 'react'
import Modal from '../Modal'
import ModalHeader from '../ModalHeader'
import CurrencyLogo from '../CurrencyLogo'
import RoutingCurrencyBox from '../RoutingCurrencyBox'
import { Currency } from '@tangoswapcash/sdk'
import { groupBy } from 'lodash'
import { PARTS } from '../../hooks/useSmartTrades'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
import Typography from '../Typography/index'
import { PairType } from '../../features/onsen/enum'
import { SwitchVerticalIcon, ChevronDownIcon } from '@heroicons/react/outline'
import { PencilIcon } from '@heroicons/react/solid'
import Button from '../Button'
import { useState } from 'react'
import CurrencyInput from '../../features/exchange-v1/limit-order/CurrencyInput'
import Input from '../../components/Input'
import Checkbox from '../Checkbox'

// const getDistribution = (distribution: string[], parts: number = PARTS) => {
//   const swapOptions = [
//       {exchange: "1BCH", currency: "DIRECT_SWAP"},
//       {exchange: "1BCH", currency: "BCH"},
//       {exchange: "1BCH", currency: "flexUSD"},
//       {exchange: "BenSwap", currency: "DIRECT_SWAP"},
//       {exchange: "BenSwap", currency: "BCH"},
//       {exchange: "BenSwap", currency: "flexUSD"},
//       {exchange: "MistSwap", currency: "DIRECT_SWAP"},
//       {exchange: "MistSwap", currency: "BCH"},
//       {exchange: "MistSwap", currency: "flexUSD"},
//       {exchange: "MuesliSwap", currency: "DIRECT_SWAP"},
//       {exchange: "MuesliSwap", currency: "BCH"},
//       {exchange: "MuesliSwap", currency: "flexUSD"},
//       {exchange: "TangoSwap", currency: "DIRECT_SWAP"},
//       {exchange: "TangoSwap", currency: "BCH"},
//       {exchange: "TangoSwap", currency: "flexUSD"},
//       {exchange: "Tropical", currency: "DIRECT_SWAP"},
//       {exchange: "Tropical", currency: "BCH"},
//       {exchange: "Tropical", currency: "flexUSD"},
//   ];

//   const exchangesDistribution = [];

//   distribution.forEach((value, index) => {
//     if(value !== "0") {
//       exchangesDistribution.push({percentage: parseInt(value) * 100 / parts, ...swapOptions[index] })
//     }
//   })

//   return exchangesDistribution;
// }

interface ROICalculatorProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  currency0: Currency
  currency1: Currency
  farm: any
  //   outputCurrency: Currency;
  //   distribution: string[];
}

const ROICalculatorModal: FC<ROICalculatorProps> = ({ isOpen, setIsOpen, currency0, currency1, farm }) => {
  //const routingDistribution = groupBy(getDistribution(distribution), "currency");
  const { i18n } = useLingui()
  const classNameButton =
    'font-bold border border-none rounded-full text-high-emphesis border-dark-800 hover:from-blue hover:to-pink'
  const [stakeAmount, setStakeAmount] = useState('myBalance')
  const [stakeFor, setStakeFor] = useState('30D')
  const [compundingEvery, setCompoundingEvery] = useState('1D')
  const [inputValue, setInputValue] = useState((0.0).toFixed(2))
  const [outputValue, setOutputValue] = useState((0.0).toFixed(2))
  const [checked, setChecked] = useState(false)

  const onInputValue = (value) => {
    setInputValue(value)
    let calc = value * 2
    setOutputValue(calc)
  }

  const switchValues = (value1, value2) => {
    let valueCopy = value1
    setInputValue(value2)
    setOutputValue(valueCopy)
  }
  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} maxWidth={450}>
      <ModalHeader onClose={() => setIsOpen(false)} title={i18n._(t`ROI Calculator`)} />

      <div className="max-w-full overflow-x-auto">
        <div className="flex flex-col justify-center items-center">
          <div className="input-currency">
            <div>
              <Typography variant="sm" className="select-none">
                <div className="flex flex-row items-center w-full">
                  <p className="font-bold">{currency0.symbol}-</p>
                  <p className={farm?.pair?.type === PairType.KASHI ? 'font-thin' : 'font-bold'}>
                    {currency1.symbol} Staked
                  </p>
                </div>
                <div className="rounded border border-pink px-4 py-3 mb-2 routing-currency-box flex flex-row items-center justify-end">
                  <div>
                    <div className="flex flex-row items-center justify-center">
                      <Input.Numeric
                        className="p-2 pr-4 border-none rounded bg-dark-900 w-14"
                        value={inputValue}
                        type="text"
                        inputMode="decimal"
                        pattern="^[0-9]+[.,]?[0-9]*$"
                        align="right"
                        onUserInput={onInputValue}
                        placeholder="0.00"
                      />
                      <p className="font-bold">{currency0.symbol}</p>
                    </div>
                    <div className="flex flex-row items-center justify-end">
                      <p className="font-bold pr-3">{outputValue}</p>
                      <p className="font-bold">{currency1.symbol}</p>
                    </div>
                  </div>
                  <div className="ml-5 mr-5 cursor-pointer">
                    <SwitchVerticalIcon
                      width={20}
                      height={20}
                      onClick={() => {
                        switchValues(inputValue, outputValue)
                      }}
                    />
                  </div>
                </div>
              </Typography>
            </div>
            <div className="flex flex-row">
              <Button
                variant="outlined"
                color="blue"
                size="xs"
                className={stakeAmount === '100' ? 'border border-pink mr-2' : 'mr-2'}
                onClick={() => {
                  setStakeAmount('100')
                  onInputValue(100)
                }}
              >
                <p>$100</p>
              </Button>
              <Button
                variant="outlined"
                color="blue"
                size="xs"
                className={stakeAmount === '1000' ? 'border border-pink mr-2' : 'mr-2'}
                onClick={() => {
                  setStakeAmount('1000')
                  onInputValue(1000)
                }}
              >
                <p>$1000</p>
              </Button>
              <Button
                variant="outlined"
                color="blue"
                size="xs"
                className={stakeAmount === 'myBalance' ? 'border border-pink mr-2' : 'mr-2'}
                onClick={() => setStakeAmount('myBalance')}
              >
                My Balance
              </Button>
            </div>

            <div className="mt-5">
              <Typography variant="sm" className="select-none">
                <p className="font-bold">Staked for</p>
              </Typography>

              <div className="grid grid-cols-5 inline-grid rounded-full bg-dark-800 bg-red bg-opacity-30 h-[35px]">
                <Button
                  className={stakeFor === '1D' ? classNameButton + ' bg-black' : classNameButton}
                  onClick={() => setStakeFor('1D')}
                  style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis ">
                    1D
                  </a>
                </Button>
                <Button
                  className={stakeFor === '7D' ? classNameButton + ' bg-black' : classNameButton}
                  onClick={() => setStakeFor('7D')}
                  style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis ">
                    7D
                  </a>
                </Button>
                <Button
                  className={stakeFor === '30D' ? classNameButton + ' bg-black' : classNameButton}
                  onClick={() => setStakeFor('30D')}
                  style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis">
                    30D
                  </a>
                </Button>
                <Button
                  className={stakeFor === '1Y' ? classNameButton + ' bg-black' : classNameButton}
                  onClick={() => setStakeFor('1Y')}
                  style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis">
                    1Y
                  </a>
                </Button>
                <Button
                  className={stakeFor === '5Y' ? classNameButton + ' bg-black' : classNameButton}
                  onClick={() => setStakeFor('5Y')}
                  style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis">
                    5Y
                  </a>
                </Button>
              </div>
              <div className="mt-5">
                <Typography variant="sm" className="select-none">
                  <p className="font-bold">Compounding every</p>
                </Typography>
                <Checkbox color={'blue'} checked={checked} disabled={false} set={() => setChecked(!checked)} />
                <div className="grid grid-cols-5 rounded-full bg-dark-800 bg-red bg-opacity-30 h-[35px] mb-4">
                  <Button
                    className={compundingEvery === '1D' ? classNameButton + ' bg-black' : classNameButton}
                    onClick={() => setCompoundingEvery('1D')}
                    style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis ">
                      1D
                    </a>
                  </Button>
                  <Button
                    className={compundingEvery === '7D' ? classNameButton + ' bg-black' : classNameButton}
                    onClick={() => setCompoundingEvery('7D')}
                    style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis ">
                      7D
                    </a>
                  </Button>
                  <Button
                    className={compundingEvery === '14D' ? classNameButton + ' bg-black' : classNameButton}
                    onClick={() => setCompoundingEvery('14D')}
                    style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis">
                      14D
                    </a>
                  </Button>
                  <Button
                    className={compundingEvery === '30D' ? classNameButton + ' bg-black' : classNameButton}
                    onClick={() => setCompoundingEvery('30D')}
                    style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis">
                      30D
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex flex-row items-center justify-center">
                <ChevronDownIcon width={15} height={15} className="m-3" />
              </div>
              <div className="border rounded border-pink mt-5 flex flex-row items-center justify-between bg-gradient-to-r from-opaque-blue to-opaque-pink">
                <div className="m-3">
                  <Typography>ROI at current rates</Typography>
                  <Typography>$0.00</Typography>
                  <Typography>0.00 TANGO (0.00%)</Typography>
                </div>
                <Button>
                  <PencilIcon width={15} height={15} />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Button className="flex flex-row items-center justify-center">
              Details
              <ChevronDownIcon width={15} height={15} className="m-3" />
            </Button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .swap-container::after {
          content: '';
          position: absolute;
          width: 1px;
          background: linear-gradient(180deg, rgba(101, 25, 6, 1) 2%, rgba(187, 94, 65, 1) 100%);
          top: 0;
          bottom: 0;
          right: -110px;
        }
        .swap-container::before {
          content: '';
          position: absolute;
          width: 1px;
          background: linear-gradient(180deg, rgba(187, 94, 65, 1) 2%, rgba(101, 25, 6, 1) 100%);
          top: 0;
          bottom: 0;
          left: -110px;
        }
      `}</style>
    </Modal>
  )
}

export default ROICalculatorModal
