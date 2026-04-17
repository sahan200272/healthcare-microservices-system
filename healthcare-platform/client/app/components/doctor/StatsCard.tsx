"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;       // Tailwind text color, e.g. "text-blue-500"
  bgColor: string;     // Tailwind bg color, e.g. "bg-blue-500/10"
  trend?: string;      // optional e.g. "+12% this week"
  trendUp?: boolean;
  onClick?: () => void;
  active?: boolean;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  trend,
  trendUp,
  onClick,
  active,
}: StatsCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass rounded-2xl p-5 text-left w-full transition-all duration-200 ${
        active ? "ring-2 ring-brand-primary shadow-lg shadow-brand-primary/20" : ""
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trendUp
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
      <p className="text-xs font-semibold text-clinical-gray uppercase tracking-widest">
        {label}
      </p>
    </motion.button>
  );
}
