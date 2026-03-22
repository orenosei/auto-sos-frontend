import { Routes, Route } from 'react-router-dom'
import Homepage from './pages/homepage'
import NotFound from './pages/NotFound'


function App() {

  return (
    <main className='flex items-center justify-center min-h-screen'>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  )
}

export default App
