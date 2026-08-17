import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Download, Filter, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb, PageHeader } from '../components/layout/PortalLayout';
import { AlertCard, EmptyState, ErrorState, LoadingSkeleton } from '../components/common/UI';
import { groundwaterService } from '../services/groundwater.service';
import { useAppStore } from '../store/appStore';

const EMPTY_ALERTS = [];

export default function AlertsPage() {
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const { alertStatuses, updateAlertStatus } = useAppStore();
  const alertsQuery = useQuery({ queryKey: ['alerts'], queryFn: groundwaterService.getAlerts });
  const alerts = alertsQuery.data ?? EMPTY_ALERTS;
  const filtered = useMemo(() => alerts.filter((alert) => (!severity || alert.severity === severity) && (!status || (alertStatuses[alert.id] || alert.status) === status)), [alerts, severity, status, alertStatuses]);
  const acknowledge = (id) => { updateAlertStatus(id, 'Acknowledged'); toast.success('Alert marked as acknowledged locally.'); };

  return <><Breadcrumb items={['Alerts']}/><PageHeader title="Groundwater Alerts" description="Review alerts recorded by the monitoring pipeline."/><section className="page-section"><div className="container">{alertsQuery.isLoading ? <LoadingSkeleton rows={4}/> : alertsQuery.isError ? <ErrorState retry={alertsQuery.refetch}/> : <><div className="filters alert-filters"><div className="field"><label htmlFor="severity">Severity</label><select id="severity" value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="">All severities</option>{['critical', 'high', 'medium', 'low'].map((value) => <option key={value}>{value}</option>)}</select></div><div className="field"><label htmlFor="alert-status">Status</label><select id="alert-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>New</option><option>Acknowledged</option></select></div><button className="button" onClick={() => toast.success('Alert filters applied.')}><Filter size={16}/> Apply filters</button><button className="button button-outline" onClick={() => { setSeverity(''); setStatus(''); }}>Reset</button></div>{filtered.length ? <div className="alert-list">{filtered.map((alert) => <AlertCard key={alert.id} alert={{ ...alert, status: alertStatuses[alert.id] || alert.status }} onStatusChange={acknowledge}/>)}</div> : <EmptyState title="No data available." message="No alerts have been recorded."/>}</>}</div></section></>;
}

export function AlertDetailPage() {
  const { id } = useParams();
  const { alertStatuses, updateAlertStatus } = useAppStore();
  const alertsQuery = useQuery({ queryKey: ['alerts'], queryFn: groundwaterService.getAlerts });
  if (alertsQuery.isLoading) return <section className="page-section"><div className="container"><LoadingSkeleton rows={3}/></div></section>;
  if (alertsQuery.isError) return <section className="page-section"><div className="container"><ErrorState retry={alertsQuery.refetch}/></div></section>;
  const alert = alertsQuery.data?.find((item) => item.id === id);
  if (!alert) return <section className="page-section"><div className="container"><EmptyState title="No data available." message="This alert was not found."/></div></section>;
  const currentStatus = alertStatuses[alert.id] || alert.status;
  return <><Breadcrumb items={['Alerts', alert.title]}/><PageHeader eyebrow={`${alert.severity} severity`} title={alert.title} description={`${alert.district}, ${alert.state} · ${new Date(alert.createdAt).toLocaleString('en-IN')}`}/><section className="page-section"><div className="container content-grid"><section className="panel"><h2>Alert evidence</h2><dl className="detail-list single"><div><dt>Status</dt><dd>{currentStatus}</dd></div><div><dt>Trigger reason</dt><dd>{alert.description}</dd></div><div><dt>Related station</dt><dd>{alert.stationId}</dd></div></dl><h3>Recommended action</h3><p>{alert.recommendedAction}</p></section><aside className="panel"><h2>Review actions</h2><div className="stacked-actions"><button className="button" onClick={() => { updateAlertStatus(alert.id, 'Acknowledged'); toast.success('Alert acknowledged locally.'); }}><CheckCircle2 size={17}/> Acknowledge</button><button className="button button-outline" onClick={() => toast.info('Server-side review workflow is not available.')}><MessageSquare size={17}/> Mark under review</button><button className="button button-outline" onClick={() => toast.info('Export is not available.')}><Download size={17}/> Download summary</button></div></aside></div></section></>;
}
