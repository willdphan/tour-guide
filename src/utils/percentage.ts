export const formatPercentage = (value: number | string): string => {
  const text = typeof value === 'number' ? `${value}%` : value;
  return text.replace(
    /(\d+(\.\d+)?%)/g,
    (match) => `<span class="">${match}</span>`
  );
};