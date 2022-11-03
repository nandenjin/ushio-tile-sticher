import { ChakraProvider } from '@chakra-ui/react'
import { Global } from '@emotion/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <Global
        styles={{
          body: {
            fontFamily: 'monospace',
            fontSize: '13px',
          },
          a: {
            textDecoration: 'none',
            color: '#09b',
          },
        }}
      />
      <App />
    </ChakraProvider>
  </React.StrictMode>
)
