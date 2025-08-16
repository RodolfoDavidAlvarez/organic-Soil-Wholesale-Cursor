import { Router } from 'express';
import { pricingService, CustomerType } from '../services/pricingService.js';

const router = Router();

// Get price for a single product
router.get('/product/:productId/:sizeOption', async (req, res) => {
  try {
    const { productId, sizeOption } = req.params;
    const { quantity = 1, customerType = 'regular', locationId = 1 } = req.query;

    const pricing = await pricingService.calculatePrice(
      parseInt(productId),
      sizeOption,
      parseInt(quantity as string),
      customerType as CustomerType['type'],
      parseInt(locationId as string)
    );

    res.json({
      success: true,
      pricing
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate price'
    });
  }
});

// Calculate pricing for entire cart
router.post('/cart', async (req, res) => {
  try {
    const { items, customerType = 'regular', locationId = 1 } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const cartPricing = await pricingService.calculateCartPricing(
      items,
      customerType as CustomerType['type'],
      parseInt(locationId)
    );

    res.json({
      success: true,
      cartPricing
    });
  } catch (error) {
    console.error('Error calculating cart pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cart pricing'
    });
  }
});

// Get all pricing tiers for a product
router.get('/tiers/:productId/:sizeOption', async (req, res) => {
  try {
    const { productId, sizeOption } = req.params;
    const { customerType = 'regular' } = req.query;

    // Get tiers for different quantities to show pricing breaks
    const quantities = [1, 5, 10, 20, 50, 100];
    const pricingBreaks = await Promise.all(
      quantities.map(async (quantity) => {
        const pricing = await pricingService.calculatePrice(
          parseInt(productId),
          sizeOption,
          quantity,
          customerType as CustomerType['type']
        );
        return {
          quantity,
          ...pricing
        };
      })
    );

    res.json({
      success: true,
      pricingBreaks
    });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing tiers'
    });
  }
});

// Admin: Create pricing tier
router.post('/admin/tier', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const tier = req.body;
    const result = await pricingService.setPricingTier(tier);

    if (result) {
      res.json({
        success: true,
        tier: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to create pricing tier'
      });
    }
  } catch (error) {
    console.error('Error creating pricing tier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pricing tier'
    });
  }
});

// Admin: Bulk import pricing from CSV
router.post('/admin/import-csv', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const { csvData } = req.body;

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        success: false,
        error: 'CSV data array is required'
      });
    }

    const result = await pricingService.importPricingFromCSV(csvData);

    res.json({
      success: true,
      imported: result.success,
      errors: result.errors,
      total: csvData.length
    });
  } catch (error) {
    console.error('Error importing CSV pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import CSV pricing'
    });
  }
});

// Get pricing comparison for different customer types
router.get('/compare/:productId/:sizeOption', async (req, res) => {
  try {
    const { productId, sizeOption } = req.params;
    const { quantity = 1, locationId = 1 } = req.query;

    const customerTypes: CustomerType['type'][] = ['regular', 'contractor', 'wholesale', 'member'];
    
    const comparisons = await Promise.all(
      customerTypes.map(async (customerType) => {
        const pricing = await pricingService.calculatePrice(
          parseInt(productId),
          sizeOption,
          parseInt(quantity as string),
          customerType,
          parseInt(locationId as string)
        );
        return {
          customerType,
          ...pricing
        };
      })
    );

    res.json({
      success: true,
      comparisons
    });
  } catch (error) {
    console.error('Error comparing pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare pricing'
    });
  }
});

// Get volume discount information
router.get('/volume-discounts', async (req, res) => {
  try {
    const volumeDiscounts = [
      { min_quantity: 1, max_quantity: 9, discount: '0%', description: 'Regular pricing' },
      { min_quantity: 10, max_quantity: 19, discount: '2%', description: 'Small volume discount' },
      { min_quantity: 20, max_quantity: 49, discount: '3%', description: 'Medium volume discount' },
      { min_quantity: 50, max_quantity: null, discount: '5%', description: 'Large volume discount' }
    ];

    const customerTypeDiscounts = [
      { type: 'regular', discount: '0%', description: 'Standard retail pricing' },
      { type: 'contractor', discount: '5%', description: 'Licensed contractor discount' },
      { type: 'member', discount: '10%', description: 'Membership program discount' },
      { type: 'wholesale', discount: '15%', description: 'Wholesale account discount' }
    ];

    res.json({
      success: true,
      volumeDiscounts,
      customerTypeDiscounts
    });
  } catch (error) {
    console.error('Error fetching volume discounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volume discounts'
    });
  }
});

export default router;