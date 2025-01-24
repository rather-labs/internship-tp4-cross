// Custom serializer for BigInt
export const serialize = (obj: any): any => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};
// Custom deserializer for BigInt
export const deserialize = (str: string): any => {
  return JSON.parse(str, (_, value) => {
    // Check if the value matches a BigInt pattern
    if (typeof value === 'string' && /^\d+n$/.test(value)) {
      return BigInt(value.slice(0, -1));
    }
    return value;
  });
};

export function storeData(name: string, data: any) {
  if (typeof window === 'undefined') return; // Skip on server-side
  try {
    window.localStorage.setItem(name, serialize(data));
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
}

export function getData(name: string, defaultData: any) {
  if (typeof window === 'undefined') return defaultData; // Return default on server-side
  try {
    return deserialize(window.localStorage.getItem(name) || serialize(defaultData));
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return defaultData;
  }
}