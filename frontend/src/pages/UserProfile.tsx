import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, Calendar, School, Users, Edit, Save, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getProfile, updateProfile, type UserProfile } from '../services/profileService'

import { getAssessment } from '../services/assessmentService'
import { toast } from 'sonner'

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [scores, setScores] = useState<any[]>([])
  const [assessment, setAssessment] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    
    const loadData = async () => {
      setLoading(true)
      try {
       const [profileData, scoresData, assessmentData] = await Promise.all([
  getProfile(userId),
  Promise.resolve([]), // <-- replace getRecentScores with empty array
  getAssessment(userId)
])

        
        setProfile(profileData)
        setScores(scoresData || [])
        setAssessment(assessmentData)
        
        if (profileData) {
          setEditForm({
            full_name: profileData.full_name,
            age: profileData.age,
            grade_level: profileData.grade_level,
            school: profileData.school,
            parent_email: profileData.parent_email,
            teacher_email: profileData.teacher_email
          })
        }
      } catch (error) {
        console.error('Failed to load profile data:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  const handleSave = async () => {
    if (!userId || !profile) return
    
    try {
      const updated = await updateProfile(userId, editForm)
      if (updated) {
        setProfile(updated)
        setEditing(false)
        toast.success('Profile updated successfully')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const canEdit = user?.id === userId || user?.email === 'admin@dyslexia.com'

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="btn btn-ghost mr-4">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <motion.div 
            className="lg:col-span-2 card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              {canEdit && (
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button onClick={handleSave} className="btn btn-primary btn-sm">
                        <Save className="w-4 h-4 mr-1" /> Save
                      </button>
                      <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditing(true)} className="btn btn-outline btn-sm">
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Username</label>
                <p className="text-gray-900 font-medium">{profile.username}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.full_name || ''}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="input mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{profile.full_name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Age</label>
                {editing ? (
                  <input
                    type="number"
                    value={editForm.age || ''}
                    onChange={(e) => setEditForm({...editForm, age: parseInt(e.target.value)})}
                    className="input mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{profile.age || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Grade Level</label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.grade_level || ''}
                    onChange={(e) => setEditForm({...editForm, grade_level: e.target.value})}
                    className="input mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{profile.grade_level || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">School</label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.school || ''}
                    onChange={(e) => setEditForm({...editForm, school: e.target.value})}
                    className="input mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{profile.school || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Parent Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={editForm.parent_email || ''}
                    onChange={(e) => setEditForm({...editForm, parent_email: e.target.value})}
                    className="input mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{profile.parent_email || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Teacher Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={editForm.teacher_email || ''}
                    onChange={(e) => setEditForm({...editForm, teacher_email: e.target.value})}
                    className="input mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{profile.teacher_email || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Account Type</label>
                <p className="text-gray-900">{profile.is_admin ? 'Administrator' : 'Student'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Member Since</label>
                <p className="text-gray-900">{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div 
            className="card p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
            
            <div className="space-y-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{scores.length}</div>
                <div className="text-sm text-gray-600">Games Played</div>
              </div>

              {assessment && (
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {assessment.assessment?.overallRisk?.replace('_risk', '').toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">Risk Level</div>
                </div>
              )}

              {scores.length > 0 && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        {scores.length > 0 && (
          <motion.div 
            className="card p-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">Recent Game Activity</h3>
            <div className="space-y-3">
              {scores.slice(0, 5).map((score, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{score.game}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(score.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{score.score}%</div>
                    <div className="text-sm text-gray-600">{score.risk_level}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default UserProfile