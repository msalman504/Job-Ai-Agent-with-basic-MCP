import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSubscription } from '../auth/SubscriptionContext';

interface CandidateProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  resume: string;
  skills: string[];
  experience: string;
  education: string;
  preferences: {
    jobTypes: string[];
    locations: string[];
    salaryRange: string;
    remoteWork: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export const UserProfile: React.FC = () => {
  const { user } = useUser();
  const { role } = useSubscription();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    resume: '',
    skills: '',
    experience: '',
    education: '',
    jobTypes: '',
    locations: '',
    salaryRange: '',
    remoteWork: false,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      // Simulate loading profile from localStorage (in production, use your DB)
      const storedProfile = localStorage.getItem('job-agent.profile');
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        setFormData({
          fullName: parsedProfile.fullName || '',
          email: parsedProfile.email || '',
          phone: parsedProfile.phone || '',
          resume: parsedProfile.resume || '',
          skills: parsedProfile.skills?.join(', ') || '',
          experience: parsedProfile.experience || '',
          education: parsedProfile.education || '',
          jobTypes: parsedProfile.preferences?.jobTypes?.join(', ') || '',
          locations: parsedProfile.preferences?.locations?.join(', ') || '',
          salaryRange: parsedProfile.preferences?.salaryRange || '',
          remoteWork: parsedProfile.preferences?.remoteWork || false,
        });
      } else {
        // Create initial profile from Clerk user data
        const initialProfile: CandidateProfile = {
          id: `profile_${Date.now()}`,
          userId: user?.id || 'unknown',
          fullName: user?.fullName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          phone: user?.primaryPhoneNumber?.phoneNumber || '',
          resume: '',
          skills: [],
          experience: '',
          education: '',
          preferences: {
            jobTypes: [],
            locations: [],
            salaryRange: '',
            remoteWork: false,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(initialProfile);
        setFormData({
          fullName: initialProfile.fullName,
          email: initialProfile.email,
          phone: initialProfile.phone,
          resume: '',
          skills: '',
          experience: '',
          education: '',
          jobTypes: '',
          locations: '',
          salaryRange: '',
          remoteWork: false,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const updatedProfile: CandidateProfile = {
        ...profile!,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        resume: formData.resume,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        experience: formData.experience,
        education: formData.education,
        preferences: {
          jobTypes: formData.jobTypes.split(',').map(s => s.trim()).filter(s => s),
          locations: formData.locations.split(',').map(s => s.trim()).filter(s => s),
          salaryRange: formData.salaryRange,
          remoteWork: formData.remoteWork,
        },
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage (in production, save to your DB)
      localStorage.setItem('job-agent.profile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your personal information and job preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {profile?.fullName || 'Complete your profile'}
                </h3>
                <p className="text-gray-600 mb-2">{profile?.email}</p>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  role === 'subscriber' || role === 'owner' || role === 'admin'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {role === 'subscriber' || role === 'owner' || role === 'admin' ? 'Pro Member' : 'Free Member'}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile Completion</span>
                  <span className="font-medium">
                    {profile ? Math.round((Object.values(profile).filter(v => v && v !== '').length / Object.keys(profile).length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills Listed</span>
                  <span className="font-medium">{profile?.skills?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Preferences</span>
                  <span className="font-medium">{profile?.preferences?.jobTypes?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                  <select
                    name="salaryRange"
                    value={formData.salaryRange}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select range</option>
                    <option value="30k-50k">$30k - $50k</option>
                    <option value="50k-75k">$50k - $75k</option>
                    <option value="75k-100k">$75k - $100k</option>
                    <option value="100k-150k">$100k - $150k</option>
                    <option value="150k+">$150k+</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma-separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="React, TypeScript, Node.js, Python..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resume</label>
                  <textarea
                    name="resume"
                    value={formData.resume}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows={6}
                    placeholder="Paste your resume content here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows={3}
                    placeholder="Describe your work experience..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows={2}
                    placeholder="Your educational background..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Types (comma-separated)</label>
                  <input
                    type="text"
                    name="jobTypes"
                    value={formData.jobTypes}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Full-time, Contract, Remote..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Locations (comma-separated)</label>
                  <input
                    type="text"
                    name="locations"
                    value={formData.locations}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="New York, San Francisco, Remote..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="remoteWork"
                      checked={formData.remoteWork}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-50"
                    />
                    <span className="text-sm font-medium text-gray-700">Open to remote work</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
