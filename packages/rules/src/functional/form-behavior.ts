import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import { createFinding } from '../finding.js';
import type { GeometryCollection } from '@syy-uime/core';

export const formBehaviorRule: Rule = {
  id: 'form-behavior',
  dimension: 'functional',
  requiredEvidence: ['geometry'],
  execute(context: RuleContext): RuleResult {
    const geometryEvidence = context.evidence.find((e) => e.type === 'geometry') as
      | Evidence<GeometryCollection>
      | undefined;

    const findings: Finding[] = [];
    let checksFailed = 0;

    if (!geometryEvidence) {
      return { findings, checksRun: 0, checksPassed: 0, checksFailed: 0 };
    }

    const forms = geometryEvidence.data.elements.filter((el) => el.tag === 'form');
    if (forms.length === 0) {
      return { findings, checksRun: 1, checksPassed: 1, checksFailed: 0 };
    }

    // We cannot see the form element itself in our geometry; check via DOM instead.
    // For the POC we rely on the presence of input elements as a proxy.
    const inputs = geometryEvidence.data.elements.filter(
      (el) => el.tag === 'input' || el.tag === 'select' || el.tag === 'textarea',
    );

    if (inputs.length > 0) {
      checksFailed++;
      findings.push(
        createFinding({
          ruleId: 'form-behavior',
          dimension: 'functional',
          severity: 'info',
          page: context.page,
          url: context.url,
          message:
            'Form inputs detected. The POC does not currently execute generic form submission assertions; configure a journey to validate submit/validation/success/error states.',
          evidence: [geometryEvidence],
        }),
      );
    }

    return {
      findings,
      checksRun: forms.length || 1,
      checksPassed: (forms.length || 1) - checksFailed,
      checksFailed,
    };
  },
};
