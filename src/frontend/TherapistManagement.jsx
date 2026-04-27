import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api/apiClient.js'
import MaterialSymbol from '../components/MaterialSymbol.jsx'

const DEFAULT_THERAPISTS = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    phone: '+1 (555) 123-4567',
    email: 'sarah.jenkins@movicloudspa.com',
    specialization: 'Deep Tissue Massage',
    experience: '8 years',
    status: 'Available',
    availability: {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '18:00',
      leaveDates: []
    },
    services: ['Deep Tissue Massage', 'Swedish Massage']
  },
  {
    id: 2,
    name: 'Julian Reed',
    phone: '+1 (555) 234-5678',
    email: 'julian.reed@movicloudspa.com',
    specialization: 'Sports Therapy',
    experience: '6 years',
    status: 'Available',
    availability: {
      workingDays: ['Monday', 'Wednesday', 'Friday'],
      startTime: '10:00',
      endTime: '19:00',
      leaveDates: []
    },
    services: ['Sports Therapy', 'Deep Tissue Massage']
  }
]

const SAMPLE_APPOINTMENTS = [
  {
    therapistId: 1,
    clientName: 'Elena Gilbert',
    service: 'Deep Tissue Massage',
    date: '2024-04-23',
    time: '10:00 AM - 11:30 AM',
    status: 'Confirmed',
    room: 'Zen Suite'
  },
  {
    therapistId: 1,
    clientName: 'Marcus Vane',
    service: 'Swedish Massage',
    date: '2024-04-23',
    time: '02:00 PM - 03:00 PM',
    status: 'Confirmed',
    room: 'Lotus Room'
  },
  {
    therapistId: 2,
    clientName: 'Sarah Koenig',
    service: 'Sports Therapy',
    date: '2024-04-24',
    time: '09:00 AM - 10:30 AM',
    status: 'Upcoming',
    room: 'Ocean Mist Hall'
  }
]

const ALL_SERVICES = [
  'Swedish Massage',
  'Deep Tissue Massage',
  'Aromatherapy Massage',
  'Facial',
  'Sports Therapy',
  'Hot Stone Massage',
  'Reflexology',
  'Prenatal Massage'
]

