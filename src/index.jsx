import {createRoot} from "react-dom/client";
import {SpaContainer} from "pithekos-lib";
import {createHashRouter, RouterProvider} from "react-router-dom";
import './index.css';
import HelloWorld from "./pages/tCoreContent";
import App from "./App";

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "tCoreContent",
    element: <HelloWorld />,
  },
]);

createRoot(document.getElementById("root"))
    .render(
        <SpaContainer>
            <RouterProvider router={router}/>
        </SpaContainer>
    );