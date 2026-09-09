import React from 'react';
import PlannedFeature from './PlannedFeature';

function Accounting() {
  return (
    <PlannedFeature
      title="Accounting is on the way"
      items={[
        'Automatic reconciliation of issued bills against recorded payments',
        'Expense categorization for repairs, utilities, payroll and supplies',
        'Chart of accounts scoped per property and per company',
        'Period locking, so closed months cannot be edited after filing',
        'CSV export for handoff to an external bookkeeper',
      ]}
    />
  );
}

export default Accounting;
