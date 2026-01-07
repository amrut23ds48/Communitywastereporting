import React from 'react';
import { FileText, Table } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Prioritize shadcn if available, otherwise fallback to simple div
// Since I don't see shadcn components explicitly in the file list earlier, I will build a custom modal to match the existing design

import { X } from 'lucide-react';

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: 'csv' | 'pdf') => void;
    title?: string;
}

export function ExportDialog({ isOpen, onClose, onExport, title = "Export Data" }: ExportDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 scale-100 animate-in zoom-in-95 duration-200">

                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <p className="text-sm text-slate-500 mb-6">
                    Choose a format to download your report data.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onExport('csv')}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                            <Table className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">CSV Export</span>
                    </button>

                    <button
                        onClick={() => onExport('pdf')}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-full group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">PDF Report</span>
                    </button>
                </div>

                <div className="mt-6">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
