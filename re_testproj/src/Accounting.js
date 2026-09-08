import React from 'react';
import PlannedFeature from './PlannedFeature';

function Accounting() {
  return (
    <PlannedFeature
      title="Accounting"
      summary="A single place to reconcile what was billed against what was actually collected, and to categorise every peso that moves through a property."
      planned={[
        'Chart of accounts scoped per property and per company',
        'Automatic reconciliation of issued bills against recorded payments',
        'Expense categorisation for repairs, utilities, payroll and supplies',
        'Period locking, so closed months cannot be edited after filing',
        'Export to CSV for handoff to an external bookkeeper',
      ]}
      relatedLabel="See Profit and Loss"
      relatedPath="/profitloss"
    />
  );
}

export default Accounting;
