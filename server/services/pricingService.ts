import { supabase } from '../lib/supabase.js';

export interface PricingTier {
  id: number;
  product_id: number;
  size_option: string;
  tier_name: string;
  min_quantity: number;
  max_quantity?: number;
  discount_percentage?: number;
  fixed_price?: number;
  customer_type?: string;
  is_active: boolean;
}

export interface PriceCalculation {
  base_price: number;
  discount_amount: number;
  final_price: number;
  tier_applied?: string;
  savings: number;
}

export interface CustomerType {
  type: 'regular' | 'contractor' | 'wholesale' | 'member';
  discount_multiplier: number;
}

// Enhanced pricing service with dynamic tiers and customer types
export class PricingService {
  
  // Get base price from inventory or fallback to static data
  async getBasePrice(productId: number, sizeOption: string, locationId: number = 1): Promise<number> {
    try {
      // Try to get from database first
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('price')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .eq('size_option', sizeOption)
        .single();

      if (!error && inventory) {
        return inventory.price;
      }

      // Fallback to static pricing logic
      return this.getStaticPrice(productId, sizeOption);
    } catch (error) {
      console.warn('Database pricing unavailable, using static pricing:', error);
      return this.getStaticPrice(productId, sizeOption);
    }
  }

  // Static pricing fallback (existing logic from staticInventory.ts)
  private getStaticPrice(productId: number, sizeOption: string): number {
    const staticPrices: Record<string, Record<string, number>> = {
      '1': { // Organic Dairy Compost
        '9lb Bag': 24.99,
        '25lb Bag': 49.99,
        'Bulk (50lb)': 89.99,
        '1 CF Bag': 24.99
      },
      '2': { // Mikey's Worm Poop
        '9lb Bag': 29.99,
        '25lb Bag': 59.99,
        '1 CF Bag': 29.99
      },
      '3': { // Amazonian Dark Earth
        '9lb Bag': 34.99,
        '25lb Bag': 69.99,
        'Bulk (50lb)': 129.99,
        '1 CF Bag': 34.99
      }
    };

    const productPrices = staticPrices[productId.toString()];
    if (productPrices && productPrices[sizeOption]) {
      return productPrices[sizeOption];
    }

    // Dynamic pricing based on size if no specific price found
    const basePrice = 25.00;
    const sizeMultipliers: Record<string, number> = {
      '9lb Bag': 1.0,
      '25lb Bag': 1.8,
      '1.5 CF Bag': 1.5,
      '2 CF Bag': 1.8,
      'Bulk (50lb)': 3.2,
      'Bulk Pickup': 2.5,
      '1 CF Bag': 1.0
    };

    const multiplier = sizeMultipliers[sizeOption] || 1.0;
    return basePrice * multiplier;
  }

