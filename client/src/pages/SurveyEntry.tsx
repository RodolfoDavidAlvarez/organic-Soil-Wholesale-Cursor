import { useLocation } from "wouter";
import { isGardenClassSurveySource } from "@shared/surveySources.js";
import ClientSurvey from "@/pages/ClientSurvey";
import GardenClassSurvey from "@/pages/GardenClassSurvey";

export default function SurveyEntry() {
  const [location] = useLocation();
  const source = typeof window === "undefined"
    ? ""
    : new URLSearchParams(window.location.search).get("source") || "";
  const isClassPath = location === "/survey/garden-class" || location.startsWith("/survey/garden-class/");

  if (isClassPath || isGardenClassSurveySource(source)) {
    return <GardenClassSurvey />;
  }

  return <ClientSurvey />;
}
