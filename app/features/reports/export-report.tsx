import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { PrinterIcon } from "~/components/ui/icons";

export function ExportReport() {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">
            <PrinterIcon />
          </span>
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-navy-700 dark:text-white">
              Print Report
            </p>
            <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
              Use your browser's print dialog to save or print the current report view.
              Switch to the report tab you want to export before printing.
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant="primary"
                block={false}
                onClick={handlePrint}
              >
                <PrinterIcon />
                Print / Save as PDF
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-dashed bg-transparent p-5 dark:bg-transparent">
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Export Note
        </p>
        <p className="mt-2 font-body text-sm text-slate-500 dark:text-slate-400">
          CSV and Excel export will be available in a future release. For now, use Print and
          select "Save as PDF" in your browser's print dialog to create a document.
        </p>
      </Card>
    </div>
  );
}
