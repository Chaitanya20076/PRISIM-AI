import { Navigate, Route, Routes } from "react-router-dom";

import Host from "./host.jsx";
import Workshop from "./sections/Workshop/Workshop.jsx";
import Seminar from "./sections/Seminar/seminar.jsx";
import Webinar from "./sections/Webinar/Webinar.jsx";
import Bootcamp from "./sections/Bootcamp/Bootcamp.jsx";
import Competition from "./sections/Competition/Competition.jsx";
import OtherEvent from "./sections/OtherEvent/OtherEvent.jsx";

export default function Link() {
  return (
    <Routes>
      {/* Main event management page */}
      <Route index element={<Host />} />

      {/* Workshop admin panel */}
      <Route path="create" element={<Workshop />} />

      {/* Seminar admin panel */}
      <Route path="seminar" element={<Seminar />} />

      {/* Webinar admin panel */}
      <Route path="webinar" element={<Webinar />} />

      {/* Bootcamp admin panel */}
      <Route path="bootcamp" element={<Bootcamp />} />

      {/* Competition admin panel */}
      <Route path="competition" element={<Competition />} />

      {/* Other Events admin panel */}
      <Route path="other" element={<OtherEvent />} />

      {/* Redirect unknown event-management routes */}
      <Route
        path="*"
        element={<Navigate to="/admin/host" replace />}
      />
    </Routes>
  );
}