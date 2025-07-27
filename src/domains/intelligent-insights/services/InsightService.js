import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { 
  InsightTypes,
  InsightPriority,
  SimulationTypes,
  CategoryConfidence,
  MerchantPatterns,
  InsightThresholds,
  SavingsTemplates,
  SimulationHelpers,
  CategoryClassifier,
  InsightValidation,
  InsightErrors
} from 'src/domains/intelligent-insights/types'

/**
 * Intelligent Insights Service
 * Provides AI-powered recommendations and smart categorization
 */
class InsightService {
  /**
   * Generate savings suggestions based on spending patterns (IN-001)
   * @param {Object} options
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async generateSavingsSuggestions(options = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: InsightErrors.USER_NOT_AUTHENTICATED }
      }

      const monthsToAnalyze = options.months || InsightThresholds.TREND_ANALYSIS_MONTHS
      const suggestions = []

      // Get recent expenses for analysis
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - monthsToAnalyze)

      const { data: expenses } = await expenseService.getExpenses({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      })

      if (!expenses || expenses.length < InsightThresholds.MINIMUM_TRANSACTIONS) {
        return { data: [], error: null }
      }

      // Analyze spending by category
      const categoryAnalysis = this.analyzeCategorySpending(expenses)

      // Generate suggestions for high-spending categories
      for (const [category, data] of Object.entries(categoryAnalysis)) {
        if (data.total >= InsightThresholds.SAVINGS_OPPORTUNITY) {
          const suggestion = this.generateCategorySuggestion(category, data, monthsToAnalyze)
          if (suggestion) {
            suggestions.push(suggestion)
          }
        }
      }

      // Analyze specific spending patterns
      const patternSuggestions = await this.analyzeSpendingPatterns(expenses)
      suggestions.push(...patternSuggestions)

      // Sort by potential savings (highest first)
      suggestions.sort((a, b) => (b.potential_saving || 0) - (a.potential_saving || 0))

      return { data: suggestions.slice(0, 5), error: null } // Return top 5 suggestions

    } catch (err) {
      console.error('Error generating savings suggestions:', err)
      return { data: null, error: InsightErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Simulate budget changes and show impact (IN-002)
   * @param {Object} simulation
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async simulateBudgetChange(simulation) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: InsightErrors.USER_NOT_AUTHENTICATED }
      }

      const { category, change_amount, change_type, months_to_project = 6 } = simulation

      // Get current budget and spending for the category
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('month', currentMonth)
        .eq('year', currentYear)

      const currentBudget = budgets && budgets.length > 0 ? budgets[0].monthly_limit : 0

      // Get recent spending data
      const { data: expenses } = await expenseService.getExpenses({
        category,
        month: currentMonth,
        year: currentYear
      })

      const currentSpending = expenses ? 
        expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) : 0

      // Calculate budget impact
      const budgetImpact = SimulationHelpers.calculateBudgetImpact(
        currentBudget, 
        change_amount, 
        change_type
      )

      // Project future impact
      const monthlyImpact = budgetImpact.difference
      const projectedAnnualSavings = monthlyImpact * 12
      const projectedPeriodSavings = monthlyImpact * months_to_project

      // Generate scenarios
      const scenarios = SimulationHelpers.generateScenarios(currentSpending, currentBudget)

      const result = {
        category,
        current_budget: currentBudget,
        current_spending: currentSpending,
        simulation_type: change_type,
        change_amount,
        budget_impact: budgetImpact,
        projections: {
          monthly_impact: monthlyImpact,
          projected_period_savings: projectedPeriodSavings,
          projected_annual_savings: projectedAnnualSavings,
          months_projected: months_to_project
        },
        alternative_scenarios: scenarios,
        recommendations: this.generateSimulationRecommendations(budgetImpact, currentSpending)
      }

      return { data: result, error: null }

    } catch (err) {
      console.error('Error simulating budget change:', err)
      return { data: null, error: InsightErrors.CALCULATION_ERROR }
    }
  }

  /**
   * Auto-categorize transactions using smart classification (IN-003)
   * @param {Object} transaction
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async suggestTransactionCategory(transaction) {
    try {
      if (!transaction.notes && !transaction.description) {
        return { 
          data: { 
            suggested_category: 'Other', 
            confidence: CategoryConfidence.LOW,
            auto_assign: false 
          }, 
          error: null 
        }
      }

      const description = transaction.notes || transaction.description || ''
      const amount = parseFloat(transaction.amount) || 0

      // Use the category classifier
      const suggestion = CategoryClassifier.suggestCategory(description, amount)

      // Learn from user's historical categorization patterns
      const historicalSuggestion = await this.getHistoricalCategorySuggestion(description)
      if (historicalSuggestion && historicalSuggestion.confidence > suggestion.confidence) {
        return { data: historicalSuggestion, error: null }
      }

      return { data: suggestion, error: null }

    } catch (err) {
      console.error('Error suggesting transaction category:', err)
      return { data: null, error: InsightErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Bulk categorize multiple transactions
   * @param {Array} transactions
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async bulkCategorizeTransactions(transactions) {
    try {
      const results = []

      for (const transaction of transactions) {
        const { data: suggestion } = await this.suggestTransactionCategory(transaction)
        if (suggestion) {
          results.push({
            transaction_id: transaction.id,
            ...suggestion
          })
        }
      }

      return { data: results, error: null }

    } catch (err) {
      console.error('Error bulk categorizing transactions:', err)
      return { data: null, error: InsightErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get comprehensive insights dashboard
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async getInsightsDashboard() {
    try {
      const [savingsResult, trendsResult] = await Promise.all([
        this.generateSavingsSuggestions({ months: 3 }),
        this.getSpendingTrends()
      ])

      const dashboard = {
        savings_suggestions: savingsResult.data || [],
        spending_trends: trendsResult.data || [],
        quick_stats: await this.getQuickInsightStats(),
        action_items: this.generateActionItems(savingsResult.data || [])
      }

      return { data: dashboard, error: null }

    } catch (err) {
      console.error('Error getting insights dashboard:', err)
      return { data: null, error: InsightErrors.UNEXPECTED_ERROR }
    }
  }

  // Private helper methods

  /**
   * Analyze spending by category
   */
  analyzeCategorySpending(expenses) {
    const analysis = {}

    expenses.forEach(expense => {
      const category = expense.category
      const amount = parseFloat(expense.amount)

      if (!analysis[category]) {
        analysis[category] = {
          total: 0,
          count: 0,
          average: 0,
          transactions: []
        }
      }

      analysis[category].total += amount
      analysis[category].count += 1
      analysis[category].transactions.push(expense)
    })

    // Calculate averages
    Object.values(analysis).forEach(data => {
      data.average = data.total / data.count
    })

    return analysis
  }

