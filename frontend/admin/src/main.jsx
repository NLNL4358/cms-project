import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client.js';
import { UserProvider } from '@/Providers/UserContext.jsx';
import { APIProvider, ProgressPopupSync } from '@/Providers/APIContext.jsx';
import { GlobalProvider } from '@/Providers/GlobalContext.jsx';
import { PopupProvider } from '@/Providers/PopupContext.jsx';

import { Toaster } from '@/Components/ui/sonner.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <APIProvider>
                <PopupProvider>
                    <ProgressPopupSync />
                    <UserProvider>
                        <GlobalProvider>
                            <App />
                            <Toaster position="top-right" richColors />
                        </GlobalProvider>
                    </UserProvider>
                </PopupProvider>
            </APIProvider>
        </BrowserRouter>
    </QueryClientProvider>,
);
