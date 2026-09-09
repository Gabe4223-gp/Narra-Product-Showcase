import React from 'react';
import PlannedFeature from './PlannedFeature';

function TaxFiling() {
  return (
    <PlannedFeature
      title="Tax Filing is on the way"
      items={[
        'VAT and expanded withholding tax computed from issued bills',
        'Quarterly and annual summaries aligned to BIR filing periods',
        'Withholding certificates (BIR 2307) generated per tenant',
        'A filing calendar with deadline reminders',
        'Figures reconciled against the Profit and Loss statement',
      ]}
    />
  );
}

export default TaxFiling;
