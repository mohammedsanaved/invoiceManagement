import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';

// Minimal CSS‐in‐JS for demonstration; you can extract these into a CSS file or your preferred styling system.
const styles = {
  container: {
    position: 'relative' as const,
    width: '180px',
    fontFamily: 'Arial, sans-serif',
  },
  triggerButton: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #f7f7f7',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    cursor: 'pointer',
  },
  placeholderText: {
    color: '#ccc',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#fff',
    zIndex: 1000,
    maxHeight: '200px',
    overflowY: 'auto' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    borderBottom: '1px solid #eee',
    outline: 'none' as const,
    boxSizing: 'border-box' as const,
  },
  option: {
    padding: '8px 12px',
    cursor: 'pointer',
  },
  optionHighlighted: {
    background: '#f0f0f0',
  },
  noResults: {
    padding: '8px 12px',
    color: '#888',
  },
  icon: {
    marginLeft: '8px',
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
  },
  iconUp: {
    borderBottom: '6px solid #333',
  },
  iconDown: {
    borderTop: '6px solid #333',
  },
};

export interface Option {
  value: number;
  label: string;
}

interface SearchableDropdownProps {
  /** List of all possible options (each must have `id` and `name`). */
  options: Option[];
  /** Currently selected option’s id, or null if none. */
  selectedId: number | null;
  /** Called when user picks an option; receives the numeric id. */
  onChange: (id: number) => void;
  /** Placeholder text when nothing is selected. */
  placeholder?: string;
  /** If true, component is disabled (button doesn’t open). */
  disabled?: boolean;
}

export default function SearchableDropdown({
  options,
  selectedId,
  onChange,
  placeholder = 'Select…',
  disabled = false,
}: SearchableDropdownProps) {
  // open/closed state
  const [open, setOpen] = useState(false);
  // current search text
  const [searchTerm, setSearchTerm] = useState('');
  // which index is currently highlighted in filtered list
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // ref to the container, for outside‐click detection
  const containerRef = useRef<HTMLDivElement>(null);

  // Input ref (so we can focus it when dropdown opens)
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute filtered list of options each render
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  // Find display name of currently selected option
  const selectedOption = options.find((opt) => opt.value === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        // Reset searchTerm so next time dropdown opens, it starts fresh
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // When “open” becomes true, focus the input
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  // Handle keyboard events on the search input
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex((idx) =>
        idx + 1 < filteredOptions.length ? idx + 1 : idx
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((idx) => (idx - 1 >= 0 ? idx - 1 : idx));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && filteredOptions[highlightedIndex]) {
        const chosen = filteredOptions[highlightedIndex];
        onChange(chosen.value);
        setOpen(false);
        setSearchTerm('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setSearchTerm('');
    }
  };

  // When trigger button is clicked
  const toggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <div
        style={{
          ...styles.triggerButton,
          background: disabled ? '#f5f5f5' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: disabled ? '#999' : '#000',
        }}
        onClick={toggleOpen}
      >
        <span style={selectedOption ? {} : { ...styles.placeholderText }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          style={{
            ...styles.icon,
            ...(open ? styles.iconUp : styles.iconDown),
          }}
        />
      </div>

      {open && (
        <div style={styles.dropdown}>
          <input
            ref={inputRef}
            type='text'
            placeholder='Search…'
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            onKeyDown={onKeyDown}
            style={styles.searchInput}
          />

          {filteredOptions.length === 0 ? (
            <div style={styles.noResults}>No results found</div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={opt.value}
                  style={{
                    ...styles.option,
                    ...(isHighlighted ? styles.optionHighlighted : {}),
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    // mousedown, not click, so it fires before blur
                    e.preventDefault();
                    onChange(opt.value);
                    setOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
