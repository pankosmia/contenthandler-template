import { useContext, useMemo, useState, useEffect } from "react";
import { Button, DialogContent, Box, TextField } from "@mui/material";
import {
  PanDialog,
  PanDialogActions,
  i18nContext,
  PanVersificationPicker,
  PanLanguagePicker,
  debugContext,
} from "pankosmia-rcl";
import { useSearchParams } from "react-router-dom";
import { doI18n, postEmptyJson, postJson } from "pithekos-lib";
import { handleCreate } from "./tCoreContent";
import JSZip from "jszip";

export default function CreatTCProjectFromFile() {
  const { i18nRef } = useContext(i18nContext);
  const { debugRef } = useContext(debugContext);

  const [searchParams] = useSearchParams();

  const fileName = searchParams.get("file") || "";
  const fileUUID = searchParams.get("uuid") || "";

  const [currentLanguage, setCurrentLanguage] = useState({
    language_code: "",
    language_name: "",
  });
  const [languageIsValid, setLanguageIsValid] = useState(true);
  const [versification, setVersification] = useState("eng");

  const typeDocument = useMemo(() => {
    if (!fileName) return null;
    return fileName.endsWith(".zip") ? "zip" : "usfm";
  }, [fileName]);

  const [projectName, setProjectName] = useState("");
  const [projectAbr, setProjectAbr] = useState("");

  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    if (!fileUUID || typeDocument !== "zip") return;

    async function extractManifest() {
      try {
        const res = await fetch(`/temp/bytes/${fileUUID}`);
        const arrayBuffer = await res.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        const manifestFile = zip.file("manifest.json");
        if (!manifestFile) {
          console.warn("No manifest.json found in zip");
          return;
        }

        const manifestText = await manifestFile.async("string");
        const manifestData = JSON.parse(manifestText);
        setManifest(manifestData);
      } catch (err) {
        console.error("Failed to read zip:", err);
      }
    }

    extractManifest();
  }, [fileUUID, typeDocument]);
  // ✅ SAFE book code extraction
  const bookCode = useMemo(() => {
    if (!fileName) return "";
    if (typeDocument === "usfm") {
      return fileName.split(".")[0] || "";
    } else {
      return fileName.split("-")[2]?.toUpperCase() || "";
    }
  }, [fileName, typeDocument]);

  async function creatTextTranslation() {
    const payload = {
      content_name: projectName,
      content_abbr: projectAbr,
      content_type: "text_translation",
      content_language_code: currentLanguage.language_code,
      content_language_name: currentLanguage.language_name,
      versification: versification,
      add_book: false,
      book_code: null,
      book_title: null,
      book_abbr: null,
      add_cv: null,
    };
    let response = await postJson(
      "/git/new-text-translation",
      JSON.stringify(payload),
      debugRef.current,
    );
    if (response.ok) {
      if (typeDocument === "usfm") {
        const res = await fetch(`/temp/bytes/${fileUUID}`);
        const fileText = await res.text();
        response = await postJson(
          `/burrito/ingredient/raw/_local_/_local_/${projectAbr}?ipath=${`${fileName}`}&update_ingredients`,
          JSON.stringify({ payload: fileText }),
          debugRef.current,
        );
      }

      if (response.ok) {
        let isOk = await handleCreate(projectAbr, debugRef, i18nRef);
        if (isOk) {
          await postEmptyJson(
            `/app-state/current-project/_local_/_local_/${projectAbr.toLowerCase()}_tcchecks`,
          );
          window.location.href = `/clients/uw-client-checks#?fileName=${fileName}&uuid=${fileUUID}`;
        }
      }
    }
  }
  return (
    <Box>
      <PanDialog titleLabel="File selected" isOpen={true} closeFn={() => true}>
        <DialogContent>
          <Box textAlign="center" mb={2}>
            {fileName || "No file selected"}
          </Box>
          <PanVersificationPicker
            versification={versification}
            setVersification={setVersification}
            // isOpen={open}
          />
          <PanLanguagePicker
            currentLanguage={currentLanguage}
            setCurrentLanguage={setCurrentLanguage}
            setIsValid={setLanguageIsValid}
          />
          <TextField
            fullWidth
            label={doI18n("pages:content:abbreviation", i18nRef.current)}
            value={bookCode}
            InputProps={{ readOnly: true }}
            margin="dense"
          />
          <TextField
            fullWidth
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            margin="dense"
          />

          <TextField
            fullWidth
            label="Project Abbreviation"
            value={projectAbr}
            onChange={(e) => setProjectAbr(e.target.value)}
            margin="dense"
          />
        </DialogContent>

        <PanDialogActions
          actionFn={() => {
            creatTextTranslation();
          }}
          actionLabel="Continue"
          closeFn={() => {}}
          closeLabel="Cancel"
          closeOnAction={false}
        />
      </PanDialog>
    </Box>
  );
}
