/**
 * Intelligent Insights Domain Types
 * Business logic for AI recommendations and smart categorization
 */

export const InsightTypes = {
  SAVINGS_SUGGESTION: 'savings_suggestion',
  BUDGET_SIMULATION: 'budget_simulation',
  CATEGORY_RECOMMENDATION: 'category_recommendation',
  SPENDING_PATTERN: 'spending_pattern',
  COST_OPTIMIZATION: 'cost_optimization'
}

export const InsightPriority = {
  HIGH: 'high',
  MEDIUM: 'medium', 
  LOW: 'low'
}

export const SimulationTypes = {
  CATEGORY_REDUCTION: 'category_reduction',
  CATEGORY_INCREASE: 'category_increase',
  NEW_BUDGET_CATEGORY: 'new_budget_category',
  BUDGET_REALLOCATION: 'budget_reallocation'
}

export const CategoryConfidence = {
  VERY_HIGH: 'very_high',   // 95%+
  HIGH: 'high',             // 85-94%
  MEDIUM: 'medium',         // 70-84%
  LOW: 'low'                // 50-69%
}

// Common merchant/transaction patterns for auto-categorization
export const MerchantPatterns = {
  // Food & Dining
  'pret': { category: 'Food & Drink', confidence: CategoryConfidence.VERY_HIGH, type: 'coffee_lunch' },
  'starbucks': { category: 'Food & Drink', confidence: CategoryConfidence.VERY_HIGH, type: 'coffee' },
  'costa': { category: 'Food & Drink', confidence: CategoryConfidence.VERY_HIGH, type: 'coffee' },
  'mcdonalds': { category: 'Food & Drink', confidence: CategoryConfidence.VERY_HIGH, type: 'fast_food' },
  'subway': { category: 'Food & Drink', confidence: CategoryConfidence.VERY_HIGH, type: 'fast_food' },
  'tesco': { category: 'Groceries', confidence: CategoryConfidence.HIGH, type: 'supermarket' },
  'sainsburys': { category: 'Groceries', confidence: CategoryConfidence.HIGH, type: 'supermarket' },
  'asda': { category: 'Groceries', confidence: CategoryConfidence.HIGH, type: 'supermarket' },
  'waitrose': { category: 'Groceries', confidence: CategoryConfidence.HIGH, type: 'supermarket' },
  'morrisons': { category: 'Groceries', confidence: CategoryConfidence.HIGH, type: 'supermarket' },
  
  // Transport
  'uber': { category: 'Transport', confidence: CategoryConfidence.HIGH, type: 'taxi' },
  'lyft': { category: 'Transport', confidence: CategoryConfidence.HIGH, type: 'taxi' },
  'tfl': { category: 'Transport', confidence: CategoryConfidence.VERY_HIGH, type: 'public_transport' },
  'trainline': { category: 'Transport', confidence: CategoryConfidence.VERY_HIGH, type: 'train' },
  'shell': { category: 'Transport', confidence: CategoryConfidence.MEDIUM, type: 'fuel' },
  'bp': { category: 'Transport', confidence: CategoryConfidence.MEDIUM, type: 'fuel' },
  'esso': { category: 'Transport', confidence: CategoryConfidence.MEDIUM, type: 'fuel' },
  
  // Entertainment
  'netflix': { category: 'Entertainment', confidence: CategoryConfidence.VERY_HIGH, type: 'streaming' },
  'spotify': { category: 'Entertainment', confidence: CategoryConfidence.VERY_HIGH, type: 'streaming' },
  'amazon prime': { category: 'Entertainment', confidence: CategoryConfidence.HIGH, type: 'streaming' },
  'disney+': { category: 'Entertainment', confidence: CategoryConfidence.VERY_HIGH, type: 'streaming' },
  'cinema': { category: 'Entertainment', confidence: CategoryConfidence.HIGH, type: 'movies' },
  'odeon': { category: 'Entertainment', confidence: CategoryConfidence.VERY_HIGH, type: 'movies' },
  'vue': { category: 'Entertainment', confidence: CategoryConfidence.VERY_HIGH, type: 'movies' },
  
  // Shopping
  'amazon': { category: 'Shopping', confidence: CategoryConfidence.HIGH, type: 'online' },
  'ebay': { category: 'Shopping', confidence: CategoryConfidence.HIGH, type: 'online' },
  'argos': { category: 'Shopping', confidence: CategoryConfidence.HIGH, type: 'retail' },
  'john lewis': { category: 'Shopping', confidence: CategoryConfidence.HIGH, type: 'retail' },
  'next': { category: 'Shopping', confidence: CategoryConfidence.HIGH, type: 'clothing' },
  'zara': { category: 'Shopping', confidence: CategoryConfidence.HIGH, type: 'clothing' },
  'h&m': { category: 'Shopping', confidence: CategoryConfidence.HIGH, type: 'clothing' },
  
  // Health & Fitness
  'boots': { category: 'Health & Fitness', confidence: CategoryConfidence.HIGH, type: 'pharmacy' },
  'superdrug': { category: 'Health & Fitness', confidence: CategoryConfidence.HIGH, type: 'pharmacy' },
  'gym': { category: 'Health & Fitness', confidence: CategoryConfidence.HIGH, type: 'fitness' },
  'puregym': { category: 'Health & Fitness', confidence: CategoryConfidence.VERY_HIGH, type: 'fitness' },
  
  // Utilities & Bills
  'british gas': { category: 'Utilities', confidence: CategoryConfidence.VERY_HIGH, type: 'energy' },
  'eon': { category: 'Utilities', confidence: CategoryConfidence.VERY_HIGH, type: 'energy' },
  'vodafone': { category: 'Utilities', confidence: CategoryConfidence.VERY_HIGH, type: 'phone' },
  'ee': { category: 'Utilities', confidence: CategoryConfidence.VERY_HIGH, type: 'phone' },
  'three': { category: 'Utilities', confidence: CategoryConfidence.VERY_HIGH, type: 'phone' },
  'bt': { category: 'Utilities', confidence: CategoryConfidence.HIGH, type: 'broadband' },
  'sky': { category: 'Utilities', confidence: CategoryConfidence.HIGH, type: 'broadband_tv' }
}

