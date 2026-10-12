import { DashboardLayout } from '../components/layout/DashboardLayout.jsx'
import { Home, Bookmark, FileText, Calendar, CreditCard, MessageSquare, Bell, Wrench, User } from 'lucide-react'

const tenantNav = [
  { to: '/tenant', label: 'Overview', icon: <Home size={18} /> },
  { to: '/tenant/saved', label: 'Saved Properties', icon: <Bookmark size={18} /> },
  { to: '/tenant/requirements', label: 'Rental Requirements', icon: <FileText size={18} /> },
  { to: '/tenant/viewings', label: 'Viewings', icon: <Calendar size={18} /> },
  { to: '/tenant/tenancies', label: 'My Tenancies', icon: <Home size={18} /> },
  { to: '/tenant/invoices', label: 'Invoices & Bills', icon: <CreditCard size={18} /> },
  { to: '/tenant/complaints', label: 'Complaints', icon: <Wrench size={18} /> },
  { to: '/tenant/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  { to: '/tenant/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/tenant/profile', label: 'My Profile', icon: <User size={18} /> },
]

export default function TenantLayout() {
  return <DashboardLayout title="Tenant Portal" navLinks={tenantNav} />
}
