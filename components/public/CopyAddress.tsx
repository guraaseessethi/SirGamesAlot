'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { STORE } from '@/lib/content/store';

export function CopyAddress() {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(STORE.fullAddress);
      setCopied(true);
      toast('Address copied.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast(STORE.fullAddress);
    }
  }
  return (
    <Button size="sm" variant="white" onClick={copy}>
      {copied ? 'Copied ✓' : 'Copy address'}
    </Button>
  );
}