// Thresholds for generating insights
export const InsightThresholds = {
  MINIMUM_TRANSACTIONS: 3,      // Minimum transactions needed for pattern analysis
  SAVINGS_OPPORTUNITY: 20,      // Minimum £ amount to suggest savings
  HIGH_SPENDING_THRESHOLD: 0.8, // 80% of budget used triggers suggestion
  TREND_ANALYSIS_MONTHS: 3,     // Months to analyze for trends
  CONFIDENCE_THRESHOLD: 0.7     // 70% confidence needed for auto-suggestions
}

// Savings suggestion templates
export const SavingsTemplates = {
  dining_out: {
    title: "Consider Meal Prep Instead of Dining Out",
    description: "You could save by preparing meals at home instead of eating out frequently",
    potential_monthly_saving: (current_spend) => Math.round(current_spend * 0.4),
    actionable_tips: [
      "Try meal prepping on Sundays for the week ahead",
      "Set a dining out budget and stick to it",
      "Look for lunch deals and happy hours when you do eat out"
    ]
  },
  coffee_shops: {
    title: "Make Coffee at Home",
    description: "Daily coffee shop visits add up quickly over the month",
    potential_monthly_saving: (current_spend) => Math.round(current_spend * 0.6),
    actionable_tips: [
      "Invest in a good coffee machine or French press",
      "Buy quality coffee beans in bulk",
      "Limit coffee shop visits to 2-3 times per week"
    ]
  },
  subscriptions: {
    title: "Review Subscription Services",
    description: "Multiple subscriptions might be costing more than you realize",
    potential_monthly_saving: (current_spend) => Math.round(current_spend * 0.3),
    actionable_tips: [
      "Cancel subscriptions you rarely use",
      "Share family plans with household members",
      "Look for annual discounts instead of monthly payments"
    ]
  },
  transport: {
    title: "Optimize Transport Costs",
    description: "Consider more cost-effective transport options",
    potential_monthly_saving: (current_spend) => Math.round(current_spend * 0.25),
    actionable_tips: [
      "Use public transport instead of taxis when possible",
      "Consider walking or cycling for short distances",
      "Look into monthly travel passes if you commute regularly"
    ]
  }
}

