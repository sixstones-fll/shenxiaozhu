"use client";
import { useState, useRef } from "react";
export default function Test() {
  const ref = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        hi
      </div>
    </div>
  );
}
