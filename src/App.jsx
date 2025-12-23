import { Routes, Route, Navigate } from "react-router-dom";
import MapPage from "./pages/MapPage.jsx";
import CondoPage from "./pages/CondoPage.jsx";
import MasterIndexPage from "./pages/MasterIndexPage.jsx";
import NewPropertyLaunchPage from "./pages/NewPropertyLaunchPage.jsx";
import NewLaunchDetailPage from "./pages/NewLaunchDetailPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/colombo-map" replace />} />
      <Route path="/colombo-map" element={<MapPage />} />

      <Route path="/master-index" element={<MasterIndexPage />} />
      <Route path="/condominiums/:slug" element={<CondoPage />} />

      <Route path="/new-property-launch" element={<NewPropertyLaunchPage />} />
      <Route
        path="/new-property-launch/:slug"
        element={<NewLaunchDetailPage />}
      />

      <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
    </Routes>
  );
}
