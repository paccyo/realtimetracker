"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CouponCardProps {
  storeId: string;
  couponTitle: string;
  couponPer: string;
  onIssueCoupon: (storeId: string, couponTitle: string, couponPer: string) => void;
  onClose: () => void;
}

export function CouponCard({ storeId, couponTitle, couponPer, onIssueCoupon, onClose }: CouponCardProps) {
  const handleIssueClick = () => {
    onIssueCoupon(storeId, couponTitle, couponPer);
    onClose(); // Close the card after issuing the coupon
  };

  return (
    <Card className="w-[300px]">
      <CardHeader>
        <CardTitle>AI Coupon Recommendation</CardTitle>
        <CardDescription>Recommended for Store: {storeId}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{couponTitle}</p>
        <p className="text-md">Discount: {couponPer}%</p>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleIssueClick}>Issue Coupon</Button>
        </div>
      </CardContent>
    </Card>
  );
}
