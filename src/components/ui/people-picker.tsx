import { useState, useRef, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Person {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface PeoplePickerProps {
  value: Person[];
  onChange: (people: Person[]) => void;
  placeholder?: string;
  className?: string;
  availablePeople?: Person[];
}

export function PeoplePicker({
  value = [],
  onChange,
  placeholder = 'Type to search people...',
  className,
  availablePeople = [],
}: PeoplePickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter people based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredPeople([]);
      return;
    }

    const searchTerm = inputValue.toLowerCase();
    const filtered = availablePeople.filter(
      (person) =>
        !value.find((p) => p.id === person.id) &&
        (person.name.toLowerCase().includes(searchTerm) ||
          person.email.toLowerCase().includes(searchTerm))
    );
    setFilteredPeople(filtered);
  }, [inputValue, availablePeople, value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectPerson = (person: Person) => {
    onChange([...value, person]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemovePerson = (personId: string) => {
    onChange(value.filter((p) => p.id !== personId));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected People Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 dark:bg-brand-green/20 rounded-full border border-brand-green/30"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-brand-green text-white">
                {getInitials(person.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-brand-navy dark:text-gray-100">
              {person.name}
            </span>
            <button
              type="button"
              onClick={() => handleRemovePerson(person.id)}
              className="hover:bg-brand-green/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3 text-brand-navy dark:text-gray-100" />
            </button>
          </div>
        ))}
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green bg-white dark:bg-gray-900 text-brand-navy dark:text-gray-100"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredPeople.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredPeople.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => handleSelectPerson(person)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-brand-green text-white text-xs">
                    {getInitials(person.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-navy dark:text-gray-100 truncate">
                    {person.name}
                  </p>
                  <p className="text-xs text-brand-slate dark:text-gray-400 truncate">
                    {person.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {showSuggestions &&
          inputValue.trim() !== '' &&
          filteredPeople.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-4 text-center">
              <User className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-brand-slate dark:text-gray-400">
                No people found
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
