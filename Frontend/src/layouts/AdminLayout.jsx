import { DashboardLayout } from '../components/layout/DashboardLayout.jsx'
import { Home, Building, FileText, Users, ClipboardList, Calendar, CreditCard, MessageSquare, Bell, Shield, User } from 'lucide-react'

const adminNav = [
  { to: '/admin', label: 'Overview', icon: <Home size={18} /> },
  { to: '/admin/properties', label: 'All Properties', icon: <Building size={18} /> },
  { to: '/admin/listings', label: 'Listing Moderation', icon: <FileText size={18} /> },
  { to: '/admin/users', label: 'User Management', icon: <Users size={18} /> },
  { to: '/admin/users/create-employee', label: 'Create Employee', icon: <Users size={18} /> },
  { to: '/admin/leads', label: 'Leads & Inquiries', icon: <ClipboardList size={18} /> },
  { to: '/admin/viewings', label: 'Viewings', icon: <Calendar size={18} /> },
  { to: '/admin/applications', label: 'Applications', icon: <FileText size={18} /> },
  { to: '/admin/tenancies', label: 'Tenancies', icon: <Users size={18} /> },
  { to: '/admin/billing', label: 'Billing', icon: <CreditCard size={18} /> },
  { to: '/admin/commissions', label: 'Commissions', icon: <CreditCard size={18} /> },
  { to: '/admin/audit', label: 'Audit Logs', icon: <Shield size={18} /> },
  { to: '/admin/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/admin/profile', label: 'My Profile', icon: <User size={18} /> },
]

export default function AdminLayout() {
  return <DashboardLayout title="Admin Portal" navLinks={adminNav} />
}
