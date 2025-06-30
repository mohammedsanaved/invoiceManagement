import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';

export interface BankOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: BankOption[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function BankSearchDropdown({
  options,
  selectedValue,
  onChange,
  placeholder = 'Select bank…',
  disabled = false,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );
  const selected = options.find((o) => o.value === selectedValue);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // focus input on open
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      const opt = filtered[highlightedIndex];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
        setSearchTerm('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 200 }}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          padding: 8,
          border: '1px solid #ccc',
          borderRadius: 4,
          background: disabled ? '#f5f5f5' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {selected?.label ?? (
          <span style={{ color: '#aaa' }}>{placeholder}</span>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            border: '1px solid #ccc',
            borderRadius: 4,
            background: '#fff',
            maxHeight: 200,
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          <input
            ref={inputRef}
            type='text'
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder='Search…'
            style={{
              boxSizing: 'border-box',
              width: '100%',
              padding: 8,
              border: 'none',
              borderBottom: '1px solid #eee',
            }}
          />

          {filtered.length === 0 ? (
            <div style={{ padding: 8, color: '#888' }}>No results</div>
          ) : (
            filtered.map((opt, idx) => (
              <div
                key={opt.value}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.value);
                  setOpen(false);
                  setSearchTerm('');
                }}
                style={{
                  padding: 8,
                  background: idx === highlightedIndex ? '#f0f0f0' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
