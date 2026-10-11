import { useQuery } from '@tanstack/react-query'
import { getMyInvoices, getMyBills } from '../../api/tenants.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

export default function TenantInvoices() {
  const { data: invoices, isLoading: invoicesLoading } = useQuery({ queryKey: ['tenant-invoices'], queryFn: () => getMyInvoices() })
  const { data: bills, isLoading: billsLoading } = useQuery({ queryKey: ['tenant-bills'], queryFn: () => getMyBills() })

  if (invoicesLoading || billsLoading) return <LoadingSpinner label="Loading billing..." />

  const invoiceResults = invoices?.results || []
  const billResults = bills?.results || []

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Invoices & Bills</h1>

      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Rent Invoices</h2>
      {invoiceResults.length === 0 ? (
        <EmptyState title="No invoices" description="You have no rent invoices yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {invoiceResults.map((inv) => (
            <Card key={inv.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>{inv.invoice_number}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      Period: {inv.billing_period} | Due: {formatDate(inv.due_date)}
                    </p>
                  </div>
                  <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
                    {inv.status_display}
                  </Badge>
                </div>
                <div style={{ marginTop: 'var(--space-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                  <div><span style={{ color: 'var(--color-neutral-500)' }}>Total:</span> {formatBDT(inv.total_amount)}</div>
                  <div><span style={{ color: 'var(--color-neutral-500)' }}>Paid:</span> {formatBDT(inv.paid_amount)}</div>
                  <div><span style={{ color: 'var(--color-neutral-500)' }}>Outstanding:</span> <strong>{formatBDT(inv.outstanding_amount)}</strong></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Other Bills</h2>
      {billResults.length === 0 ? (
        <EmptyState title="No bills" description="You have no additional bills yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {billResults.map((bill) => (
            <Card key={bill.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>{bill.category_display || bill.category}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      Period: {bill.billing_period} | Due: {formatDate(bill.due_date)}
                    </p>
                  </div>
                  <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'danger' : 'warning'}>
                    {bill.status_display}
                  </Badge>
                </div>
                <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-neutral-500)' }}>Amount:</span> <strong>{formatBDT(bill.amount)}</strong>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
