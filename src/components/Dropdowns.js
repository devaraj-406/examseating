import React from 'react';

const Dropdown = ({ options, value, onChange, name, placeholder }) => {
  return (
    <select name={name} value={value} onChange={onChange} required>
      <option value="">{placeholder}</option>
      {options.map((option, index) => (
        <option key={index} value={option.code}>
          {option.subject} ({option.code})
        </option>
      ))}
    </select>
  );
};

export default Dropdown;
