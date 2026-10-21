import type { Page } from 'playwright';
import type { JourneyConfig, JourneyStep, Evidence, JourneyResult, JourneyStepResult } from '@syy-uime/core';

export { type JourneyResult };

export async function runJourney(page: Page, journey: JourneyConfig, baseUrl: string): Promise<JourneyResult> {
  const result: JourneyResult = {
    name: journey.name,
    start: journey.start,
    success: true,
    steps: [],
  };

  try {
    await page.goto(new URL(journey.start, baseUrl).toString(), { waitUntil: 'networkidle' });
  } catch (err) {
    result.success = false;
    result.error = `Failed to navigate to ${journey.start}: ${(err as Error).message}`;
    return result;
  }

  for (const step of journey.steps) {
    const stepResult = await executeStep(page, step);
    result.steps.push(stepResult);
    if (!stepResult.success) {
      result.success = false;
      break;
    }
  }

  return result;
}

async function executeStep(page: Page, step: JourneyStep): Promise<JourneyStepResult> {
  const timestamp = new Date().toISOString();
  const action = step.action;

  try {
    switch (action) {
      case 'navigate':
        await page.goto(step.value ?? '', { waitUntil: 'networkidle' });
        return { action, value: step.value, success: true, message: 'Navigated', timestamp };
      case 'fill':
        if (!step.selector) throw new Error('fill requires selector');
        await page.fill(step.selector, step.value ?? '');
        return { action, selector: step.selector, value: step.value, success: true, message: `Filled ${step.selector}`, timestamp };
      case 'click':
        if (!step.selector) throw new Error('click requires selector');
        await page.click(step.selector);
        return { action, selector: step.selector, success: true, message: `Clicked ${step.selector}`, timestamp };
      case 'assert-visible':
        if (!step.selector) throw new Error('assert-visible requires selector');
        await page.waitForSelector(step.selector, { state: 'visible', timeout: 5000 });
        return { action, selector: step.selector, success: true, message: `${step.selector} is visible`, timestamp };
      case 'assert-text':
        if (!step.selector || !step.text) throw new Error('assert-text requires selector and text');
        const text = await page.textContent(step.selector);
        if (!text?.includes(step.text)) throw new Error(`Expected text "${step.text}" not found in ${step.selector}`);
        return { action, selector: step.selector, text: step.text, success: true, message: `Text "${step.text}" found`, timestamp };
      case 'press':
        await page.keyboard.press(step.key ?? 'Enter');
        return { action, key: step.key, success: true, message: `Pressed ${step.key}`, timestamp };
      case 'select':
        if (!step.selector || !step.value) throw new Error('select requires selector and value');
        await page.selectOption(step.selector, step.value);
        return { action, selector: step.selector, value: step.value, success: true, message: `Selected ${step.value}`, timestamp };
      case 'hover':
        if (!step.selector) throw new Error('hover requires selector');
        await page.hover(step.selector);
        return { action, selector: step.selector, success: true, message: `Hovered ${step.selector}`, timestamp };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    return {
      action,
      selector: step.selector,
      value: step.value,
      success: false,
      message: (err as Error).message,
      timestamp,
    };
  }
}

export function journeyEvidence(result: JourneyResult): Evidence<JourneyResult> {
  return { type: 'journey-step', data: result };
}
