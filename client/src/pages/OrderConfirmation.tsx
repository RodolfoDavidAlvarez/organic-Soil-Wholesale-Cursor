import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Phone, MapPin, Clock, Home } from 'lucide-react';
import { useLocation } from 'wouter';

interface OrderDetails {
  orderId: string;
  confirmationCode: string;
  items: number;
  pickupTime: string;
}

const OrderConfirmation: React.FC = () => {
  const [, navigate] = useLocation();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // Get order details from localStorage or URL params
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      setOrderDetails(JSON.parse(savedOrder));
      // Clear the saved order
      localStorage.removeItem('lastOrder');
    }
  }, []);

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No order found</h2>
            <Button onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPickupTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Your order has been successfully placed</p>
        </div>

        {/* Order Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confirmation Code</span>
              <span className="font-mono font-bold text-lg text-primary">
                {orderDetails.confirmationCode}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Order ID</span>
              <span className="font-mono">#{orderDetails.orderId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Items</span>
              <span>{orderDetails.items} items</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pickup Time</span>
              <span className="font-medium text-green-600">
                {formatPickupTime(orderDetails.pickupTime)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Pickup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Drive to Phoenix Warehouse</p>
                  <p className="text-sm text-gray-600">123 Main Street, Phoenix, AZ 85001</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Park in "Order Pickup" area</p>
                  <p className="text-sm text-gray-600">Look for the designated pickup signs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Call when you arrive</p>
                  <p className="text-sm text-gray-600">Have your confirmation code ready</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">We'll load your order</p>
                  <p className="text-sm text-gray-600">Stay in your vehicle - we'll handle the rest!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => window.location.href = 'tel:+16025550123'}
          >
            <Phone className="w-5 h-5 mr-2" />
            Call Warehouse: (602) 555-0123
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://maps.google.com/?q=123+Main+Street+Phoenix+AZ+85001', '_blank')}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Get Directions
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Warehouse Hours
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>Monday - Friday: 7:00 AM - 5:00 PM</p>
            <p>Saturday: 8:00 AM - 2:00 PM</p>
            <p>Sunday: Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;