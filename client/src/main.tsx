import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { capturePageAttribution } from "./lib/pageAttribution";

capturePageAttribution();

createRoot(document.getElementById("root")!).render(<App />);
