
import { Navigate, Route, Routes } from "react-router-dom";

import AdminLogin from "./AdminLogin.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import Link from "./Host/Link.jsx";
import HackathonAdmin from "./Hackathons/HackathonAdmin.jsx";
import Announcement from "./Announcement/announcement.jsx";
import RecruitmentAdmin from "./Recruitments/RecruitmentAdmin.jsx";
import ProjectsAdmin from "./Projects/ProjectsAdmin.jsx";
import AIToolOfWeekAdmin from "./AIToolOfWeek/AIToolOfWeekAdmin.jsx";
import DigitalGalleryAdmin from "./DigitalGallery/DigitalGalleryAdmin.jsx";
import CertificatesAdmin from "./Certificates/CertificatesAdmin.jsx";
function Admin() {
  return (
    <Routes>
      {/* Admin login */}
      <Route index element={<AdminLogin />} />

      {/* Dashboard */}
      <Route path="dashboard" element={<AdminDashboard />} />

      {/* Event management */}
      <Route path="host/*" element={<Link />} />

      {/* Hackathon management */}
      <Route path="hackathons" element={<HackathonAdmin />} />

      {/* Announcement management */}
      <Route
        path="announcement/*"
        element={<Announcement />}
      />

      {/* Recruitment management */}
      <Route
        path="recruitment"
        element={<RecruitmentAdmin />}
      />

      {/* Projects management */}
      <Route
        path="projects"
        element={<ProjectsAdmin />}
      />

      {/* AI Tool of the Week */}
      <Route
        path="ai-tool-of-week"
        element={<AIToolOfWeekAdmin />}
      />

      {/* Digital Gallery */}
      <Route
        path="digital-gallery"
        element={<DigitalGalleryAdmin />}
      />

      {/* Redirect unknown admin routes */}
      <Route
        path="*"
        element={<Navigate to="/admin" replace />}
      />
      <Route
  path="certificates"
  element={<CertificatesAdmin />}
/>
    </Routes>
  );
}

export default Admin;
