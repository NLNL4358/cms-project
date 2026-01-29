import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./lib/query-client.js";
import { UserProvider } from "./Providers/UserContext.jsx";
import { APIProvider } from "./Providers/APIContext.jsx";
import { GlobalProvider } from "./Providers/GlobalContext.jsx";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <APIProvider>
        <UserProvider>
          <GlobalProvider>
            <App />
          </GlobalProvider>
        </UserProvider>
      </APIProvider>
    </BrowserRouter>
  </QueryClientProvider>,
);
