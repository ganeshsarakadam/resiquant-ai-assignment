'use client';

import { Document } from "@/types";
import Image from "next/image";

interface ImageViewerProps {
    document: Document;
}

export const ImageViewer = ({ document }: ImageViewerProps) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                <span className="text-sm font-medium text-gray-700">Image Viewer</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Original Size</span>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                <Image
                    src={document.url}
                    alt={document.name}
                    width={800}
                    height={600}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    style={{ width: 'auto', height: 'auto' }}
                />
            </div>
        </div>
    );
};
