import React from 'react'

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Brain, 
  BookOpen, 
  Users, 
  Award, 
  ArrowRight,
  CheckCircle,
  Target,
  Zap,
  User,
  Moon,
  Sun
} from 'lucide-react'

import { useTheme } from '../contexts/ThemeContext'

const LandingPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()
  const features = [
    {
      icon: Brain,
      title: 'Adaptive Learning',
      description: 'Games that adjust difficulty based on your progress and provide personalized practice',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: BookOpen,
      title: 'Voice Support',
      description: 'Audio guidance and text-to-speech help with pronunciation and comprehension',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: Users,
      title: 'Progress Tracking',
      description: 'Watch your skills grow with badges, achievements, and encouraging feedback',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Award,
      title: 'Supportive Practice',
      description: 'Hints, visual cues, and patient guidance make learning stress-free and fun',
      color: 'from-orange-500 to-red-600'
    }
  ]

  



  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Dyslyze</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">How It Works</a>
              <div className="flex items-center space-x-2">
                <button onClick={toggleTheme} className="btn btn-ghost text-sm">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <Link to="/auth?admin=true" className="btn btn-ghost text-sm">
                  Admin
                </Link>
                <Link to="/auth?role=teacher" className="btn btn-ghost text-sm">
                  Teacher
                </Link>
                <Link to="/auth?role=parent" className="btn btn-ghost text-sm">
                  Parent
                </Link>
                <Link to="/games" className="btn btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 gradient-bg dark:bg-gray-800 relative overflow-hidden">
        <div className="floating-shapes">
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Build Reading Skills,
              <span className="gradient-text block">Boost Confidence</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Personalized dyslexia learning platform with adaptive games, 
              voice support, and encouraging practice that builds reading confidence.
            </motion.p>
            
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link to="/games" className="btn btn-primary btn-lg group">
                Start Learning Today
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-20 gradient-bg dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Supportive Learning Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform adapts to your learning pace with encouraging games, 
              helpful hints, and voice support to build reading skills confidently.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="card card-hover p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Simple, supportive, and personalized learning experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Start Learning',
                description: 'Choose from 8 adaptive games that match your skill level',
                icon: Target
              },
              {
                step: '02',
                title: 'Practice & Improve',
                description: 'Learn with hints, voice support, and encouraging feedback',
                icon: Zap
              },
              {
                step: '03',
                title: 'Track Progress',
                description: 'Earn badges and see your reading skills grow over time',
                icon: CheckCircle
              }
            ].map((step, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Demo Accounts Section */}
      <section className="py-20 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Try Different User Roles
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience Dyslyze from different perspectives with our demo accounts
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-6 text-center h-full flex flex-col">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Student Account</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">Access learning games and track your progress</p>
              <Link to="/auth" className="btn btn-outline w-full mt-auto">Sign Up as Student</Link>
            </div>
            
            <div className="card p-6 text-center h-full flex flex-col">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Parent Account</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">Monitor your children's learning progress</p>
              <Link to="/auth?role=parent" className="btn btn-outline w-full mt-auto">Sign Up as Parent</Link>
            </div>
            
            <div className="card p-6 text-center h-full flex flex-col">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Teacher Account</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">View all students' progress and analytics</p>
              <Link to="/auth?role=teacher" className="btn btn-outline w-full mt-auto">Sign Up as Teacher</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join learners building reading confidence with our supportive, adaptive platform
          </p>
          <Link to="/games" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
            Start Learning Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-8 h-8 text-primary-400" />
                <span className="text-xl font-bold">Dyslyze</span>
              </div>
              <p className="text-gray-400">
                Building reading confidence through personalized, supportive learning experiences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Dyslyze Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage