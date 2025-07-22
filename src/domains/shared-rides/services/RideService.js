import { supabase } from 'src/shared/infrastructure/supabase'
import { RideErrors, RideValidation, RideSession, calculateEqualShares } from 'src/domains/shared-rides/types'

/**
 * Ride Service
 * Handles all shared ride expense operations
 */
class RideService {
  /**
   * Create a new ride
   * @param {import('../types').CreateRideRequest} rideData
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async createRide(rideData) {
    try {
      // Validate ride data
      const validationError = this._validateRideData(rideData)
      if (validationError) {
        return { data: null, error: validationError }
      }

      // Process participants with equal shares
      const participantsWithShares = rideData.participants.map(participant => ({
        name: participant.name.trim(),
        email: participant.email || null,
        share: calculateEqualShares(rideData.total_cost, rideData.participants.length)
      }))

      // Create ride
      const { data, error } = await supabase
        .from('rides')
        .insert([{
          ride_date: rideData.ride_date,
          session: rideData.session,
          participants: participantsWithShares,
          total_cost: parseFloat(rideData.total_cost)
        }])
        .select()
        .single()

      if (error) {
        return { data: null, error: `${RideErrors.RIDE_CREATE_FAILED}: ${error.message}` }
      }

      return { data, error: null }
    } catch (err) {
      return { data: null, error: RideErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get rides with optional filters
   * @param {import('../types').RideFilters} [filters={}]
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getRides(filters = {}) {
    try {
      let query = supabase
        .from('rides')
        .select('*')
        .order('ride_date', { ascending: false })
        .order('session', { ascending: true })

      // Apply filters
      if (filters.month && filters.year) {
        const startDate = new Date(filters.year, filters.month - 1, 1).toISOString().split('T')[0]
        const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
        query = query.gte('ride_date', startDate).lte('ride_date', endDate)
      } else if (filters.year) {
        const startDate = new Date(filters.year, 0, 1).toISOString().split('T')[0]
        const endDate = new Date(filters.year, 11, 31).toISOString().split('T')[0]
        query = query.gte('ride_date', startDate).lte('ride_date', endDate)
      }

      if (filters.session) {
        query = query.eq('session', filters.session)
      }

      const { data, error } = await query

      if (error) {
        return { data: [], error: error.message }
      }

      let filteredData = data || []

      // Filter by participant if specified
      if (filters.participant) {
        filteredData = filteredData.filter(ride => 
          ride.participants.some(p => 
            p.name.toLowerCase().includes(filters.participant.toLowerCase())
          )
        )
      }

      return { data: filteredData, error: null }
    } catch (err) {
      return { data: [], error: RideErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get monthly ride report
   * @param {number} month
   * @param {number} year
   * @returns {Promise<{data: import('../types').MonthlyRideReport|null, error: string|null}>}
   */
  async getMonthlyReport(month, year) {
    try {
      // Get rides for the specified month
      const { data: rides, error } = await this.getRides({ month, year })
      
      if (error) {
        return { data: null, error }
      }

      if (!rides || rides.length === 0) {
        return { 
          data: {
            month,
            year,
            total_rides: 0,
            total_cost: 0,
            sessions: { MORNING: 0, AFTERNOON: 0 },
            participant_costs: []
          }, 
          error: null 
        }
      }

      // Calculate report data
      const totalCost = rides.reduce((sum, ride) => sum + parseFloat(ride.total_cost), 0)
      const sessions = {
        MORNING: rides.filter(r => r.session === RideSession.MORNING).length,
        AFTERNOON: rides.filter(r => r.session === RideSession.AFTERNOON).length
      }

      // Calculate participant costs
      const participantMap = new Map()

      rides.forEach(ride => {
        ride.participants.forEach(participant => {
          const name = participant.name
          if (!participantMap.has(name)) {
            participantMap.set(name, {
              name,
              total_owed: 0,
              rides_count: 0,
              morning_rides: 0,
              afternoon_rides: 0
            })
          }

          const participantData = participantMap.get(name)
          participantData.total_owed += participant.share
          participantData.rides_count += 1
          
          if (ride.session === RideSession.MORNING) {
            participantData.morning_rides += 1
          } else {
            participantData.afternoon_rides += 1
          }
        })
      })

      // Convert to array and add average cost per ride
      const participantCosts = Array.from(participantMap.values()).map(p => ({
        ...p,
        average_cost_per_ride: p.rides_count > 0 ? p.total_owed / p.rides_count : 0
      })).sort((a, b) => b.total_owed - a.total_owed)

      const report = {
        month,
        year,
        total_rides: rides.length,
        total_cost: totalCost,
        sessions,
        participant_costs: participantCosts
      }

      return { data: report, error: null }
    } catch (err) {
      return { data: null, error: RideErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Update an existing ride
   * @param {string} rideId
   * @param {import('../types').UpdateRideRequest} updates
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async updateRide(rideId, updates) {
    try {
      // Build update object, only including provided fields
      const updateData = {}
      
      if (updates.ride_date !== undefined) {
        if (!RideValidation.validateDate(updates.ride_date)) {
          return { data: null, error: RideErrors.INVALID_DATE }
        }
        updateData.ride_date = updates.ride_date
      }

      if (updates.session !== undefined) {
        if (!RideValidation.validateSession(updates.session)) {
          return { data: null, error: RideErrors.INVALID_SESSION }
        }
        updateData.session = updates.session
      }

      if (updates.total_cost !== undefined) {
        if (!RideValidation.validateCost(updates.total_cost)) {
          return { data: null, error: RideErrors.INVALID_COST }
        }
        updateData.total_cost = parseFloat(updates.total_cost)
      }

      if (updates.participants !== undefined) {
        if (!RideValidation.validateParticipants(updates.participants)) {
          return { data: null, error: RideErrors.INVALID_PARTICIPANTS }
        }
        
        const totalCost = updates.total_cost !== undefined ? updates.total_cost : null
        if (totalCost === null) {
          // Need to get current total cost to calculate shares
          const { data: currentRide } = await supabase
            .from('rides')
            .select('total_cost')
            .eq('id', rideId)
            .single()
          
          if (!currentRide) {
            return { data: null, error: RideErrors.RIDE_NOT_FOUND }
          }
          
          updateData.participants = updates.participants.map(participant => ({
            name: participant.name.trim(),
            email: participant.email || null,
            share: calculateEqualShares(currentRide.total_cost, updates.participants.length)
          }))
        } else {
          updateData.participants = updates.participants.map(participant => ({
            name: participant.name.trim(),
            email: participant.email || null,
            share: calculateEqualShares(totalCost, updates.participants.length)
          }))
        }
      }

      // Update ride
      const { data, error } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', rideId)
        .select()
        .single()

      if (error) {
        return { data: null, error: `${RideErrors.RIDE_UPDATE_FAILED}: ${error.message}` }
      }

      if (!data) {
        return { data: null, error: RideErrors.RIDE_NOT_FOUND }
      }

      return { data, error: null }
    } catch (err) {
      return { data: null, error: RideErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Delete a ride
   * @param {string} rideId
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async deleteRide(rideId) {
    try {
      const { error } = await supabase
        .from('rides')
        .delete()
        .eq('id', rideId)

      if (error) {
        return { success: false, error: `${RideErrors.RIDE_DELETE_FAILED}: ${error.message}` }
      }

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: RideErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get unique participant names from all rides
   * @returns {Promise<{data: string[], error: string|null}>}
   */
  async getParticipantNames() {
    try {
      const { data: rides, error } = await supabase
        .from('rides')
        .select('participants')

      if (error) {
        return { data: [], error: error.message }
      }

      const names = new Set()
      rides?.forEach(ride => {
        ride.participants.forEach(participant => {
          names.add(participant.name)
        })
      })

      return { data: Array.from(names).sort(), error: null }
    } catch (err) {
      return { data: [], error: RideErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Validate ride data
   * @private
   * @param {import('../types').CreateRideRequest} rideData
   * @returns {string|null} Error message or null if valid
   */
  _validateRideData(rideData) {
    if (!RideValidation.validateDate(rideData.ride_date)) {
      return RideErrors.INVALID_DATE
    }

    if (!RideValidation.validateSession(rideData.session)) {
      return RideErrors.INVALID_SESSION
    }

    if (!RideValidation.validateCost(rideData.total_cost)) {
      return RideErrors.INVALID_COST
    }

    if (!RideValidation.validateParticipants(rideData.participants)) {
      return RideErrors.INVALID_PARTICIPANTS
    }

    return null
  }
}

// Export singleton instance
export const rideService = new RideService()
export default rideService