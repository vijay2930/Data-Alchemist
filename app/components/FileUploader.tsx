"use client"
import {useId} from "react";
import {UploadCloud} from "lucide-react";

/**
 * A reusable file upload component with drag-and-drop support.
 * @param onFileAccepted A callback function that is called with the accepted file.
 */
export default function FileUploader({onFileAccepted}: { onFileAccepted: (file: File) => void }) {
    const uniqueId = useId();

    return (
        <label
            htmlFor={`fileInput-${uniqueId}`}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-sm"
            onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files && e.dataTransfer.files[0];
                if (file) onFileAccepted(file);
            }}
            onDragOver={(e) => e.preventDefault()}
        >
            <UploadCloud className="mx-auto h-12 w-12 text-blue-400 mb-3 animate-bounce-slow"/>
            <input
                type="file"
                className="hidden"
                id={`fileInput-${uniqueId}`}
                onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) onFileAccepted(file);
                }}
                accept=".csv, .xlsx"
            />
            <span className="text-blue-700 font-semibold text-lg">Click to upload or drag & drop</span>
            <span className="text-gray-500 text-sm mt-1">.csv, .xlsx files accepted</span>
        </label>
    );
};
