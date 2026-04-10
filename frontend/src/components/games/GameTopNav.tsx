import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Menu } from 'lucide-react'

const GameTopNav: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
      <div className="card p-2 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline flex items-center gap-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline flex items-center gap-2"
            aria-label="Go to home"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/games')}
            className="btn btn-outline flex items-center gap-2 ml-auto"
            aria-label="Open games menu"
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameTopNav
