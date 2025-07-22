/**
 * Shared Rides Domain Types
 */

// Ride entity type
export const RideEntity = {
  ID: 'string',
  RIDE_DATE: 'date',
  SESSION: 'string', // 'MORNING' | 'AFTERNOON'
  PARTICIPANTS: 'array', // JSON array of participant objects
  TOTAL_COST: 'number',
  CREATED_AT: 'timestamp'
}

// Session types
export const RideSession = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON'
}

// Participant type
export const Participant = {
  name: 'string',
  email: 'string|null',
  share: 'number' // Equal share by default, but can be customized
}

// Ride request types
export const CreateRideRequest = {
  ride_date: 'string', // ISO date string
  session: 'string', // RideSession
  participants: 'array', // Array of Participant objects
  total_cost: 'number'
}

export const UpdateRideRequest = {
  ride_date: 'string|null',
  session: 'string|null',
  participants: 'array|null',
  total_cost: 'number|null'
}

// Ride filters
export const RideFilters = {
  month: 'number|null',
  year: 'number|null',
  session: 'string|null',
  participant: 'string|null'
}

// Monthly report types
export const MonthlyRideReport = {
  month: 'number',
  year: 'number',
  total_rides: 'number',
  total_cost: 'number',
  sessions: 'object', // { MORNING: number, AFTERNOON: number }
  participant_costs: 'array' // Array of { name, total_owed, rides_count }
}

// Participant cost breakdown
export const ParticipantCostBreakdown = {
  name: 'string',
  total_owed: 'number',
  rides_count: 'number',
  morning_rides: 'number',
  afternoon_rides: 'number',
  average_cost_per_ride: 'number'
}

// Ride errors
export const RideErrors = {
  RIDE_NOT_FOUND: 'Ride not found',
  INVALID_RIDE_DATA: 'Invalid ride data provided',
  INVALID_DATE: 'Invalid ride date',
  INVALID_SESSION: 'Session must be MORNING or AFTERNOON',
  INVALID_PARTICIPANTS: 'At least one participant is required',
  INVALID_COST: 'Total cost must be greater than 0',
  INVALID_PARTICIPANT_NAME: 'Participant name is required',
  DUPLICATE_PARTICIPANT: 'Duplicate participant names are not allowed',
  RIDE_CREATE_FAILED: 'Failed to create ride',
  RIDE_UPDATE_FAILED: 'Failed to update ride',
  RIDE_DELETE_FAILED: 'Failed to delete ride',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}

// Ride validation
export const RideValidation = {
  validateDate: (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    const oneYearAhead = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
    
    return !isNaN(date.getTime()) && date >= oneYearAgo && date <= oneYearAhead
  },

  validateSession: (session) => {
    return session === RideSession.MORNING || session === RideSession.AFTERNOON
  },

  validateCost: (cost) => {
    const numCost = parseFloat(cost)
    return !isNaN(numCost) && numCost > 0 && numCost <= 999999.99
  },

  validateParticipants: (participants) => {
    if (!Array.isArray(participants) || participants.length === 0) {
      return false
    }

    // Check for duplicate names
    const names = participants.map(p => p.name?.trim().toLowerCase()).filter(Boolean)
    if (new Set(names).size !== names.length) {
      return false
    }

    // Validate each participant
    return participants.every(participant => {
      return participant.name && 
             typeof participant.name === 'string' && 
             participant.name.trim().length > 0 &&
             participant.name.trim().length <= 100
    })
  },

  validateParticipantName: (name) => {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 100
  }
}

// Default participant share calculation
export const calculateEqualShares = (totalCost, participantCount) => {
  if (participantCount === 0) return 0
  return totalCost / participantCount
}