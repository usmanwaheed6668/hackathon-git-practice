import Badge from './Badge.jsx';
import { APPLICATION_STATUS, JOB_STATUS } from '../../utils/constants';

/** Status pill for applications (default) or jobs (`kind="job"`). */
export default function StatusBadge({ status, kind = 'application' }) {
  const map = kind === 'job' ? JOB_STATUS : APPLICATION_STATUS;
  const meta = map[status] || { label: status || 'Unknown', tone: 'neutral' };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
