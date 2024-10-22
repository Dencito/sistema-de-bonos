import React, { createContext, useContext, useState } from 'react';
import { message } from 'antd';

// Crear el contexto
const MessageContext = createContext();

// Proveedor del contexto
export const MessageProvider = ({ children }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const successMsg = (content) => {
    messageApi.open({
      type: 'success',
      content,
      style: {
        fontSize: '18px',
        marginLeft: 'auto',
      },
    });
  };

  const errorMsg = (content) => {
    messageApi.open({
      type: 'error',
      content,
      style: {
        fontSize: '18px',
        marginLeft: 'auto',
      },
    });
  };

  return (
    <MessageContext.Provider value={{ successMsg, errorMsg }}>
      {contextHolder}
      {children}
    </MessageContext.Provider>
  );
};

// Hook para utilizar los mensajes en cualquier parte de la app
export const useMessage = () => {
  return useContext(MessageContext);
};
