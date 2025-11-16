import React, { useState, useEffect } from 'react';
import { Checkbox, FormControl, ListItemText, MenuItem, Select } from '@mui/material';
import { getEnumOptions, getEnumDisplayValue } from '../../../Services/enumServices'

import styles from './MultiSelectFilers.module.css'

export const MultiSelectFilter = ({ 
  accessor, 
  enumType, 
  value = [], 
  onChange 
}) => {
  const [selectedValues, setSelectedValues] = useState(value);
  const options = getEnumOptions(enumType);

  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  const handleChange = (event) => {
    const newValue = event.target.value;
    
    if (newValue[newValue.length - 1] === 'all') {
      const allValues = options.map(opt => opt.value);
      setSelectedValues(selectedValues.length === allValues.length ? [] : allValues);
      onChange(selectedValues.length === allValues.length ? [] : allValues);
      return;
    }
    
    setSelectedValues(newValue);
    onChange(newValue);
  };

  return (
    <FormControl fullWidth size="small">
      <Select
        className={styles.inputField}
        multiple
        value={selectedValues}
        onChange={handleChange}
        renderValue={(selected) => selected.length === options.length 
          ? 'All' 
          : selected.map(v => getEnumDisplayValue(enumType, v)).join(', ')
        }
      >
        <MenuItem key="all" value="all">
          <Checkbox
            checked={selectedValues.length === options.length}
            indeterminate={selectedValues.length > 0 && selectedValues.length < options.length}
          />
          <ListItemText primary="Select All" />
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox checked={selectedValues.includes(option.value)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};