import { useQuery } from '@tanstack/react-query'
import { getMyInvoices, getMyPayments } from '../../api/landlords.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

export default function LandlordInvoices() {
  const { data: invoices, isLoading: invoicesLoading } = useQuery({ queryKey: ['landlord-invoices'], queryFn: () => getMyInvoices() })
  const { data: payments, isLoading: paymentsLoading } = useQuery({ queryKey: ['landlord-payments'], queryFn: () => getMyPayments() })

  if (invoicesLoading || paymentsLoading) return <LoadingSpinner label="Loading billing..." />

  const invoiceResults = invoices?.results || []
  const paymentResults = payments?.results || []

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Invoices & Payments</h1>

      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Invoices</h2>
      {invoiceResults.length === 0 ? (
        <EmptyState title="No invoices" description="No invoices have been generated yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {invoiceResults.map((inv) => (
            <Card key={inv.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                  <div><span style={{ color: 'var(--color-neutral-500)' }}>Total:</span> {formatBDT(inv.total_amount)}</div>
                  <div><span style={{ color: 'var(--color-neutral-500)' }}>Paid:</span> {formatBDT(inv.paid_amount)}</div>
                  <div><span style={{ color: 'var(--color-neutral-500)' }}>Outstanding:</span> <strong>{formatBDT(inv.outstanding_amount)}</strong></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Payment History</h2>
      {paymentResults.length === 0 ? (
        <EmptyState title="No payments" description="No payment records yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {paymentResults.map((payment) => (
            <Card key={payment.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>{payment.internal_tx_ref}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      {payment.purpose_display} | {formatDate(payment.initiated_at)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'var(--font-semibold)' }}>{formatBDT(payment.amount)}</div>
                    <Badge variant={payment.status === 'successful' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}>
                      {payment.status_display}
                    </Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
