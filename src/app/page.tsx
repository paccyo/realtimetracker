"use client";

import { useEffect, useState, useCallback } from "react";
import { getDatabase, ref as databaseRef, onValue } from "firebase/database";
import { firebaseApp } from "@/lib/firebase";
import type { DeviceData } from "@/types";

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DeviceSelector } from "@/components/DeviceSelector";
import { MapDisplay } from "@/components/MapDisplay";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // For potential future actions
import { PanelLeft } from "lucide-react";


export default function HomePage() {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [allDeviceIds, setAllDeviceIds] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const devicesRefPath = "devices"; // Path to your devices data in RTDB
    const devicesRef = databaseRef(db, devicesRefPath);

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDeviceData(data as DeviceData);
        const currentDeviceIds = Object.keys(data);
        setAllDeviceIds(currentDeviceIds);
        
        // Auto-select all devices initially or if selection becomes empty
        setSelectedDevices(prevSelected => {
          if (prevSelected.length === 0 && currentDeviceIds.length > 0) {
            return [...currentDeviceIds]; // Select all new devices
          }
          // Filter out devices that no longer exist, keep existing selections
          return prevSelected.filter(id => currentDeviceIds.includes(id));
        });
        setError(null);

      } else {
        setDeviceData({});
        setAllDeviceIds([]);
        setSelectedDevices([]);
        setError("No device data found in the database. Waiting for updates...");
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase read error:", err);
      setError("Failed to connect to Firebase or read data. Please check your connection and configuration.");
      toast({
        title: "Firebase Error",
        description: "Could not fetch data from Firebase. " + (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleDeviceSelectionChange = useCallback((deviceId: string, checked: boolean) => {
    setSelectedDevices(prev => {
      if (checked) {
        return [...prev, deviceId];
      } else {
        return prev.filter(id => id !== deviceId);
      }
    });
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold font-headline text-sidebar-foreground">Devices</h2>
          <SidebarTrigger className="md:hidden" />
        </SidebarHeader>
        <SidebarContent>
          {isLoading && (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
          {error && !isLoading && <p className="p-4 text-sm text-destructive">{error}</p>}
          {!isLoading && !error && (
            <DeviceSelector
              deviceIds={allDeviceIds}
              selectedDevices={selectedDevices}
              onSelectionChange={handleDeviceSelectionChange}
            />
          )}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <header className="flex items-center justify-between p-4 border-b bg-card shadow-sm">
            <div className="flex items-center gap-2">
               <SidebarTrigger className="hidden md:flex"/>
               <h1 className="text-2xl font-bold font-headline text-foreground">
                Realtime Tracker
              </h1>
            </div>
            {/* Placeholder for potential header actions */}
          </header>
          <main className="flex-grow p-4 overflow-auto bg-background">
            {isLoading && (
               <div className="flex items-center justify-center h-full">
                 <Skeleton className="w-full h-full rounded-lg" />
               </div>
            )}
            {!isLoading && deviceData && Object.keys(deviceData).length > 0 && (
              <div className="w-full h-full max-h-[calc(100vh-8rem)]"> {/* Adjust max-h as needed */}
                <MapDisplay
                  allDeviceData={deviceData}
                  selectedDevices={selectedDevices}
                />
              </div>
            )}
            {!isLoading && (!deviceData || Object.keys(deviceData).length === 0) && !error && (
              <div className="flex items-center justify-center h-full">
                <p className="text-lg text-muted-foreground">
                  No device data available. Waiting for devices to report locations...
                </p>
              </div>
            )}
             {!isLoading && error && (
              <div className="flex items-center justify-center h-full">
                <p className="text-lg text-destructive">
                  {error}
                </p>
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
