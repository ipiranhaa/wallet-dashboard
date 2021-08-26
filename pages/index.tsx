import type { NextPage } from 'next'
import Head from 'next/head'
import { ethers } from 'ethers'
import { Web3ReactProvider } from '@web3-react/core'

import Dashboard from '../src/components/dashboard'

const POLLING_INTERVAL = 12000

const Home: NextPage = () => {
  const getLibrary = (provider: ethers.providers.ExternalProvider): ethers.providers.Web3Provider => {
    const library = new ethers.providers.Web3Provider(provider)
    library.pollingInterval = POLLING_INTERVAL
    return library
  }

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div>
        <Head>
          <title>Wallet Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Dashboard />
      </div>
    </Web3ReactProvider>
  )
}

export default Home
