import Papa from 'papaparse';

export async function parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data as any[]),
            error: (err) => reject(err)
        });
    });
}
