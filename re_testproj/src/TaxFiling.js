import React from 'react';
import PlannedFeature from './PlannedFeature';

function TaxFiling() {
  return (
    <PlannedFeature
      title="Tax Filing"
      summary="Philippine rental income carries VAT and expanded withholding tax obligations. This module will assemble the figures BIR forms need instead of leaving them to a spreadsheet."
      planned={[
        'VAT and expanded withholding tax computed from issued bills',
        'Quarterly and annual summaries aligned to BIR filing periods',
        'Withholding certificates (BIR 2307) generated per tenant',
        'A filing calendar with deadline reminders',
        'Figures reconciled against the Profit and Loss statement',
      ]}
      relatedLabel="See Profit and Loss"
      relatedPath="/profitloss"
    />
  );
}

export default TaxFiling;
