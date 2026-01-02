import React from 'react';
import './Field.css';

export default function Field({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  name,
  required = false,
  rows,
  id,
  disabled = false
}) {
  if (type === 'textarea') {
    return (
      <div className="field-container">
        {label && <label htmlFor={id || name}>{label} {required && <span className="required">*</span>}</label>}
        <textarea
          id={id || name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows || 3}
          required={required}
          disabled={disabled}
        />
      </div>
    );
  }
  
  return (
    <div className="field-container">
      {label && <label htmlFor={id || name}>{label} {required && <span className="required">*</span>}</label>}
      <input
        id={id || name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}