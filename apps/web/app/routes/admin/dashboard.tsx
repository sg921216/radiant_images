import { AdminLayout } from '../../components/AdminLayout';
import { Link } from 'react-router';
export default function Dashboard() {
  return (
    <AdminLayout>
      <h1>Owner dashboard</h1>
      <p>Your signed-in workspace for Radiant Images.</p>
      <nav aria-label="Owner sections">
        <Link to="/admin/content">Pages and FAQ</Link>
        <Link to="/admin/pricing">Pricing</Link>
        <Link to="/admin/gallery">Gallery</Link>
        <Link to="/admin/banners">Banners</Link>
        <Link to="/admin/settings">Settings</Link>
        <Link to="/admin/templates">Email templates</Link>
        <Link to="/admin/checklist">Master checklist</Link>
        <Link to="/admin/questionnaire">Questionnaire questions</Link>
        <Link to="/admin/clients">Clients</Link>
      </nav>
    </AdminLayout>
  );
}
