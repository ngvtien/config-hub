import { WidgetProps } from '@rjsf/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Info } from 'lucide-react'

/**
 * Custom theme for react-jsonschema-form that matches Config Hub's shadcn/ui design
 * 
 * This theme provides:
 * - Proper field type mapping (string, number, boolean, enum, etc.)
 * - Field descriptions and help text
 * - Validation rules from JSON schema (min, max, pattern, required, etc.)
 * - Error display
 * - Nested object and array support
 */

// Text Input Widget - handles string types with pattern validation
export function TextWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  
  // Extract validation constraints from schema
  const minLength = schema.minLength
  const maxLength = schema.maxLength
  const pattern = schema.pattern
  const placeholder = schema.examples?.[0] as string || schema.default as string || ''

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={value || ''}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className={hasError ? 'border-destructive' : ''}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
      />
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
      {/* Show validation hints */}
      {!hasError && (minLength || maxLength || pattern) && (
        <p className="text-xs text-muted-foreground">
          {minLength && maxLength && `Length: ${minLength}-${maxLength} characters`}
          {minLength && !maxLength && `Min length: ${minLength} characters`}
          {!minLength && maxLength && `Max length: ${maxLength} characters`}
          {pattern && ` • Pattern: ${pattern}`}
        </p>
      )}
    </div>
  )
}

// Textarea Widget
export function TextareaWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0

  return (
    <div className="space-y-2">
      <Textarea
        id={id}
        value={value || ''}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className={hasError ? 'border-destructive' : ''}
        rows={options.rows || 5}
      />
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// Checkbox Widget - handles boolean types
export function CheckboxWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    label,
    schema,
    onChange,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  const defaultValue = schema.default

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={value !== undefined ? value : defaultValue || false}  
          disabled={disabled || readonly}
          required={required}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <Label htmlFor={id} className={disabled || readonly ? 'opacity-50' : ''}>
          {label}
          {defaultValue !== undefined && !value && (
            <span className="text-xs text-muted-foreground ml-2">(default: {String(defaultValue)})</span>
          )}
        </Label>
      </div>
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// Email Widget - handles string format: email
export function EmailWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  const placeholder = schema.examples?.[0] as string || 'email@example.com'

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="email"
        value={value || ''}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className={hasError ? 'border-destructive' : ''}
        placeholder={placeholder}
      />
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// URL Widget - handles string format: uri/url
export function URLWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  const placeholder = schema.examples?.[0] as string || 'https://example.com'

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="url"
        value={value || ''}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className={hasError ? 'border-destructive' : ''}
        placeholder={placeholder}
      />
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// Password Widget - handles string format: password
export function PasswordWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  const minLength = schema.minLength
  const maxLength = schema.maxLength

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="password"
        value={value || ''}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className={hasError ? 'border-destructive' : ''}
        minLength={minLength}
        maxLength={maxLength}
      />
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
      {!hasError && (minLength || maxLength) && (
        <p className="text-xs text-muted-foreground">
          {minLength && maxLength && `Length: ${minLength}-${maxLength} characters`}
          {minLength && !maxLength && `Min length: ${minLength} characters`}
          {!minLength && maxLength && `Max length: ${maxLength} characters`}
        </p>
      )}
    </div>
  )
}

// Select Widget - handles enum types
export function SelectWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    onChange,
    options,
    schema,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  const { enumOptions = [] } = options
  
  // Get placeholder from schema
  const placeholder = schema.default ? `Default: ${schema.default}` : 'Select an option...'

  return (
    <div className="space-y-2">
      <Select
        value={value !== undefined && value !== null ? String(value) : ''}
        onValueChange={(val) => {
          // Convert back to original type if needed
          const enumOption = enumOptions.find((opt: any) => String(opt.value) === val)
          onChange(enumOption ? enumOption.value : val)
        }}
        disabled={disabled || readonly}
        required={required}
      >
        <SelectTrigger id={id} className={hasError ? 'border-destructive' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {enumOptions.map((option: any) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// Number Input Widget - handles integer and number types with range validation
export function NumberWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  
  // Extract validation constraints from schema
  const minimum = schema.minimum
  const maximum = schema.maximum
  const exclusiveMinimum = schema.exclusiveMinimum
  const exclusiveMaximum = schema.exclusiveMaximum
  const multipleOf = schema.multipleOf
  const placeholder = schema.examples?.[0] as string || schema.default?.toString() || ''
  
  // Determine step based on schema type and multipleOf
  const step = multipleOf || (schema.type === 'integer' ? 1 : 'any')

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="number"
        value={value ?? ''}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === '' ? options.emptyValue : Number(val))
        }}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className={hasError ? 'border-destructive' : ''}
        placeholder={placeholder}
        min={exclusiveMinimum !== undefined ? exclusiveMinimum + (step as number || 1) : minimum}
        max={exclusiveMaximum !== undefined ? exclusiveMaximum - (step as number || 1) : maximum}
        step={step}
      />
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
      {/* Show validation hints */}
      {!hasError && (minimum !== undefined || maximum !== undefined || multipleOf) && (
        <p className="text-xs text-muted-foreground">
          {minimum !== undefined && maximum !== undefined && `Range: ${minimum}-${maximum}`}
          {minimum !== undefined && maximum === undefined && `Min: ${minimum}`}
          {minimum === undefined && maximum !== undefined && `Max: ${maximum}`}
          {exclusiveMinimum !== undefined && ` (exclusive min: ${exclusiveMinimum})`}
          {exclusiveMaximum !== undefined && ` (exclusive max: ${exclusiveMaximum})`}
          {multipleOf && ` • Multiple of: ${multipleOf}`}
        </p>
      )}
    </div>
  )
}

