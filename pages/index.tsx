import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-blue-500">
      <Head>
        <title>Hexigo</title>
        <meta name="description" content="Digital implementation of a hexagonal tile-based strategy game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 text-center bg-white p-8 rounded-lg shadow-lg max-w-lg">
        <h1 className="text-4xl font-bold mb-8">
          Welcome to <span className="text-blue-600">Hexigo</span>
        </h1>
        
        <p className="mb-8 text-xl">
          A digital implementation of a hexagonal tile-based strategy game.
        </p>

        <Link href="/game">
          <div className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200">
            Start Game
          </div>
        </Link>
        
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-brick p-4 rounded-lg text-white">
            <span className="text-2xl">🧱</span>
            <p>Brick</p>
          </div>
          <div className="bg-wood p-4 rounded-lg text-white">
            <span className="text-2xl">🌲</span>
            <p>Wood</p>
          </div>
          <div className="bg-sheep p-4 rounded-lg text-white">
            <span className="text-2xl">🐑</span>
            <p>Sheep</p>
          </div>
          <div className="bg-wheat p-4 rounded-lg text-white">
            <span className="text-2xl">🌾</span>
            <p>Wheat</p>
          </div>
          <div className="bg-ore p-4 rounded-lg text-white">
            <span className="text-2xl">⛏️</span>
            <p>Ore</p>
          </div>
          <div className="bg-desert p-4 rounded-lg text-gray-800">
            <span className="text-2xl">🏜️</span>
            <p>Desert</p>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-white mt-8">
        <p>Hexigo - Built with Next.js and React</p>
      </footer>
    </div>
  )
} 