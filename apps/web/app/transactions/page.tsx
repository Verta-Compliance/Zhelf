import { redirect } from 'next/navigation';
import { Text, Title2, Title3 } from '@fluentui/react-text';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';
import { getMarketplaceTransactions } from '../../src/server/database';
import TransactionActions from './transaction-actions';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const transactions = await getMarketplaceTransactions(user.id);

  return (
    <main className='container'>
      <div className='section-heading'>
        <Title2 as='h1'>Transactions</Title2>
        <Text className='muted'>
          Complete a handoff, then review your experience.
        </Text>
      </div>
      {transactions.length ? (
        <div className='transaction-list'>
          {transactions.map((transaction) => (
            <article
              className='transaction-card'
              key={transaction.id}
            >
              <div>
                <Title3 as='h2'>{transaction.listingTitle}</Title3>
                <Text className='muted'>
                  {transaction.transactionType === 'Purchase'
                    ? `Purchase · $${transaction.amount}`
                    : `Swap · ${transaction.swapListingTitle ?? 'offered item'}`}
                </Text>
                <p>
                  {transaction.buyerId === user.id
                    ? `Seller: ${transaction.sellerName}`
                    : `Buyer: ${transaction.buyerName}`}
                </p>
                <span className='status-badge'>{transaction.status}</span>
              </div>
              <TransactionActions
                transaction={transaction}
                currentUserId={user.id}
              />
            </article>
          ))}
        </div>
      ) : (
        <p className='muted'>
          No transactions yet. Accepted offers will appear here.
        </p>
      )}
    </main>
  );
}
