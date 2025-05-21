import React from "react";
import { OrderForm } from "@/components/OrderForm";

const Order: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Place Your Order</h1>
      <OrderForm />
    </div>
  );
};

export default Order;
