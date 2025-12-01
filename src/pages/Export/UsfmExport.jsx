import { useContext, useState, useEffect } from 'react';
import {
    AppBar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    List,
    ListItem,
    ListItemText,
    Toolbar,
    Typography,
    useTheme,
} from "@mui/material";
import { getText, debugContext, i18nContext, doI18n, getJson, Header } from "pithekos-lib";
import { enqueueSnackbar } from "notistack";
import { saveAs } from 'file-saver';
import Color from 'color';

function UsfmExport() {
    const { i18nRef } = useContext(i18nContext);
    const { debugRef } = useContext(debugContext);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [bookCodes, setBookCodes] = useState([]);
    const [bookNames, setBookNames] = useState([]);
    const [repoPath, setRepoPath] = useState([])
    const [open, setOpen] = useState(true);

    const getProjectSummaries = async () => {
        const hash = window.location.hash;
        const query = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(query);
        const path = params.get('repoPath');
        setRepoPath(path);
        const summariesResponse = await getJson(`/burrito/metadata/summary/${path}`, debugContext.current);
        if (summariesResponse.ok) {
            const data = summariesResponse.json;
            const bookCode = data.book_codes;
            setBookNames(bookCode);
        } else {
            console.error(" Erreur lors de la récupération des données.");
        }
    };
    useEffect(
        () => {
            getProjectSummaries();
        },
        []
    );

    const usfmExportOneBook = async bookCode => {
        const bookUrl = `/burrito/ingredient/raw/${repoPath}?ipath=${bookCode}.usfm`;
        const bookUsfmResponse = await getText(bookUrl, debugRef.current);
        if (!bookUsfmResponse.ok) {
            enqueueSnackbar(
                `${doI18n("pages:core-contenthandler_text_translation:could_not_fetch", i18nRef.current)} ${bookCode}`,
                { variant: "error" }
            );
            return false;
        }
        let blob = new Blob([bookUsfmResponse.text], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `${bookCode}.usfm`);
        enqueueSnackbar(
            `${doI18n("pages:content:saved", i18nRef.current)} ${bookCode} ${doI18n("pages:content:to_download_folder", i18nRef.current)}`,
            { variant: "success" }
        );
        return true;
    }

    // Lighten secondary.main color
    const theme = useTheme();
    const lightenedColor = Color(theme.palette.secondary.main).lighten(0.8).hex();
    const lightenedColorHover = Color(theme.palette.secondary.main).lighten(0.999).hex();

    const handleToggle = (item) => {
        setSelectedBooks((prev) =>
            prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
        );
    };

    const handleClose = () => {
        setOpen(false);
        return window.location.href = "/clients/content"
    }

    const handleCloseCreate = async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.href = "/clients/content"
    }
    useEffect(
        () => {
            const doFetch = async () => {
                const versificationResponse = await getJson("/content-utils/versification/eng", debugRef.current);
                if (versificationResponse.ok) {
                    setBookCodes(Object.keys(versificationResponse.json.maxVerses));
                }
            };
            if (bookCodes.length === 0) {
                doFetch().then();
            }
        },
        []
    );


    return (

        <Box>
            <Box
                sx={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    zIndex: -1,
                    backgroundImage:
                        'url("/app-resources/pages/content/background_blur.png")',
                    backgroundRepeat: "no-repeat",
                    backdropFilter: "blur(3px)",
                }}
            />
            <Header
                titleKey="pages:content:title"
                currentId="content"
                requireNet={false}
            />
            <Dialog
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        component: 'form',
                    },
                }}
                sx={{
                    backdropFilter: "blur(3px)",
                }}
            >
                <AppBar color='secondary' sx={{ position: 'relative', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <Toolbar>
                        <Typography variant="h6" component="div">
                            {doI18n("pages:core-contenthandler_text_translation:export_as_usfm", i18nRef.current)}
                        </Typography>
                    </Toolbar>
                </AppBar>
                <DialogContent sx={{ mt: 1 }} style={{ overflow: "hidden" }}>
                    <Box sx={{ maxHeight: '269px' }}>
                        <DialogContentText>
                            <Typography>
                                {doI18n("pages:core-contenthandler_text_translation:pick_one_or_more_books_export", i18nRef.current)}
                            </Typography>
                            {selectedBooks.length > 0 &&
                                <Typography sx={{ ml: 2 }}>
                                    <em>
                                        {`${selectedBooks.length}/${bookNames.length} ${doI18n("pages:content:books_selected", i18nRef.current)}`}
                                    </em>
                                </Typography>
                            }
                        </DialogContentText>
                        <List
                            dense
                            style={{ maxHeight: 300, overflowY: 'auto' }}
                        >
                            {bookCodes.filter(item => bookNames.includes(item)).map((bookName) => (
                                <ListItem
                                    key={bookName}
                                    button
                                    onClick={() => handleToggle(bookName)}
                                    sx={{
                                        backgroundColor: selectedBooks.includes(bookName) ? lightenedColor : 'transparent',
                                        '&:hover': {
                                            backgroundColor: selectedBooks.includes(bookName) ? lightenedColorHover : 'action.hover',
                                        },
                                    }}
                                >
                                    <ListItemText primary={`${bookName} - ` + doI18n(`scripture:books:${bookName}`, i18nRef.current)} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="text"
                        color="primary"
                        onClick={() => {
                            setSelectedBooks([]);
                            handleClose()
                        }}
                    >
                        {doI18n("pages:content:cancel", i18nRef.current)}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={selectedBooks.length === 0}
                        onClick={() => {
                            if (!selectedBooks || selectedBooks.length === 0) {
                                enqueueSnackbar(
                                    doI18n("pages:core-contenthandler_text_translation:no_books_selected", i18nRef.current),
                                    { variant: "warning" }
                                );
                            } else {
                                selectedBooks.forEach(usfmExportOneBook);
                            }
                            handleCloseCreate();
                        }}
                    >
                        {doI18n("pages:core-contenthandler_text_translation:export_label", i18nRef.current)}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UsfmExport;
