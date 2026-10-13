import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Text, Title2, Title3 } from '@fluentui/react-text';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import { isModerator } from '../../../src/lib/supabase/moderation';
import { getListingReports } from '../../../src/server/database';
import ReportReviewActions from './review-actions';

export default async function ModerationReportsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/auth');
  if (!isModerator(user)) notFound();

  const reports = await getListingReports();

  return (
    <main className='container'>
      <div className='section-heading'>
        <Title2 as='h1'>Listing reports</Title2>
        <Text className='muted'>Review reports from the community.</Text>
      </div>
      {reports.length ? (
        <div className='report-list'>
          {reports.map((report) => (
            <article
              className='report-card'
              key={report.id}
            >
              <div className='report-content'>
                <div className='report-heading'>
                  <Title3 as='h2'>{report.reason}</Title3>
                  <span className='status-badge'>{report.status}</span>
                </div>
                <Link
                  href={`/listings/${report.listingId}`}
                  className='view-link'
                >
                  {report.listingTitle}
                </Link>
                <Text className='muted'>Reported by {report.reporterName}</Text>
                {report.details ? <p>{report.details}</p> : null}
                <time
                  className='muted'
                  dateTime={report.createdAt}
                >
                  {`${report.createdAt.slice(0, 16).replace('T', ' ')} UTC`}
                </time>
              </div>
              {report.status === 'Open' ? (
                <ReportReviewActions reportId={report.id} />
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className='muted'>No listing reports.</p>
      )}
    </main>
  );
}