  // Get applicable pricing tier for quantity and customer type
  async getPricingTier(
    productId: number, 
    sizeOption: string, 
    quantity: number, 
    customerType: CustomerType['type'] = 'regular'
  ): Promise<PricingTier | null> {
    try {
      const { data: tiers, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('product_id', productId)
        .eq('size_option', sizeOption)
        .eq('is_active', true)
        .lte('min_quantity', quantity)
        .or(`max_quantity.is.null,max_quantity.gte.${quantity}`)
        .or(`customer_type.is.null,customer_type.eq.${customerType}`)
        .order('min_quantity', { ascending: false })
        .limit(1);

      if (error || !tiers || tiers.length === 0) {
        return null;
      }

      return tiers[0];
    } catch (error) {
      console.warn('Error fetching pricing tiers:', error);
      return null;
    }
  }

  // Calculate final price with all discounts applied
  async calculatePrice(
    productId: number,
    sizeOption: string,
    quantity: number,
    customerType: CustomerType['type'] = 'regular',
    locationId: number = 1
  ): Promise<PriceCalculation> {
    const basePrice = await this.getBasePrice(productId, sizeOption, locationId);
    const tier = await this.getPricingTier(productId, sizeOption, quantity, customerType);
    
    let discountAmount = 0;
    let finalPrice = basePrice;
    let tierApplied: string | undefined;
    
    // Apply tier-based pricing
    if (tier) {
      tierApplied = tier.tier_name;
      
      if (tier.fixed_price) {
        // Fixed price override
        finalPrice = tier.fixed_price;
        discountAmount = Math.max(0, basePrice - tier.fixed_price);
      } else if (tier.discount_percentage) {
        // Percentage discount
        discountAmount = basePrice * (tier.discount_percentage / 100);
        finalPrice = basePrice - discountAmount;
      }
    }

    // Apply customer type discounts
    const customerDiscounts: Record<CustomerType['type'], number> = {
      regular: 0,
      contractor: 5, // 5% additional discount
      wholesale: 15, // 15% additional discount
      member: 10 // 10% additional discount
    };

    const customerDiscount = customerDiscounts[customerType];
    if (customerDiscount > 0) {
      const additionalDiscount = finalPrice * (customerDiscount / 100);
      discountAmount += additionalDiscount;
      finalPrice -= additionalDiscount;
    }

    // Volume discounts for large quantities (progressive)
    if (quantity >= 50) {
      const volumeDiscount = finalPrice * 0.05; // 5% for 50+
      discountAmount += volumeDiscount;
      finalPrice -= volumeDiscount;
      tierApplied = tierApplied ? `${tierApplied} + Volume` : 'Volume Discount';
    } else if (quantity >= 20) {
      const volumeDiscount = finalPrice * 0.03; // 3% for 20+
      discountAmount += volumeDiscount;
      finalPrice -= volumeDiscount;
      tierApplied = tierApplied ? `${tierApplied} + Volume` : 'Volume Discount';
    } else if (quantity >= 10) {
      const volumeDiscount = finalPrice * 0.02; // 2% for 10+
      discountAmount += volumeDiscount;
      finalPrice -= volumeDiscount;
      tierApplied = tierApplied ? `${tierApplied} + Volume` : 'Volume Discount';
    }

    return {
      base_price: basePrice,
      discount_amount: discountAmount,
      final_price: Math.max(finalPrice, basePrice * 0.7), // Min 30% off maximum
      tier_applied: tierApplied,
      savings: discountAmount
    };
  }

  // Batch price calculation for cart items
  async calculateCartPricing(items: Array<{
    productId: number;
    sizeOption: string;
    quantity: number;
  }>, customerType: CustomerType['type'] = 'regular', locationId: number = 1) {
    
    const calculations = await Promise.all(
      items.map(item => 
        this.calculatePrice(item.productId, item.sizeOption, item.quantity, customerType, locationId)
      )
    );

    const subtotal = calculations.reduce((sum, calc, index) => 
      sum + (calc.final_price * items[index].quantity), 0
    );

    const totalSavings = calculations.reduce((sum, calc, index) => 
      sum + (calc.savings * items[index].quantity), 0
    );

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Apply cart-wide discounts for large orders
    let cartDiscount = 0;
    let cartDiscountReason = '';

    if (subtotal >= 1000) {
      cartDiscount = subtotal * 0.1; // 10% for orders over $1000
      cartDiscountReason = 'Large Order Discount (10%)';
    } else if (subtotal >= 500) {
      cartDiscount = subtotal * 0.05; // 5% for orders over $500
      cartDiscountReason = 'Large Order Discount (5%)';
    }

    return {
      items: calculations.map((calc, index) => ({
        ...calc,
        quantity: items[index].quantity,
        line_total: calc.final_price * items[index].quantity
      })),
      subtotal,
      cart_discount: cartDiscount,
      cart_discount_reason: cartDiscountReason,
      total_savings: totalSavings + cartDiscount,
      final_total: subtotal - cartDiscount,
      total_items: totalItems
    };
  }

  // Admin: Create or update pricing tier
  async setPricingTier(tier: Omit<PricingTier, 'id'>): Promise<PricingTier | null> {
    try {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .upsert(tier)
        .select()
        .single();

      if (error) {
        console.error('Error setting pricing tier:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error setting pricing tier:', error);
      return null;
    }
  }

  // Admin: Bulk import pricing from CSV data
  async importPricingFromCSV(csvData: Array<{
    productId: number;
    sizeOption: string;
    price: number;
    tierName?: string;
    minQuantity?: number;
    discountPercentage?: number;
  }>): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    for (const item of csvData) {
      try {
        const tier: Omit<PricingTier, 'id'> = {
          product_id: item.productId,
          size_option: item.sizeOption,
          tier_name: item.tierName || 'retail',
          min_quantity: item.minQuantity || 1,
          max_quantity: null,
          discount_percentage: item.discountPercentage || 0,
          fixed_price: item.price,
          customer_type: 'regular',
          is_active: true
        };

        const result = await this.setPricingTier(tier);
        if (result) {
          success++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error('Error importing pricing item:', error);
        errors++;
      }
    }

    return { success, errors };
  }
}

// Export singleton instance
export const pricingService = new PricingService();