"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { CongestionThresholdProvider, useCongestionThreshold } from "@/context/CongestionThresholdContext";
import { getDatabase, ref as databaseRef, onValue, set, push } from "firebase/database";
import { collection, onSnapshot, query, DocumentData } from "firebase/firestore";
import { firebaseApp, firestore } from "@/lib/firebase";
import type { DeviceData } from "@/types";

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DeviceSelector } from "@/components/DeviceSelector";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // For potential future actions
import { PanelLeft } from "lucide-react";
import { MIN_COORD, MAX_COORD } from "@/components/MapDisplay";
import { Slider } from "@/components/ui/slider";

const MOVEMENT_DELTA = 0.5; // Adjust this value for smaller/larger movements

import Link from "next/link";
import dynamic from 'next/dynamic';
import { getCouponRecommendation } from '@/actions/genkitActions';

const MapDisplay = dynamic(() => import('@/components/MapDisplay').then(mod => mod.MapDisplay), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-lg" />
});


export default function HomePage() {
  return (
    <CongestionThresholdProvider>
      <HomePageContent />
    </CongestionThresholdProvider>
  );
}

function HomePageContent() {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [allDeviceIds, setAllDeviceIds] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [stores, setStores] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showOnlyLatest, setShowOnlyLatest] = useState(false);
  const { congestionThreshold, setCongestionThreshold } = useCongestionThreshold();
  const [isGeneratingDummyData, setIsGeneratingDummyData] = useState(false);
  const [numDummyDevices, setNumDummyDevices] = useState(1); // Default to 1 dummy device
  const [dummyIntervals, setDummyIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const deviceDataRef = useRef<DeviceData | null>(null);

  useEffect(() => {
    deviceDataRef.current = deviceData;
  }, [deviceData]);

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

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      dummyIntervals.forEach(intervalId => clearInterval(intervalId));
    };
  }, [dummyIntervals]);

  useEffect(() => {
    const q = query(collection(firestore, "stores"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const storesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        storesData.push({ id: doc.id, ...doc.data() });
      });
      setStores(storesData);
    }, (error) => {
      console.error("Error fetching stores: ", error);
      toast({
        title: "Firestore Error",
        description: "Could not fetch store data.",
        variant: "destructive",
      });
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

  const handleSelectAllDevices = useCallback(() => {
    setSelectedDevices(allDeviceIds);
  }, [allDeviceIds]);

  const handleDeselectAllDevices = useCallback(() => {
    setSelectedDevices([]);
  }, []);

  const generateRandomTarget = useCallback(() => {
    return {
      latitude: MIN_COORD + Math.random() * (MAX_COORD - MIN_COORD),
      longitude: MIN_COORD + Math.random() * (MAX_COORD - MIN_COORD),
    };
  }, []);

  const toggleDummyDataGeneration = useCallback(() => {
    const db = getDatabase(firebaseApp);

    if (isGeneratingDummyData) {
      // Stop generating dummy data
      dummyIntervals.forEach(intervalId => clearInterval(intervalId));
      setDummyIntervals(new Map());
      setIsGeneratingDummyData(false);
      toast({
        title: "Dummy Data Stopped",
        description: "Real-time dummy data generation has been stopped.",
      });
    } else {
      // Start generating dummy data
      let dummyDeviceIdsToManage = allDeviceIds.filter(id => id.startsWith("dummy-device-"));

      const newDummyIntervals = new Map<string, NodeJS.Timeout>();

      // Ensure we have at least numDummyDevices
      while (dummyDeviceIdsToManage.length < numDummyDevices) {
        const newDeviceId = `dummy-device-${Math.random().toString(36).substring(2, 8)}`;
        dummyDeviceIdsToManage.push(newDeviceId);
        toast({
          title: "New Dummy Device Created",
          description: `Created new dummy device: ${newDeviceId}`,
        });
      }

      // If we have too many, stop the extra ones and remove them from the list
      if (dummyDeviceIdsToManage.length > numDummyDevices) {
        const devicesToRemove = dummyDeviceIdsToManage.splice(numDummyDevices);
        devicesToRemove.forEach(deviceId => {
          // Optionally, remove from Firebase as well if desired
          // set(databaseRef(db, `devices/${deviceId}`), null);
          toast({
            title: "Dummy Device Removed",
            description: `Removed dummy device: ${deviceId}`,
          });
          setAllDeviceIds(prev => prev.filter(id => id !== deviceId));
          setSelectedDevices(prev => prev.filter(id => id !== deviceId));
        });
      }

      // Set initial random positions for all dummy devices (new and existing)
      dummyDeviceIdsToManage.forEach(deviceId => {
        const initialPoint = {
          latitude: MIN_COORD + Math.random() * (MAX_COORD - MIN_COORD),
          longitude: MIN_COORD + Math.random() * (MAX_COORD - MIN_COORD),
          timestamp: new Date().toISOString(),
        };
        set(databaseRef(db, `devices/${deviceId}/points/initial`), initialPoint); // Reset initial position
      });

      // const newDummyIntervals = new Map<string, NodeJS.Timeout>();

      dummyDeviceIdsToManage.forEach(deviceId => {
        const interval = setInterval(() => {
          const currentDevicePoints = deviceDataRef.current?.[deviceId]?.points;
          if (!currentDevicePoints) return;

          const pointsArray = Object.values(currentDevicePoints)
            .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number' && p.timestamp)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          if (pointsArray.length === 0) return;

          const latestPoint = pointsArray[0];

          let newLat = latestPoint.latitude + (Math.random() * 2 - 1) * MOVEMENT_DELTA;
          let newLon = latestPoint.longitude + (Math.random() * 2 - 1) * MOVEMENT_DELTA;

          // Keep coordinates within bounds
          newLat = Math.max(MIN_COORD, Math.min(MAX_COORD, newLat));
          newLon = Math.max(MIN_COORD, Math.min(MAX_COORD, newLon));

          const newPoint = {
            latitude: newLat,
            longitude: newLon,
            timestamp: new Date().toISOString(),
          };
          push(databaseRef(db, `devices/${deviceId}/points`), newPoint);
        }, 500); // Update every 0.5 seconds for smoother movement

        newDummyIntervals.set(deviceId, interval);
      });

      setDummyIntervals(newDummyIntervals);
      setIsGeneratingDummyData(true);
      toast({
        title: "Dummy Data Started",
        description: `Real-time dummy data generation started for ${dummyDeviceIdsToManage.length} device(s).`,
      });
    }
  }, [isGeneratingDummyData, allDeviceIds, dummyIntervals, toast, deviceDataRef, setAllDeviceIds, setSelectedDevices]);

  const handleCouponRecommendation = useCallback(async () => {
    if (!deviceData || Object.keys(deviceData).length === 0) {
      toast({
        title: "No Device Data",
        description: "Cannot recommend coupons without device data.",
        variant: "destructive",
      });
      return;
    }

    if (stores.length === 0) {
      toast({
        title: "No Stores Registered",
        description: "Please register stores in the settings page first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating Coupon Recommendation",
      description: "Please wait while AI analyzes the data...",
    });

    try {
      const formattedStores = stores.map(store => {
        const devicesInStore = Object.values(deviceData).filter(device => {
          const latestPoint = Object.values(device.points || {}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          if (!latestPoint) return false;

          const { latitude, longitude } = latestPoint;
          const { positionX, positionY, sizeX, sizeY } = store;

          // Check if the device's latest point is within the store's boundaries
          return (
            latitude >= positionY &&
            latitude <= (positionY + sizeY) &&
            longitude >= positionX &&
            longitude <= (positionX + sizeX)
          );
        }).length;

        let congestionStatus = "low";
        if (devicesInStore >= congestionThreshold) {
          congestionStatus = "high";
        } else if (devicesInStore > 0) {
          congestionStatus = "medium";
        }

        return {
          id: store.id,
          name: store.name,
          positionX: store.positionX,
          positionY: store.positionY,
          sizeX: store.sizeX,
          sizeY: store.sizeY,
          congestionStatus: congestionStatus,
        };
      });

      // Assuming no specific congested areas are identified on this page for now
      const congestedAreas: any[] = []; 

      const result = await getCouponRecommendation(congestedAreas, formattedStores);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "AI Coupon Recommendation",
        description: result.response,
        duration: 9000,
      });

    } catch (error) {
      console.error("Error calling Genkit flow:", error);
      toast({
        title: "Error",
        description: `Failed to get coupon recommendation: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  }, [deviceData, stores, congestionThreshold, toast]);

  const handleCreateNewDummyDevice = useCallback(() => {
    const db = getDatabase(firebaseApp);
    const newDeviceId = `dummy-device-${Math.random().toString(36).substring(2, 8)}`;

    const initialPoint = {
      latitude: MIN_COORD + Math.random() * (MAX_COORD - MIN_COORD),
      longitude: MIN_COORD + Math.random() * (MAX_COORD - MIN_COORD),
      timestamp: new Date().toISOString(),
    };
    set(databaseRef(db, `devices/${newDeviceId}/points/initial`), initialPoint)
      .then(() => {
        toast({
          title: "New Dummy Device Created",
          description: `Created and started data generation for: ${newDeviceId}`,
        });

        // Start interval for the new device
        const interval = setInterval(() => {
          const currentDevicePoints = deviceDataRef.current?.[newDeviceId]?.points;
          if (!currentDevicePoints) return;

          const pointsArray = Object.values(currentDevicePoints)
            .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number' && p.timestamp)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          if (pointsArray.length === 0) return;

          const latestPoint = pointsArray[0];

          let newLat = latestPoint.latitude + (Math.random() * 2 - 1) * MOVEMENT_DELTA;
          let newLon = latestPoint.longitude + (Math.random() * 2 - 1) * MOVEMENT_DELTA;

          newLat = Math.max(MIN_COORD, Math.min(MAX_COORD, newLat));
          newLon = Math.max(MIN_COORD, Math.min(MAX_COORD, newLon));

          const newPoint = {
            latitude: newLat,
            longitude: newLon,
            timestamp: new Date().toISOString(),
          };
          push(databaseRef(db, `devices/${newDeviceId}/points`), newPoint);
        }, 500);

        setDummyIntervals(prev => new Map(prev).set(newDeviceId, interval));
        setAllDeviceIds(prev => [...prev, newDeviceId]);
        setSelectedDevices(prev => [...prev, newDeviceId]); // Automatically select the new device
      })
      .catch(error => {
        console.error("Error creating new dummy device:", error);
        toast({
          title: "Error",
          description: `Failed to create new dummy device: ${error.message}`,
          variant: "destructive",
        });
      });
  }, [toast, deviceDataRef, setDummyIntervals, setAllDeviceIds, setSelectedDevices]);

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
            <>
              <div className="flex justify-between p-4 border-b">
                <Button onClick={handleSelectAllDevices} variant="outline" size="sm">Select All</Button>
                <Button onClick={handleDeselectAllDevices} variant="outline" size="sm">Deselect All</Button>
              </div>
              <DeviceSelector
                deviceIds={allDeviceIds}
                selectedDevices={selectedDevices}
                onSelectionChange={handleDeviceSelectionChange}
              />
            </>
          )}
          <div className="p-4 border-t">
            <div className="mb-4">
              <label htmlFor="congestion-threshold" className="block text-sm font-medium text-gray-700 mb-2">
                Congestion Threshold: {congestionThreshold}
              </label>
              <Slider
                id="congestion-threshold"
                min={1}
                max={10}
                step={1}
                value={[congestionThreshold]}
                onValueChange={(value) => setCongestionThreshold(value[0])}
                className="w-full"
              />
            </div>
            <Button onClick={() => setNumDummyDevices(prev => Math.max(1, prev - 1))} variant="outline" size="sm">-</Button>
            <span className="mx-2">{numDummyDevices}</span>
            <Button onClick={() => setNumDummyDevices(prev => prev + 1)} variant="outline" size="sm">+</Button>
          </div>
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
            <Button onClick={handleCouponRecommendation} variant="outline">AIクーポン推薦</Button>
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
                  showOnlyLatest={showOnlyLatest}
                  stores={stores}
                  congestionThreshold={congestionThreshold}
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
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button onClick={toggleDummyDataGeneration}>
              {isGeneratingDummyData ? "Stop Dummy Data" : "Start Dummy Data"}
            </Button>
            <Button onClick={() => setShowOnlyLatest(!showOnlyLatest)}>
              {showOnlyLatest ? "Show All Data" : "Show Only Latest Data"}
            </Button>
            <Button onClick={handleCreateNewDummyDevice}>
              Create New Dummy Device
            </Button>
            <Link href="/settings">
              <Button className="w-full">Settings</Button>
            </Link>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