  /**
   * Generate category-specific saving suggestion
   */
  generateCategorySuggestion(category, data, monthsAnalyzed) {
    const monthlyAverage = data.total / monthsAnalyzed
    
    // Map categories to savings templates
    const categoryMapping = {
      'Food & Drink': 'dining_out',
      'Coffee': 'coffee_shops',
      'Entertainment': 'subscriptions',
      'Transport': 'transport'
    }

    const templateKey = categoryMapping[category] || 'dining_out'
    const template = SavingsTemplates[templateKey]

    if (!template) return null

    const potentialSaving = template.potential_monthly_saving(monthlyAverage)

    return {
      type: InsightTypes.SAVINGS_SUGGESTION,
      priority: potentialSaving > 50 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
      category,
      title: template.title,
      description: template.description,
      potential_saving: potentialSaving,
      current_monthly_spend: Math.round(monthlyAverage),
      actionable_tips: template.actionable_tips,
      confidence: 0.8,
      data_points: data.count
    }
  }

  /**
   * Analyze specific spending patterns
   */
  async analyzeSpendingPatterns(expenses) {
    const patterns = []

    // Group transactions by merchant/description patterns
    const merchantGroups = {}
    
    expenses.forEach(expense => {
      const description = (expense.notes || '').toLowerCase()
      
      // Check for frequent merchants
      for (const [pattern, data] of Object.entries(MerchantPatterns)) {
        if (description.includes(pattern)) {
          if (!merchantGroups[pattern]) {
            merchantGroups[pattern] = {
              pattern,
              category: data.category,
              type: data.type,
              transactions: [],
              total: 0
            }
          }
          merchantGroups[pattern].transactions.push(expense)
          merchantGroups[pattern].total += parseFloat(expense.amount)
        }
      }
    })

    // Generate suggestions for high-frequency merchants
    Object.values(merchantGroups).forEach(group => {
      if (group.transactions.length >= 5 && group.total >= 50) {
        patterns.push({
          type: InsightTypes.COST_OPTIMIZATION,
          priority: InsightPriority.MEDIUM,
          title: `Consider alternatives to ${group.pattern}`,
          description: `You've spent £${group.total.toFixed(2)} at ${group.pattern} in recent months`,
          merchant_pattern: group.pattern,
          frequency: group.transactions.length,
          total_spent: group.total,
          category: group.category
        })
      }
    })

    return patterns
  }

