"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import type { Package, Booking, BookingContextType } from "@/types";

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialPackage: Package = {
  mountainId: "",
  mountainBasePrice: 0,
  mountainName: "",
  hikeTypeId: "",
  hikeTypeName: "",
  participants: 1,
  date: "",
  skillLevel: "Beginner",
  addOns: [],
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingPackage, setBookingPackage] = useState<Package>(initialPackage);
  const [booking, setBooking] = useState<Booking | null>(null);

  const updatePackage = (updates: Partial<Package>) => {
    setBookingPackage((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const value: BookingContextType = {
    currentStep,
    package: bookingPackage,
    booking,
    setCurrentStep,
    updatePackage,
    setBooking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
