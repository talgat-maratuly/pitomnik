import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { ExportPage } from '@/pages/admin/ExportPage'
import { JournalPage } from '@/pages/admin/JournalPage'
import { WorkMapPage } from '@/pages/admin/WorkMapPage'
import { ObjectsPage } from '@/pages/admin/ObjectsPage'
import { PhotosPage } from '@/pages/admin/PhotosPage'
import { QrPage } from '@/pages/admin/QrPage'
import { WorkTypesPage } from '@/pages/admin/WorkTypesPage'
import { WorkFormPage } from '@/pages/WorkFormPage'
import { FormSettingsPage } from '@/pages/admin/FormSettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/work-form" element={<WorkFormPage />} />
        <Route path="/work-form/:sectionCode" element={<WorkFormPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="work-map" element={<WorkMapPage />} />
          <Route path="objects" element={<ObjectsPage />} />
          <Route path="work-types" element={<WorkTypesPage />} />
          <Route path="qr" element={<QrPage />} />
          <Route path="form-settings" element={<FormSettingsPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="photos" element={<PhotosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
