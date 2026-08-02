import { Download, Upload } from "lucide-react";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { ImportWizard } from "@/Components/Import/ImportWizard";

/**
 * Stream G's home: getting history in, and getting everything back out.
 *
 * The two halves belong on one screen because they are the same question asked
 * in both directions — "is my data mine?" — and because an import is the
 * natural first thing a new account does, while an export is what makes leaving
 * possible. A tracker that can only be fed by hand and never emptied is a
 * hostage situation with a nice chart.
 */
export default function DataPage() {
  const [tab, setTab] = useState("import");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-[-0.01em]">Import &amp; export</h1>
        <p className="text-sm text-muted-foreground">
          Bring a bank statement in, or take everything out.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="import">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="mr-2 h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="pt-4">
          <ImportWizard />
        </TabsContent>

        <TabsContent value="export" className="pt-4">
          <p className="text-sm text-muted-foreground">Coming in this stream's second half.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
