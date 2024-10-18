export const formatPercentage = (text: string) => {
    return text.replace(
      /(\d+(\.\d+)?%)/g,
      (match) => `<span class="">${match}</span>`
    );
  };