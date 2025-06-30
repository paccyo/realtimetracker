"use client";

import React, { useState, useCallback } from 'react';
import MapSelectionTool from '@/components/MapSelectionTool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Link from "next/link";

interface StoreSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SettingsPage = () => {
  const [selectedArea, setSelectedArea] = useState<StoreSelection | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('');
  const { toast } = useToast();

  const handleSelectionComplete = useCallback((selection: { x: number; y: number; width: number; height: number } | null) => {
    setSelectedArea(selection);
  }, []);

  const handleSaveStore = async () => {
    if (!selectedArea) {
      toast({
        title: "Selection Required",
        description: "Please select an area on the map for the store.",
        variant: "destructive",
      });
      return;
    }
    if (!storeName.trim()) {
      toast({
        title: "Store Name Required",
        description: "Please enter a name for the store.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(firestore, "stores"), {
        name: storeName,
        category: storeCategory,
        positionX: selectedArea.x,
        positionY: selectedArea.y,
        sizeX: selectedArea.width,
        sizeY: selectedArea.height,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Store Saved",
        description: `Store '${storeName}' saved successfully.`, 
      });
      // Clear form after saving
      setSelectedArea(null);
      setStoreName('');
      setStoreCategory('');
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        title: "Error Saving Store",
        description: "Failed to save store data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Store Settings</h1>
      <Link href="/">
        <Button variant="outline" className="mb-4">Back to Home</Button>
      </Link>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative w-full h-full border rounded-lg overflow-hidden">
          <MapSelectionTool onSelectionComplete={handleSelectionComplete} />
        </div>
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
          <div>
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g., Main Entrance Cafe"
            />
          </div>
          <div>
            <Label htmlFor="storeCategory">Store Category</Label>
            <Input
              id="storeCategory"
              value={storeCategory}
              onChange={(e) => setStoreCategory(e.target.value)}
              placeholder="e.g., Cafe, Retail, Restroom"
            />
          </div>
          {selectedArea && (
            <div className="text-sm text-muted-foreground">
              <p>Selected Area: </p>
              <p>X: {selectedArea.x.toFixed(2)}, Y: {selectedArea.y.toFixed(2)}</p>
              <p>Width: {selectedArea.width.toFixed(2)}, Height: {selectedArea.height.toFixed(2)}</p>
            </div>
          )}
          <Button onClick={handleSaveStore} className="mt-auto">Save Store</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;