  /**
   * Get historical category suggestion based on user patterns
   */
  async getHistoricalCategorySuggestion(description) {
    try {
      const { user } = await authService.getCurrentUser()
      if (!user) return null

      // Look for similar transaction descriptions in user's history
      const { data: similarTransactions } = await supabase
        .from('expenses')
        .select('category, notes')
        .eq('user_id', user.id)
        .ilike('notes', `%${description.substring(0, 10)}%`)
        .limit(10)

      if (!similarTransactions || similarTransactions.length === 0) {
        return null
      }

      // Find most common category for similar transactions
      const categoryCounts = {}
      similarTransactions.forEach(transaction => {
        const category = transaction.category
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })

      const mostCommonCategory = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)[0]

      if (mostCommonCategory && mostCommonCategory[1] >= 2) {
        return {
          suggested_category: mostCommonCategory[0],
          confidence: CategoryConfidence.HIGH,
          merchant_type: 'historical_pattern',
          reason: `Based on ${mostCommonCategory[1]} similar transactions`,
          auto_assign: mostCommonCategory[1] >= 3
        }
      }

      return null

    } catch (err) {
      console.error('Error getting historical suggestion:', err)
      return null
    }
  }

  /**
   * Generate simulation recommendations
   */
  generateSimulationRecommendations(budgetImpact, currentSpending) {
    const recommendations = []

    if (budgetImpact.impact_level === 'high') {
      recommendations.push('This is a significant budget change that will require lifestyle adjustments')
    }

    if (budgetImpact.difference < 0) {
      recommendations.push('Track your progress weekly to ensure you stay within the new budget')
      recommendations.push('Consider setting up automatic alerts when you reach 75% of your new budget')
    }

    if (currentSpending > budgetImpact.new_budget) {
      recommendations.push('You\'ll need to reduce current spending to meet this new budget target')
    }

    return recommendations
  }

  /**
   * Get spending trends analysis
   */
  async getSpendingTrends() {
    try {
      const { user } = await authService.getCurrentUser()
      if (!user) return { data: null, error: InsightErrors.USER_NOT_AUTHENTICATED }

      // Get last 6 months of data
      const months = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        months.push({
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          name: date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        })
      }

      const trends = []
      for (const monthData of months) {
        const { data: expenses } = await expenseService.getExpenses({
          month: monthData.month,
          year: monthData.year
        })

        const total = expenses ? 
          expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) : 0

        trends.push({
          ...monthData,
          total_spent: total,
          transaction_count: expenses ? expenses.length : 0
        })
      }

      return { data: trends, error: null }

    } catch (err) {
      console.error('Error getting spending trends:', err)
      return { data: null, error: InsightErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get quick insight statistics
   */
  async getQuickInsightStats() {
    try {
      const { data: expenses } = await expenseService.getExpenses({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      })

      if (!expenses) return {}

      const categoryTotals = {}
      expenses.forEach(expense => {
        const category = expense.category
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount)
      })

      const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0]

      return {
        total_transactions: expenses.length,
        top_spending_category: topCategory ? topCategory[0] : null,
        top_category_amount: topCategory ? topCategory[1] : 0,
        average_transaction: expenses.length > 0 ? 
          expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) / expenses.length : 0
      }

    } catch (err) {
      console.error('Error getting quick stats:', err)
      return {}
    }
  }

  /**
   * Generate actionable items from insights
   */
  generateActionItems(suggestions) {
    return suggestions.slice(0, 3).map(suggestion => ({
      title: `Save £${suggestion.potential_saving} on ${suggestion.category}`,
      description: suggestion.actionable_tips[0],
      priority: suggestion.priority,
      potential_impact: suggestion.potential_saving
    }))
  }
}

// Export singleton instance
export const insightService = new InsightService()
export default insightService