import { OverlayToaster, Position } from '@blueprintjs/core';
import type { ToastProps, Toaster } from '@blueprintjs/core';

let toasterPromise: Promise<Toaster> | null = null;

function getToaster(): Promise<Toaster> {
  if (!toasterPromise) {
    toasterPromise = OverlayToaster.createAsync({
      position: Position.TOP,
      maxToasts: 5,
    });
  }
  return toasterPromise;
}

export async function showToast(props: ToastProps): Promise<string | undefined> {
  const toaster = await getToaster();
  return toaster.show(props);
}

export async function showSuccessToast(message: string): Promise<string | undefined> {
  return showToast({
    message,
    intent: 'success',
    icon: 'tick-circle',
    timeout: 3000,
  });
}

export async function showErrorToast(message: string): Promise<string | undefined> {
  return showToast({
    message,
    intent: 'danger',
    icon: 'error',
    timeout: 0,
  });
}

export async function showWarningToast(message: string): Promise<string | undefined> {
  return showToast({
    message,
    intent: 'warning',
    icon: 'warning-sign',
    timeout: 0,
  });
}
