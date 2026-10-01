export interface Signatory {
  id: string;
  name: string;
  signature_data: string;
  sort_order: number;
  created_at?: string;
}

export interface FormConfig {
  id: string;
  title: string;
  subtitle: string;
  logo_text: string;
  submit_label: string;
  updated_at?: string;
}

export interface FormSection {
  id: string;
  label: string;
  sort_order: number;
  style: 'default' | 'signature';
  created_at?: string;
  fields?: FormField[];
}

export interface FormField {
  id: string;
  section_id: string;
  field_key: string;
  label: string;
  field_type: 'text' | 'number' | 'date' | 'time' | 'textarea' | 'select' | 'signature-select';
  placeholder: string;
  options: string;
  required: boolean;
  full_width: boolean;
  sort_order: number;
  created_at?: string;
}
