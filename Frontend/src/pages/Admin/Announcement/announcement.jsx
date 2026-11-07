
import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./Dashboard/Dashboard.jsx";
import Create from "./Create/Create.jsx";
import Manage from "./Manage/Manage.jsx";

export default function Announcement() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />

      <Route path="create" element={<Create />} />

      <Route path="manage" element={<Manage />} />

      <Route path="*" element={<Navigate to="/admin/announcement" replace />} />
    </Routes>
  );
}
