import { fetchRestJson, supabase } from './supabase';

export interface BackupData {
  version: string;
  exported_at: string;
  form_config: object[];
  form_sections: object[];
  form_fields: object[];
  signatories: object[];
  submissions: object[];
}

async function fetchSmallTable<T extends object>(table: string, select: string): Promise<T[]> {
  return fetchRestJson<T[]>(table, { select }, 0);
}

async function fetchAllRows<T extends object>(table: string, select: string, pageSize = 1): Promise<T[]> {
  const backupTimeout = 0;
  const ids = await fetchRestJson<Array<{ id: string }>>(table, { select: 'id' }, backupTimeout);
  if (ids.length === 0) return [];

  const rows: T[] = [];
  for (let offset = 0; offset < ids.length; offset += pageSize) {
    const page = await fetchRestJson<T[]>(table, {
      select,
      offset: String(offset),
      limit: String(pageSize),
    }, backupTimeout);
    rows.push(...page);
  }
  return rows;
}

export async function exportBackup(): Promise<BackupData> {
  const formConfig = await fetchSmallTable('form_config', 'id,title,subtitle,logo_text,submit_label,updated_at');
  const formSections = await fetchSmallTable('form_sections', 'id,label,sort_order,style,created_at');
  const formFields = await fetchSmallTable('form_fields', 'id,section_id,field_key,label,field_type,placeholder,options,required,full_width,sort_order,created_at');
  const signatories = await fetchAllRows('signatories', 'id,name,signature_data,sort_order,created_at', 5);
  const submissions = await fetchAllRows('submissions', 'id,submission_number,form_data,signature_data,submitted_at', 5);

  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    form_config: formConfig,
    form_sections: formSections,
    form_fields: formFields,
    signatories,
    submissions,
  };
}

export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yaumiyya-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function restoreBackup(data: BackupData): Promise<{ success: boolean; error: string | null }> {
  try {
    if (data.form_sections?.length) {
      await supabase.from('form_fields').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('form_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (data.form_config?.length) {
      for (const row of data.form_config) {
        await supabase.from('form_config').upsert(row as object);
      }
    }

    if (data.form_sections?.length) {
      await supabase.from('form_sections').insert(data.form_sections as object[]);
    }

    if (data.form_fields?.length) {
      await supabase.from('form_fields').insert(data.form_fields as object[]);
    }

    if (data.signatories?.length) {
      await supabase.from('signatories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('signatories').insert(data.signatories as object[]);
    }

    if (data.submissions?.length) {
      for (const row of data.submissions) {
        await supabase.from('submissions').upsert(row as object);
      }
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
