declare module 'dify-client';
declare module 'uuid';

declare global {
  interface Window {
    handleButtonClick?: (message: string) => void;
    handleButtonToggle?: (message: string) => void;
    handleMultipleSubmit?: () => void;
  }
}
