const ENUM_MAP = {
  
};
  
export const getEnumOptions = (enumType) => {
  const enumObj = ENUM_MAP[enumType];
  if (!enumObj) return [];
  
  return Object.entries(enumObj).map(([key, value]) => ({
    value: parseInt(key),
    label: value
  }));
};
  
export const getEnumDisplayValue = (enumType, value) => {
  const enumObj = ENUM_MAP[enumType];
  if (!enumObj) return value;
  
  return enumObj[value] || value;
};
  
export const getEnumValues = (enumType) => {
  return Object.values(ENUM_MAP[enumType] || {});
};