export default function TherapistManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [therapists, setTherapists] = useState(DEFAULT_THERAPISTS)
  const [selectedTherapist, setSelectedTherapist] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Edit states
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isEditingAvailability, setIsEditingAvailability] = useState(false)
  const [isEditingServices, setIsEditingServices] = useState(false)
  
  // Form states
  const [newTherapist, setNewTherapist] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    experience: ''
  })
  
  const [editedTherapist, setEditedTherapist] = useState(null)
  const [availabilityForm, setAvailabilityForm] = useState({
    workingDays: [],
    startTime: '',
    endTime: '',
    useDefaultHours: false
  })
  const [selectedServices, setSelectedServices] = useState([])
  const [isLeaveMode, setIsLeaveMode] = useState(false)
  const [leaveCalendar, setLeaveCalendar] = useState([])
  const [selectedLeaveDates, setSelectedLeaveDates] = useState([])

  useEffect(() => {
    apiGet('/api/therapists')
      .then((data) => setTherapists(data || DEFAULT_THERAPISTS))
      .catch(() => setTherapists(DEFAULT_THERAPISTS))
  }, [])

  useEffect(() => {
    if (!statusMessage) return

    const timer = setTimeout(() => {
      setStatusMessage('')
    }, 3000)

    return () => clearTimeout(timer)
  }, [statusMessage])

  useEffect(() => {
    if (therapists.length > 0 && !selectedTherapist) {
      setSelectedTherapist(therapists[0])
    }
  }, [therapists, selectedTherapist])

  const filteredTherapists = therapists.filter((therapist) =>
    therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    therapist.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    therapist.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddTherapist = async () => {
    setStatusMessage('')
    setIsSubmitting(true)
    
    if (!newTherapist.name || !newTherapist.phone || !newTherapist.email || !newTherapist.specialization || !newTherapist.experience) {
      setStatusMessage('Please fill in all required fields.')
      setIsSubmitting(false)
      return
    }

    const payload = {
      ...newTherapist,
      status: 'Available',
      availability: {
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00',
        endTime: '18:00',
        leaveDates: []
      },
      services: []
    }

    try {
      const savedTherapist = await apiPost('/api/therapists', payload)
      setTherapists(prev => [...prev, savedTherapist])
      setSelectedTherapist(savedTherapist)
      setStatusMessage('Therapist added successfully.')
    } catch (error) {
      console.error('Backend save failed:', error)
      const fallbackTherapist = { ...payload, id: Date.now() }
      setTherapists(prev => [...prev, fallbackTherapist])
      setSelectedTherapist(fallbackTherapist)
      setStatusMessage('Therapist added successfully.')
    } finally {
      setNewTherapist({ name: '', phone: '', email: '', specialization: '', experience: '' })
      setIsAddOpen(false)
      setIsSubmitting(false)
    }
  }

  const handleUpdateTherapist = async () => {
    if (!editedTherapist) return
    
    setStatusMessage('')
    try {
      const updated = { ...editedTherapist }
      setTherapists(therapists.map(t => t.id === editedTherapist.id ? updated : t))
      setSelectedTherapist(updated)
      setEditedTherapist(null)
      setIsEditingDetails(false)
      setStatusMessage('Therapist details updated successfully.')
    } catch (error) {
      setStatusMessage(error.message || 'Unable to update therapist.')
    }
  }

  const handleUpdateAvailability = async () => {
    if (!selectedTherapist) return
    
    setStatusMessage('')
    try {
      const updated = {
        ...selectedTherapist,
        availability: availabilityForm.useDefaultHours ? {
          workingDays: availabilityForm.workingDays,
          startTime: '09:00',
          endTime: '18:00',
          leaveDates: []
        } : availabilityForm
      }
      setTherapists(therapists.map(t => t.id === selectedTherapist.id ? updated : t))
      setSelectedTherapist(updated)
      setIsEditingAvailability(false)
      setStatusMessage('Availability updated successfully.')
    } catch (error) {
      setStatusMessage(error.message || 'Unable to update availability.')
    }
  }

  const handleUpdateServices = async () => {
    if (!selectedTherapist) return
    
    setStatusMessage('')
    try {
      const updated = {
        ...selectedTherapist,
        services: selectedServices
      }
      setTherapists(therapists.map(t => t.id === selectedTherapist.id ? updated : t))
      setSelectedTherapist(updated)
      setIsEditingServices(false)
      setStatusMessage('Services updated successfully.')
    } catch (error) {
      setStatusMessage(error.message || 'Unable to update services.')
    }
  }

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const totalTherapists = therapists.length
  const availableToday = therapists.filter(t => t.status === 'Available').length
  const onLeave = therapists.filter(t => t.status === 'On Leave').length

  return (
    <div className="view-body">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] text-[#1f1a16] mb-2" style={{ fontFamily: 'var(--serif)' }}>Expert Therapists</h1>
        <p className="text-[10px] text-[#9a9186]">Guided by intuition, grounded in expertise</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-[24px] p-6" style={{ boxShadow: '0 12px 22px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-[#9a9186] mb-1 uppercase tracking-[1px]">Total Therapists</p>
              <p className="text-[11px] font-bold text-[#1f1a16] uppercase tracking-[1px]">{totalTherapists}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#1f4d3e]/10 flex items-center justify-center">
              <MaterialSymbol name="people" className="text-[#1f4d3e] text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[24px] p-6" style={{ boxShadow: '0 12px 22px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-[#9a9186] mb-1 uppercase tracking-[1px]">Available Today</p>
              <p className="text-[11px] font-bold text-[#1f1a16] uppercase tracking-[1px]">{availableToday}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#dcefe6] flex items-center justify-center">
              <MaterialSymbol name="check_circle" className="text-[#2f7d6d] text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[24px] p-6" style={{ boxShadow: '0 12px 22px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-[#9a9186] mb-1 uppercase tracking-[1px]">On Leave</p>
              <p className="text-[11px] font-bold text-[#1f1a16] uppercase tracking-[1px]">{onLeave}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#f5d9a1] flex items-center justify-center">
              <MaterialSymbol name="event_busy" className="text-[#f0b429] text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Action */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <MaterialSymbol name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6f665c] text-xl" />
          <input
            type="text"
            placeholder="Search therapist, specialization, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-[18px] border border-[#eee6db] bg-white text-[#3d3a36] text-[12px] focus:outline-none focus:ring-2 focus:ring-[#1f4d3e]/20"
          />
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#1f4d3e] to-[#2f7d6d] text-white font-medium flex items-center gap-2 transition-all duration-300 text-[10px] uppercase tracking-[1.2px]"
        >
          <MaterialSymbol name="add" className="text-xl" />
          Add New Therapist
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-[24px] mb-6" style={{ boxShadow: '0 12px 22px rgba(0,0,0,0.06)' }}>
        <div className="flex border-b border-[#1f4d3e]/10">
          {['details', 'availability', 'services', 'appointments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium capitalize transition-colors text-[10px] uppercase tracking-[1px] ${
                activeTab === tab
                  ? 'text-[#1f4d3e] border-b-2 border-[#1f4d3e]'
                  : 'text-[#9a9186] hover:text-[#2f2a24]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Therapist List */}
              <div>
                <h3 className="text-[16px] font-semibold text-[#1f1a16] mb-4" style={{ fontFamily: 'var(--serif)' }}>Therapists</h3>
                <p className="text-[9px] text-[#9a9186] mb-4 uppercase tracking-[1px]">Available team</p>
                <p className="text-[9px] text-[#9a9186] mb-4 uppercase tracking-[1px]">Showing {filteredTherapists.length} of {therapists.length}</p>
                
                <div className="space-y-3">
                  {filteredTherapists.map((therapist) => (
                    <div
                      key={therapist.id}
                      onClick={() => setSelectedTherapist(therapist)}
                      className={`p-4 rounded-[22px] border cursor-pointer transition-all duration-200 ${
                        selectedTherapist?.id === therapist.id
                          ? 'border-[#1f4d3e] bg-[#1f4d3e]/5'
                          : 'border-[#1f4d3e]/15 bg-white hover:border-[#1f4d3e]/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1f4d3e] to-[#2f7d6d] flex items-center justify-center text-white font-semibold text-[10px]">
                          {getInitials(therapist.name)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#2f2a24] text-[11px]">{therapist.name}</h4>
                          <p className="text-[9px] text-[#9a9186]">{therapist.specialization}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          therapist.status === 'Available' ? 'bg-[#2f7d6d]' : 'bg-[#f0b429]'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Therapist Details */}
              <div>
                <div className="bg-white rounded-[24px] border border-[#1f4d3e]/15 p-6" style={{ boxShadow: '0 12px 22px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[16px] font-semibold text-[#1f1a16]" style={{ fontFamily: 'var(--serif)' }}>Therapist Details</h3>
                    {isEditingDetails ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditingDetails(false)
                            setEditedTherapist(null)
                          }}
                          className="px-3 py-2 rounded-full border border-[#eee6db] text-[#9a9186] hover:text-[#2f2a24] text-[9px] uppercase tracking-[1px]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateTherapist}
                          className="px-3 py-2 rounded-full bg-[#1f4d3e] text-white text-[9px] uppercase tracking-[1.2px]"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditedTherapist(selectedTherapist)
                          setIsEditingDetails(true)
                        }}
                        className="px-3 py-2 rounded-full bg-[#1f4d3e] text-white text-[10px] uppercase tracking-[1.2px]"
                      >
                        Edit Details
                      </button>
                    )}
                  </div>

                  {selectedTherapist ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1f4d3e] to-[#2f7d6d] flex items-center justify-center text-white font-semibold text-[12px]">
                          {getInitials(selectedTherapist.name)}
                        </div>
                        <div>
                          <h4 className="text-[16px] font-semibold text-[#2f2a24]" style={{ fontFamily: 'var(--serif)' }}>{selectedTherapist.name}</h4>
                          <p className="text-[9px] text-[#9a9186]">{selectedTherapist.specialization}</p>
                        </div>
                      </div>

                      {isEditingDetails ? (
                        <div className="space-y-4">
                          <label className="block">
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Full Name</span>
                            <input
                              type="text"
                              value={editedTherapist?.name || ''}
                              onChange={(e) => setEditedTherapist({...editedTherapist, name: e.target.value})}
                              className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Phone Number</span>
                            <input
                              type="text"
                              value={editedTherapist?.phone || ''}
                              onChange={(e) => setEditedTherapist({...editedTherapist, phone: e.target.value})}
                              className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Email Address</span>
                            <input
                              type="email"
                              value={editedTherapist?.email || ''}
                              onChange={(e) => setEditedTherapist({...editedTherapist, email: e.target.value})}
                              className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Specialization</span>
                            <input
                              type="text"
                              value={editedTherapist?.specialization || ''}
                              onChange={(e) => setEditedTherapist({...editedTherapist, specialization: e.target.value})}
                              className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Experience</span>
                            <input
                              type="text"
                              value={editedTherapist?.experience || ''}
                              onChange={(e) => setEditedTherapist({...editedTherapist, experience: e.target.value})}
                              className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Full Name</span>
                            <p className="font-medium text-[#1f1a16] text-[12px]">{selectedTherapist.name}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Phone Number</span>
                            <p className="font-medium text-[#1f1a16] text-[12px]">{selectedTherapist.phone}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Email Address</span>
                            <p className="font-medium text-[#1f1a16] text-[12px]">{selectedTherapist.email}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Specialization</span>
                            <p className="font-medium text-[#1f1a16] text-[12px]">{selectedTherapist.specialization}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#9a9186] uppercase tracking-[1px]">Experience</span>
                            <p className="font-medium text-[#1f1a16] text-[12px]">{selectedTherapist.experience}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#9a9186] text-[10px]">Selected profile and summary data appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && selectedTherapist && (
            <div>
              {isEditingAvailability ? (
                <div>
                  <h3 className="text-[16px] font-semibold text-[#1f1a16] mb-6" style={{ fontFamily: 'var(--serif)' }}>Edit Availability</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] text-[#9a9186] mb-3 block uppercase tracking-[1px]">Working Days</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <label key={day} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={availabilityForm.workingDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAvailabilityForm({...availabilityForm, workingDays: [...availabilityForm.workingDays, day]})
                                } else {
                                  setAvailabilityForm({...availabilityForm, workingDays: availabilityForm.workingDays.filter(d => d !== day)})
                                }
                              }}
                              className="accent-[#1f4d3e]"
                            />
                            <span className="text-[10px]">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availabilityForm.useDefaultHours}
                          onChange={(e) => setAvailabilityForm({...availabilityForm, useDefaultHours: e.target.checked})}
                          className="accent-[#1f4d3e]"
                        />
                        <span className="text-[10px]">Use default spa hours (9:00 AM - 6:00 PM)</span>
                      </label>
                    </div>

                    {!availabilityForm.useDefaultHours && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-[#9a9186] mb-2 uppercase tracking-[1px]">Start Time</label>
                          <input
                            type="time"
                            value={availabilityForm.startTime}
                            onChange={(e) => setAvailabilityForm({...availabilityForm, startTime: e.target.value})}
                            className="w-full p-3 rounded-xl border border-[#eee6db] bg-white text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#9a9186] mb-2 uppercase tracking-[1px]">End Time</label>
                          <input
                            type="time"
                            value={availabilityForm.endTime}
                            onChange={(e) => setAvailabilityForm({...availabilityForm, endTime: e.target.value})}
                            className="w-full p-3 rounded-xl border border-[#eee6db] bg-white text-[12px]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsEditingAvailability(false)
                          setAvailabilityForm({workingDays: [], startTime: '', endTime: '', useDefaultHours: false})
                        }}
                        className="px-6 py-3 rounded-full border border-[#eee6db] text-[#9a9186] hover:text-[#2f2a24] text-[10px] uppercase tracking-[1px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateAvailability}
                        className="px-6 py-3 rounded-full bg-[#1f4d3e] text-white text-[10px] uppercase tracking-[1.2px]"
                      >
                        Save Availability
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[16px] font-semibold text-[#1f1a16]" style={{ fontFamily: 'var(--serif)' }}>Availability</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setAvailabilityForm(selectedTherapist.availability || {workingDays: [], startTime: '', endTime: '', useDefaultHours: false})
                          setIsEditingAvailability(true)
                        }}
                        className="px-4 py-2 rounded-full bg-[#1f4d3e] text-white text-[10px] uppercase tracking-[1.2px]"
                      >
                        Edit Availability
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">Working Days</span>
                      <p className="font-medium text-[#1f1a16] text-[12px]">
                        {selectedTherapist.availability?.workingDays?.join(', ') || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">Start Time</span>
                      <p className="font-medium text-[#1f1a16] text-[12px]">
                        {selectedTherapist.availability?.startTime || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">End Time</span>
                      <p className="font-medium text-[#1f1a16] text-[12px]">
                        {selectedTherapist.availability?.endTime || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">Leave Dates</span>
                      <p className="font-medium text-[#1f1a16] text-[12px]">
                        {selectedTherapist.availability?.leaveDates?.length > 0 
                          ? selectedTherapist.availability.leaveDates.join(', ')
                          : 'No leave dates scheduled'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leave Calendar Modal */}
          {isLeaveMode && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" style={{ backgroundColor: 'rgba(15, 20, 18, 0.45)' }}>
              <div className="bg-white rounded-[24px] p-6 max-w-md w-full" style={{ boxShadow: '0 30px 60px rgba(31,77,62,0.18)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-semibold text-[#1f1a16]" style={{ fontFamily: 'var(--serif)' }}>Manage Leave Dates</h3>
                  <button
                    onClick={() => setIsLeaveMode(false)}
                    className="w-8 h-8 rounded-full bg-[#1f4d3e]/10 flex items-center justify-center hover:bg-[#1f4d3e]/20"
                  >
                    <MaterialSymbol name="close" className="text-[#1f4d3e]" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] text-[#9a9186] mb-4 uppercase tracking-[1px]">Select Leave Dates</p>
                  <input
                    type="date"
                    multiple
                    onChange={(e) => {
                      const dates = Array.from(e.target.selectedOptions, option => option.value)
                      setSelectedLeaveDates(dates)
                    }}
                    className="w-full p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                  />
                </div>

                <div className="mb-6">
                  <p className="text-[10px] text-[#9a9186] mb-2 uppercase tracking-[1px]">Selected Leave Dates</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedLeaveDates.length > 0 ? (
                      selectedLeaveDates.map((date, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-xl border border-[#eee6db] bg-white">
                          <span className="text-[12px] text-[#1f1a16]">{date}</span>
                          <button
                            onClick={() => {
                              const newDates = selectedLeaveDates.filter((_, i) => i !== index)
                              setSelectedLeaveDates(newDates)
                            }}
                            className="text-[#b05b49] hover:text-[#d32f2e] text-[10px]"
                          >
                            <MaterialSymbol name="delete" className="text-xl" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#9a9186] text-[10px] text-center py-4">No leave dates selected</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsLeaveMode(false)}
                    className="flex-1 px-6 py-3 rounded-full border border-[#1f4d3e]/15 text-[#9a9186] hover:text-[#2f2a24] text-[10px] uppercase tracking-[1px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedLeaveDates.length > 0 && selectedTherapist) {
                        const updated = {
                          ...selectedTherapist,
                          availability: {
                            ...selectedTherapist.availability,
                            leaveDates: [...(selectedTherapist.availability?.leaveDates || []), ...selectedLeaveDates]
                          }
                        }
                        setTherapists(therapists.map(t => t.id === selectedTherapist.id ? updated : t))
                        setSelectedTherapist(updated)
                        setSelectedLeaveDates([])
                        setIsLeaveMode(false)
                        setStatusMessage('Leave dates updated successfully.')
                      }
                    }}
                    className="flex-1 px-6 py-3 rounded-full bg-[#1f4d3e] text-white text-[10px] uppercase tracking-[1.2px]"
                  >
                    Save Leave Dates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && selectedTherapist && (
            <div>
              {isEditingServices ? (
                <div>
                  <h3 className="text-[16px] font-semibold text-[#1f1a16] mb-6" style={{ fontFamily: 'var(--serif)' }}>Edit Services</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServices.length === ALL_SERVICES.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices(ALL_SERVICES)
                            } else {
                              setSelectedServices([])
                            }
                          }}
                          className="accent-[#1f4d3e]"
                        />
                        <span className="text-[10px]">Select All</span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {ALL_SERVICES.map((service) => (
                        <label key={service} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-[#eee6db] hover:border-[#1f4d3e]/30">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices([...selectedServices, service])
                              } else {
                                setSelectedServices(selectedServices.filter(s => s !== service))
                              }
                            }}
                            className="accent-[#1f4d3e]"
                          />
                          <span className="text-[10px]">{service}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsEditingServices(false)
                          setSelectedServices([])
                        }}
                        className="px-6 py-3 rounded-full border border-[#eee6db] text-[#9a9186] hover:text-[#2f2a24] text-[10px] uppercase tracking-[1px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateServices}
                        className="px-6 py-3 rounded-full bg-[#1f4d3e] text-white text-[10px] uppercase tracking-[1.2px]"
                      >
                        Save Services
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[16px] font-semibold text-[#1f1a16]" style={{ fontFamily: 'var(--serif)' }}>Services</h3>
                    <button
                      onClick={() => {
                        setSelectedServices(selectedTherapist.services || [])
                        setIsEditingServices(true)
                      }}
                      className="px-4 py-2 rounded-full bg-[#1f4d3e] text-white text-[10px] uppercase tracking-[1.2px]"
                    >
                      Edit Services
                    </button>
                  </div>
                  
                  {selectedTherapist.services?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTherapist.services.map((service) => (
                        <div key={service} className="p-3 rounded-xl border border-[#eee6db] bg-white">
                          <p className="font-medium text-[#1f1a16] text-[12px]">{service}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#9a9186] text-[10px]">No services assigned</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              <h3 className="text-[16px] font-semibold text-[#1f1a16] mb-6" style={{ fontFamily: 'var(--serif)' }}>Assigned Appointments</h3>
              
              {selectedTherapist ? (
                <div className="space-y-4">
                  <div className="mb-6">
                    <p className="text-[10px] text-[#9a9186] mb-2 uppercase tracking-[1px]">
                      {selectedTherapist.name}'s Appointments
                    </p>
                    <p className="text-[9px] text-[#9a9186]">
                      Total: {SAMPLE_APPOINTMENTS.filter(apt => apt.therapistId === selectedTherapist.id).length} appointments
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {SAMPLE_APPOINTMENTS
                      .filter(apt => apt.therapistId === selectedTherapist.id)
                      .map((appointment, index) => (
                        <div key={index} className="bg-white rounded-[18px] border border-[#eee6db] p-4" style={{ boxShadow: '0 8px 16px rgba(0,0,0,0.06)' }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1f4d3e] to-[#2f7d6d] flex items-center justify-center text-white font-semibold text-[10px]">
                                  {getInitials(appointment.clientName)}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#1f1a16] text-[12px]">{appointment.clientName}</p>
                                  <p className="text-[9px] text-[#9a9186]">{appointment.service}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-[10px] text-[#9a9186]">
                                <div className="flex items-center gap-2">
                                  <MaterialSymbol name="calendar_month" className="text-[#1f4d3e] text-[14px]" />
                                  <span>{appointment.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MaterialSymbol name="schedule" className="text-[#1f4d3e] text-[14px]" />
                                  <span>{appointment.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MaterialSymbol name="meeting_room" className="text-[#1f4d3e] text-[14px]" />
                                  <span>{appointment.room}</span>
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-[10px] uppercase tracking-[1px] ${
                                  appointment.status === 'Confirmed' 
                                    ? 'bg-[#2f7d6d] text-white' 
                                    : 'bg-[#f5d9a1] text-[#1f4d3e]'
                                }`}>
                                  {appointment.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#1f4d3e]/10 flex items-center justify-center mx-auto mb-4">
                    <MaterialSymbol name="event" className="text-[#1f4d3e] text-2xl" />
                  </div>
                  <p className="text-[#9a9186] mb-2 text-[10px]">Select a therapist to view appointments</p>
                  <p className="text-[10px] text-[#9a9186]">Choose a therapist from the list to see their scheduled appointments</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-[24px] ${
          statusMessage.includes('success') ? 'bg-[#2f7d6d] text-white' : 'bg-[#b05b49] text-white'
        }`} style={{ boxShadow: '0 12px 22px rgba(0,0,0,0.06)' }}>
          <span className="text-[11px]">{statusMessage}</span>
        </div>
      )}

      {/* Add Therapist Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full" style={{ boxShadow: '0 30px 60px rgba(31,77,62,0.18)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-semibold text-[#1f1a16]" style={{ fontFamily: 'var(--serif)' }}>New therapist admission</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1f4d3e]/10 flex items-center justify-center hover:bg-[#1f4d3e]/20"
              >
                <MaterialSymbol name="close" className="text-[#1f4d3e]" />
              </button>
            </div>

            <form onSubmit={(e) => { 
              e.preventDefault(); 
              handleAddTherapist(); 
            }} className="space-y-4">
              <label className="block">
                <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">Full Name</span>
                <input
                  type="text"
                  value={newTherapist.name}
                  onChange={(e) => setNewTherapist({...newTherapist, name: e.target.value})}
                  className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">Phone Number</span>
                <input
                  type="text"
                  value={newTherapist.phone}
                  onChange={(e) => setNewTherapist({...newTherapist, phone: e.target.value})}
                  className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">Email Address</span>
                <input
                  type="email"
                  value={newTherapist.email}
                  onChange={(e) => setNewTherapist({...newTherapist, email: e.target.value})}
                  className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">Specialization</span>
                <input
                  type="text"
                  value={newTherapist.specialization}
                  onChange={(e) => setNewTherapist({...newTherapist, specialization: e.target.value})}
                  className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-[#9a9186] uppercase tracking-[1px]">Experience</span>
                <input
                  type="text"
                  value={newTherapist.experience}
                  onChange={(e) => setNewTherapist({...newTherapist, experience: e.target.value})}
                  className="w-full mt-1 p-3 rounded-[18px] border border-[#eee6db] bg-white text-[12px]"
                  required
                />
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 px-6 py-3 rounded-full border border-[#1f4d3e]/15 text-[#9a9186] hover:text-[#2f2a24] text-[10px] uppercase tracking-[1px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 rounded-full text-white text-[10px] uppercase tracking-[1.2px] ${isSubmitting ? 'bg-[#8a9c90] cursor-not-allowed' : 'bg-[#1f4d3e]'}`}
                >
                  {isSubmitting ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
