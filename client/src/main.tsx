import { createRoot } from "react-dom/client";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

async function start() {
  if (window.location.pathname === "/free-worm-castings") {
    const { default: CampaignEntry } = await import("./CampaignEntry");
    root.render(<CampaignEntry />);
    return;
  }

  const { default: App } = await import("./App");
  root.render(<App />);
}

void start();
