import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Head>
        <title>Catan POC</title>
        <meta name="description" content="Settlers of Catan POC using Next.js and Boardgame.io" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 text-center">
        <h1 className="text-4xl font-bold mb-8">
          Welcome to <span className="text-blue-600">Catan</span> POC
        </h1>
        
        <p className="mb-8 text-xl">
          A standalone implementation of the Settlers of Catan board game.
        </p>

        <Link href="/game">
          <div className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200">
            Start Game
          </div>
        </Link>
      </main>

      <footer className="w-full h-16 border-t border-gray-200 flex items-center justify-center">
        <p>Catan POC - Built with Next.js and Boardgame.io</p>
      </footer>
    </div>
  )
} 