import * as XLSX from "xlsx";

/**
 * Parses an XLSX file using the 'xlsx' library.
 * @param file The XLSX file to parse.
 * @returns A promise that resolves with the parsed data from the first sheet.
 */
export default async function parseXLSX(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: "array" });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
};