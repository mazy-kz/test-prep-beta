export const PRODUCT_NAME = 'Test Prep Portfolio';
export const PRODUCT_VERSION = 'v1.1';
export const PRODUCT_TITLE = `${PRODUCT_NAME} — ${PRODUCT_VERSION}`;

export const PRODUCT_DESCRIPTION =
  'Practice multiple-choice exams with instant or end-of-test feedback across math and science subjects.';

export function formatPageTitle(section?: string) {
  return section ? `${section} · ${PRODUCT_TITLE}` : PRODUCT_TITLE;
}
