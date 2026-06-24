import { createRoot } from "react-dom/client";
import { SpaContainer } from "pankosmia-rcl";
import { createHashRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import CreatePage from "./pages/create";
import UpdatePage from "./pages/update"
import { ThemeProvider } from "@emotion/react";
import { useEffect, useState } from "react";
import { getAndSetJson } from "pankosmia-lib/http";
import { createTheme, styled } from "@mui/material";
import { SnackbarProvider, MaterialDesignContent } from "notistack";

const router = createHashRouter([
    {
        path: "/",
        element: <App />
    },
    {
        path: "createPage",
        element: <CreatePage />
    },
    {
        path: "updatePage",
        element: <UpdatePage />,
    }
]);
function AppLayout() {
    const [themeSpec, setThemeSpec] = useState({
        palette: {
            primary: {
                main: "#666",
            },
            secondary: {
                main: "#888",
            },
        },
    });

    useEffect(() => {
        if (
            themeSpec.palette &&
            themeSpec.palette.primary &&
            themeSpec.palette.primary.main &&
            themeSpec.palette.primary.main === "#666"
        ) {
            getAndSetJson({
                url: "/api/app-resources/themes/default.json",
                setter: setThemeSpec,
            }).then();
        }
    }, []);

    const theme = createTheme(
        {
            components: {
                MuiButton: {
                    styleOverrides: {
                        root: {
                            textTransform: "none",
                        },
                    },
                },
                MuiFab: {
                    styleOverrides: {
                        root: {
                            textTransform: "none",
                        },
                    },
                },
                MuiTab: {
                    styleOverrides: {
                        root: {
                            textTransform: "none",
                        },
                    },
                },
            },
        },
        themeSpec,
    );
    const CustomSnackbarContent = styled(MaterialDesignContent)(() => ({
        "&.notistack-MuiContent-error": {
            backgroundColor: "#FDEDED",
            color: "#D32F2F",
        },
        "&.notistack-MuiContent-info": {
            backgroundColor: "#E5F6FD",
            color: "#0288D1",
        },
        "&.notistack-MuiContent-warning": {
            backgroundColor: "#FFF4E5",
            color: "#EF6C00",
        },
        "&.notistack-MuiContent-success": {
            backgroundColor: "#EDF7ED",
            color: "#2E7D32",
        },
    }));
    return (
        <ThemeProvider theme={theme}>
            <SnackbarProvider
                Components={{
                    error: CustomSnackbarContent,
                    info: CustomSnackbarContent,
                    warning: CustomSnackbarContent,
                    success: CustomSnackbarContent,
                }}
                maxSnack={6}
            >
                <SpaContainer>
                    <RouterProvider router={router} />
                </SpaContainer>
            </SnackbarProvider>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")).render(<AppLayout />);
