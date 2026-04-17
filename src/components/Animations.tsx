"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function FadeInUp({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}

export function SlideInLeft({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}

export function SlideInRight({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}

export function FloatingAnimation({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function PulseAnimation({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
