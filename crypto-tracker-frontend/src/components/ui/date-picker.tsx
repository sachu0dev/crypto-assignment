import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { cn } from '../../lib/utils';
import dayjs from 'dayjs';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label }) => {
  const [open, setOpen] = React.useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm mb-1">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-between rounded border px-3 py-2 bg-background text-left text-sm shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            )}
            onClick={() => setOpen(!open)}
            type="button"
          >
            {value ? (
              dayjs(value).format('YYYY-MM-DD HH:mm')
            ) : (
              <span className="text-muted-foreground">Pick a date/time</span>
            )}
            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <input
            type="datetime-local"
            value={value}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
