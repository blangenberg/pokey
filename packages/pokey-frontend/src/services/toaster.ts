import { message, notification } from 'antd';

export function showSuccessToast(msg: string): void {
  void message.success({ content: msg, duration: 3 });
}

export function showErrorToast(msg: string): void {
  notification.error({ title: 'Error', description: msg, duration: 0, placement: 'top' });
}

export function showWarningToast(msg: string): void {
  notification.warning({ title: 'Warning', description: msg, duration: 0, placement: 'top' });
}
