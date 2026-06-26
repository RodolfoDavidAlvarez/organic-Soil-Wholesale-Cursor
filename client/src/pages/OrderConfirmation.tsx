import React, { useEffect, useState } from 'react';
import SEO from '@/components/layout/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Phone, MapPin, Clock, Home, Truck } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
  PHOENIX_YARD_ADDRESS,
  PHOENIX_YARD_DIRECTIONS_URL,
} from '@/config/contact';

interface OrderDetails {
  orderId: string;
  confirmationCode?: string;
  items: number;
  pickupTime?: string | null;
  pickupReadyLabel?: string | null;
  /** 'pickup' | 'delivery' (older orders may not have this) */
  fulfillment?: 'pickup' | 'delivery';
  deliveryZip?: string | null;
}

const PHOENIX_YARD_PHONE_DISPLAY = CUSTOMER_SUPPORT_PHONE_DISPLAY;
const PHOENIX_YARD_PHONE_TEL = CUSTOMER_SUPPORT_PHONE_TEL;

const OrderConfirmation: React.FC = () => {
  const [, navigate] = useLocation();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // Prefer localStorage (set by Checkout right before navigation). If that
    // didn't survive (private mode, tab swap, hard refresh), fall back to the
    // order_id from the URL query so we still show something useful instead of
    // a blank "No order found" page.
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      try {
        setOrderDetails(JSON.parse(savedOrder));
      } catch {
        setOrderDetails(null);
      }
      // NOTE: do NOT remove from localStorage — keep it so a page refresh after
      // checkout still shows the confirmation instead of "No order found".
      return;
    }
    // Fallback to URL-driven minimal view
    try {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('order_id');
      if (orderId) {
        setOrderDetails({ orderId, items: 0 });
      }
    } catch {}
  }, []);

  if (!orderDetails) {
    return (
      <>
        <SEO title="Order Confirmation" canonical="https://organicsoilwholesale.com/order-confirmation" robots="noindex, nofollow" />
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">No order found</h2>
              <Button onClick={() => navigate('/')} size="lg" className="min-h-[48px]">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const isDelivery = orderDetails.fulfillment === 'delivery';

  const formatPickupTime = (isoString?: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Phoenix',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const pickupTimeLabel =
    orderDetails.pickupReadyLabel || formatPickupTime(orderDetails.pickupTime);

  return (
    <>
      <SEO title="Order Confirmation" canonical="https://organicsoilwholesale.com/order-confirmation" robots="noindex, nofollow" />
      <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Order Confirmed</h1>
          <p className="text-stone-600">
            {isDelivery
              ? "We'll call to schedule delivery shortly."
              : "Your order has been placed."}
          </p>
        </div>

        {/* Order details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderDetails.confirmationCode && (
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Confirmation Code</span>
                <span className="font-mono font-bold text-lg text-primary">
                  {orderDetails.confirmationCode}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-stone-600">Order ID</span>
              <span className="font-mono">#{orderDetails.orderId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-600">Items</span>
              <span>{orderDetails.items} {orderDetails.items === 1 ? 'item' : 'items'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-600">Fulfillment</span>
              <span className="font-medium text-stone-900 inline-flex items-center gap-1.5">
                {isDelivery ? <Truck className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                {isDelivery ? 'Delivery' : 'Pickup'}
              </span>
            </div>

            {isDelivery && orderDetails.deliveryZip && (
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Delivery ZIP</span>
                <span className="font-medium text-stone-900">{orderDetails.deliveryZip}</span>
              </div>
            )}

            {!isDelivery && pickupTimeLabel && (
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Estimated ready</span>
                <span className="font-medium text-green-700">{pickupTimeLabel}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pickup vs Delivery instructions */}
        {isDelivery ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Step n={1} title="We'll call you within 1 business day" body="To confirm delivery date and any site access details." />
                <Step n={2} title="Driver dispatch from Phoenix yard" body={`Loading from ${PHOENIX_YARD_ADDRESS}.`} />
                <Step n={3} title="Truck arrives on your scheduled day" body="Walking-floor or flatbed depending on what you ordered." />
                <Step n={4} title="Material delivered to your site" body="We'll handle unloading per truck type. Please be available to direct placement." />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Pickup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Step n={1} title="Drive to the Phoenix yard" body={PHOENIX_YARD_ADDRESS} />
                <Step n={2} title="Pull into the yard" body="Look for the loading area." />
                <Step
                  n={3}
                  title="Call when you arrive"
                  body={`Have your ${orderDetails.confirmationCode ? 'confirmation code' : `order number #${orderDetails.orderId}`} ready.`}
                />
                <Step n={4} title="We'll load your order" body="Stay with your vehicle, we'll handle the rest." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full min-h-[48px]"
            onClick={() => { window.location.href = PHOENIX_YARD_PHONE_TEL; }}
          >
            <Phone className="w-5 h-5 mr-2" />
            Call {PHOENIX_YARD_PHONE_DISPLAY}
          </Button>

          {!isDelivery && (
            <Button
              size="lg"
              variant="outline"
              className="w-full min-h-[48px]"
              onClick={() => { window.open(PHOENIX_YARD_DIRECTIONS_URL, '_blank'); }}
            >
              <MapPin className="w-5 h-5 mr-2" />
              Get Directions
            </Button>
          )}

          <Button
            size="lg"
            variant="ghost"
            className="w-full min-h-[48px]"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </Button>
        </div>

        {/* Yard hours */}
        <div className="mt-8 bg-stone-100 rounded-lg p-4">
          <h3 className="font-medium text-stone-900 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Phoenix yard hours
          </h3>
          <div className="text-sm text-stone-700 space-y-1">
            <p>Tuesday - Saturday: 8:00 AM - 4:00 PM</p>
            <p>Closed daily 1:00 PM - 2:00 PM (lunch)</p>
            <p>Sunday & Monday: Closed</p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

interface StepProps { n: number; title: string; body: string }
const Step: React.FC<StepProps> = ({ n, title, body }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-primary">{n}</span>
    </div>
    <div>
      <p className="font-medium text-stone-900">{title}</p>
      <p className="text-sm text-stone-600">{body}</p>
    </div>
  </div>
);

export default OrderConfirmation;
