import React, { createContext, useContext } from 'react';
import { message } from 'antd';

const MessageContext = createContext();

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

export const useMessage = () => {
  return useContext(MessageContext);
};
0