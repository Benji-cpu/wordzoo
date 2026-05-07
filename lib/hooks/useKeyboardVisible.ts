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

export interface ViewportInsets {
  keyboardOpen: boolean;
  keyboardHeight: number;
  viewportHeight: number;
}

export function useViewportInsets(): ViewportInsets {
  const [insets, setInsets] = useState<ViewportInsets>({
    keyboardOpen: false,
    keyboardHeight: 0,
    viewportHeight: 0,
  });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const initialHeight = vv.height;

    function update() {
      const height = vv!.height;
      const delta = initialHeight - height;
      setInsets({
        keyboardOpen: delta > 150,
        keyboardHeight: delta > 150 ? delta : 0,
        viewportHeight: height,
      });
    }

    update();
    vv.addEventListener('resize', update);
    return () => vv.removeEventListener('resize', update);
  }, []);

  return insets;
}
