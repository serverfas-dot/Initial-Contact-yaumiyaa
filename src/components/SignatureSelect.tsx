import { useState, useEffect } from 'react';
import { fetchSignatoryNames, fetchSignatorySignature } from '../lib/formSchema';
import type { SignatorySummary } from '../lib/formSchema';

let sharedSignatories: SignatorySummary[] | null = null;
let sharedSignatoriesRequest: Promise<SignatorySummary[]> | null = null;

function loadSharedSignatories(): Promise<SignatorySummary[]> {
  if (sharedSignatories) return Promise.resolve(sharedSignatories);
  if (!sharedSignatoriesRequest) {
    sharedSignatoriesRequest = fetchSignatoryNames()
      .then((data) => {
        sharedSignatories = data;
        return data;
      })
      .finally(() => {
        sharedSignatoriesRequest = null;
      });
  }
  return sharedSignatoriesRequest;
}

interface Props {
  fieldKey: string;
  label: string;
  required: boolean;
  value: string;
  onChange: (name: string, signatureData: string) => void;
}

export default function SignatureSelect({ fieldKey, label, required, value, onChange }: Props) {
  const [signatories, setSignatories] = useState<SignatorySummary[]>([]);
  const [selectedSignature, setSelectedSignature] = useState('');
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    loadSharedSignatories()
      .then((data) => {
        setSignatories(data);
        setLoading(false);
      })
      .catch(() => {
        setErrored(true);
        setLoading(false);
      });
  }, []);

  const selected = signatories.find((s) => s.name === value);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    const sig = signatories.find((s) => s.name === name);
    if (!sig) {
      setSelectedSignature('');
      onChange('', '');
      return;
    }
    try {
      const signature = await fetchSignatorySignature(sig.id);
      setSelectedSignature(signature);
      onChange(name, signature);
    } catch {
      setErrored(true);
      onChange(name, '');
    }
  };

  return (
    <div className="sig-select-row">
      <div className="sig-select-name-col">
        <label className="sig-col-label">ނަން</label>
        <select
          name={fieldKey}
          required={required}
          value={value}
          onChange={handleChange}
          className="select-field"
          disabled={loading}
        >
          <option value="">{loading ? 'ލޯޑްވަނީ...' : errored ? 'ނުކުޅެދުނު' : 'ނަން ހިޔާރުކޮށްލާ...'}</option>
          {signatories.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="sig-select-sig-col">
        <label className="sig-col-label">{label}</label>
        <div className="sig-select-sig-box">
          {selected && selectedSignature ? (
            <img
              src={selectedSignature}
              alt={selected.name}
              className="sig-select-sig-img"
            />
          ) : (
            <span className="sig-select-sig-placeholder">
              {value ? 'ސިގްނޭޗަރ ނެތް' : '—'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
