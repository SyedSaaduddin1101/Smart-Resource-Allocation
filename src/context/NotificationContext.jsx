import React, { createContext, useContext } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const showNotification = (message, type = 'success') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'loading':
        toast.loading(message);
        break;
      default:
        toast(message);
    }
  };
  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};