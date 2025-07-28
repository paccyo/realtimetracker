
"use client";

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
  onDateTimeChange: (date: Date) => void;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ onDateTimeChange }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('00:00');

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const [hours, minutes] = time.split(':').map(Number);
      newDate.setHours(hours, minutes);
      setDate(newDate);
      onDateTimeChange(newDate);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      setDate(newDate);
      onDateTimeChange(newDate);
    }
  };

  return (
    <div className="p-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateChange}
        className="rounded-md border"
      />
      <Input
        type="time"
        value={time}
        onChange={handleTimeChange}
        className="mt-4"
      />
    </div>
  );
};