// Budget simulation helpers
export const SimulationHelpers = {
  /**
   * Calculate impact of budget change
   */
  calculateBudgetImpact: (originalBudget, proposedChange, changeType) => {
    let newBudget = originalBudget
    
    switch (changeType) {
      case SimulationTypes.CATEGORY_REDUCTION:
        newBudget = Math.max(0, originalBudget - Math.abs(proposedChange))
        break
      case SimulationTypes.CATEGORY_INCREASE:
        newBudget = originalBudget + Math.abs(proposedChange)
        break
      default:
        newBudget = proposedChange
    }
    
    const difference = newBudget - originalBudget
    const percentageChange = originalBudget > 0 ? (difference / originalBudget) * 100 : 0
    
    return {
      original_budget: originalBudget,
      new_budget: newBudget,
      difference,
      percentage_change: Math.round(percentageChange * 100) / 100,
      impact_level: Math.abs(percentageChange) > 25 ? 'high' : 
                   Math.abs(percentageChange) > 10 ? 'medium' : 'low'
    }
  },

  /**
   * Generate simulation scenarios
   */
  generateScenarios: (currentSpending, budgetLimit) => {
    const scenarios = []
    
    // Conservative reduction (10%)
    scenarios.push({
      name: 'Conservative Savings',
      description: 'Reduce spending by 10%',
      type: SimulationTypes.CATEGORY_REDUCTION,
      change_amount: Math.round(currentSpending * 0.1),
      projected_savings: Math.round(currentSpending * 0.1),
      difficulty: 'easy'
    })
    
    // Moderate reduction (25%)
    scenarios.push({
      name: 'Moderate Savings',
      description: 'Reduce spending by 25%',
      type: SimulationTypes.CATEGORY_REDUCTION,
      change_amount: Math.round(currentSpending * 0.25),
      projected_savings: Math.round(currentSpending * 0.25),
      difficulty: 'medium'
    })
    
    // Aggressive reduction (40%)
    scenarios.push({
      name: 'Aggressive Savings',
      description: 'Reduce spending by 40%',
      type: SimulationTypes.CATEGORY_REDUCTION,
      change_amount: Math.round(currentSpending * 0.4),
      projected_savings: Math.round(currentSpending * 0.4),
      difficulty: 'hard'
    })
    
    return scenarios
  }
}

// Category classification helpers
export const CategoryClassifier = {
  /**
   * Analyze transaction description for category suggestions
   */
  suggestCategory: (description, amount = 0) => {
    const cleanDesc = description.toLowerCase().trim()
    
    // Direct merchant pattern matching
    for (const [pattern, data] of Object.entries(MerchantPatterns)) {
      if (cleanDesc.includes(pattern)) {
        return {
          suggested_category: data.category,
          confidence: data.confidence,
          merchant_type: data.type,
          reason: `Recognized merchant: ${pattern}`,
          auto_assign: data.confidence === CategoryConfidence.VERY_HIGH
        }
      }
    }
    
    // Keyword-based classification
    const keywords = {
      'Food & Drink': ['restaurant', 'cafe', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 'food'],
      'Groceries': ['grocery', 'supermarket', 'food shopping', 'weekly shop'],
      'Transport': ['taxi', 'bus', 'train', 'petrol', 'fuel', 'parking', 'car'],
      'Entertainment': ['cinema', 'movie', 'concert', 'show', 'theatre', 'game'],
      'Shopping': ['shop', 'store', 'retail', 'purchase', 'buy'],
      'Health & Fitness': ['pharmacy', 'doctor', 'dentist', 'gym', 'fitness', 'health'],
      'Utilities': ['electric', 'gas', 'water', 'phone', 'internet', 'broadband']
    }
    
    for (const [category, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (cleanDesc.includes(word)) {
          return {
            suggested_category: category,
            confidence: CategoryConfidence.MEDIUM,
            merchant_type: 'keyword_match',
            reason: `Keyword match: ${word}`,
            auto_assign: false
          }
        }
      }
    }
    
    // Amount-based suggestions (fallback)
    if (amount > 100) {
      return {
        suggested_category: 'Shopping',
        confidence: CategoryConfidence.LOW,
        merchant_type: 'amount_based',
        reason: 'Large amount suggests shopping',
        auto_assign: false
      }
    }
    
    return {
      suggested_category: 'Other',
      confidence: CategoryConfidence.LOW,
      merchant_type: 'unknown',
      reason: 'No pattern recognized',
      auto_assign: false
    }
  }
}

export const InsightValidation = {
  validateInsight: (insight) => {
    const errors = []
    
    if (!insight.type || !Object.values(InsightTypes).includes(insight.type)) {
      errors.push('Invalid insight type')
    }
    
    if (!insight.title || insight.title.length < 3) {
      errors.push('Title must be at least 3 characters')
    }
    
    if (!insight.description || insight.description.length < 10) {
      errors.push('Description must be at least 10 characters')
    }
    
    if (insight.type === InsightTypes.SAVINGS_SUGGESTION) {
      if (!insight.potential_saving || insight.potential_saving <= 0) {
        errors.push('Savings suggestion must have positive potential saving')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export const InsightErrors = {
  INVALID_INSIGHT_TYPE: 'Invalid insight type provided',
  INSUFFICIENT_DATA: 'Not enough data to generate insights',
  CALCULATION_ERROR: 'Error calculating insight recommendations',
  DATABASE_ERROR: 'Database error while processing insights',
  USER_NOT_AUTHENTICATED: 'User must be authenticated to access insights',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}