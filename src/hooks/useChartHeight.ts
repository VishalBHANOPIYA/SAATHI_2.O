"use client";

import { useState, useEffect } from 'react';

export function useChartHeight(
  mobile = 200,
  tablet = 260, 
  desktop = 320
): number {
  const [height, setHeight] = useState(mobile);
  
  useEffect(() => {
    function update() {
      if (window.innerWidth >= 1024) 
        setHeight(desktop);
      else if (window.innerWidth >= 768) 
        setHeight(tablet);
      else 
        setHeight(mobile);
    }
    update();
    window.addEventListener('resize', update);
    return () => 
      window.removeEventListener('resize', update);
  }, [mobile, tablet, desktop]);
  
  return height;
}
