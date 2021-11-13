import React from 'react'
import Image from 'next/image'

const TangoPrice = () => {
  return (
    <div className="tango-price">
      <div className="tango-logo">
        <Image src="/images/logos/tango-filled.png" alt="Tango" layout="fill" />
      </div>
      <div className="price-container">$0.864</div>
      <style jsx>{`
        .tango-price {
          display: flex;
          align-items: center;
        }
        .tango-logo {
          width: 34px;
          height: 34px;
          position: relative;
        }
        .price-container {
          padding: 6px 10px;
          border: 1px solid #bb5e41;
          border-radius: 13px;
          margin-left: 7px;
          font-size: 16px;
          color: #ffbeaa;
        }
      `}</style>
    </div>
  )
}

export default TangoPrice