// Field Template - wraps each form field with label, description, and validation
export function FieldTemplate(props: any) {
  const {
    id,
    classNames,
    label,
    help,
    required,
    description,
    errors,
    children,
    displayLabel,
    schema,
  } = props

  return (
    <div className={`space-y-2 ${classNames}`}>
      {displayLabel && label && (
        <div className="flex items-start justify-between gap-2">
          <Label htmlFor={id} className="flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
            {schema?.readOnly && (
              <span className="text-xs text-muted-foreground font-normal">(read-only)</span>
            )}
          </Label>
          {/* Show info icon if there's a description */}
          {description && (
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          )}
        </div>
      )}
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      {children}
      {errors}
      {help}
    </div>
  )
}

// Object Field Template - wraps object fields
export function ObjectFieldTemplate(props: any) {
  const { title, description, properties, required } = props

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      {title && (
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            {title}
            {required && <span className="text-destructive ml-1">*</span>}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {properties.map((element: any) => (
          <div key={element.name}>{element.content}</div>
        ))}
      </div>
    </div>
  )
}

// Array Field Template - wraps array fields with proper add/remove controls
export function ArrayFieldTemplate(props: any) {
  const { title, items, canAdd, onAddClick, required, description, schema } = props

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      {title && (
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            {title}
            {required && <span className="text-destructive ml-1">*</span>}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {/* Show array constraints */}
          {(schema?.minItems !== undefined || schema?.maxItems !== undefined) && (
            <p className="text-xs text-muted-foreground">
              {schema.minItems !== undefined && schema.maxItems !== undefined && 
                `Items: ${schema.minItems}-${schema.maxItems}`}
              {schema.minItems !== undefined && schema.maxItems === undefined && 
                `Min items: ${schema.minItems}`}
              {schema.minItems === undefined && schema.maxItems !== undefined && 
                `Max items: ${schema.maxItems}`}
            </p>
          )}
        </div>
      )}
      <div className="space-y-3">
        {items && items.length > 0 ? (
          items.map((element: any, index: number) => (
            <div key={element.key} className="flex items-start gap-2 p-3 border rounded-md bg-background">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <div className="flex-1">{element.children}</div>
              {element.hasRemove && (
                <button
                  type="button"
                  onClick={element.onDropIndexClick(element.index)}
                  className="flex-shrink-0 px-2 py-1 text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors"
                  title="Remove item"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No items yet. Click "Add Item" to get started.
          </div>
        )}
      </div>
      {canAdd && (
        <button
          type="button"
          onClick={onAddClick}
          className="w-full px-3 py-2 text-sm text-primary hover:text-primary/80 hover:bg-primary/10 border border-dashed border-primary/30 rounded transition-colors"
          disabled={schema?.maxItems !== undefined && items?.length >= schema.maxItems}
        >
          + Add Item
        </button>
      )}
    </div>
  )
}

// Error List Template
export function ErrorListTemplate(props: any) {
  const { errors } = props

  if (!errors || errors.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-semibold mb-1">Please fix the following errors:</div>
        <ul className="list-disc list-inside space-y-1">
          {errors.map((error: any, i: number) => (
            <li key={i} className="text-sm">
              {error.stack}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

// Radio Widget - handles enum with radio buttons (alternative to select)
export function RadioWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    onChange,
    options,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  const { enumOptions = [] } = options

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {enumOptions.map((option: any) => (
          <div key={String(option.value)} className="flex items-center space-x-2">
            <input
              type="radio"
              id={`${id}-${option.value}`}
              name={id}
              value={String(option.value)}
              checked={value === option.value}
              disabled={disabled || readonly}
              required={required}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            <Label htmlFor={`${id}-${option.value}`} className={disabled || readonly ? 'opacity-50' : ''}>
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// Date Widget - handles string format: date
export function DateWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="date"
        value={value || ''}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className={hasError ? 'border-destructive' : ''}
      />
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// DateTime Widget - handles string format: date-time
export function DateTimeWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="datetime-local"
        value={value || ''}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className={hasError ? 'border-destructive' : ''}
      />
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// Color Widget - handles string format: color
export function ColorWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="color"
          value={value || '#000000'}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          autoFocus={autofocus}
          onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
          onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
          onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
          className={`w-20 h-10 ${hasError ? 'border-destructive' : ''}`}
        />
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
          className="flex-1 font-mono"
          placeholder="#000000"
          disabled={disabled || readonly}
        />
      </div>
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// Range Widget - handles number with range slider
export function RangeWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    onChange,
    schema,
    rawErrors = [],
  } = props

  const hasError = rawErrors.length > 0
  const min = schema.minimum ?? 0
  const max = schema.maximum ?? 100
  const step = schema.multipleOf ?? 1

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <input
          id={id}
          type="range"
          value={value ?? min}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled || readonly}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="text-sm font-medium w-12 text-right">{value ?? min}</span>
      </div>
      {hasError && (
        <p className="text-sm text-destructive">{rawErrors[0]}</p>
      )}
    </div>
  )
}

// Hidden Widget - handles hidden fields
export function HiddenWidget(props: WidgetProps) {
  const { id, value } = props
  return <input type="hidden" id={id} value={value || ''} />
}

// Custom theme object - maps widgets and templates to our custom components
export const customTheme = {
  widgets: {
    TextWidget,
    TextareaWidget,
    CheckboxWidget,
    SelectWidget,
    RadioWidget,
    NumberWidget,
    RangeWidget,
    EmailWidget,
    URLWidget,
    PasswordWidget,
    DateWidget,
    DateTimeWidget,
    ColorWidget,
    HiddenWidget,
  },
  templates: {
    FieldTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
    ErrorListTemplate,
  },
}
