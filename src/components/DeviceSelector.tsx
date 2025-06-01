"use client";

import type * as React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DeviceSelectorProps {
  deviceIds: string[];
  selectedDevices: string[];
  onSelectionChange: (deviceId: string, checked: boolean) => void;
}

export function DeviceSelector({ deviceIds, selectedDevices, onSelectionChange }: DeviceSelectorProps) {
  if (deviceIds.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No devices available.</p>;
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-3">
        {deviceIds.map((id) => (
          <div key={id} className="flex items-center space-x-2">
            <Checkbox
              id={`device-${id}`}
              checked={selectedDevices.includes(id)}
              onCheckedChange={(checked) => onSelectionChange(id, !!checked)}
              aria-label={`Select device ${id}`}
            />
            <Label htmlFor={`device-${id}`} className="text-sm font-medium leading-none cursor-pointer">
              {id}
            </Label>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
