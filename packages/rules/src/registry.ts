import type { Rule } from '@syy-uime/core';
import { runtimeErrorsRule } from './functional/runtime-errors.js';
import { networkFailuresRule } from './functional/network-failures.js';
import { brokenNavigationRule } from './functional/broken-navigation.js';
import { journeyExecutionRule } from './functional/journey-execution.js';
import { formBehaviorRule } from './functional/form-behavior.js';
import { buttonStyleRule } from './consistent/button-style.js';
import { formControlStyleRule } from './consistent/form-control-style.js';
import { typographyRule } from './consistent/typography.js';
import { spacingRule } from './consistent/spacing.js';
import { axeViolationsRule } from './accessible/axe-violations.js';
import { keyboardFocusRule } from './accessible/keyboard-focus.js';
import { semanticStructureRule } from './accessible/semantic-structure.js';
import { documentOverflowRule } from './responsive/document-overflow.js';
import { elementOverflowRule } from './responsive/element-overflow.js';
import { elementOverlapRule } from './responsive/element-overlap.js';

export const ALL_RULES: Rule[] = [
  // Functional
  runtimeErrorsRule,
  networkFailuresRule,
  brokenNavigationRule,
  journeyExecutionRule,
  formBehaviorRule,
  // Consistent
  buttonStyleRule,
  formControlStyleRule,
  typographyRule,
  spacingRule,
  // Accessible
  axeViolationsRule,
  keyboardFocusRule,
  semanticStructureRule,
  // Responsive
  documentOverflowRule,
  elementOverflowRule,
  elementOverlapRule,
];

export function getRulesForDimensions(dimensions: ('functional' | 'consistent' | 'accessible' | 'responsive')[]): Rule[] {
  return ALL_RULES.filter((rule) => dimensions.includes(rule.dimension));
}
