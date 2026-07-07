import { PrinterIcon } from "~/components/ui/icons";

export function ExportReport() {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">
            <PrinterIcon />
          </span>
          <div>
            <p className="font-body text-sm font-semibold text-navy-700 dark:text-white">
              Print Report
            </p>
            <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
              Use your browser's print dialog to save or print the current report view.
              Switch to the report tab you want to export before printing.
            </p>
            <button
              type="button"
              onClick={handlePrint}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy-700 px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-gold-500 dark:text-navy-900 dark:hover:bg-gold-400"
            >
              <PrinterIcon />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-white/8 dark:bg-white/3">
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Export Note
        </p>
        <p className="mt-2 font-body text-sm text-slate-500 dark:text-slate-400">
          CSV and Excel export will be available in a future release. For now, use Print and
          select "Save as PDF" in your browser's print dialog to create a document.
        </p>
      </div>
    </div>
  );
}
