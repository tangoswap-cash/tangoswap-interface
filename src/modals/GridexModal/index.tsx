import { FC } from "react";
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'

interface GridexModal {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const GridexInfo: FC<GridexModal> = ({ isOpen, setIsOpen }) => {
  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} maxWidth={550}>
      <ModalHeader onClose={() => setIsOpen(false)} title="Concentrated Market Making" />
      <div>
          <p><i>Tango CMM</i> (Concentrated Market Making), an alternative to UniswapV3. The market-making effect which can be achieved by UniswapV3, can also be approached by Tango CMM and merge the liquidity into SmartSwap.fi The general idea of Tango CMM is to use many small Bancor pools and let each pool take charge of a small price range. If the pools are dense enough, we can approximate any curve. Each small pool has its own fungible liquidity token, implemented in ERC1155. This is different from the NFT scheme used by UniswapV3. Fungible tokens are more flexible. For example, some rewards can be distributed to a small pool’s liquid providers as long as UniswapV2’s price falls into its price range.</p>
      </div>
    </Modal>
  )
}

export default GridexInfo
