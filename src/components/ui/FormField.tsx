import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'textarea' | 'select';
  value?: string | number;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  className?: string;
  helpText?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  touched = false,
  options = [],
  min,
  max,
  step,
  rows = 3,
  className,
  helpText,
}) => {
  const hasError = touched && error;
  const showError = hasError;

  const handleChange = (newValue: string | number) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleChange(type === 'number' ? Number(e.target.value) : e.target.value),
      onBlur: handleBlur,
      placeholder,
      disabled,
      required,
      className: cn(
        'transition-colors',
        showError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      ),
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={rows}
            placeholder={placeholder}
          />
        );

      case 'select':
        return (
          <Select
            value={value as string}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(
              'transition-colors',
              showError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value || ''}
          />
        );

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            value={value || ''}
          />
        );

      case 'time':
        return (
          <Input
            {...commonProps}
            type="time"
            value={value || ''}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type={type}
            value={value || ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={name} 
        className={cn(
          'text-sm font-medium',
          required && 'after:content-["*"] after:ml-1 after:text-red-500'
        )}
      >
        {label}
      </Label>
      
      {renderInput()}
      
      {helpText && !showError && (
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      
      {showError && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormField; 