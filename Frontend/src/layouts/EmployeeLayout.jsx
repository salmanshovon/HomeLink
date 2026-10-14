import { DashboardLayout } from '../components/layout/DashboardLayout.jsx'
import { Home, Building, FileText, Users, ClipboardList, Calendar, CreditCard, MessageSquare, Bell, User, Wrench } from 'lucide-react'

const employeeNav = [
  { to: '/employee', label: 'Overview', icon: <Home size={18} /> },
  { to: '/employee/properties', label: 'All Properties', icon: <Building size={18} /> },
  { to: '/employee/listings', label: 'Listing Moderation', icon: <FileText size={18} /> },
  { to: '/employee/leads', label: 'Leads & Inquiries', icon: <ClipboardList size={18} /> },
  { to: '/employee/viewings', label: 'Viewings', icon: <Calendar size={18} /> },
  { to: '/employee/applications', label: 'Applications', icon: <FileText size={18} /> },
  { to: '/employee/tenancies', label: 'Tenancies', icon: <Users size={18} /> },
  { to: '/employee/billing', label: 'Billing', icon: <CreditCard size={18} /> },
  { to: '/employee/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  { to: '/employee/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/employee/services', label: 'Service Requests', icon: <Wrench size={18} /> },
  { to: '/employee/profile', label: 'My Profile', icon: <User size={18} /> },
]

export default function EmployeeLayout() {
  return <DashboardLayout title="Employee Portal" navLinks={employeeNav} />
}
