import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginSignup from './pages/LoginSignup'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Landing Page - Public */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />
        } 
      />
      
      {/* Login/Signup - Public */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <LoginSignup />
        } 
      />
      
      {/* Home Page - Protected */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      
      {/* Map Page */}
      <Route
        path="/map"
        element={<MapPage />}
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
