import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'

import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector'
import { InjectedConnector } from '@web3-react/injected-connector'
import { BigNumber } from 'ethers'

const chainIdConfig = 97
const localStorageConnectorKey = 'connector'

const injected = new InjectedConnector({ supportedChainIds: [chainIdConfig] })

const connectorsByName: Record<string, InjectedConnector> = {
  injected: injected,
}

const getErrorMessage = (error: Error) => {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network."
  } else if (error instanceof UserRejectedRequestErrorInjected) {
    return 'Please authorize this website to access your Ethereum account.'
  } else {
    console.error(error)
    return 'An unknown error occurred. Check the console for more details.'
  }
}

const setupNetwork = async () => {
  const provider = window.ethereum
  if (provider && provider.request) {
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${chainIdConfig.toString(16)}`,
            chainName: 'Binance Smart Chain Mainnet',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'bnb',
              decimals: 18,
            },
            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
            blockExplorerUrls: ['https://testnet.bscscan.com/'],
          },
        ],
      })
      return true
    } catch (error) {
      console.error('Failed to setup the network in Metamask:', error)
      return false
    }
  } else {
    console.error("Can't setup the BSC network on metamask because window.ethereum is undefined")
    return false
  }
}

const Dashboard = () => {
  const { connector, active, activate, deactivate, chainId, account, library, error } = useWeb3React()
  const [balance, setBalance] = React.useState('')
  const [activatingConnector, setActivatingConnector] = React.useState<InjectedConnector>()

  useEffect(() => {
    const connectState = window.localStorage.getItem(localStorageConnectorKey)
    if (connectState) {
      const connector = connectorsByName[connectState]
      setActivatingConnector(connector)
      login(connector)
    }
  }, [])

  useEffect(() => {
    if (!!account && !!library) {
      library
        .getBalance(account)
        .then((balance: BigNumber) => {
          setBalance(ethers.utils.formatUnits(balance))
        })
        .catch(() => {
          setBalance('')
        })
    } else {
      setBalance('')
    }
  }, [account, library, chainId])

  const login = (connector: InjectedConnector) => {
    if (connector) {
      window.localStorage.setItem(localStorageConnectorKey, 'injected')
      activate(connector, async (error: Error) => {
        if (error instanceof UnsupportedChainIdError) {
          const hasSetup = await setupNetwork()
          if (hasSetup) {
            activate(connector)
          }
        } else {
          if (error instanceof NoEthereumProviderError) {
            console.error('Provider Error', 'No provider was found')
          } else if (error instanceof UserRejectedRequestErrorInjected) {
            console.error('Authorization Error', 'Please authorize to access your account')
          } else {
            console.error(error.name, error.message)
          }
        }
      })
    } else {
      console.error('Unable to find connector', 'The connector config is wrong')
    }
  }

  const logout = () => {
    window.localStorage.removeItem(localStorageConnectorKey)
    deactivate()
  }

  const onConnectWallet = () => {
    const connector = connectorsByName['injected']
    setActivatingConnector(connector)
    login(connector)
  }

  const isConnect = activatingConnector === connector && active

  return (
    <>
      <div>
        <p>chain id: {chainId}</p>
        <p>account: {account}</p>
        <p>balance: {balance}</p>
      </div>

      <div>
        {!isConnect ? (
          <button onClick={onConnectWallet}>Connect Wallet</button>
        ) : (
          <button onClick={logout}>Deactivate</button>
        )}
      </div>
      <div>{error && getErrorMessage(error)}</div>
    </>
  )
}

export default Dashboard
