// Store data in Local Storage
export function setStoredData(name: string, data: any) {
    localStorage.setItem(name, JSON.stringify(data));
}

// Get data from Local Storage
export function getStoredData(name: string) {
    return localStorage.getItem(name) ? JSON.parse(localStorage.getItem(name) ?? "{}") : undefined;
}