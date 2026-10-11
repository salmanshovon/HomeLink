import { DashboardLayout } from '../components/layout/DashboardLayout.jsx'
import { Home, Building, FileText, Users, CreditCard, MessageSquare, Bell, Megaphone } from 'lucide-react'

const landlordNav = [
  { to: '/landlord', label: 'Overview', icon: <Home size={18} /> },
  { to: '/landlord/properties', label: 'My Properties', icon: <Building size={18} /> },
  { to: '/landlord/listings', label: 'Listings', icon: <FileText size={18} /> },
  { to: '/landlord/tenancies', label: 'Tenancies', icon: <Users size={18} /> },
  { to: '/landlord/invoices', label: 'Invoices & Bills', icon: <CreditCard size={18} /> },
  { to: '/landlord/complaints', label: 'Complaints', icon: <FileText size={18} /> },
  { to: '/landlord/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  { to: '/landlord/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { to: '/landlord/notifications', label: 'Notifications', icon: <Bell size={18} /> },
]

export default function LandlordLayout() {
  return <DashboardLayout title="Landlord Portal" navLinks={landlordNav} />
}
