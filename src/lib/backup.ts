import { supabase } from './supabase';

export interface BackupData {
  version: string;
  exported_at: string;
  form_config: object[];
  form_sections: object[];
  form_fields: object[];
  signatories: object[];
  submissions: object[];
}

export async function exportBackup(): Promise<BackupData> {
  const [cfgRes, secRes, fldRes, sigRes, subRes] = await Promise.all([
    supabase.from('form_config').select('*'),
    supabase.from('form_sections').select('*'),
    supabase.from('form_fields').select('*'),
    supabase.from('signatories').select('*'),
    supabase.from('submissions').select('*'),
  ]);

  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    form_config: cfgRes.data || [],
    form_sections: secRes.data || [],
    form_fields: fldRes.data || [],
    signatories: sigRes.data || [],
    submissions: subRes.data || [],
  };
}

export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yaumiyya-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
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
