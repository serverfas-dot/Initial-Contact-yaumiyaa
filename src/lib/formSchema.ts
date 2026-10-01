import { fetchRestJson, supabase } from './supabase';
import type { FormConfig, FormSection, FormField, Signatory } from './types';

const FORM_CONFIG_CACHE = 'yaumiyya.form_config';
const FORM_SECTIONS_CACHE = 'yaumiyya.form_sections';
const SIGNATORIES_CACHE = 'yaumiyya.signatories';
const SUBMISSIONS_CACHE = 'yaumiyya.submissions';

function readCache<T>(key: string): T | null {
  try {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) as T : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function clearCache(...keys: string[]): void {
  keys.forEach((key) => sessionStorage.removeItem(key));
}

export async function fetchFormConfig(): Promise<FormConfig | null> {
  const cached = readCache<FormConfig | null>(FORM_CONFIG_CACHE);
  if (cached) return cached;
  const rows = await fetchRestJson<FormConfig[]>('form_config', {
    select: 'id,title,subtitle,logo_text,submit_label,updated_at',
    limit: '1',
  });
  const config = rows[0] || null;
  writeCache(FORM_CONFIG_CACHE, config);
  return config;
}

export async function updateFormConfig(id: string, updates: Partial<FormConfig>): Promise<void> {
  await supabase.from('form_config').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  clearCache(FORM_CONFIG_CACHE);
}

export async function fetchSectionsWithFields(): Promise<FormSection[]> {
  const cached = readCache<FormSection[]>(FORM_SECTIONS_CACHE);
  if (cached) return cached;
  const [sections, fields] = await Promise.all([
    fetchRestJson<FormSection[]>('form_sections', {
      select: 'id,label,sort_order,style,created_at',
      order: 'sort_order.asc',
    }),
    fetchRestJson<FormField[]>('form_fields', {
      select: 'id,section_id,field_key,label,field_type,placeholder,options,required,full_width,sort_order,created_at',
      order: 'sort_order.asc',
    }),
  ]);

  const result = sections.map((section) => ({
    ...section,
    fields: fields.filter((field) => field.section_id === section.id),
  }));
  writeCache(FORM_SECTIONS_CACHE, result);
  return result;
}

export async function createSection(label: string, sort_order: number, style: string): Promise<FormSection | null> {
  const { data } = await supabase
    .from('form_sections')
    .insert([{ label, sort_order, style }])
    .select()
    .maybeSingle();
  clearCache(FORM_SECTIONS_CACHE);
  return data;
}

export async function updateSection(id: string, updates: Partial<FormSection>): Promise<void> {
  await supabase.from('form_sections').update(updates).eq('id', id);
  clearCache(FORM_SECTIONS_CACHE);
}

export async function deleteSection(id: string): Promise<void> {
  await supabase.from('form_sections').delete().eq('id', id);
  clearCache(FORM_SECTIONS_CACHE);
}

export async function createField(field: Omit<FormField, 'id' | 'created_at'>): Promise<FormField | null> {
  const { data } = await supabase.from('form_fields').insert([field]).select().maybeSingle();
  return data;
}

export async function updateField(id: string, updates: Partial<FormField>): Promise<void> {
  await supabase.from('form_fields').update(updates).eq('id', id);
  clearCache(FORM_SECTIONS_CACHE);
}

export async function deleteField(id: string): Promise<void> {
  await supabase.from('form_fields').delete().eq('id', id);
  clearCache(FORM_SECTIONS_CACHE);
}

export type SignatorySummary = Omit<Signatory, 'signature_data'>;

export async function fetchSignatoryNames(): Promise<SignatorySummary[]> {
  return fetchRestJson<SignatorySummary[]>('signatories', {
    select: 'id,name,sort_order,created_at',
    order: 'sort_order.asc',
  });
}

export async function fetchSignatorySignature(id: string): Promise<string> {
  const rows = await fetchRestJson<Array<{ signature_data: string }>>('signatories', {
    select: 'signature_data',
    id: `eq.${id}`,
    limit: '1',
  });
  return rows[0]?.signature_data || '';
}

export async function fetchSignatories(): Promise<Signatory[]> {
  const cached = readCache<Signatory[]>(SIGNATORIES_CACHE);
  if (cached) return cached;
  const signatories = await fetchRestJson<Signatory[]>('signatories', {
    select: 'id,name,signature_data,sort_order,created_at',
    order: 'sort_order.asc',
  });
  writeCache(SIGNATORIES_CACHE, signatories);
  return signatories;
}

export async function createSignatory(name: string, signature_data: string, sort_order: number): Promise<{ data: Signatory | null; error: string | null }> {
  const { data, error } = await supabase.from('signatories').insert([{ name, signature_data, sort_order }]).select().maybeSingle();
  clearCache(SIGNATORIES_CACHE);
  return { data, error: error ? error.message : null };
}

export async function updateSignatory(id: string, updates: Partial<Signatory>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('signatories').update(updates).eq('id', id);
  clearCache(SIGNATORIES_CACHE);
  return { error: error ? error.message : null };
}

export async function deleteSignatory(id: string): Promise<void> {
  await supabase.from('signatories').delete().eq('id', id);
  clearCache(SIGNATORIES_CACHE);
}

export interface Submission {
  id: string;
  submission_number: number;
  form_data: Record<string, string | number>;
  signature_data: Record<string, string>;
  submitted_at: string;
}

export type SubmissionSummary = Pick<Submission, 'id' | 'submission_number' | 'submitted_at'>;

export async function fetchSubmissions(): Promise<SubmissionSummary[]> {
  const cached = readCache<SubmissionSummary[]>(SUBMISSIONS_CACHE);
  if (cached) return cached;
  const submissions = await fetchRestJson<SubmissionSummary[]>('submissions', {
    select: 'id,submission_number,submitted_at',
  });
  submissions.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  writeCache(SUBMISSIONS_CACHE, submissions);
  return submissions;
}

export async function fetchSubmission(id: string): Promise<Submission> {
  const rows = await fetchRestJson<Submission[]>('submissions', {
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  });
  if (!rows[0]) throw new Error('Submission not found');
  return rows[0];
}

export async function deleteSubmission(id: string): Promise<void> {
  await supabase.from('submissions').delete().eq('id', id);
  clearCache(SUBMISSIONS_CACHE);
}
