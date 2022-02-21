import { FC } from "react";
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'

interface SmartSwapInfoProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const SmartSwapInfo: FC<SmartSwapInfoProps> = ({ isOpen, setIsOpen }) => {
  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} maxWidth={550}>
      <ModalHeader onClose={() => setIsOpen(false)} title="Just Swap at the best price" />
      <div>
          <p><i>SmartSwap</i> sources liquidity from all DEXes and is capable of splitting a single trade across multiple DEXes to ensure the best price.</p>
      </div>
    </Modal>
  )
}

export default SmartSwapInfo
