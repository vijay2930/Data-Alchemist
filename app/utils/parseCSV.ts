import Papa from "papaparse";

/**
 * Parses a CSV file using PapaParse.
 * @param file The CSV file to parse.
 * @returns A promise that resolves with the parsed data.
 */
export default async function parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
};
