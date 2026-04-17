"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Plus, X, Loader2, CheckCircle2 } from "lucide-react";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

interface AvailabilityCalendarProps {
  doctorId: string;
  existingSlots?: { availableDate: string; timeSlots: string[] }[];
  onAdd: (date: string, slots: string[]) => Promise<void>;
}

export default function AvailabilityCalendar({
  doctorId,
  existingSlots = [],
  onAdd,
}: AvailabilityCalendarProps) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  // Find slots already set for the selected date
  const bookedSlots = useMemo(() => {
    const found = existingSlots.find((e) => e.availableDate === selectedDate);
    return found?.timeSlots ?? [];
  }, [existingSlots, selectedDate]);

  const toggleSlot = (slot: string) => {
    if (bookedSlots.includes(slot)) return; // already booked
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSave = async () => {
    if (!selectedDate || selectedSlots.length === 0) return;
    setSaving(true);
    try {
      await onAdd(selectedDate, selectedSlots);
      setSavedMessage(`Availability saved for ${selectedDate}`);
      setSelectedSlots([]);
      setTimeout(() => setSavedMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div>
        <label className="block text-sm font-bold text-clinical-gray uppercase tracking-wider mb-2">
          Select Date
        </label>
        <div className="relative w-full max-w-[260px]">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary pointer-events-none" />
          <input
            type="date"
            id="availability-date"
            min={today}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlots([]);
            }}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-clinical-dark dark:text-clinical-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* Time Slots */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-bold text-clinical-gray uppercase tracking-wider mb-3">
              Select Time Slots
            </label>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    disabled={isBooked}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isBooked
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-not-allowed"
                        : isSelected
                        ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/30"
                        : "bg-slate-100 dark:bg-slate-800 text-clinical-gray hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {isBooked ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {slot}
                  </button>
                );
              })}
            </div>

            {selectedSlots.length > 0 && (
              <div className="mt-4 p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                <p className="text-xs font-semibold text-clinical-gray mb-1">Selected slots:</p>
                <p className="text-sm font-bold text-brand-primary">
                  {selectedSlots.sort().join(", ")}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          id="save-availability"
          onClick={handleSave}
          disabled={!selectedDate || selectedSlots.length === 0 || saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40 shadow-lg shadow-brand-primary/30"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Plus className="w-4 h-4" /> Save Availability</>
          )}
        </button>

        {selectedSlots.length > 0 && (
          <button
            onClick={() => setSelectedSlots([])}
            className="text-sm text-clinical-gray hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {savedMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> {savedMessage}
        </motion.p>
      )}
    </div>
  );
}
