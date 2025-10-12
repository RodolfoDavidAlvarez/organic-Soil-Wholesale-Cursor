# Organic Soil Wholesale - Project Vision & Status

## Current Mission (December 2024)

**Creating a mobile-first ordering system for landscapers via QR code on physical banner**

### Real-World Context

- **Physical Location**: Organic Soil Wholesale facility with large banner display
- **Target Users**: Professional landscapers driving by who scan QR code
- **Business Goal**: Convert drive-by traffic into immediate orders
- **User Journey**: See banner → Scan QR → Select needs → Place order (2-3 taps max)

## Current Implementation Status

### ✅ Completed

1. **Pay & Pickup Landing Page** (`/pay-and-pickup`, legacy `/drive-through`)
   - Mobile-optimized interface without header/footer distractions
   - Two-step selection process (Purpose → Plant Type)
   - Smart product recommendations based on selections
   - Direct call/text/quote actions
   - Analytics tracking for user behavior

### 🎯 Future Vision

- This Pay & Pickup landing may become the DEFAULT ordering interface for ALL users
- Previously named "QR Landing" for identification, now accessible via `/drive-through` for better UX
- Designed to be the simplest, fastest way to order wholesale soil

## Key Business Insights

### Customer Psychology

1. **Landscapers are busy** - Need instant, no-friction ordering
2. **Mobile-first** - 90% of users on phones (often in trucks)
3. **Visual learners** - Show texture photos first, not product bags
4. **Action-oriented** - Want to order NOW, not browse

### Design Principles

1. **Bold & Simple** - Large buttons, clear choices
2. **Minimal Steps** - Maximum 3 taps to order
3. **No Jargon** - Simple language, not manufacturer terms
4. **Visual First** - Product texture photos as primary images

## Technical Framework

### When User Provides Direction:

1. **Capture Intent** - What problem are they solving?
2. **Understand Context** - Physical location, user scenario
3. **Design for Reality** - How will this work in a truck?
4. **Measure Success** - Track conversions, not just visits

### Development Priorities:

1. **Mobile Performance** - Fast load on 4G in parking lot
2. **Touch Targets** - Minimum 44px for gloved hands
3. **Offline Capability** - Consider poor signal areas
4. **Direct Actions** - Phone calls, SMS, instant quotes

## Next Steps & Opportunities

### Immediate Improvements:

- [ ] Add product availability status
- [ ] Include bulk pricing tiers
- [ ] Add "Frequent Orders" for returning customers
- [ ] Implement SMS order confirmation

### Future Expansions:

- [ ] GPS-based delivery estimates
- [ ] Photo upload for "match this soil"
- [ ] Loyalty program for contractors
- [ ] Integration with QuickBooks for invoicing

## Success Metrics

- **Conversion Rate**: QR Scan → Order Request
- **Time to Order**: Target < 30 seconds
- **Return Users**: Track repeat QR scans
- **Most Selected**: Track popular products/categories

---

## Development Notes

- Always test on real phones in sunlight
- Consider one-handed operation
- Account for dirty/gloved hands
- Optimize for speed over beauty
- Focus on closing sales, not educating
