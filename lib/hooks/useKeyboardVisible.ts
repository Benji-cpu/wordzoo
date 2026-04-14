'use client';
import { useState, useEffect } from 'react';

export function useKeyboardVisible(): boolean {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const initialHeight = vv.height;

    function handleResize() {
      setKeyboardVisible(vv!.height < initialHeight - 150);
    }

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  return keyboardVisible;
}
