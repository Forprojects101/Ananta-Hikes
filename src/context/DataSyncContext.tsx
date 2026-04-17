"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";

type SyncEvent = "mountains-updated" | "bookings-updated" | "hike-types-updated" | "add-ons-updated" | "content-settings-updated";

interface DataSyncContextType {
  // Trigger a refresh event
  triggerSync: (event: SyncEvent) => void;
  
  // Subscribe to sync events
  onSync: (event: SyncEvent, callback: () => void) => () => void;
  
  // Timestamp of last sync for each type
  lastSyncTimestamp: Record<SyncEvent, number>;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

export function DataSyncProvider({ children }: { children: ReactNode }) {
  // Use useRef for listeners to avoid closure issues and unnecessary re-renders
  const listenersRef = useRef<Record<SyncEvent, Set<() => void>>>({
    "mountains-updated": new Set(),
    "bookings-updated": new Set(),
    "hike-types-updated": new Set(),
    "add-ons-updated": new Set(),
    "content-settings-updated": new Set(),
  });

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Record<SyncEvent, number>>({
    "mountains-updated": 0,
    "bookings-updated": 0,
    "hike-types-updated": 0,
    "add-ons-updated": 0,
    "content-settings-updated": 0,
  });

  const triggerSync = useCallback((event: SyncEvent) => {
    console.log(`🔄 [DataSync] Triggering sync event: ${event}`);
    
    // Update timestamp
    setLastSyncTimestamp((prev) => ({
      ...prev,
      [event]: Date.now(),
    }));

    // Call all listeners for this event
    const eventListeners = listenersRef.current[event];
    eventListeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error(`❌ [DataSync] Error in listener for ${event}:`, error);
      }
    });
  }, []);

  const onSync = useCallback(
    (event: SyncEvent, callback: () => void) => {
      console.log(`📡 [DataSync] Registering listener for: ${event}`);
      
      // Add the callback to the set directly via ref
      listenersRef.current[event].add(callback);

      // Return unsubscribe function
      return () => {
        listenersRef.current[event].delete(callback);
      };
    },
    []
  );

  return (
    <DataSyncContext.Provider value={{ triggerSync, onSync, lastSyncTimestamp }}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync() {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error("useDataSync must be used within DataSyncProvider");
  }
  return context;
}
