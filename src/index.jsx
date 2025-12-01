import {createRoot} from "react-dom/client";
import {SpaContainer} from "pithekos-lib";
import {createHashRouter, RouterProvider} from "react-router-dom";
import './index.css';
import CreatePage from "./pages/create";
import UpdatePage from "./pages/update"
import App from "./App";

const router = createHashRouter([
    {
        path:"/",
        element:<App/>
    },
    {
        path: "createPage",
        element: <CreatePage/>
    },
    {
        path: "updatePage",
        element: <UpdatePage/>,
    }
]);

createRoot(document.getElementById("root"))
    .render(
        <SpaContainer>
            <RouterProvider router={router}/>
        </SpaContainer>
    );